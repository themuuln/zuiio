import { S3Client } from "@aws-sdk/client-s3";

/**
 * Singleton S3Client configured for Cloudflare R2.
 *
 * R2 is S3-compatible but requires a custom endpoint:
 * https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 *
 * Region is "auto" per Cloudflare's recommendation.
 */

function createR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

let _client: S3Client | null = null;

/** Returns the singleton R2 S3Client. Creates it on first call. */
export function getR2Client(): S3Client {
  if (!_client) _client = createR2Client();
  return _client;
}

/** Returns the R2 bucket name. Throws if not configured. */
export function getR2Bucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error("Missing R2_BUCKET environment variable. Set R2_BUCKET.");
  }
  return bucket;
}
/** Returns true if all required R2 env vars are set. */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}
