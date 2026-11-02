CREATE TABLE `evening_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`day` text NOT NULL,
	`did_well` text DEFAULT '' NOT NULL,
	`missed_principle` text DEFAULT '' NOT NULL,
	`fix_tomorrow` text DEFAULT '' NOT NULL,
	`kept_word` text,
	`energy` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "evening_reviews_kept_word" CHECK("evening_reviews"."kept_word" is null or "evening_reviews"."kept_word" in ('oui', 'en_partie', 'non')),
	CONSTRAINT "evening_reviews_energy" CHECK("evening_reviews"."energy" is null or "evening_reviews"."energy" between 1 and 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `evening_reviews_user_day` ON `evening_reviews` (`user_id`,`day`);--> statement-breakpoint
CREATE TABLE `fronts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "fronts_status" CHECK("fronts"."status" in ('active', 'reserve'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fronts_user_slug` ON `fronts` (`user_id`,`slug`);--> statement-breakpoint
CREATE TABLE `missions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`slug` text,
	`title` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`rank` text NOT NULL,
	`front_id` integer,
	`status` text DEFAULT 'todo' NOT NULL,
	`due_date` text,
	`planned_date` text,
	`start_condition` text,
	`is_test` integer DEFAULT false NOT NULL,
	`review_date` text,
	`parent_id` integer,
	`done_at` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`front_id`) REFERENCES `fronts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`parent_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "missions_rank" CHECK("missions"."rank" in ('S', 'A', 'B', 'C', 'D')),
	CONSTRAINT "missions_status" CHECK("missions"."status" in ('todo', 'doing', 'done', 'dropped', 'reserve')),
	CONSTRAINT "missions_source" CHECK("missions"."source" in ('manual', 'seed', 'reading')),
	CONSTRAINT "missions_reserve_condition" CHECK("missions"."status" <> 'reserve' or length(trim(coalesce("missions"."start_condition", ''))) > 0),
	CONSTRAINT "missions_test_review" CHECK("missions"."is_test" = 0 or "missions"."review_date" is not null)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `missions_user_slug` ON `missions` (`user_id`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `missions_single_active_s` ON `missions` (`user_id`) WHERE "missions"."rank" = 'S' and "missions"."status" in ('todo', 'doing');--> statement-breakpoint
CREATE INDEX `missions_user_status` ON `missions` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `oath_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`day` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oath_logs_user_day` ON `oath_logs` (`user_id`,`day`);--> statement-breakpoint
CREATE TABLE `phases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "phases_dates" CHECK("phases"."start_date" <= "phases"."end_date")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `phases_slug_unique` ON `phases` (`slug`);--> statement-breakpoint
CREATE TABLE `quest_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`quest_id` integer NOT NULL,
	`day` text NOT NULL,
	`status` text NOT NULL,
	`value` integer,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "quest_logs_status" CHECK("quest_logs"."status" in ('held', 'slip', 'logged'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quest_logs_quest_day` ON `quest_logs` (`quest_id`,`day`);--> statement-breakpoint
CREATE TABLE `quests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`start_date` text NOT NULL,
	`length_days` integer,
	`milestones` text NOT NULL,
	`xp_per_day` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "quests_kind" CHECK("quests"."kind" in ('daily_hold', 'daily_steps')),
	CONSTRAINT "quests_status" CHECK("quests"."status" in ('active', 'done', 'archived')),
	CONSTRAINT "quests_length" CHECK("quests"."length_days" is null or "quests"."length_days" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quests_user_slug` ON `quests` (`user_id`,`slug`);--> statement-breakpoint
CREATE TABLE `reading_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`day` text NOT NULL,
	`reading_id` integer NOT NULL,
	`listened` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reading_id`) REFERENCES `readings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reading_views_user_day_reading` ON `reading_views` (`user_id`,`day`,`reading_id`);--> statement-breakpoint
CREATE TABLE `readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`group` text NOT NULL,
	`phase_slug` text,
	`situations` text NOT NULL,
	`order` integer,
	`pillar` text NOT NULL,
	`source` text NOT NULL,
	`quote` text,
	`quote_kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`mantra` text NOT NULL,
	`action` text NOT NULL,
	`evening_question` text NOT NULL,
	`symbol` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`phase_slug`) REFERENCES `phases`(`slug`) ON UPDATE cascade ON DELETE no action,
	CONSTRAINT "readings_group" CHECK("readings"."group" in ('phase', 'secours')),
	CONSTRAINT "readings_phase" CHECK(("readings"."group" = 'phase') = ("readings"."phase_slug" is not null and "readings"."order" is not null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `readings_slug_unique` ON `readings` (`slug`);--> statement-breakpoint
CREATE INDEX `readings_phase_order` ON `readings` (`phase_slug`,`order`);--> statement-breakpoint
CREATE TABLE `seed_log` (
	`entity` text NOT NULL,
	`slug` text NOT NULL,
	`applied_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	PRIMARY KEY(`entity`, `slug`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`password_hash` text,
	`settings` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`day` text NOT NULL,
	`kind` text NOT NULL,
	`ref_type` text,
	`ref_id` integer,
	`ritual` text,
	`amount` integer NOT NULL,
	`revoked_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "xp_amount_positive" CHECK("xp_events"."amount" > 0),
	CONSTRAINT "xp_kind" CHECK("xp_events"."kind" in ('mission', 'ritual', 'quest_day', 'quest_milestone')),
	CONSTRAINT "xp_ritual" CHECK(("xp_events"."kind" = 'ritual') = ("xp_events"."ritual" is not null) and ("xp_events"."ritual" is null or "xp_events"."ritual" in ('reading', 'oath', 'evening_review')))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `xp_unique_ritual` ON `xp_events` (`user_id`,`ritual`,`day`) WHERE "xp_events"."kind" = 'ritual' and "xp_events"."revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `xp_unique_quest` ON `xp_events` (`user_id`,`kind`,`ref_type`,`ref_id`,`day`) WHERE "xp_events"."kind" in ('quest_day', 'quest_milestone') and "xp_events"."revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `xp_unique_mission` ON `xp_events` (`user_id`,`ref_type`,`ref_id`) WHERE "xp_events"."kind" = 'mission' and "xp_events"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX `xp_user_day` ON `xp_events` (`user_id`,`day`);