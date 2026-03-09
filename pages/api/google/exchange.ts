import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import {
  getGoogleOAuthClient,
  verifyState,
  getCookie,
  clearStateCookie,
} from '@/server/services/google-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const { code, state } = req.body ?? {};

  if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  try {
    const cookieValue = getCookie(req, 'google_oauth_state');
    if (!verifyState(state, cookieValue)) {
      return res.status(400).json({ error: 'Invalid state' });
    }

    const oauthClient = getGoogleOAuthClient();
    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauthClient });
    const profileResponse = await oauth2.userinfo.get();

    clearStateCookie(res);
    return res.status(200).json({
      tokens,
      profile: profileResponse.data,
    });
  } catch (error) {
    console.error('[GoogleExchange]', error);
    return res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
}
