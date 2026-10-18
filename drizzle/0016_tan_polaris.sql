CREATE TABLE `social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(16) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`email` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `social_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_accounts_provider_account_unique` UNIQUE(`provider`,`providerAccountId`)
);
