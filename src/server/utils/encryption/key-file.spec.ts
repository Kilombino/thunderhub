import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  DB_KEY_FILE_NAME,
  getDefaultKeyPath,
  resolveEncryptionKey,
} from './key-file';

describe('resolveEncryptionKey', () => {
  const dir = () => mkdtempSync(join(tmpdir(), 'thub-key-'));

  it('prefers the explicit env key', () => {
    expect(
      resolveEncryptionKey({ envKey: 'abc', keyPath: '/nonexistent/key' })
    ).toEqual({ key: 'abc' });
  });

  it('generates and persists a 0600 key, then reuses it', () => {
    const keyPath = join(dir(), DB_KEY_FILE_NAME);

    const first = resolveEncryptionKey({ keyPath });
    expect(first.generated).toBe(true);
    expect(first.key).toMatch(/^[0-9a-f]{64}$/);
    expect(statSync(keyPath).mode & 0o777).toBe(0o600);
    expect(readFileSync(keyPath, 'utf8').trim()).toBe(first.key);

    const second = resolveEncryptionKey({ keyPath });
    expect(second).toEqual({ key: first.key });
  });

  it('ignores an invalid key file', () => {
    const keyPath = join(dir(), DB_KEY_FILE_NAME);
    writeFileSync(keyPath, 'not-a-key');
    const result = resolveEncryptionKey({ keyPath });
    expect(result.key).toBeUndefined();
    expect(result.warning).toContain('invalid');
  });

  it('returns a warning when the directory is not writable', () => {
    const result = resolveEncryptionKey({
      keyPath: '/nonexistent-dir/sub/.thub-db-key',
    });
    expect(result.key).toBeUndefined();
    expect(result.warning).toBeDefined();
  });

  it('derives the default path from the sqlite file', () => {
    expect(getDefaultKeyPath('/data/thunderhub.db')).toBe('/data/.thub-db-key');
    expect(getDefaultKeyPath(':memory:')).toBeUndefined();
    expect(getDefaultKeyPath(undefined)).toBeUndefined();
  });
});
