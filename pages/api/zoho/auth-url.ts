import type { NextApiRequest, NextApiResponse } from 'next';
import { generateZohoStatePair, getZohoOAuthConfig, getZohoScopes, setZohoStateCookie } from '@/server/services/zoho-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  try {
    const { clientId, redirectUri, accountsDomain } = getZohoOAuthConfig();
    const { cookieValue, stateParam } = generateZohoStatePair();
    setZohoStateCookie(res, cookieValue);

    const scope = getZohoScopes().join(',');
    const params = new URLSearchParams({
      scope,
      client_id: clientId,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      redirect_uri: redirectUri,
      state: stateParam,
    });

    const url = `${accountsDomain}/oauth/v2/auth?${params.toString()}`;
    res.status(200).json({ url });
  } catch (error) {
    console.error('[ZohoAuthUrl]', error);
    res.status(500).json({ error: 'Failed to generate Zoho auth URL' });
  }
}
