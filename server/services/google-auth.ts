import { google } from 'googleapis';
import { createHmac, randomBytes } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
];

export interface GoogleTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string;
  token_type?: string;
  expiry_date?: number | null;
  id_token?: string | null;
}

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth environment variables are not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function generateStatePair() {
  const sessionSecret = getSessionSecret();
  const rawState = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', sessionSecret).update(rawState).digest('hex');
  return {
    cookieValue: rawState,
    stateParam: `${rawState}.${signature}`,
  };
}

export function verifyState(stateParam: string | undefined, cookieValue: string | undefined) {
  if (!stateParam || !cookieValue) {
    return false;
  }
  const sessionSecret = getSessionSecret();
  const [rawState, signature] = stateParam.split('.');
  if (!rawState || !signature) {
    return false;
  }
  if (rawState !== cookieValue) {
    return false;
  }
  const expectedSignature = createHmac('sha256', sessionSecret).update(rawState).digest('hex');
  return signature === expectedSignature;
}

export function setStateCookie(res: NextApiResponse, value: string) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `google_oauth_state=${value}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax${secure ? '; Secure' : ''}`
  );
}

export function clearStateCookie(res: NextApiResponse) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `google_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure ? '; Secure' : ''}`
  );
}

export function getCookie(req: NextApiRequest, name: string): string | undefined {
  const cookies = req.headers.cookie;
  if (!cookies) return undefined;
  const match = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : undefined;
}

export function getGoogleScopes() {
  return GOOGLE_SCOPES;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable not configured');
  }
  return secret;
}
