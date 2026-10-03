import { randomBytes } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

export const DB_KEY_FILE_NAME = '.thub-db-key';

const isValidKey = (key: string): boolean => /^[0-9a-f]{64}$/i.test(key);

/**
 * Default location of the auto-generated key: next to the SQLite file.
 * Postgres has no local directory, so it needs DB_ENCRYPTION_KEY(_PATH).
 */
export const getDefaultKeyPath = (
  sqlitePath: string | undefined
): string | undefined => {
  if (!sqlitePath || sqlitePath === ':memory:') return undefined;
  return join(dirname(sqlitePath), DB_KEY_FILE_NAME);
};

/**
 * Returns the database encryption key.
 *
 * - An explicit key (DB_ENCRYPTION_KEY) always wins.
 * - Otherwise the key is read from `keyPath`, or generated (32 random bytes,
 *   hex) and persisted there with 0600 permissions on first start.
 * - If the file can not be read or written (e.g. read-only volume) a warning
 *   is returned and the database keeps working without field encryption.
 */
export const resolveEncryptionKey = ({
  envKey,
  keyPath,
}: {
  envKey?: string;
  keyPath?: string;
}): { key?: string; generated?: boolean; warning?: string } => {
  if (envKey) return { key: envKey };
  if (!keyPath) return {};

  try {
    if (existsSync(keyPath)) {
      const key = readFileSync(keyPath, 'utf8').trim();
      if (!isValidKey(key)) {
        return {
          warning: `Ignoring invalid database key in ${keyPath} (expected 64 hex characters).`,
        };
      }
      return { key };
    }

    const key = randomBytes(32).toString('hex');
    // 'wx' fails if another process created the file in the meantime.
    writeFileSync(keyPath, `${key}\n`, { mode: 0o600, flag: 'wx' });
    return { key, generated: true };
  } catch (error: any) {
    return {
      warning: `Unable to read or create database key at ${keyPath}: ${error?.message || error}`,
    };
  }
};
