import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Item from '../models/Item';
import { buildStoreItemName, enrichItemMetadata } from '../utils/itemMetadata';

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGO_URI or MONGODB_URI in environment.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const deepfashionItems = await Item.find({ source: 'deepfashion' });
  console.log(`Updating metadata for ${deepfashionItems.length} imported items`);

  let updatedCount = 0;
  for (const item of deepfashionItems) {
    const nextName = buildStoreItemName(item.category, item.sourcePath, item.name);
    const enriched = enrichItemMetadata({
      name: nextName,
      category: item.category,
      brand: item.brand,
      material: item.material,
      tags: item.tags,
      description: item.description,
      sourcePath: item.sourcePath,
    });

    item.name = nextName;
    item.brand = 'The Alternative';
    item.tags = enriched.tags;
    item.description = enriched.description;
    item.color = item.color || enriched.color;
    item.material = item.material || enriched.material;
    item.seasonality = enriched.seasonality;
    item.occasions = enriched.occasions;
    item.sustainabilityScore = enriched.sustainabilityScore;
    item.brandEthicsScore = enriched.brandEthicsScore;
    item.carbonScore = enriched.carbonScore;
    await item.save();
    updatedCount += 1;
  }

  console.log(`Updated ${updatedCount} items.`);
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Catalog metadata update failed:', error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });