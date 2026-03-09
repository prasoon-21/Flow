import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { UserRepository } from '@/server/adapters/repositories/user.repository';
import { setSessionCookie } from '@/server/services/session.service';
import { resolveUserModules } from '@/lib/access/modules';

const bodySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

const userRepo = new UserRepository();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const parseResult = bodySchema.safeParse(req.body ?? {});
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid credentials payload' });
  }

  const { userId, password } = parseResult.data;
  const user = await userRepo.findById(userId);
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const modules = resolveUserModules(user);
  const capabilities = user.capabilities ?? [];

  setSessionCookie(res, {
    userId: user.id,
    tenantId: user.tenantId,
    userRole: user.role,
    modules,
    capabilities,
  });

  return res.status(200).json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      modules,
      capabilities,
    },
  });
}
