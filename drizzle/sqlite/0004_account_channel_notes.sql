CREATE TABLE `account_channel_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`node_public_key` text NOT NULL,
	`channel_id` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_channel_notes_node_public_key_channel_id_unique` ON `account_channel_notes` (`node_public_key`,`channel_id`);