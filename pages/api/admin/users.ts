import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getFirestoreInstance } from '@/server/adapters/firestore';
import { ModuleKey, UserRole } from '@/lib/types/tenant';

const moduleSchema = z.enum(['dashboard', 'ivr', 'email', 'whatsapp', 'chatbot', 'automations']);
const roleSchema = z.enum(['admin', 'agent', 'viewer']);

const bodySchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  tenantId: z.string().min(1),
  modules: z.array(moduleSchema).min(1),
  password: z.string().min(6).optional(),
  capabilities: z.array(z.string().min(1)).optional(),
  metadata: z.record(z.unknown()).optional(),
  role: roleSchema.optional(),
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

function normalizeList<T>(items: T[] | undefined): T[] {
  if (!items || items.length === 0) {
    return [];
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

  const { userId, email, name, tenantId, modules, password, capabilities, metadata, role } = parseResult.data;
  const db = getFirestoreInstance();
  const userRef = db.collection('users').doc(userId);
  const snapshot = await userRef.get();
  const existing = snapshot.exists ? snapshot.data() : null;
  const effectiveRole = (role ?? (existing?.role as UserRole | undefined) ?? 'agent') as UserRole;
  const normalizedModules = normalizeList<ModuleKey>(modules);
  const normalizedCapabilities = capabilities
    ? normalizeList<string>(capabilities)
    : (existing?.capabilities as string[] | undefined) ?? [];
  const now = new Date();

  if (!snapshot.exists) {
    if (!password) {
      return res.status(400).json({ error: 'Password is required for new users' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const payload: Record<string, unknown> = {
      email,
      name,
      tenantId,
      role: effectiveRole,
      modules: normalizedModules,
      capabilities: normalizedCapabilities,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    if (metadata !== undefined) {
      payload.metadata = metadata;
    }
    await userRef.set(payload);
    return res.status(201).json({
      ok: true,
      created: true,
      user: {
        id: userId,
        email,
        name,
        tenantId,
        role: effectiveRole,
        modules: normalizedModules,
        capabilities: normalizedCapabilities,
        metadata,
      },
    });
  }

  const updates: Record<string, unknown> = {
    email,
    name,
    tenantId,
    role: effectiveRole,
    modules: normalizedModules,
    capabilities: normalizedCapabilities,
    updatedAt: now,
  };
  if (metadata !== undefined) {
    updates.metadata = metadata;
  }
  if (password) {
    updates.passwordHash = await bcrypt.hash(password, 10);
  }

  await userRef.update(updates);
  return res.status(200).json({
    ok: true,
    created: false,
    user: {
      id: userId,
      email,
      name,
      tenantId,
      role: effectiveRole,
      modules: normalizedModules,
      capabilities: normalizedCapabilities,
      metadata: metadata ?? existing?.metadata ?? null,
    },
  });
}
