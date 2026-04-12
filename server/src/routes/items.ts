import express, { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/verifyToken';
import Item from '../models/Item';
import multer from 'multer';
import { extractImageEmbedding, findSimilarItems, updateItemEmbedding } from '../services/clipImageSearch';
import { uploadBufferToCloudinary } from '../config/cloudinary';

const router: Router = express.Router();

// Configure multer for image uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for clothing images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const items = await Item.find({ uid: req.uid });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.post('/', verifyToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const itemData = { ...req.body, uid: req.uid };

    if (req.file) {
      // Step 1: Upload image buffer to Cloudinary → get permanent URL
      try {
        console.log('Uploading image to Cloudinary...');
        const imageUrl = await uploadBufferToCloudinary(req.file.buffer);
        itemData.imageUrl = imageUrl;
        console.log('Cloudinary upload successful:', imageUrl);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return res.status(500).json({ error: 'Image upload to Cloudinary failed' });
      }

      // Step 2: Generate CLIP embedding from the same buffer
      try {
        console.log('Processing uploaded image for CLIP embedding...');
        const embedding = await extractImageEmbedding(req.file.buffer);
        itemData.imageEmbedding = embedding;
        console.log('CLIP embedding generated successfully');
      } catch (embeddingError) {
        console.warn('Failed to generate CLIP embedding, continuing without it:', embeddingError);
        // Don't fail — embedding is optional
      }
    }

    const newItem = new Item(itemData);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.put('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// CLIP-based Image Search endpoint
router.post('/search-image', verifyToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('Processing image search request...');

    // Extract features from uploaded image
    const queryEmbedding = await extractImageEmbedding(req.file.buffer);
    console.log('Query embedding extracted');

    // Get all items for this user
    const allItems = await Item.find({ uid: req.uid }).select('name category color material imageUrl imageEmbedding');

    if (allItems.length === 0) {
      return res.json({
        success: true,
        results: [],
        totalResults: 0,
        message: 'No items in wardrobe to compare against'
      });
    }

    console.log(`Found ${allItems.length} items for user`);

    // Calculate similarity scores
    const similarities = [];

    for (const item of allItems) {
      let similarity = 0;

      if (item.imageEmbedding && item.imageEmbedding.length > 0) {
        // Use feature vector similarity
        similarity = cosineSimilarity(queryEmbedding, item.imageEmbedding);
      } else {
        // Fallback: Use category and color matching
        similarity = calculateBasicSimilarity(queryEmbedding, item);
      }

      similarities.push({
        ...item.toObject(),
        similarity: Math.max(0, Math.min(1, similarity)) // Clamp between 0-1
      });
    }

    // Sort by similarity (descending) and return top results
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .map(item => ({
        _id: item._id,
        name: item.name,
        category: item.category,
        color: item.color,
        material: item.material,
        imageUrl: item.imageUrl,
        similarity: Math.round(item.similarity * 100) / 100
      }));

    console.log(`Returning ${topResults.length} similar items`);

    res.json({
      success: true,
      results: topResults,
      totalResults: topResults.length
    });
  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).json({
      error: 'Failed to search images',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

// Helper functions for similarity calculation
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function calculateBasicSimilarity(queryEmbedding: number[], item: any): number {
  // Extract basic features from query embedding (assuming first few elements represent basic features)
  // This is a simplified approach - in a real implementation, you'd want to structure the embedding better
  const queryColor = queryEmbedding.slice(0, 3); // Assume first 3 elements are color features
  const querySize = queryEmbedding.slice(3, 5); // Assume next 2 are size features

  let similarity = 0;

  // Color similarity (if item has color info)
  if (item.color) {
    const itemColor = getColorVector(item.color);
    const colorSim = cosineSimilarity(queryColor, itemColor);
    similarity += colorSim * 0.4; // 40% weight for color
  }

  // Category similarity
  if (item.category) {
    // Simple category matching - could be improved with category hierarchies
    const categoryMatch = item.category.toLowerCase().includes('shirt') ||
                         item.category.toLowerCase().includes('pants') ||
                         item.category.toLowerCase().includes('dress') ? 0.8 : 0.3;
    similarity += categoryMatch * 0.3; // 30% weight for category
  }

  // Material similarity (if available)
  if (item.material) {
    const materialMatch = item.material.toLowerCase().includes('cotton') ||
                         item.material.toLowerCase().includes('polyester') ? 0.7 : 0.4;
    similarity += materialMatch * 0.3; // 30% weight for material
  }

  return Math.max(0, Math.min(1, similarity));
}

function getColorVector(colorName: string): number[] {
  // Simple color mapping - could be expanded with more colors
  const colorMap: { [key: string]: number[] } = {
    'red': [1, 0, 0],
    'green': [0, 1, 0],
    'blue': [0, 0, 1],
    'black': [0.1, 0.1, 0.1],
    'white': [0.9, 0.9, 0.9],
    'gray': [0.5, 0.5, 0.5],
    'yellow': [1, 1, 0],
    'purple': [0.5, 0, 0.5],
    'orange': [1, 0.5, 0],
    'pink': [1, 0.7, 0.8],
    'brown': [0.4, 0.2, 0],
    'beige': [0.9, 0.8, 0.7]
  };

  const lowerColor = colorName.toLowerCase();
  for (const [key, vector] of Object.entries(colorMap)) {
    if (lowerColor.includes(key)) {
      return vector;
    }
  }

  // Default to neutral gray if color not recognized
  return [0.5, 0.5, 0.5];
}