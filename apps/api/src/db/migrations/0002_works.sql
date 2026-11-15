CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`slug_fr` text NOT NULL,
	`slug_en` text NOT NULL,
	`released_at` text,
	`document` text NOT NULL,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `works_kind_slug_fr_unique` ON `works` (`kind`,`slug_fr`);--> statement-breakpoint
CREATE UNIQUE INDEX `works_kind_slug_en_unique` ON `works` (`kind`,`slug_en`);--> statement-breakpoint
CREATE INDEX `works_kind_status_released_idx` ON `works` (`kind`,`status`,`released_at`);