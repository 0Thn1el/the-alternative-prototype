type SustainabilityMetrics = {
  sustainabilityScore: number;
  brandEthicsScore: number;
  carbonScore: number;
};

type ItemMetadataInput = {
  name: string;
  category: string;
  brand?: string;
  color?: string;
  material?: string;
  tags?: string[];
  description?: string;
  sourcePath?: string;
};

type EnrichedItemMetadata = SustainabilityMetrics & {
  color?: string;
  material?: string;
  tags: string[];
  description: string;
  seasonality: string[];
  occasions: string[];
};

const GENERIC_TOKENS = new Set([
  'img', 'images', 'image', 'fashion', 'womens', 'women', 'mens', 'men', 'ladies', 'lady',
  'catalog', 'lookbook', 'deepfashion', 'original', 'photo', 'product', 'item', 'full', 'front',
  'back', 'side', 'view', 'id', 'jpg', 'jpeg', 'png', 'webp', 'look', 'studio', 'abstract'
]);

const COLOR_KEYWORDS = [
  'black', 'white', 'gray', 'grey', 'navy', 'blue', 'red', 'green', 'yellow', 'orange', 'pink',
  'purple', 'brown', 'beige', 'khaki', 'cream', 'olive', 'tan', 'burgundy', 'silver', 'gold'
];

const MATERIAL_KEYWORDS = [
  'organic cotton', 'recycled polyester', 'recycled nylon', 'vegan leather', 'recycled wool',
  'tencel', 'lyocell', 'hemp', 'linen', 'bamboo', 'cork', 'silk', 'wool', 'cotton', 'denim',
  'polyester', 'nylon', 'leather', 'suede', 'cashmere', 'fleece', 'canvas', 'jersey', 'knit'
];

const STYLE_KEYWORDS = [
  'casual', 'formal', 'smart', 'smart-casual', 'streetwear', 'classic', 'minimal', 'elegant',
  'athleisure', 'sporty', 'tailored', 'vintage', 'relaxed', 'oversized', 'cropped', 'layered',
  'structured', 'boho', 'polished', 'workwear', 'party', 'evening', 'summer', 'winter'
];

const OCCASION_KEYWORDS: Record<string, string[]> = {
  casual: ['casual', 'relaxed', 'weekend', 'everyday'],
  work: ['office', 'workwear', 'tailored', 'professional', 'smart', 'polished'],
  evening: ['evening', 'night', 'party', 'dressy'],
  formal: ['formal', 'occasion', 'ceremony', 'gown'],
  outdoor: ['outdoor', 'utility', 'cargo', 'performance'],
};

const SEASON_KEYWORDS: Record<string, string[]> = {
  spring: ['spring', 'lightweight', 'layered'],
  summer: ['summer', 'linen', 'bamboo', 'breathable', 'short', 'sleeveless'],
  autumn: ['autumn', 'fall', 'layered', 'knit', 'denim'],
  winter: ['winter', 'coat', 'wool', 'fleece', 'thermal', 'puffer'],
};

const BRAND_ETHICS: Record<string, number> = {
  patagonia: 0.9,
  reformation: 0.88,
  everlane: 0.72,
  veja: 0.9,
  pangaia: 0.86,
  stella: 0.8,
  'stella mccartney': 0.86,
  allbirds: 0.84,
  deepfashion: 0.55,
};

const HIGH_SUSTAINABILITY_MATERIALS: Record<string, number> = {
  'organic cotton': 0.95,
  hemp: 0.94,
  linen: 0.9,
  bamboo: 0.82,
  tencel: 0.93,
  lyocell: 0.93,
  cork: 0.88,
  'recycled wool': 0.9,
  'recycled polyester': 0.8,
  'recycled nylon': 0.8,
  'vegan leather': 0.72,
};

const LOW_SUSTAINABILITY_MATERIALS: Record<string, number> = {
  polyester: 0.3,
  nylon: 0.28,
  acrylic: 0.2,
  leather: 0.35,
  suede: 0.32,
};

const TRENDY_TAG_LABELS: Record<string, string> = {
  casual: 'Off Duty',
  formal: 'Night Out',
  smart: 'Polished',
  'smart casual': 'Clean Cut',
  streetwear: 'Street',
  classic: 'Classic',
  minimal: 'Minimal',
  elegant: 'Luxe',
  athleisure: 'Active',
  sporty: 'Sport',
  tailored: 'Tailored',
  vintage: 'Vintage',
  relaxed: 'Relaxed',
  oversized: 'Oversized',
  cropped: 'Cropped',
  layered: 'Layered',
  structured: 'Sharp',
  boho: 'Boho',
  polished: 'Polished',
  workwear: 'Workwear',
  party: 'Party',
  evening: 'Night Out',
  summer: 'Breezy',
  winter: 'Cozy',
  spring: 'Fresh',
  autumn: 'Layered',
  organic: 'Organic',
  'organic cotton': 'Organic',
  recycled: 'Recycled',
  'recycled polyester': 'Recycled',
  'recycled nylon': 'Recycled',
  'recycled wool': 'Recycled',
  'vegan leather': 'Vegan',
  hemp: 'Hemp',
  linen: 'Linen',
  bamboo: 'Bamboo',
  tencel: 'Tencel',
  lyocell: 'Tencel',
  denim: 'Denim',
  wool: 'Wool',
  leather: 'Leather',
  outdoor: 'Utility',
  work: 'Workwear',
};

export function enrichItemMetadata(input: ItemMetadataInput): EnrichedItemMetadata {
  const rawTokens = tokenizeItemText(input);
  const color = input.color ?? inferColor(rawTokens);
  const material = normalizeMaterial(input.material, rawTokens);
  const seasonality = inferSeasonality(rawTokens, input.category, material);
  const occasions = inferOccasions(rawTokens, input.category);
  const tags = buildTags(rawTokens, input.category, material, color, seasonality, occasions);
  const sustainabilityMetrics = calculateSustainabilityMetrics({
    ...input,
    material,
    tags,
  });

  return {
    color,
    material,
    tags,
    description: buildDescription({
      name: input.name,
      category: input.category,
      color,
      material,
      seasonality,
      occasions,
      tags,
    }),
    seasonality,
    occasions,
    ...sustainabilityMetrics,
  };
}

export function buildStoreItemName(category: string, sourcePath?: string, fallbackName?: string): string {
  const segments = (sourcePath ?? '')
    .replace(/\\/g, '/')
    .split('/')
    .slice(0, -1)
    .map((segment) => segment.trim().toLowerCase())
    .filter((segment) => segment && !GENERIC_TOKENS.has(segment) && !/^img\d*$/i.test(segment));

  const descriptiveSegment = [...segments]
    .reverse()
    .find((segment) => /[a-z]/.test(segment) && !segment.includes('img'));

  const descriptor = descriptiveSegment
    ? descriptiveSegment
        .replace(/[_-]+/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 2 && !GENERIC_TOKENS.has(token) && !/^\d+$/.test(token))
        .slice(0, 4)
        .map((token) => toTitleCase(token))
        .join(' ')
    : '';

  if (descriptor) {
    return `${descriptor} ${toTitleCase(category)}`.trim().slice(0, 120);
  }

  if (fallbackName && !/img[_-]?\d+/i.test(fallbackName)) {
    return fallbackName.slice(0, 120);
  }

  return `${toTitleCase(category)} Essentials`.slice(0, 120);
}

export function calculateSustainabilityMetrics(input: {
  brand?: string;
  material?: string;
  tags?: string[];
  description?: string;
}): SustainabilityMetrics {
  const text = [input.material, input.description, ...(input.tags ?? [])].filter(Boolean).join(' ').toLowerCase();
  const brandEthicsScore = inferBrandEthics(input.brand);

  let materialScore = 0.45;
  for (const [keyword, score] of Object.entries(HIGH_SUSTAINABILITY_MATERIALS)) {
    if (text.includes(keyword)) {
      materialScore = Math.max(materialScore, score);
    }
  }
  for (const [keyword, score] of Object.entries(LOW_SUSTAINABILITY_MATERIALS)) {
    if (text.includes(keyword)) {
      materialScore = Math.min(materialScore, score);
    }
  }

  const circularityScore = text.includes('recycled') || text.includes('upcycled') ? 0.9 : text.includes('organic') ? 0.7 : 0.45;
  const localityScore = text.includes('local') || text.includes('made local') ? 0.85 : 0.45;
  const durabilityScore = text.includes('denim') || text.includes('wool') || text.includes('leather') || text.includes('tailored') ? 0.7 : 0.55;

  const carbonScore = clamp(1 - (materialScore * 0.55 + circularityScore * 0.2 + localityScore * 0.1 + durabilityScore * 0.15), 0.05, 0.95);
  const sustainabilityScore = clamp(
    materialScore * 0.45 + brandEthicsScore * 0.25 + circularityScore * 0.15 + localityScore * 0.05 + durabilityScore * 0.1,
    0,
    1
  );

  return {
    sustainabilityScore: round3(sustainabilityScore),
    brandEthicsScore: round3(brandEthicsScore),
    carbonScore: round3(carbonScore),
  };
}

function tokenizeItemText(input: ItemMetadataInput): string[] {
  const combined = [
    input.name,
    input.category,
    input.brand,
    input.material,
    input.description,
    ...(input.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return Array.from(new Set(
    combined
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/[\s_-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !GENERIC_TOKENS.has(token) && !/^\d+$/.test(token))
  ));
}

function inferColor(tokens: string[]): string | undefined {
  const match = COLOR_KEYWORDS.find((keyword) => tokens.includes(keyword));
  return match ? toTitleCase(match === 'grey' ? 'gray' : match) : undefined;
}

function normalizeMaterial(explicitMaterial: string | undefined, tokens: string[]): string | undefined {
  const explicit = explicitMaterial?.trim();
  if (explicit) {
    return toTitleCase(explicit);
  }

  const joined = tokens.join(' ');
  const match = MATERIAL_KEYWORDS.find((keyword) => joined.includes(keyword));
  return match ? toTitleCase(match) : undefined;
}

function inferOccasions(tokens: string[], category: string): string[] {
  const matches = new Set<string>();

  for (const [occasion, keywords] of Object.entries(OCCASION_KEYWORDS)) {
    if (keywords.some((keyword) => tokens.includes(keyword))) {
      matches.add(occasion);
    }
  }

  const normalizedCategory = category.toLowerCase();
  if (normalizedCategory.includes('dress')) {
    matches.add('evening');
  }
  if (normalizedCategory.includes('blazer') || normalizedCategory.includes('shirt') || normalizedCategory.includes('trouser')) {
    matches.add('work');
  }
  if (matches.size === 0) {
    matches.add('casual');
  }

  return Array.from(matches);
}

function inferSeasonality(tokens: string[], category: string, material?: string): string[] {
  const matches = new Set<string>();
  const combined = new Set(tokens);

  for (const [season, keywords] of Object.entries(SEASON_KEYWORDS)) {
    if (keywords.some((keyword) => combined.has(keyword))) {
      matches.add(season);
    }
  }

  const normalizedCategory = category.toLowerCase();
  const lowerMaterial = material?.toLowerCase() ?? '';
  if (normalizedCategory.includes('coat') || normalizedCategory.includes('jacket') || lowerMaterial.includes('wool') || lowerMaterial.includes('fleece')) {
    matches.add('winter');
    matches.add('autumn');
  }
  if (normalizedCategory.includes('short') || lowerMaterial.includes('linen') || lowerMaterial.includes('bamboo')) {
    matches.add('summer');
    matches.add('spring');
  }

  if (matches.size === 0) {
    matches.add('spring');
    matches.add('autumn');
  }

  return Array.from(matches);
}

function buildTags(
  tokens: string[],
  category: string,
  material: string | undefined,
  color: string | undefined,
  seasonality: string[],
  occasions: string[]
): string[] {
  const candidateTags = new Set<string>();
  const normalizedCategory = normalizeCategoryTag(category);

  if (material) {
    candidateTags.add(material);
  }

  for (const value of seasonality) candidateTags.add(value);
  for (const value of occasions) candidateTags.add(value);

  for (const keyword of STYLE_KEYWORDS) {
    if (tokens.includes(keyword)) {
      candidateTags.add(formatTagLabel(keyword));
    }
  }

  for (const token of tokens) {
    if (COLOR_KEYWORDS.includes(token) || token === normalizedCategory) continue;
    if (STYLE_KEYWORDS.includes(token) || MATERIAL_KEYWORDS.some((keyword) => keyword.includes(token))) {
      candidateTags.add(formatTagLabel(token));
    }
  }

  if (tokens.some((token) => ['black', 'white', 'gray', 'grey', 'navy', 'beige', 'olive', 'brown'].includes(token))) {
    candidateTags.add('Core');
  }
  if (normalizedCategory.toLowerCase().includes('dress') || normalizedCategory.toLowerCase().includes('outerwear')) {
    candidateTags.add('Statement');
  }

  return Array.from(candidateTags)
    .map((tag) => formatTagLabel(tag.trim()))
    .filter((tag) => tag.length > 2 && !GENERIC_TOKENS.has(tag.toLowerCase()) && !/^img\d*$/i.test(tag))
    .slice(0, 5);
}

function buildDescription(input: {
  name: string;
  category: string;
  color?: string;
  material?: string;
  seasonality: string[];
  occasions: string[];
  tags: string[];
}): string {
  const parts = [
    `${input.name} is a ${input.color ? `${input.color.toLowerCase()} ` : ''}${input.category.toLowerCase()}`,
    input.material ? `crafted with ${input.material.toLowerCase()}` : undefined,
    input.occasions.length > 0 ? `suited for ${input.occasions.join(' and ')} wear` : undefined,
    input.seasonality.length > 0 ? `best for ${input.seasonality.join(' and ')}` : undefined,
  ].filter(Boolean);

  const descriptorTags = input.tags.filter((tag) => !input.seasonality.includes(tag) && !input.occasions.includes(tag)).slice(0, 3);
  if (descriptorTags.length > 0) {
    parts.push(`with ${descriptorTags.map((tag) => tag.toLowerCase()).join(', ')} details`);
  }

  return `${parts.join(', ')}.`.replace(/\s+,/g, ',');
}

function normalizeCategoryTag(category: string): string {
  return toTitleCase(category.trim().replace(/[-_]+/g, ' '));
}

function formatTagLabel(value: string): string {
  const normalized = value.replace(/[-_]+/g, ' ').trim().toLowerCase();
  if (TRENDY_TAG_LABELS[normalized]) {
    return TRENDY_TAG_LABELS[normalized];
  }

  const matchedEntry = Object.entries(TRENDY_TAG_LABELS).find(([key]) => normalized.includes(key));
  if (matchedEntry) {
    return matchedEntry[1];
  }

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => toTitleCase(token))
    .join(' ');
}

function inferBrandEthics(brand?: string): number {
  if (!brand) {
    return 0.55;
  }

  const normalized = brand.toLowerCase();
  for (const [name, score] of Object.entries(BRAND_ETHICS)) {
    if (normalized.includes(name)) {
      return score;
    }
  }

  return 0.58;
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}