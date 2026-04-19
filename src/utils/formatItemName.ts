export function formatItemName(name?: string | null): string {
  return String(name || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}