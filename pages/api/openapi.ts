import type { NextApiRequest, NextApiResponse } from 'next';
import { getOpenApiSpec } from '@/lib/openapi';

function resolveBaseUrl(req: NextApiRequest): string | undefined {
  const host = req.headers.host;
  if (!host) {
    return undefined;
  }
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  const scheme = protocol || (host.includes('localhost') ? 'http' : 'https');
  return `${scheme}://${host}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const baseUrl = resolveBaseUrl(req);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json(getOpenApiSpec(baseUrl));
}
