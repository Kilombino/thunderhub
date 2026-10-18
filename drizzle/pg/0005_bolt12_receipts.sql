CREATE TABLE "bolt12_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_public_key" text NOT NULL,
	"payment_hash" text NOT NULL,
	"payment_preimage" text NOT NULL,
	"offer" text NOT NULL,
	"invoice" text NOT NULL,
	"payer_note" text,
	"amount_msat" text NOT NULL,
	"fee_msat" text NOT NULL,
	"paid_at" timestamp(6) DEFAULT now() NOT NULL,
	CONSTRAINT "bolt12_receipts_node_public_key_payment_hash_unique" UNIQUE("node_public_key","payment_hash")
);
