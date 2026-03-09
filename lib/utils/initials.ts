export function initialsFromName(value: string | null | undefined): string {
  if (!value) return '??';
  const cleaned = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!cleaned.length) {
    return value.slice(0, 2).toUpperCase();
  }
  if (cleaned.length === 1) {
    return cleaned[0].slice(0, 2).toUpperCase();
  }
  const [first, second] = cleaned;
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase();
}
