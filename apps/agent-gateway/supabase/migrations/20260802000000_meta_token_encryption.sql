-- 20260802000000_meta_token_encryption.sql
-- At-rest encryption for Meta page access tokens.
--
-- page_access_token is now stored encrypted by src/lib/crypto.ts
-- (AES-256-GCM, format enc:v1:<iv>:<tag>:<ct>; META_TOKEN_ENCRYPTION_KEY).
-- token_encrypted tracks which rows hold ciphertext:
--   * new connections from the select route store encrypted tokens (flag true)
--   * existing rows stay plaintext (flag false) and decryptSecret() passes
--     them through untouched — no re-encryption backfill required.

ALTER TABLE channel_connections
  ADD COLUMN IF NOT EXISTS token_encrypted boolean DEFAULT false;

-- Backfill so the flag is never NULL for pre-existing plaintext rows.
UPDATE channel_connections
SET token_encrypted = false
WHERE token_encrypted IS NULL;
