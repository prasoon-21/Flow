import { createHmac, randomBytes } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

const DEFAULT_SCOPES = [
  'ZohoMail.accounts.READ',
  'ZohoMail.folders.READ',
  'ZohoMail.messages.READ',
  'ZohoMail.messages.UPDATE',
  'ZohoMail.messages.CREATE',
  'ZohoMail.attachments.READ',
];

export interface ZohoOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accountsDomain: string;
  mailDomain: string;
}

export function getZohoOAuthConfig(): ZohoOAuthConfig {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const redirectUri = process.env.ZOHO_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Zoho OAuth environment variables are not configured');
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    accountsDomain: process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com',
    mailDomain: process.env.ZOHO_API_DOMAIN || process.env.ZOHO_MAIL_DOMAIN || 'https://mail.zoho.com',
  };
}

export function getZohoScopes(): string[] {
  const raw = process.env.ZOHO_SCOPES;
  if (!raw) {
    return DEFAULT_SCOPES;
  }
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function generateZohoStatePair() {
  const sessionSecret = getSessionSecret();
  const rawState = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', sessionSecret).update(rawState).digest('hex');
  return {
    cookieValue: rawState,
    stateParam: `${rawState}.${signature}`,
  };
}

export function verifyZohoState(stateParam: string | undefined, cookieValue: string | undefined) {
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

export function setZohoStateCookie(res: NextApiResponse, value: string) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `zoho_oauth_state=${value}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax${secure ? '; Secure' : ''}`
  );
}

export function clearZohoStateCookie(res: NextApiResponse) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `zoho_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure ? '; Secure' : ''}`
  );
}

export function getZohoCookie(req: NextApiRequest, name: string): string | undefined {
  const cookies = req.headers.cookie;
  if (!cookies) return undefined;
  const match = cookies.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : undefined;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable not configured');
  }
  return secret;
}
