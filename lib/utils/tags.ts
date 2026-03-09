export type TagRecord = {
  id: string;
  name: string;
  scopes?: string[];
  category?: string | null;
  color?: string | null;
  archived?: boolean;
};

export type TagUpsertInput = {
  id?: string;
  name: string;
  scopes: string[];
  category?: string | null;
  color?: string | null;
  archived?: boolean;
};

export function reconcileTagsForScope({
  tags,
  scope,
  catalog,
}: {
  tags: string[];
  scope: string;
  catalog: TagRecord[];
}): { normalizedTags: string[]; upserts: TagUpsertInput[] } {
  const normalizedTags: string[] = [];
  const upserts: TagUpsertInput[] = [];
  const seen = new Set<string>();
  const catalogByName = new Map<string, TagRecord>();

  catalog.forEach((tag) => {
    const name = tag?.name?.trim();
    if (!name) return;
    catalogByName.set(name.toLowerCase(), tag);
  });

  tags.forEach((tag) => {
    const name = tag.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const existing = catalogByName.get(key);
    if (existing) {
      normalizedTags.push(existing.name);
      const scopes = existing.scopes ?? [];
      if (!scopes.includes(scope)) {
        upserts.push({
          id: existing.id,
          name: existing.name,
          scopes: [...scopes, scope],
          category: existing.category ?? null,
          color: existing.color ?? null,
          archived: existing.archived ?? false,
        });
      }
      return;
    }

    normalizedTags.push(name);
    upserts.push({ name, scopes: [scope] });
  });

  return { normalizedTags, upserts };
}
