CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`purpose` text NOT NULL,
	`storage` text NOT NULL,
	`key` text NOT NULL,
	`content_type` text NOT NULL,
	`width` real NOT NULL,
	`height` real NOT NULL,
	`alt` text NOT NULL,
	`average_color` text,
	`variants` text,
	`byte_size` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_key_unique` ON `media_assets` (`key`);--> statement-breakpoint
CREATE TABLE `stack` (
	`id` text PRIMARY KEY NOT NULL,
	`tool_id` text NOT NULL,
	`domain` text NOT NULL,
	`position` integer NOT NULL,
	`points` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stack_tool_domain_unique` ON `stack` (`tool_id`,`domain`);--> statement-breakpoint
CREATE TABLE `tools` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`icon_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`icon_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tools_slug_unique` ON `tools` (`slug`);