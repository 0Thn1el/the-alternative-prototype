import express, { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/verifyToken';
import Item from '../models/Item';
import multer from 'multer';
import { extractImageEmbedding } from '../services/clipImageSearch';
import { uploadBufferToCloudinary } from '../config/cloudinary';
import { getHybridRecommendations, recordInteraction } from '../services/recommendations';
import { InteractionEvent } from '../models/Interaction';
import { enrichItemMetadata } from '../utils/itemMetadata';

const router: Router = express.Router();

const CATEGORY_BUCKET_PATTERNS: Record<string, string[]> = {
  top: ['top', 'shirt', 'blouse', 'tee', 't-shirt', 'tank', 'sweater', 'hoodie', 'knit', 'cardigan', 'polo'],
  bottom: ['bottom', 'jean', 'pant', 'trouser', 'skirt', 'short', 'legging'],
  outerwear: ['outerwear', 'jacket', 'coat', 'blazer', 'anorak', 'parka'],
  shoes: ['shoe', 'boot', 'sneaker', 'loafer', 'heel', 'sandal', 'trainer'],
  dress: ['dress', 'gown'],
};

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
    const items = await Item.find({ uid: req.uid, source: { $ne: 'deepfashion' } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.get('/recommendations', verifyToken, async (req: AuthRequest, res) => {
  try {
    if (!req.uid) {
      return res.status(401).json({ error: 'Missing authenticated user' });
    }

    const recommendations = await getHybridRecommendations(req.uid, {
      weather: req.query.weather ? String(req.query.weather) : undefined,
      occasion: req.query.occasion ? String(req.query.occasion) : undefined,
      timeOfDay: req.query.timeOfDay ? String(req.query.timeOfDay) : undefined,
      season: req.query.season ? String(req.query.season) : undefined,
      category: req.query.category ? String(req.query.category) : undefined,
      baseItemId: req.query.baseItemId ? String(req.query.baseItemId) : undefined,
      sustainabilityWeight: req.query.sustainabilityWeight !== undefined ? Number(req.query.sustainabilityWeight) : undefined,
      limit: req.query.limit !== undefined ? Number(req.query.limit) : undefined,
    });

    res.json({
      items: recommendations,
      context: {
        weather: req.query.weather ?? null,
        occasion: req.query.occasion ?? null,
        timeOfDay: req.query.timeOfDay ?? null,
        season: req.query.season ?? null,
        category: req.query.category ?? null,
        baseItemId: req.query.baseItemId ?? null,
      },
    });
  } catch (error) {
    console.error('Recommendation fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

router.post('/interactions', verifyToken, async (req: AuthRequest, res) => {
  try {
    if (!req.uid) {
      return res.status(401).json({ error: 'Missing authenticated user' });
    }

    const { itemId, event, context } = req.body as {
      itemId?: string;
      event?: InteractionEvent;
      context?: {
        season?: string;
        timeOfDay?: string;
        weather?: string;
        occasion?: string;
        dwellTimeMs?: number;
      };
    };

    if (!itemId || !event) {
      return res.status(400).json({ error: 'itemId and event are required' });
    }

    if (!['view', 'like', 'add_to_cart', 'purchase'].includes(event)) {
      return res.status(400).json({ error: 'Unsupported interaction event' });
    }

    const itemExists = await Item.exists({ _id: itemId });
    if (!itemExists) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await recordInteraction({
      uid: req.uid,
      itemId,
      event,
      context,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Interaction recording error:', error);
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

// Paginated dataset catalog endpoint for Discovery/Shop pages
router.get('/catalog', verifyToken, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '24'), 10), 1), 60);
    const skip = (page - 1) * limit;

    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const tag = String(req.query.tag || '').trim();
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

    const query: any = { source: 'deepfashion' };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { tags: { $elemMatch: { $regex: q, $options: 'i' } } },
      ];
    }

    if (category) {
      const normalizedCategory = category.toLowerCase();
      const bucketPatterns = CATEGORY_BUCKET_PATTERNS[normalizedCategory];

      query.category = bucketPatterns
        ? { $regex: bucketPatterns.map((pattern) => escapeRegex(pattern)).join('|'), $options: 'i' }
        : { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
    }

    if (tag) {
      query.tags = { $elemMatch: { $regex: `^${escapeRegex(tag)}$`, $options: 'i' } };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {} as any;
      if (minPrice !== undefined && !Number.isNaN(minPrice)) query.price.$gte = minPrice;
      if (maxPrice !== undefined && !Number.isNaN(maxPrice)) query.price.$lte = maxPrice;
    }

    const [items, total] = await Promise.all([
      Item.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name category tags description price brand color material imageUrl source seasonality occasions sustainabilityScore brandEthicsScore carbonScore'),
      Item.countDocuments(query),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Catalog fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch catalog items' });
  }
});

// Similar dataset items by selected catalog item
router.get('/catalog/similar/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '12'), 10), 1), 60);
    const skip = (page - 1) * limit;

    const baseItem = await Item.findById(req.params.id).select('imageEmbedding category tags source');
    if (!baseItem || baseItem.source !== 'deepfashion') {
      return res.status(404).json({ error: 'Catalog item not found' });
    }

    const candidates = await Item.find({
      _id: { $ne: baseItem._id },
      source: 'deepfashion',
      imageEmbedding: { $exists: true, $ne: [] },
    }).select('name category tags description price brand color material imageUrl imageEmbedding source seasonality occasions sustainabilityScore brandEthicsScore carbonScore');

    const scored = candidates.map((item) => {
      let similarity = 0;
      if (baseItem.imageEmbedding && item.imageEmbedding && baseItem.imageEmbedding.length === item.imageEmbedding.length) {
        similarity = cosineSimilarity(baseItem.imageEmbedding, item.imageEmbedding);
      }

      if (baseItem.category && item.category && baseItem.category.toLowerCase() === item.category.toLowerCase()) {
        similarity += 0.08;
      }

      if (baseItem.tags?.length && item.tags?.length) {
        const overlap = baseItem.tags.filter((tag) => item.tags.includes(tag)).length;
        similarity += Math.min(0.12, overlap * 0.03);
      }

      return {
        ...item.toObject(),
        similarity: Math.max(0, Math.min(1, similarity)),
      };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    const total = scored.length;
    const pageItems = scored.slice(skip, skip + limit);

    res.json({
      items: pageItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Catalog similar fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch similar catalog items' });
  }
});

router.post('/', verifyToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const itemData: any = { ...req.body, uid: req.uid, source: 'user' };

    if (!Array.isArray(itemData.tags)) {
      itemData.tags = itemData.tags ? [String(itemData.tags)] : [];
    }

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

    const enriched = enrichItemMetadata({
      name: itemData.name,
      category: itemData.category,
      brand: itemData.brand,
      material: itemData.material,
      tags: itemData.tags,
      description: itemData.description,
    });

    itemData.tags = enriched.tags;
    itemData.description = itemData.description || enriched.description;
    itemData.color = itemData.color || enriched.color;
    itemData.material = itemData.material || enriched.material;
    itemData.seasonality = enriched.seasonality;
    itemData.occasions = enriched.occasions;
    itemData.sustainabilityScore = enriched.sustainabilityScore;
    itemData.brandEthicsScore = enriched.brandEthicsScore;
    itemData.carbonScore = enriched.carbonScore;

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
    const nextBody = { ...req.body };
    const existingItem = await Item.findById(req.params.id).select('name category brand material tags description');

    const enriched = enrichItemMetadata({
      name: nextBody.name || existingItem?.name || 'Item',
      category: nextBody.category || existingItem?.category || 'unknown',
      brand: nextBody.brand || existingItem?.brand,
      material: nextBody.material || existingItem?.material,
      tags: Array.isArray(nextBody.tags) ? nextBody.tags : existingItem?.tags,
      description: nextBody.description || existingItem?.description,
    });

    nextBody.tags = Array.isArray(nextBody.tags) && nextBody.tags.length > 0 ? enriched.tags : enriched.tags;
    nextBody.description = nextBody.description || enriched.description;
    nextBody.color = nextBody.color || enriched.color;
    nextBody.material = nextBody.material || enriched.material;
    nextBody.seasonality = enriched.seasonality;
    nextBody.occasions = enriched.occasions;
    nextBody.sustainabilityScore = enriched.sustainabilityScore;
    nextBody.brandEthicsScore = enriched.brandEthicsScore;
    nextBody.carbonScore = enriched.carbonScore;

    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      nextBody,
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

    // Search across the user's wardrobe and imported DeepFashion catalog items.
    const allItems = await Item.find({
      $or: [
        { uid: req.uid },
        { source: 'deepfashion' },
      ],
    }).select('name category color material imageUrl imageEmbedding source');

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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}