CREATE TABLE `user_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`photoKey` text NOT NULL,
	`isMain` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `isPremium` boolean DEFAULT false NOT NULL;