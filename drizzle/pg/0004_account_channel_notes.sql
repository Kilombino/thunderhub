CREATE TABLE "account_channel_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_public_key" text NOT NULL,
	"channel_id" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp(6) DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) DEFAULT now() NOT NULL,
	CONSTRAINT "account_channel_notes_node_public_key_channel_id_unique" UNIQUE("node_public_key","channel_id")
);
