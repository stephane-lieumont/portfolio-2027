CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`object_key` text NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`width` integer,
	`height` integer,
	`byte_size` integer NOT NULL,
	`content_type` text NOT NULL,
	`uploaded_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_object_key_unique` ON `media_assets` (`object_key`);--> statement-breakpoint
CREATE TABLE `project_gallery` (
	`project_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_gallery_pk` ON `project_gallery` (`project_id`,`asset_id`);--> statement-breakpoint
CREATE INDEX `project_gallery_order_idx` ON `project_gallery` (`project_id`,`position`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`mission` text,
	`mission_steps` text DEFAULT '[]' NOT NULL,
	`technos` text DEFAULT '[]' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`demo_url` text,
	`source_url` text,
	`cover_asset_id` text,
	`released_at` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`cover_asset_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE INDEX `projects_kind_status_idx` ON `projects` (`kind`,`status`);