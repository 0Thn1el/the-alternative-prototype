import mongoose from 'mongoose';
import Item from '../models/Item';
import { extractImageEmbedding } from '../services/clipImageSearch';
import fs from 'fs';
import path from 'path';

async function updateExistingItems() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/the-alternative-prototype';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all items without embeddings
    const itemsWithoutEmbeddings = await Item.find({
      $or: [
        { imageEmbedding: { $exists: false } },
        { imageEmbedding: { $size: 0 } }
      ]
    });

    console.log(`Found ${itemsWithoutEmbeddings.length} items without embeddings`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const item of itemsWithoutEmbeddings) {
      try {
        if (item.imageUrl) {
          // For now, we'll skip items without local image files
          // In a real implementation, you'd download the image from the URL
          console.log(`Skipping item ${item._id} - image URL processing not implemented yet`);
          continue;
        }

        // If we had local image files, we would process them here
        // For now, we'll generate a basic embedding based on item properties
        const basicEmbedding = generateBasicEmbedding(item);
        item.imageEmbedding = basicEmbedding;
        await item.save();

        updatedCount++;
        console.log(`Updated item: ${item.name} (${updatedCount}/${itemsWithoutEmbeddings.length})`);
      } catch (error) {
        console.error(`Error updating item ${item._id}:`, error);
        errorCount++;
      }
    }

    console.log(`\nUpdate complete:`);
    console.log(`- Updated: ${updatedCount} items`);
    console.log(`- Errors: ${errorCount} items`);
    console.log(`- Total processed: ${updatedCount + errorCount}`);

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

function generateBasicEmbedding(item: any): number[] {
  // Generate a basic embedding based on item properties
  // This is a simplified approach - in production, you'd use actual image processing

  const embedding = new Array(128).fill(0); // 128-dimensional embedding

  // Color encoding (first 3 dimensions)
  if (item.color) {
    const colorVector = getColorVector(item.color);
    embedding[0] = colorVector[0];
    embedding[1] = colorVector[1];
    embedding[2] = colorVector[2];
  }

  // Category encoding (next 10 dimensions)
  if (item.category) {
    const category = item.category.toLowerCase();
    if (category.includes('shirt') || category.includes('top')) embedding[3] = 1;
    if (category.includes('pants') || category.includes('trousers')) embedding[4] = 1;
    if (category.includes('dress')) embedding[5] = 1;
    if (category.includes('skirt')) embedding[6] = 1;
    if (category.includes('jacket') || category.includes('coat')) embedding[7] = 1;
    if (category.includes('shoes')) embedding[8] = 1;
    if (category.includes('accessories')) embedding[9] = 1;
    if (category.includes('hat')) embedding[10] = 1;
    if (category.includes('bag')) embedding[11] = 1;
    if (category.includes('jewelry')) embedding[12] = 1;
  }

  // Material encoding (next 5 dimensions)
  if (item.material) {
    const material = item.material.toLowerCase();
    if (material.includes('cotton')) embedding[13] = 1;
    if (material.includes('polyester')) embedding[14] = 1;
    if (material.includes('wool')) embedding[15] = 1;
    if (material.includes('leather')) embedding[16] = 1;
    if (material.includes('silk')) embedding[17] = 1;
  }

  // Add some randomness to make embeddings unique
  for (let i = 18; i < embedding.length; i++) {
    embedding[i] = Math.random() * 0.1; // Small random values
  }

  return embedding;
}

function getColorVector(colorName: string): number[] {
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

  return [0.5, 0.5, 0.5]; // Default gray
}

// Run the script
if (require.main === module) {
  updateExistingItems();
}

export { updateExistingItems };