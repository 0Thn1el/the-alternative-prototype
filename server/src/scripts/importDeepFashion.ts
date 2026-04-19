import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Item from '../models/Item';
import { uploadBufferToCloudinary } from '../config/cloudinary';
import { extractImageEmbedding } from '../services/clipImageSearch';
import { buildStoreItemName, enrichItemMetadata } from '../utils/itemMetadata';

dotenv.config();

type CategoryMap = Map<number, string>;
type ImageCategoryMap = Map<string, number>;

type CliOptions = {
  datasetRoot: string;
  limit: number;
  delayMs: number;
  startAt: number;
  overwrite: boolean;
};

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const getArg = (name: string, fallback: string) => {
    const found = args.find((arg) => arg.startsWith(`--${name}=`));
    return found ? found.split('=').slice(1).join('=') : fallback;
  };

  return {
    datasetRoot: getArg('datasetRoot', path.resolve(process.cwd(), '../deepfashion')),
    limit: Number(getArg('limit', '50')),
    delayMs: Number(getArg('delayMs', '300')),
    startAt: Number(getArg('startAt', '0')),
    overwrite: getArg('overwrite', 'false') === 'true',
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCategoryCloth(filePath: string): CategoryMap {
  const map: CategoryMap = new Map();
  if (!fs.existsSync(filePath)) return map;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/^\d+$/.test(line) || line.toLowerCase().includes('category')) continue;
    const parts = line.split(/\s+/);
    const maybeId = Number(parts[parts.length - 1]);
    if (Number.isNaN(maybeId)) continue;
    const category = parts.slice(0, -1).join(' ').replace(/_/g, ' ').trim();
    if (category) map.set(maybeId, category);
  }
  return map;
}

function parseCategoryImg(filePath: string): ImageCategoryMap {
  const map: ImageCategoryMap = new Map();
  if (!fs.existsSync(filePath)) return map;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/^\d+$/.test(line) || line.toLowerCase().includes('image_name')) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;

    const categoryId = Number(parts[parts.length - 1]);
    if (Number.isNaN(categoryId)) continue;

    const relativePath = parts.slice(0, -1).join(' ');
    map.set(relativePath.replace(/\\/g, '/'), categoryId);
  }

  return map;
}

function estimatePrice(category: string): number {
  const c = category.toLowerCase();
  if (c.includes('dress') || c.includes('coat') || c.includes('jacket')) return 95;
  if (c.includes('jeans') || c.includes('pants') || c.includes('trousers')) return 62;
  if (c.includes('shoe') || c.includes('boot') || c.includes('sneaker')) return 84;
  if (c.includes('shirt') || c.includes('top') || c.includes('blouse') || c.includes('tee')) return 38;
  return 49;
}

function getImageRoot(datasetRoot: string): string {
  const candidates = ['img', 'images'];
  for (const candidate of candidates) {
    const full = path.join(datasetRoot, candidate);
    if (fs.existsSync(full)) return full;
  }
  throw new Error(`Could not find image folder. Expected one of: ${candidates.join(', ')} under ${datasetRoot}`);
}

function collectImagesRecursively(root: string): string[] {
  const output: string[] = [];
  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
        output.push(fullPath);
      }
    }
  };
  walk(root);
  return output;
}

async function run() {
  const options = parseArgs();
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('Missing MONGO_URI or MONGODB_URI in environment.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const imageRoot = getImageRoot(options.datasetRoot);
  const categoryCloth = parseCategoryCloth(path.join(options.datasetRoot, 'list_category_cloth.txt'));
  const categoryImg = parseCategoryImg(path.join(options.datasetRoot, 'list_category_img.txt'));

  const imageFiles = collectImagesRecursively(imageRoot)
    .slice(options.startAt, options.startAt + options.limit);

  console.log(`Found ${imageFiles.length} images to import`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const fullPath of imageFiles) {
    const relative = path.relative(options.datasetRoot, fullPath).replace(/\\/g, '/');

    try {
      const existing = await Item.findOne({ source: 'deepfashion', sourcePath: relative }).select('_id');
      if (existing && !options.overwrite) {
        skipped += 1;
        continue;
      }

      const fileBuffer = fs.readFileSync(fullPath);
      const imageUrl = await uploadBufferToCloudinary(fileBuffer, 'deepfashion');

      let embedding: number[] = [];
      try {
        embedding = await extractImageEmbedding(fileBuffer);
      } catch (embeddingError) {
        console.warn(`Embedding failed for ${relative}:`, embeddingError);
      }

      const categoryId = categoryImg.get(relative);
      const mappedCategory = categoryId ? categoryCloth.get(categoryId) : undefined;
      const fallbackCategory = relative.split('/')[1] || 'unknown';
      const category = (mappedCategory || fallbackCategory).replace(/_/g, ' ');
      const itemName = buildStoreItemName(category, relative);
      const enriched = enrichItemMetadata({
        name: itemName,
        category,
        brand: 'The Alternative',
        sourcePath: relative,
      });

      const payload = {
        uid: null,
        source: 'deepfashion' as const,
        sourcePath: relative,
        name: itemName,
        category,
        tags: enriched.tags,
        description: enriched.description,
        price: estimatePrice(category),
        brand: 'The Alternative',
        color: enriched.color,
        material: enriched.material,
        seasonality: enriched.seasonality,
        occasions: enriched.occasions,
        sustainabilityScore: enriched.sustainabilityScore,
        brandEthicsScore: enriched.brandEthicsScore,
        carbonScore: enriched.carbonScore,
        imageUrl,
        imageEmbedding: embedding,
      };

      if (existing && options.overwrite) {
        await Item.findByIdAndUpdate(existing._id, payload);
      } else {
        await Item.create(payload);
      }

      imported += 1;
      process.stdout.write(`Imported ${imported}/${imageFiles.length}: ${relative}\n`);
      if (options.delayMs > 0) await sleep(options.delayMs);
    } catch (error: any) {
      failed += 1;
      console.error(`Failed for ${relative}:`, error?.message || error);
    }
  }

  console.log(`Done. Imported=${imported}, Skipped=${skipped}, Failed=${failed}`);
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Import failed:', error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  });
