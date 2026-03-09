import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getFirestoreInstance } from '@/server/adapters/firestore';
import { getConfig } from '@/lib/config/env';
import type { ModuleKey } from '@/lib/types/tenant';

const moduleSchema = z.enum([
  'dashboard',
  'ivr',
  'email',
  'whatsapp',
  'chatbot',
  'automations',
  'contacts',
  'tickets',
  'shipping-label',
]);

const bodySchema = z.object({
  name: z.string().min(1),
  path: z
    .string()
    .min(1)
    .refine((value) => value.startsWith('/'), { message: 'Path must start with /' }),
  projectKey: z.string().min(1).optional(),
  tenantId: z.string().min(1).nullable().optional(),
  moduleKey: moduleSchema.optional(),
  requiredModules: z.array(moduleSchema).optional(),
  requiredCapabilities: z.array(z.string().min(1)).optional(),
});

function readAdminKey(req: NextApiRequest): string | null {
  const header = req.headers['x-admin-key'];
  if (Array.isArray(header)) {
    return header[0] ?? null;
  }
  if (typeof header === 'string') {
    return header;
  }
  return null;
}

function normalizeList<T>(items: T[] | undefined): T[] | undefined {
  if (!items) {
    return undefined;
  }
  return Array.from(new Set(items));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return res.status(500).json({ error: 'ADMIN_API_KEY is not configured' });
  }

  const providedKey = readAdminKey(req);
  if (!providedKey || providedKey !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parseResult = bodySchema.safeParse(req.body ?? {});
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const {
    name,
    path,
    projectKey: projectKeyInput,
    tenantId,
    moduleKey,
    requiredModules,
    requiredCapabilities,
  } = parseResult.data;
  const { projectKey: defaultProjectKey } = getConfig();
  const projectKey = projectKeyInput ?? defaultProjectKey;
  const db = getFirestoreInstance();
  const now = new Date();

  const existingQuery = await db
    .collection('pages')
    .where('path', '==', path)
    .where('projectKey', '==', projectKey)
    .limit(1)
    .get();

  const normalizedModules = normalizeList<ModuleKey>(requiredModules);
  const normalizedCapabilities = normalizeList<string>(requiredCapabilities);

  if (existingQuery.empty) {
    const payload: Record<string, unknown> = {
      name,
      path,
      projectKey,
      tenantId: tenantId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    if (moduleKey) {
      payload.moduleKey = moduleKey;
    }
    if (normalizedModules !== undefined) {
      payload.requiredModules = normalizedModules;
    }
    if (normalizedCapabilities !== undefined) {
      payload.requiredCapabilities = normalizedCapabilities;
    }
    const docRef = await db.collection('pages').add(payload);
    return res.status(201).json({
      ok: true,
      created: true,
      page: {
        id: docRef.id,
        name,
        path,
        projectKey,
        tenantId: tenantId ?? null,
        moduleKey: moduleKey ?? null,
        requiredModules: normalizedModules ?? null,
        requiredCapabilities: normalizedCapabilities ?? null,
      },
    });
  }

  const existingDoc = existingQuery.docs[0];
  const updates: Record<string, unknown> = {
    name,
    path,
    projectKey,
    updatedAt: now,
  };
  if (tenantId !== undefined) {
    updates.tenantId = tenantId;
  }
  if (moduleKey !== undefined) {
    updates.moduleKey = moduleKey;
  }
  if (normalizedModules !== undefined) {
    updates.requiredModules = normalizedModules;
  }
  if (normalizedCapabilities !== undefined) {
    updates.requiredCapabilities = normalizedCapabilities;
  }

  await existingDoc.ref.set(updates, { merge: true });

  return res.status(200).json({
    ok: true,
    created: false,
    page: {
      id: existingDoc.id,
      name,
      path,
      projectKey,
      tenantId: tenantId ?? (existingDoc.data()?.tenantId ?? null),
      moduleKey: moduleKey ?? existingDoc.data()?.moduleKey ?? null,
      requiredModules: normalizedModules ?? existingDoc.data()?.requiredModules ?? null,
      requiredCapabilities: normalizedCapabilities ?? existingDoc.data()?.requiredCapabilities ?? null,
    },
  });
}
