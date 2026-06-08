CREATE TABLE `swipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetId` int NOT NULL,
	`action` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `swipes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `swipes` ADD CONSTRAINT `swipes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `swipes` ADD CONSTRAINT `swipes_targetId_users_id_fk` FOREIGN KEY (`targetId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;