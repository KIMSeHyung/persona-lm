CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`persona_id` text NOT NULL,
	`source_type` text NOT NULL,
	`authored_by_self` integer NOT NULL,
	`content` text NOT NULL,
	`metadata_json` text,
	`created_at` integer,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` text PRIMARY KEY NOT NULL,
	`persona_id` text NOT NULL,
	`kind` text NOT NULL,
	`summary` text NOT NULL,
	`canonical_text` text NOT NULL,
	`status` text NOT NULL,
	`confidence` integer NOT NULL,
	`scope_json` text,
	`tags_json` text,
	`metadata_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personas_slug_unique` ON `personas` (`slug`);