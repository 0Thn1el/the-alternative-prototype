import { Types } from 'mongoose';
import Item, { IItem } from '../models/Item';
import Interaction, { IInteractionContext, InteractionEvent } from '../models/Interaction';
import { calculateSustainabilityMetrics } from '../utils/itemMetadata';

type RecommendationContext = {
  weather?: string;
  occasion?: string;
  timeOfDay?: string;
  season?: string;
  category?: string;
  baseItemId?: string;
  sustainabilityWeight?: number;
  limit?: number;
};

type ScoreBreakdown = {
  visualSimilarity: number;
  behaviourMatch: number;
  wardrobeCompatibility: number;
  contextRelevance: number;
  sustainabilityBoost: number;
  total: number;
};

export type RecommendedItem = {
  _id: Types.ObjectId;
  name: string;
  category: string;
  tags: string[];
  price?: number;
  brand?: string;
  color?: string;
  material?: string;
  imageUrl?: string;
  source: 'user' | 'deepfashion';
  seasonality?: string[];
  occasions?: string[];
  sustainabilityScore?: number;
  brandEthicsScore?: number;
  carbonScore?: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  reasons: string[];
};

const EVENT_WEIGHTS: Record<InteractionEvent, number> = {
  view: 1,
  like: 3,
  add_to_cart: 4,
  purchase: 5,
};

const SCORE_WEIGHTS = {
  visualSimilarity: 0.3,
  behaviourMatch: 0.25,
  wardrobeCompatibility: 0.2,
  contextRelevance: 0.15,
  sustainabilityBoost: 0.1,
};

const CATEGORY_COMPATIBILITY: Record<string, string[]> = {
  top: ['bottom', 'outerwear', 'shoes'],
  bottom: ['top', 'outerwear', 'shoes'],
  dress: ['outerwear', 'shoes'],
  outerwear: ['top', 'bottom', 'dress', 'shoes'],
  shoes: ['top', 'bottom', 'dress', 'outerwear'],
};

export async function getHybridRecommendations(
  uid: string,
  context: RecommendationContext = {}
): Promise<RecommendedItem[]> {
  const limit = Math.min(Math.max(context.limit ?? 12, 1), 50);

  const [wardrobeItems, interactions, baseItem, allCandidates] = await Promise.all([
    Item.find({ uid }).lean<IItem[]>(),
    Interaction.find({ uid }).sort({ createdAt: -1 }).limit(250).lean(),
    context.baseItemId ? Item.findById(context.baseItemId).lean<IItem | null>() : Promise.resolve(null),
    Item.find({
      source: 'deepfashion',
      ...(context.category ? { category: { $regex: `^${escapeRegex(context.category)}$`, $options: 'i' } } : {}),
    }).lean<IItem[]>(),
  ]);

  const interactedItemIds = new Set(interactions.map((interaction) => String(interaction.itemId)));
  const candidates = allCandidates.filter((item) => !interactedItemIds.has(String(item._id)));

  const interactedObjectIds = interactions
    .map((interaction) => String(interaction.itemId))
    .filter((itemId) => Types.ObjectId.isValid(itemId))
    .map((itemId) => new Types.ObjectId(itemId));

  const interactedItems = interactions.length > 0
    ? await Item.find({ _id: { $in: interactedObjectIds } }).lean<IItem[]>()
    : [];

  const interactionItemsById = new Map(interactedItems.map((item) => [String(item._id), item]));
  const weightedPreferenceEmbedding = buildWeightedPreferenceEmbedding(
    interactions.map((interaction) => ({
      weight: EVENT_WEIGHTS[interaction.event],
      item: interactionItemsById.get(String(interaction.itemId)),
    }))
  );

  const categoryAffinity = buildCategoryAffinity(interactions, interactionItemsById);
  const pricePreference = buildPricePreference(interactions, interactionItemsById);
  const sustainabilityPreference = buildSustainabilityPreference(interactions, interactionItemsById);
  const effectiveSustainabilityWeight = clamp(context.sustainabilityWeight ?? sustainabilityPreference ?? 0.5, 0, 1);

  return candidates
    .map((candidate) => scoreCandidate({
      candidate,
      baseItem,
      wardrobeItems,
      weightedPreferenceEmbedding,
      categoryAffinity,
      pricePreference,
      context,
      sustainabilityWeight: effectiveSustainabilityWeight,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export async function recordInteraction(params: {
  uid: string;
  itemId: string;
  event: InteractionEvent;
  context?: IInteractionContext;
}): Promise<void> {
  const objectId = new Types.ObjectId(params.itemId);

  await Interaction.create({
    uid: params.uid,
    itemId: objectId,
    event: params.event,
    context: params.context ?? {},
  });
}

function scoreCandidate(params: {
  candidate: IItem;
  baseItem: IItem | null;
  wardrobeItems: IItem[];
  weightedPreferenceEmbedding: number[] | null;
  categoryAffinity: Map<string, number>;
  pricePreference: { min?: number; max?: number; average?: number } | null;
  context: RecommendationContext;
  sustainabilityWeight: number;
}): RecommendedItem {
  const { candidate, baseItem, wardrobeItems, weightedPreferenceEmbedding, categoryAffinity, pricePreference, context, sustainabilityWeight } = params;

  const visualSimilarity = scoreVisualSimilarity(candidate, baseItem, weightedPreferenceEmbedding);
  const behaviourMatch = scoreBehaviourMatch(candidate, weightedPreferenceEmbedding, categoryAffinity, pricePreference);
  const wardrobeCompatibility = scoreWardrobeCompatibility(candidate, wardrobeItems);
  const contextRelevance = scoreContextRelevance(candidate, context);
  const sustainabilityBoost = scoreSustainability(candidate) * sustainabilityWeight;

  const total =
    visualSimilarity * SCORE_WEIGHTS.visualSimilarity +
    behaviourMatch * SCORE_WEIGHTS.behaviourMatch +
    wardrobeCompatibility * SCORE_WEIGHTS.wardrobeCompatibility +
    contextRelevance * SCORE_WEIGHTS.contextRelevance +
    sustainabilityBoost * SCORE_WEIGHTS.sustainabilityBoost;

  const scoreBreakdown: ScoreBreakdown = {
    visualSimilarity: roundScore(visualSimilarity),
    behaviourMatch: roundScore(behaviourMatch),
    wardrobeCompatibility: roundScore(wardrobeCompatibility),
    contextRelevance: roundScore(contextRelevance),
    sustainabilityBoost: roundScore(sustainabilityBoost),
    total: roundScore(total),
  };

  return {
    _id: candidate._id,
    name: candidate.name,
    category: candidate.category,
    tags: candidate.tags ?? [],
    price: candidate.price,
    brand: candidate.brand,
    color: candidate.color,
    material: candidate.material,
    imageUrl: candidate.imageUrl,
    source: candidate.source,
    seasonality: candidate.seasonality ?? [],
    occasions: candidate.occasions ?? [],
    sustainabilityScore: candidate.sustainabilityScore,
    brandEthicsScore: candidate.brandEthicsScore,
    carbonScore: candidate.carbonScore,
    score: roundScore(total),
    scoreBreakdown,
    reasons: buildExplainability(candidate, scoreBreakdown, wardrobeItems, context),
  };
}

function scoreVisualSimilarity(candidate: IItem, baseItem: IItem | null, preferenceEmbedding: number[] | null): number {
  const signals: number[] = [];

  if (baseItem?.imageEmbedding && candidate.imageEmbedding) {
    signals.push(cosineSimilarity(baseItem.imageEmbedding, candidate.imageEmbedding));
  }

  if (preferenceEmbedding && candidate.imageEmbedding) {
    signals.push(cosineSimilarity(preferenceEmbedding, candidate.imageEmbedding));
  }

  if (signals.length === 0) {
    return 0;
  }

  return average(signals);
}

function scoreBehaviourMatch(
  candidate: IItem,
  preferenceEmbedding: number[] | null,
  categoryAffinity: Map<string, number>,
  pricePreference: { min?: number; max?: number; average?: number } | null
): number {
  let score = 0;

  if (preferenceEmbedding && candidate.imageEmbedding) {
    score += cosineSimilarity(preferenceEmbedding, candidate.imageEmbedding) * 0.6;
  }

  const normalizedCategory = normalizeCategory(candidate.category);
  const affinity = categoryAffinity.get(normalizedCategory) ?? 0;
  score += clamp(affinity, 0, 1) * 0.25;

  if (typeof candidate.price === 'number' && pricePreference?.average !== undefined) {
    const spread = Math.max(pricePreference.average * 0.75, 25);
    const priceDistance = Math.abs(candidate.price - pricePreference.average);
    score += clamp(1 - priceDistance / spread, 0, 1) * 0.15;
  }

  return clamp(score, 0, 1);
}

function scoreWardrobeCompatibility(candidate: IItem, wardrobeItems: IItem[]): number {
  if (wardrobeItems.length === 0) {
    return 0;
  }

  const candidateCategory = normalizeCategory(candidate.category);
  const complementaryCategories = CATEGORY_COMPATIBILITY[candidateCategory] ?? [];

  const compatibilityScores = wardrobeItems.map((ownedItem) => {
    let score = 0;
    const ownedCategory = normalizeCategory(ownedItem.category);

    if (complementaryCategories.includes(ownedCategory)) {
      score += 0.45;
    } else if (ownedCategory === candidateCategory) {
      score += 0.2;
    }

    if (candidate.imageEmbedding && ownedItem.imageEmbedding) {
      score += cosineSimilarity(candidate.imageEmbedding, ownedItem.imageEmbedding) * 0.35;
    }

    score += tagOverlapScore(candidate.tags ?? [], ownedItem.tags ?? []) * 0.15;

    if (candidate.color && ownedItem.color && candidate.color.toLowerCase() === ownedItem.color.toLowerCase()) {
      score += 0.05;
    }

    return clamp(score, 0, 1);
  });

  compatibilityScores.sort((left, right) => right - left);
  return average(compatibilityScores.slice(0, Math.min(3, compatibilityScores.length)));
}

function scoreContextRelevance(candidate: IItem, context: RecommendationContext): number {
  const signals: number[] = [];
  const tags = new Set((candidate.tags ?? []).map((tag) => tag.toLowerCase()));
  const material = candidate.material?.toLowerCase() ?? '';

  if (context.season) {
    const season = context.season.toLowerCase();
    const seasonality = (candidate.seasonality ?? []).map((value) => value.toLowerCase());
    if (seasonality.includes(season) || tags.has(season)) {
      signals.push(1);
    }
  }

  if (context.occasion) {
    const occasion = context.occasion.toLowerCase();
    const occasions = (candidate.occasions ?? []).map((value) => value.toLowerCase());
    if (occasions.includes(occasion) || tags.has(occasion)) {
      signals.push(1);
    }
  }

  if (context.timeOfDay) {
    const timeOfDay = context.timeOfDay.toLowerCase();
    if (tags.has(timeOfDay)) {
      signals.push(0.9);
    }
  }

  if (context.weather) {
    const weather = context.weather.toLowerCase();
    const category = normalizeCategory(candidate.category);

    if (weather.includes('cold')) {
      if (category === 'outerwear' || material.includes('wool') || material.includes('fleece')) {
        signals.push(1);
      }
    } else if (weather.includes('hot') || weather.includes('warm')) {
      if (material.includes('linen') || material.includes('cotton') || tags.has('summer')) {
        signals.push(1);
      }
    } else if (weather.includes('rain')) {
      if (category === 'outerwear' || tags.has('rain')) {
        signals.push(0.9);
      }
    }
  }

  if (signals.length === 0) {
    return 0;
  }

  return average(signals);
}

function scoreSustainability(candidate: IItem): number {
  const explicitScores = [candidate.sustainabilityScore, candidate.brandEthicsScore, candidate.carbonScore !== undefined ? 1 - candidate.carbonScore : undefined]
    .filter((value): value is number => typeof value === 'number');

  if (explicitScores.length > 0) {
    return average(explicitScores.map((value) => clamp(value, 0, 1)));
  }

  return calculateSustainabilityMetrics({
    brand: candidate.brand,
    material: candidate.material,
    tags: candidate.tags,
    description: candidate.description,
  }).sustainabilityScore;
}

function buildExplainability(
  candidate: IItem,
  scoreBreakdown: ScoreBreakdown,
  wardrobeItems: IItem[],
  context: RecommendationContext
): string[] {
  const reasons: string[] = [];

  if (scoreBreakdown.behaviourMatch >= 0.55) {
    reasons.push('Matches your recent style preferences');
  }

  if (scoreBreakdown.wardrobeCompatibility >= 0.45 && wardrobeItems.length > 0) {
    const matchingItems = countCompatibleWardrobeItems(candidate, wardrobeItems);
    reasons.push(`Pairs with ${matchingItems} item${matchingItems === 1 ? '' : 's'} in your wardrobe`);
  }

  if (scoreBreakdown.contextRelevance >= 0.45) {
    if (context.occasion) {
      reasons.push(`Relevant for ${context.occasion} plans`);
    } else if (context.weather) {
      reasons.push(`Fits ${context.weather} weather`);
    } else {
      reasons.push('Relevant to your current context');
    }
  }

  if (scoreBreakdown.sustainabilityBoost >= 0.45) {
    reasons.push('Strong sustainability profile');
  }

  if (scoreBreakdown.visualSimilarity >= 0.55) {
    reasons.push('Visually aligned with items you engaged with');
  }

  return reasons.slice(0, 3);
}

function countCompatibleWardrobeItems(candidate: IItem, wardrobeItems: IItem[]): number {
  const candidateCategory = normalizeCategory(candidate.category);
  const complementaryCategories = CATEGORY_COMPATIBILITY[candidateCategory] ?? [];

  const matches = wardrobeItems.filter((item) => {
    const normalizedCategory = normalizeCategory(item.category);
    return complementaryCategories.includes(normalizedCategory);
  }).length;

  return Math.max(matches, 1);
}

function buildWeightedPreferenceEmbedding(
  weightedItems: Array<{ weight: number; item: IItem | undefined }>
): number[] | null {
  const usableItems = weightedItems.filter(({ item }) => item?.imageEmbedding && item.imageEmbedding.length > 0);
  if (usableItems.length === 0) {
    return null;
  }

  const embeddingLength = usableItems[0].item!.imageEmbedding!.length;
  const accumulator = new Array<number>(embeddingLength).fill(0);
  let totalWeight = 0;

  for (const { item, weight } of usableItems) {
    const embedding = item!.imageEmbedding!;
    if (embedding.length !== embeddingLength) {
      continue;
    }

    for (let index = 0; index < embeddingLength; index += 1) {
      accumulator[index] += embedding[index] * weight;
    }
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return null;
  }

  return accumulator.map((value) => value / totalWeight);
}

function buildCategoryAffinity(interactions: Array<{ event: InteractionEvent; itemId: unknown }>, itemsById: Map<string, IItem>): Map<string, number> {
  const rawTotals = new Map<string, number>();
  let maxWeight = 0;

  for (const interaction of interactions) {
    const item = itemsById.get(String(interaction.itemId));
    if (!item) {
      continue;
    }

    const category = normalizeCategory(item.category);
    const next = (rawTotals.get(category) ?? 0) + EVENT_WEIGHTS[interaction.event];
    rawTotals.set(category, next);
    maxWeight = Math.max(maxWeight, next);
  }

  if (maxWeight === 0) {
    return new Map();
  }

  return new Map(Array.from(rawTotals.entries()).map(([category, weight]) => [category, weight / maxWeight]));
}

function buildPricePreference(
  interactions: Array<{ event: InteractionEvent; itemId: unknown }>,
  itemsById: Map<string, IItem>
): { min?: number; max?: number; average?: number } | null {
  const weightedPrices: Array<{ price: number; weight: number }> = [];

  for (const interaction of interactions) {
    const item = itemsById.get(String(interaction.itemId));
    if (item && typeof item.price === 'number') {
      weightedPrices.push({ price: item.price, weight: EVENT_WEIGHTS[interaction.event] });
    }
  }

  if (weightedPrices.length === 0) {
    return null;
  }

  const totalWeight = weightedPrices.reduce((sum, entry) => sum + entry.weight, 0);
  const weightedAverage = weightedPrices.reduce((sum, entry) => sum + entry.price * entry.weight, 0) / totalWeight;

  return {
    min: Math.min(...weightedPrices.map((entry) => entry.price)),
    max: Math.max(...weightedPrices.map((entry) => entry.price)),
    average: weightedAverage,
  };
}

function buildSustainabilityPreference(
  interactions: Array<{ event: InteractionEvent; itemId: unknown }>,
  itemsById: Map<string, IItem>
): number | null {
  const weightedScores: Array<{ score: number; weight: number }> = [];

  for (const interaction of interactions) {
    const item = itemsById.get(String(interaction.itemId));
    if (!item) {
      continue;
    }

    const sustainability = scoreSustainability(item);
    weightedScores.push({ score: sustainability, weight: EVENT_WEIGHTS[interaction.event] });
  }

  if (weightedScores.length === 0) {
    return null;
  }

  const totalWeight = weightedScores.reduce((sum, entry) => sum + entry.weight, 0);
  return weightedScores.reduce((sum, entry) => sum + entry.score * entry.weight, 0) / totalWeight;
}

function normalizeCategory(category: string): string {
  const normalized = category.toLowerCase();

  if (normalized.includes('shirt') || normalized.includes('top') || normalized.includes('blouse') || normalized.includes('tee')) {
    return 'top';
  }
  if (normalized.includes('pant') || normalized.includes('jean') || normalized.includes('skirt') || normalized.includes('short')) {
    return 'bottom';
  }
  if (normalized.includes('dress')) {
    return 'dress';
  }
  if (normalized.includes('coat') || normalized.includes('jacket') || normalized.includes('hoodie') || normalized.includes('sweater')) {
    return 'outerwear';
  }
  if (normalized.includes('shoe') || normalized.includes('boot') || normalized.includes('sneaker') || normalized.includes('heel')) {
    return 'shoes';
  }

  return normalized;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < vecA.length; index += 1) {
    dotProduct += vecA[index] * vecB[index];
    normA += vecA[index] * vecA[index];
    normB += vecB[index] * vecB[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return clamp(dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)), 0, 1);
}

function tagOverlapScore(tagsA: string[], tagsB: string[]): number {
  if (tagsA.length === 0 || tagsB.length === 0) {
    return 0;
  }

  const normalizedB = new Set(tagsB.map((tag) => tag.toLowerCase()));
  const overlap = tagsA.filter((tag) => normalizedB.has(tag.toLowerCase())).length;
  return overlap / Math.max(tagsA.length, tagsB.length);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundScore(value: number): number {
  return Math.round(clamp(value, 0, 1) * 1000) / 1000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}