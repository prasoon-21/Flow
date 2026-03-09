import type { NextApiRequest, NextApiResponse } from 'next';
import { clearSessionCookie } from '@/server/services/session.service';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
