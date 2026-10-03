import { sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Channel notes for accounts that are not database users (account config
 * file and SSO accounts). Keyed by the node's public key so notes survive
 * macaroon rotations or account renames.
 */
export const accountChannelNotes = sqliteTable(
  'account_channel_notes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    node_public_key: text('node_public_key').notNull(),
    channel_id: text('channel_id').notNull(),
    note: text('note').notNull(),
    created_at: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  t => [unique().on(t.node_public_key, t.channel_id)]
);
