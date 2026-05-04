CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`adminId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `love_stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleName` varchar(256) NOT NULL,
	`location` varchar(256) NOT NULL,
	`quoteTitle` text NOT NULL,
	`story` text NOT NULL,
	`photoUrl` text,
	`photoKey` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `love_stories_id` PRIMARY KEY(`id`)
);
