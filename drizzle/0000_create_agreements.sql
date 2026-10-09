CREATE TABLE `agreements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`signer_name` text NOT NULL,
	`signer_email` text NOT NULL,
	`envelope_id` text,
	`status` text DEFAULT 'sent' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agreements_envelope_id_unique` ON `agreements` (`envelope_id`);