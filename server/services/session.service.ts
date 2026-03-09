import { createHmac, timingSafeEqual } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session-constants';
import { CapabilityKey, ModuleKey, UserRole } from '@/lib/types/tenant';

export interface SessionData {
  userId: string;
  tenantId: string;
  userRole: UserRole;
  modules: ModuleKey[];
  capabilities?: CapabilityKey[];
}

interface EncodedSession extends SessionData {
  exp: number;
}

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || 'engage-os-dev-secret-do-not-use-in-production';
}

function encodeSession(data: EncodedSession): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | null | undefined): SessionData | null {
  if (!token || !token.includes('.')) {
    return null;
  }
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expected = createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  const providedBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) {
    return null;
  }
  const isValidSignature = timingSafeEqual(providedBuf, expectedBuf);
  if (!isValidSignature) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as EncodedSession;
    if (typeof decoded.exp !== 'number' || decoded.exp * 1000 < Date.now()) {
      return null;
    }
    return {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      userRole: decoded.userRole,
      modules: Array.isArray(decoded.modules) ? (decoded.modules as ModuleKey[]) : [],
      capabilities: Array.isArray(decoded.capabilities) ? (decoded.capabilities as CapabilityKey[]) : [],
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextApiResponse, data: SessionData): void {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const normalizedData: SessionData = {
    ...data,
    modules: data.modules ?? [],
    capabilities: data.capabilities ?? [],
  };
  const token = encodeSession({ ...normalizedData, exp });
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure ? '; Secure' : ''}`);
}

export function clearSessionCookie(res: NextApiResponse): void {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`);
}

export function readSessionFromRequest(req: NextApiRequest): SessionData | null {
  const token = req.cookies?.[SESSION_COOKIE_NAME] ?? extractCookie(req.headers.cookie ?? '', SESSION_COOKIE_NAME);
  return verifySessionToken(token);
}

function extractCookie(cookieHeader: string, key: string): string | null {
  if (!cookieHeader) {
    return null;
  }
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [name, value] = part.trim().split('=');
    if (name === key) {
      return decodeURIComponent(value ?? '');
    }
  }
  return null;
}
