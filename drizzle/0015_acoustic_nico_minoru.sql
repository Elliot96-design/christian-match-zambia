CREATE TABLE `security_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`email` varchar(320),
	`action` varchar(64) NOT NULL,
	`ipAddress` varchar(64),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_audit_logs_id` PRIMARY KEY(`id`)
);
