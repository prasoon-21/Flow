import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getConfig, StorageConfig } from '@/lib/config/env';

interface UploadParams {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}

export interface StoredObject {
  key: string;
  bucket: string;
  size: number;
  url: string | null;
}

export class ObjectStorageService {
  private client: S3Client;

  constructor(private readonly config: StorageConfig) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  get bucket(): string {
    return this.config.bucket;
  }

  async uploadObject(params: UploadParams): Promise<StoredObject> {
    const body =
      typeof params.body === 'string'
        ? Buffer.from(params.body)
        : Buffer.isBuffer(params.body)
        ? params.body
        : Buffer.from(params.body);
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: params.key,
      Body: body,
      ContentType: params.contentType ?? 'application/octet-stream',
    });
    await this.client.send(command);
    const url = this.buildPublicUrl(params.key);
    return {
      key: params.key,
      bucket: this.config.bucket,
      size: body.byteLength,
      url,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds = 15 * 60): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });
    return awsGetSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  buildPublicUrl(key: string): string | null {
    if (!this.config.publicBaseUrl) {
      return null;
    }
    return `${this.config.publicBaseUrl}/${key}`.replace(/\/+/g, '/').replace(':/', '://');
  }
}

let instance: ObjectStorageService | null = null;

export function getObjectStorageService(): ObjectStorageService {
  if (!instance) {
    const config = getConfig().storage;
    if (!config) {
      throw new Error('Object storage is not configured. Set Cloudflare R2 credentials in the environment.');
    }
    instance = new ObjectStorageService(config);
  }
  return instance;
}

export function isObjectStorageConfigured(): boolean {
  return Boolean(getConfig().storage);
}
