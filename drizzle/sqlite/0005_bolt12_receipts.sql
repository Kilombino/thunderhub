CREATE TABLE `bolt12_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`node_public_key` text NOT NULL,
	`payment_hash` text NOT NULL,
	`payment_preimage` text NOT NULL,
	`offer` text NOT NULL,
	`invoice` text NOT NULL,
	`payer_note` text,
	`amount_msat` text NOT NULL,
	`fee_msat` text NOT NULL,
	`paid_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bolt12_receipts_node_public_key_payment_hash_unique` ON `bolt12_receipts` (`node_public_key`,`payment_hash`);
