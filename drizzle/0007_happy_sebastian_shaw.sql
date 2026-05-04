ALTER TABLE `users` ADD `adminUsername` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `adminPasswordHash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `adminPin` varchar(64);