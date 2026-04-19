import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Item from '../models/Item';
import { extractImageEmbedding } from '../services/clipImageSearch';

dotenv.config();

type CliOptions = {
  datasetRoot: string;
  limit: number;
  delayMs: number;
};

function resolveDefaultDatasetRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), '../deepfashion'),
    path.resolve(process.cwd(), '../../deepfashion'),
  ];

  const existingCandidate = candidates.find((candidate) => fs.existsSync(candidate));
  return existingCandidate ?? candidates[0];
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const getArg = (name: string, fallback: string) => {
    const found = args.find((arg) => arg.startsWith(`--${name}=`));
    return found ? found.split('=').slice(1).join('=') : fallback;
  };

  return {
    datasetRoot: getArg('datasetRoot', resolveDefaultDatasetRoot()),
    limit: Number(getArg('limit', '100')),
    delayMs: Number(getArg('delayMs', '0')),
  };
}

function isZeroEmbedding(embedding?: number[]): boolean {
  return !embedding || embedding.length === 0 || embedding.every((value) => value === 0);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const options = parseArgs();
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('Missing MONGO_URI or MONGODB_URI in environment.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const candidates = await Item.find({
    source: 'deepfashion',
    sourcePath: { $exists: true, $ne: null },
  }).sort({ updatedAt: -1 });

  const brokenItems = candidates.filter((item) => isZeroEmbedding(item.imageEmbedding)).slice(0, options.limit);
  console.log(`Found ${brokenItems.length} DeepFashion items with missing or zero embeddings to repair`);

  let repaired = 0;
  let failed = 0;

  for (const item of brokenItems) {
    const relativePath = String(item.sourcePath || '').replace(/\\/g, '/');
    const fullPath = path.join(options.datasetRoot, relativePath);

    try {
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Image file not found: ${fullPath}`);
      }

      const imageBuffer = fs.readFileSync(fullPath);
      const embedding = await extractImageEmbedding(imageBuffer);
      item.imageEmbedding = embedding;
      await item.save();
      repaired += 1;
      process.stdout.write(`Repaired ${repaired}/${brokenItems.length}: ${relativePath}\n`);
      if (options.delayMs > 0) await sleep(options.delayMs);
    } catch (error: any) {
      failed += 1;
      console.error(`Failed to repair ${relativePath}:`, error?.message || error);
    }
  }

  console.log(`Done. Repaired=${repaired}, Failed=${failed}`);
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Embedding repair failed:', error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });