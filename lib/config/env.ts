/**
 * Environment configuration with 12-factor app principles
 * Supports TEST and PROD environments with separate Firestore instances
 */

export type AppEnv = 'test' | 'prod' | 'local';

export interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  databaseId?: string; // For multi-database setup
  region?: string;
}

export interface StorageConfig {
  provider: 'cloudflare-r2';
  accountId: string;
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
}

export interface AppConfig {
  env: AppEnv;
  firebase: FirebaseConfig;
  defaultTenant: string;
  projectKey: string;
  emulatorHost?: string;
  storage?: StorageConfig;
}

/**
 * Loads and validates environment configuration
 */
export function loadConfig(): AppConfig {
  const env = (process.env.APP_ENV || 'local') as AppEnv;

  // For local development, check for emulator
  const emulatorHost = process.env.FIREBASE_EMULATOR_HOST;

  // Load Firebase credentials from environment
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawPrivateKey?.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
  const databaseId = process.env.FIRESTORE_DATABASE_ID;
  const region = process.env.FIREBASE_REGION || 'us-central1';
  const projectKey = process.env.PROJECT_KEY || 'engage';

  if (process.env.DEBUG_FIREBASE_KEY === 'true') {
    const keyLines = privateKey ? privateKey.split('\n') : [];
    console.log('[firebase-key]', {
      hasHeader: Boolean(privateKey?.includes('BEGIN PRIVATE KEY')),
      hasFooter: Boolean(privateKey?.includes('END PRIVATE KEY')),
      lineCount: keyLines.length,
      hasEscapedNewlines: Boolean(rawPrivateKey?.includes('\\n')),
      length: privateKey?.length ?? 0,
    });
  }

  if (!projectId || !clientEmail || !privateKey) {
    if (env === 'local' && emulatorHost) {
      // Emulator mode - use dummy values
      return {
        env,
        firebase: {
          projectId: 'demo-project',
          clientEmail: 'demo@example.com',
          privateKey: '-----BEGIN PRIVATE KEY-----\nDEMO\n-----END PRIVATE KEY-----\n',
          databaseId: databaseId || '(default)',
          region,
        },
        defaultTenant: process.env.DEFAULT_TENANT || 'drmorepen',
        projectKey,
        emulatorHost,
      };
    }
    // Demo mode - return safe defaults (Firestore is stubbed anyway)
    return {
      env: 'local' as AppEnv,
      firebase: {
        projectId: 'demo-project',
        clientEmail: 'demo@example.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nDEMO\n-----END PRIVATE KEY-----\n',
        databaseId: '(default)',
        region,
      },
      defaultTenant: process.env.DEFAULT_TENANT || 'demo-tenant',
      projectKey,
    };
  }

  return {
    env,
    firebase: {
      projectId,
      clientEmail,
      privateKey,
      databaseId: databaseId || '(default)',
      region,
    },
    defaultTenant: process.env.DEFAULT_TENANT || 'drmorepen',
    projectKey,
    emulatorHost,
    storage: loadStorageConfig(),
  };
}

/**
 * Singleton config instance
 */
let config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!config) {
    config = loadConfig();
  }
  return config;
}

function loadStorageConfig(): StorageConfig | undefined {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return undefined;
  }

  const rawEndpoint =
    process.env.CLOUDFLARE_R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
  const endpoint = normalizeEndpoint(rawEndpoint, bucket);
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

  return {
    provider: 'cloudflare-r2',
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
    publicBaseUrl: publicBaseUrl?.replace(/\/+$/, ''),
  };
}

function normalizeEndpoint(endpoint: string, bucket: string): string {
  try {
    const url = new URL(endpoint);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');
    if (path === bucket) {
      url.pathname = '';
    }
    return url.toString().replace(/\/+$/, '');
  } catch {
    return endpoint.replace(/\/+$/, '').replace(new RegExp(`/${bucket}$`), '');
  }
}
