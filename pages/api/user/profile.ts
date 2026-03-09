import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { readSessionFromRequest } from '@/server/services/session.service';
import { UserService, UserServiceError } from '@/server/services/user.service';

const bodySchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    currentPassword: z.string().min(1).optional(),
  })
  .refine((data) => data.name || data.email || data.password, {
    message: 'At least one field is required',
  })
  .refine((data) => !data.currentPassword || data.password, {
    message: 'Password is required when providing currentPassword',
    path: ['password'],
  });

const userService = new UserService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = readSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parseResult = bodySchema.safeParse(req.body ?? {});
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: parseResult.error.flatten(),
    });
  }

  try {
    const user = await userService.updateProfile(session.userId, parseResult.data);
    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('[UserProfileUpdate]', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}
