import { sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Proof of BOLT 12 payments made from ThunderHub. LND keeps no payment
 * request for them (the record of a payment to an offer has none), so the
 * offer, the invoice its issuer signed and the preimage are kept here, by
 * the paying node's public key.
 */
export const bolt12Receipts = sqliteTable(
  'bolt12_receipts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    node_public_key: text('node_public_key').notNull(),
    payment_hash: text('payment_hash').notNull(),
    payment_preimage: text('payment_preimage').notNull(),
    offer: text('offer').notNull(),
    invoice: text('invoice').notNull(),
    payer_note: text('payer_note'),
    amount_msat: text('amount_msat').notNull(),
    fee_msat: text('fee_msat').notNull(),
    paid_at: text('paid_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  },
  t => [unique().on(t.node_public_key, t.payment_hash)]
);
