CREATE TABLE `chatroom_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('general','bible_verse','testimony','prayer_request','counseling') NOT NULL DEFAULT 'general',
	`category` enum('general','counseling','testimonies','bible_verse','prayer_requests','prayer_sessions') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatroom_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatroom_reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`reactionType` enum('heart','pray') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatroom_reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `denomination` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `faithLevel` enum('growing','committed','deeply_rooted');--> statement-breakpoint
ALTER TABLE `users` ADD `bibleVersion` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `prayerFrequency` enum('daily','weekly','occasionally');--> statement-breakpoint
ALTER TABLE `users` ADD `lookingFor` enum('marriage','friendship','dating','not_sure');--> statement-breakpoint
ALTER TABLE `users` ADD `ageRangeMin` int;--> statement-breakpoint
ALTER TABLE `users` ADD `ageRangeMax` int;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLocation` varchar(128);