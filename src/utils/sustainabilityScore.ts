export interface SustainabilityData {
  organic: boolean;
  recycled: boolean;
  local: boolean;
}

export interface SustainabilityProfile {
  sustainable?: Partial<SustainabilityData>;
  material?: string;
  materials?: string[];
  tags?: string[];
  brand?: string;
  sustainabilityScore?: number;
  brandEthicsScore?: number;
  carbonScore?: number;
}

export function calculateSustainabilityScore(profile?: SustainabilityData | SustainabilityProfile): number {
  if (!profile) return 0;

  if ('sustainabilityScore' in profile && typeof profile.sustainabilityScore === 'number') {
    return normalizeScore(profile.sustainabilityScore);
  }

  const sustainable = isLegacySustainabilityData(profile) ? profile : profile.sustainable;
  const text = [
    'material' in profile && typeof profile.material === 'string' ? profile.material : '',
    'materials' in profile && Array.isArray(profile.materials) ? profile.materials.join(' ') : '',
    'tags' in profile && Array.isArray(profile.tags) ? profile.tags.join(' ') : '',
  ].join(' ').toLowerCase();

  let score = 15;

  if (sustainable?.organic) score += 28;
  if (sustainable?.recycled) score += 26;
  if (sustainable?.local) score += 16;

  if (text.includes('organic cotton') || text.includes('hemp') || text.includes('linen') || text.includes('tencel') || text.includes('lyocell')) {
    score += 24;
  } else if (text.includes('bamboo') || text.includes('recycled') || text.includes('upcycled')) {
    score += 18;
  } else if (text.includes('polyester') || text.includes('nylon') || text.includes('acrylic')) {
    score -= 8;
  }

  if ('brandEthicsScore' in profile && typeof profile.brandEthicsScore === 'number') {
    score += normalizeScore(profile.brandEthicsScore) * 0.15;
  }

  if ('carbonScore' in profile && typeof profile.carbonScore === 'number') {
    score += (100 - normalizeScore(profile.carbonScore)) * 0.12;
  }

  if ('brand' in profile && typeof profile.brand === 'string') {
    const lowerBrand = profile.brand.toLowerCase();
    if (['patagonia', 'reformation', 'veja', 'pangaia', 'allbirds'].some((brand) => lowerBrand.includes(brand))) {
      score += 8;
    }
  }

  return clamp(Math.round(score), 0, 100);
}

export function getSustainabilityGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  return 'D';
}

export function getSustainabilityColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-orange-600';
}

export function getSustainabilityBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-orange-100 text-orange-800 border-orange-200';
}

export function getSustainabilityHighlights(profile?: SustainabilityData | SustainabilityProfile): string[] {
  if (!profile) return [];

  const sustainable = isLegacySustainabilityData(profile) ? profile : profile.sustainable;
  const text = [
    'material' in profile && typeof profile.material === 'string' ? profile.material : '',
    'materials' in profile && Array.isArray(profile.materials) ? profile.materials.join(' ') : '',
    'tags' in profile && Array.isArray(profile.tags) ? profile.tags.join(' ') : '',
  ].join(' ').toLowerCase();

  const highlights: string[] = [];
  if (sustainable?.organic || text.includes('organic')) highlights.push('Organic materials');
  if (sustainable?.recycled || text.includes('recycled') || text.includes('upcycled')) highlights.push('Recycled content');
  if (sustainable?.local || text.includes('local')) highlights.push('Local production');
  if (text.includes('hemp') || text.includes('linen') || text.includes('tencel') || text.includes('lyocell')) highlights.push('Lower-impact fibers');
  if ('carbonScore' in profile && typeof profile.carbonScore === 'number' && normalizeScore(profile.carbonScore) <= 35) highlights.push('Lower carbon estimate');

  return Array.from(new Set(highlights)).slice(0, 4);
}

function isLegacySustainabilityData(value: SustainabilityData | SustainabilityProfile): value is SustainabilityData {
  return 'organic' in value || 'recycled' in value || 'local' in value;
}

function normalizeScore(value: number): number {
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
