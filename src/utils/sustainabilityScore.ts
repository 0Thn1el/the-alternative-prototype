export interface SustainabilityData {
  organic: boolean;
  recycled: boolean;
  local: boolean;
}

export function calculateSustainabilityScore(sustainable?: SustainabilityData): number {
  if (!sustainable) return 0;
  
  let score = 0;
  
  // Organic materials contribute 35 points
  if (sustainable.organic) score += 35;
  
  // Recycled materials contribute 35 points
  if (sustainable.recycled) score += 35;
  
  // Local production contributes 30 points
  if (sustainable.local) score += 30;
  
  return score;
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
