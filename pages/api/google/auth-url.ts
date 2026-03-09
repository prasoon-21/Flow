import type { NextApiRequest, NextApiResponse } from 'next';
import { getGoogleOAuthClient, generateStatePair, setStateCookie, getGoogleScopes } from '@/server/services/google-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  try {
    const oauthClient = getGoogleOAuthClient();
    const { cookieValue, stateParam } = generateStatePair();
    setStateCookie(res, cookieValue);

    const url = oauthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: getGoogleScopes(),
      state: stateParam,
    });

    res.status(200).json({ url });
  } catch (error) {
    console.error('[GoogleAuthUrl]', error);
    res.status(500).json({ error: 'Failed to generate Google auth URL' });
  }
}
