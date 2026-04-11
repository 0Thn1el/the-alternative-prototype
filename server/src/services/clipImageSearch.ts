import { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } from '@xenova/transformers';
import sharp from 'sharp';
import Item from '../models/Item';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Cache CLIP model/processor after first load
env.cacheDir = path.join(os.homedir(), '.cache', 'transformers');
let processor: any = null;
let visionModel: any = null;

async function getCLIPModel() {
  if (!processor || !visionModel) {
    console.log('Loading CLIP model (this may take a moment on first run)...');
    const model_id = 'Xenova/clip-vit-base-patch32';
    processor = await AutoProcessor.from_pretrained(model_id);
    visionModel = await CLIPVisionModelWithProjection.from_pretrained(model_id);
    console.log('CLIP model loaded successfully');
  }
  return { processor, visionModel };
}

export async function extractImageEmbedding(imageBuffer: Buffer): Promise<number[]> {
  // Try CLIP first for semantic image embeddings
  try {
    const { processor: proc, visionModel: model } = await getCLIPModel();

    // Write buffer to a temp file so RawImage can read it
    const tmpPath = path.join(os.tmpdir(), `clip-tmp-${Date.now()}.jpg`);
    // Convert to JPEG first (handles PNG, WebP, etc.)
    const jpegBuffer = await sharp(imageBuffer).jpeg().toBuffer();
    fs.writeFileSync(tmpPath, jpegBuffer);

    try {
      const image = await RawImage.read(tmpPath);
      const image_inputs = await proc(image);
      const { image_embeds } = await model(image_inputs);

      const embedding = Array.from(image_embeds.data) as number[];
      console.log(`CLIP embedding extracted: ${embedding.length} dimensions`);
      return embedding;
    } finally {
      // Clean up temp file
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  } catch (clipError) {
    console.warn('CLIP extraction failed, falling back to Sharp-based features:', clipError);
    return extractSharpFeatures(imageBuffer);
  }
}

// Fallback: extract basic color/shape features using Sharp
async function extractSharpFeatures(imageBuffer: Buffer): Promise<number[]> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const stats = await image.stats();

  const { dominant } = stats;
  const channels = stats.channels;

  const features = [
    metadata.width! / 1000,
    metadata.height! / 1000,
    dominant.r / 255,
    dominant.g / 255,
    dominant.b / 255,
    channels[0].mean / 255,
    channels[1].mean / 255,
    channels[2].mean / 255,
    (channels[0].max - channels[0].min) / 255,
    (channels[1].max - channels[1].min) / 255,
    (channels[2].max - channels[2].min) / 255,
    metadata.width! / metadata.height!,
  ];

  while (features.length < 512) {
    features.push(0);
  }

  console.log('Sharp fallback features extracted:', features.length, 'dimensions');
  return features;
}

// Find similar items using cosine similarity search
export async function findSimilarItems(
  queryEmbedding: number[],
  userId: string,
  limit: number = 10
): Promise<any[]> {
  try {
    // Get all items with embeddings for this user
    const items = await Item.find({
      uid: userId,
      imageEmbedding: { $exists: true, $ne: null }
    }).select('name category color material imageUrl imageEmbedding');

    if (items.length === 0) {
      return [];
    }

    console.log(`Found ${items.length} items with embeddings for user ${userId}`);

    // Calculate cosine similarity for each item
    const similarities = items.map(item => {
      const similarity = cosineSimilarity(queryEmbedding, item.imageEmbedding!);
      return {
        ...item.toObject(),
        similarity: similarity
      };
    });

    // Sort by similarity (descending) and return top results
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => ({
        _id: item._id,
        name: item.name,
        category: item.category,
        color: item.color,
        material: item.material,
        imageUrl: item.imageUrl,
        similarity: Math.round(item.similarity * 100) / 100 // Round to 2 decimal places
      }));

    console.log(`Returning ${topResults.length} similar items`);
    return topResults;

  } catch (error) {
    console.error('Error finding similar items:', error);
    throw new Error('Failed to search similar items');
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Update item embedding when image is added/updated
export async function updateItemEmbedding(itemId: string, imageBuffer: Buffer): Promise<void> {
  try {
    console.log(`Updating embedding for item ${itemId}`);
    const embedding = await extractImageEmbedding(imageBuffer);
    await Item.findByIdAndUpdate(itemId, { imageEmbedding: embedding });
    console.log(`Successfully updated embedding for item ${itemId}`);
  } catch (error) {
    console.error('Error updating item embedding:', error);
    // Don't throw - embedding update failure shouldn't break item creation
  }
}

// Batch update embeddings for existing items (utility function)
export async function updateAllItemEmbeddings(userId?: string): Promise<void> {
  try {
    const query = userId ? { uid: userId, imageUrl: { $exists: true } } : { imageUrl: { $exists: true } };
    const items = await Item.find(query).select('_id imageUrl');

    console.log(`Found ${items.length} items to update embeddings`);

    for (const item of items) {
      try {
        // Note: This would need actual image buffers, not just URLs
        // In a real implementation, you'd fetch images from URLs or storage
        console.log(`Skipping embedding update for ${item._id} - need image buffer`);
      } catch (error) {
        console.error(`Failed to update embedding for item ${item._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in batch embedding update:', error);
  }
}