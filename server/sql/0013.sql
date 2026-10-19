CREATE TABLE `feed_reactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`feed_id` integer NOT NULL,
	`visitor_hash` text NOT NULL,
	`reaction` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_reactions_feed_visitor_idx` ON `feed_reactions` (`feed_id`,`visitor_hash`);
--> statement-breakpoint
CREATE INDEX `feed_reactions_feed_reaction_idx` ON `feed_reactions` (`feed_id`,`reaction`);
--> statement-breakpoint
UPDATE `info` SET `value` = '13' WHERE `key` = 'migration_version';
