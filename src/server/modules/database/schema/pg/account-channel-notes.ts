import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Channel notes for accounts that are not database users (account config
 * file and SSO accounts). Keyed by the node's public key so notes survive
 * macaroon rotations or account renames.
 */
export const accountChannelNotes = pgTable(
  'account_channel_notes',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    node_public_key: text('node_public_key').notNull(),
    channel_id: text('channel_id').notNull(),
    note: text('note').notNull(),
    created_at: timestamp('created_at', { precision: 6, mode: 'string' })
      .notNull()
      .defaultNow(),
    updated_at: timestamp('updated_at', { precision: 6, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  t => [unique().on(t.node_public_key, t.channel_id)]
);
