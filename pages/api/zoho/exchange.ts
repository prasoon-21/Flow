import type { NextApiRequest, NextApiResponse } from 'next';
import {
  clearZohoStateCookie,
  getZohoCookie,
  getZohoOAuthConfig,
  verifyZohoState,
} from '@/server/services/zoho-auth';

type ZohoAccountProfile = {
  email?: string | null;
  name?: string | null;
  accountId?: string | null;
};

type ZohoAccountOption = {
  accountId: string | null;
  name: string | null;
  mailboxAddress: string | null;
  primaryEmail: string | null;
  emails: string[];
};

const ZOHO_ACCOUNT_TIMEOUT_MS = 5000;

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
    const cookieValue = getZohoCookie(req, 'zoho_oauth_state');
    if (!verifyZohoState(state, cookieValue)) {
      return res.status(400).json({ error: 'Invalid state' });
    }

    const { clientId, clientSecret, redirectUri, accountsDomain, mailDomain } = getZohoOAuthConfig();
    const tokenBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch(`${accountsDomain}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody.toString(),
    });

    const tokenPayload = (await tokenResponse.json()) as Record<string, unknown>;
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      console.error('[ZohoExchange] Token exchange error', tokenPayload);
      return res.status(500).json({ error: 'Failed to exchange Zoho authorization code' });
    }

    const accessToken = tokenPayload.access_token as string;
    const apiDomain = mailDomain;

    let profile: ZohoAccountProfile = {};
    let accounts: ZohoAccountOption[] = [];
    try {
      const { response: accountResponse, payload: accountPayload } = await fetchZohoJson(
        `${mailDomain}/api/accounts`,
        accessToken,
        'accounts.list'
      );
      if (!accountResponse.ok) {
        console.error('[ZohoExchange] Account list error', {
          status: accountResponse.status,
          statusText: accountResponse.statusText,
          payload: accountPayload,
        });
        throw new Error('Failed to fetch Zoho accounts');
      }
      const normalizedAccounts = normalizeZohoList(accountPayload);
      const rawAccounts = normalizedAccounts
        .map((account) => mapZohoAccount(account))
        .filter((account): account is ZohoAccountOption => Boolean(account && account.accountId));
      accounts = await enrichZohoAccounts(rawAccounts, accessToken, mailDomain);
      profile = buildZohoProfile(accounts);
    } catch (error) {
      console.error('[ZohoExchange] Account lookup failed', error);
    }

    clearZohoStateCookie(res);
    const expiresIn = (tokenPayload.expires_in ?? tokenPayload.expires_in_sec) as number | null | undefined;

    return res.status(200).json({
      tokens: {
        access_token: accessToken,
        refresh_token: tokenPayload.refresh_token ?? null,
        expires_in: expiresIn ?? null,
        api_domain: apiDomain,
      },
      profile,
      accounts,
    });
  } catch (error) {
    console.error('[ZohoExchange]', error);
    return res.status(500).json({ error: 'Failed to exchange Zoho authorization code' });
  }
}

function normalizeZohoList(payload: Record<string, unknown>): Record<string, unknown>[] {
  if (Array.isArray(payload.data)) {
    return payload.data as Record<string, unknown>[];
  }
  const nested = payload.data as Record<string, unknown> | undefined;
  if (nested && Array.isArray(nested.data)) {
    return nested.data as Record<string, unknown>[];
  }
  if (Array.isArray(payload.accounts)) {
    return payload.accounts as Record<string, unknown>[];
  }
  return [];
}

async function enrichZohoAccounts(
  accounts: ZohoAccountOption[],
  accessToken: string,
  mailDomain: string
): Promise<ZohoAccountOption[]> {
  const missingEmails = accounts.filter((account) => account.accountId && account.emails.length === 0);
  if (!missingEmails.length) {
    return accounts;
  }
  const resolvedAccounts = await Promise.all(
    missingEmails.map(async (account) => resolveZohoAccountDetail(account.accountId as string, accessToken, mailDomain))
  );
  const resolvedById = new Map<string, ZohoAccountOption>();
  for (const resolved of resolvedAccounts) {
    if (resolved?.accountId) {
      resolvedById.set(resolved.accountId, resolved);
    }
  }
  return accounts.map((account) => {
    const accountId = account.accountId ?? '';
    const resolved = resolvedById.get(accountId);
    if (!resolved) {
      return account;
    }
    const mergedEmails = mergeEmailLists(account.emails, resolved.emails);
    const primaryEmail =
      account.primaryEmail ?? resolved.primaryEmail ?? (mergedEmails.length ? mergedEmails[0] : null);
    return {
      ...account,
      name: account.name ?? resolved.name,
      mailboxAddress: account.mailboxAddress ?? resolved.mailboxAddress,
      primaryEmail,
      emails: mergedEmails,
    };
  });
}

async function resolveZohoAccountDetail(accountId: string, accessToken: string, mailDomain: string) {
  try {
    const { response, payload } = await fetchZohoJson(
      `${mailDomain}/api/accounts/${accountId}`,
      accessToken,
      'accounts.detail'
    );
    if (!response.ok) {
      console.error('[ZohoExchange] Account detail error', {
        accountId,
        status: response.status,
        statusText: response.statusText,
        payload,
      });
      return null;
    }
    const detail = normalizeZohoDetail(payload);
    if (!detail) {
      return null;
    }
    return mapZohoAccount(detail);
  } catch (error) {
    console.error('[ZohoExchange] Account detail lookup failed', { accountId, error });
    return null;
  }
}

function mapZohoAccount(raw: Record<string, unknown>): ZohoAccountOption | null {
  const accountId = normalizeStringValue(raw.accountId ?? raw.account_id);
  if (!accountId) {
    return null;
  }
  const name =
    normalizeStringValue(raw.displayName) ??
    normalizeStringValue(raw.accountName) ??
    normalizeStringValue(raw.accountDisplayName);
  const { mailboxAddress, primaryEmail, emails } = extractZohoEmails(raw);
  return {
    accountId,
    name,
    mailboxAddress,
    primaryEmail,
    emails,
  };
}

function buildZohoProfile(accounts: ZohoAccountOption[]): ZohoAccountProfile {
  const first = accounts[0];
  if (!first) {
    return {};
  }
  const email = first.primaryEmail ?? first.mailboxAddress ?? first.emails[0] ?? null;
  return {
    accountId: first.accountId ?? null,
    name: first.name ?? null,
    email,
  };
}

function extractZohoEmails(raw: Record<string, unknown>): {
  mailboxAddress: string | null;
  primaryEmail: string | null;
  emails: string[];
} {
  const candidates: string[] = [];
  let primaryEmail: string | null = null;

  const mailboxAddress = normalizeStringValue(raw.mailboxAddress) ?? null;
  if (mailboxAddress) {
    candidates.push(mailboxAddress);
  }
  const incomingUserName = normalizeStringValue(raw.incomingUserName);
  if (incomingUserName) {
    candidates.push(incomingUserName);
  }

  const emailAddress = raw.emailAddress;
  if (Array.isArray(emailAddress)) {
    emailAddress.forEach((entry) => {
      if (!entry) return;
      if (typeof entry === 'string') {
        candidates.push(entry);
        return;
      }
      if (typeof entry === 'object') {
        const record = entry as Record<string, unknown>;
        const mailId = normalizeStringValue(record.mailId ?? record.mail_id ?? record.email);
        if (!mailId) return;
        const isConfirmed = record.isConfirmed;
        if (isConfirmed === false || isConfirmed === 'false') {
          return;
        }
        candidates.push(mailId);
        const isPrimary = record.isPrimary === true || record.isPrimary === 'true';
        if (isPrimary && !primaryEmail) {
          primaryEmail = mailId;
        }
      }
    });
  } else {
    const emailAddressValue = normalizeStringValue(emailAddress);
    if (emailAddressValue) {
      candidates.push(emailAddressValue);
    }
  }

  const primaryEmailAddress = normalizeStringValue(raw.primaryEmailAddress);
  if (primaryEmailAddress) {
    candidates.push(primaryEmailAddress);
  }
  const accountEmail = normalizeStringValue(raw.accountEmail);
  if (accountEmail) {
    candidates.push(accountEmail);
  }

  let emails = normalizeEmailList(candidates);
  if (!primaryEmail) {
    primaryEmail = mailboxAddress ?? (emails.length ? emails[0] : null);
  }
  if (primaryEmail) {
    emails = movePrimaryToFront(emails, primaryEmail);
  }

  return {
    mailboxAddress,
    primaryEmail,
    emails,
  };
}

function mergeEmailLists(base: string[], extra: string[]): string[] {
  return normalizeEmailList([...base, ...extra]);
}

function movePrimaryToFront(emails: string[], primaryEmail: string): string[] {
  const normalizedPrimary = primaryEmail.toLowerCase();
  const index = emails.findIndex((email) => email.toLowerCase() === normalizedPrimary);
  if (index === -1) {
    return [primaryEmail, ...emails];
  }
  if (index === 0) {
    return emails;
  }
  return [emails[index], ...emails.slice(0, index), ...emails.slice(index + 1)];
}

function normalizeEmailList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    if (!value || typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    result.push(trimmed);
  });
  return result;
}

function normalizeZohoDetail(payload: Record<string, unknown>): Record<string, unknown> | null {
  if (payload.data && !Array.isArray(payload.data) && typeof payload.data === 'object') {
    return payload.data as Record<string, unknown>;
  }
  if (Array.isArray(payload.data)) {
    return (payload.data[0] as Record<string, unknown>) ?? null;
  }
  if (payload.account && typeof payload.account === 'object') {
    return payload.account as Record<string, unknown>;
  }
  if (Array.isArray(payload.accounts)) {
    return (payload.accounts[0] as Record<string, unknown>) ?? null;
  }
  return payload;
}

async function fetchZohoJson(url: string, accessToken: string, context: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ZOHO_ACCOUNT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
      signal: controller.signal,
    });
    const payload = await readZohoJson(response, context);
    return { response, payload };
  } finally {
    clearTimeout(timeout);
  }
}

async function readZohoJson(response: Response, context: string): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (error) {
    console.error('[ZohoExchange] Non-JSON response', {
      context,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      body: text.slice(0, 200),
    });
    throw error;
  }
}

function normalizeStringValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim().length);
    return typeof first === 'string' ? first.trim() : null;
  }
  if (value === null || value === undefined) {
    return null;
  }
  const asString = String(value).trim();
  return asString.length ? asString : null;
}
