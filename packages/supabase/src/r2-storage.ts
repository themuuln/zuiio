import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 client — S3-compatible object storage with zero egress fees.
 *
 * Env vars required:
 *   R2_ACCOUNT_ID       — Cloudflare account ID
 *   R2_ACCESS_KEY_ID    — R2 API token access key ID
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 *   R2_BUCKET           — Default bucket name (optional, can override per call)
 *   R2_PUBLIC_DOMAIN    — Custom domain or r2.dev pub token (optional)
 */
function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getDefaultBucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET not configured.");
  return bucket;
}

/**
 * Upload a file to R2 and return its public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  opts: { bucket?: string; contentType?: string } = {},
): Promise<string> {
  const client = getR2Client();
  const bucket = opts.bucket ?? getDefaultBucket();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: opts.contentType,
    }),
  );

  return getR2PublicUrl(key, bucket);
}

/**
 * Generate a presigned URL for reading a private file (expires in seconds).
 */
export async function getR2SignedUrl(
  key: string,
  opts: { bucket?: string; expiresIn?: number } = {},
): Promise<string> {
  const client = getR2Client();
  const bucket = opts.bucket ?? getDefaultBucket();
  const expiresIn = opts.expiresIn ?? 3600;

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Build a public URL for an R2 object.
 * Uses R2_PUBLIC_DOMAIN env var if set, otherwise falls back to r2.dev.
 */
export function getR2PublicUrl(key: string, bucket?: string): string {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (publicDomain) {
    return `https://${publicDomain}/${key}`;
  }
  const b = bucket ?? getDefaultBucket();
  // R2 dev subdomain pattern: pub-<token>.r2.dev/<key>
  // User should set R2_PUBLIC_DOMAIN for production
  return `https://${b}.r2.dev/${key}`;
}

/**
 * Build a deterministic storage path: `{prefix}/{uuid}.{ext}`
 */
export function buildR2Path(prefix: string, filename: string): string {
  const ext = filename.split(".").pop() ?? "bin";
  const uuid = crypto.randomUUID();
  return `${prefix}/${uuid}.${ext}`;
}
