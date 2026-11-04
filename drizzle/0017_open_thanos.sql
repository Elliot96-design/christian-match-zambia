ALTER TABLE `chat_unlocks` MODIFY COLUMN `status` enum('pending','under_review','verified','rejected','expired','completed','failed') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `chat_unlocks` MODIFY COLUMN `provider` enum('mtn','airtel','bank','visa','mock') NOT NULL DEFAULT 'mtn';--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `currency` varchar(8) DEFAULT 'ZMW' NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `internalReference` varchar(32);--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `transactionId` varchar(128);--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `senderPhone` varchar(32);--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `senderName` varchar(128);--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `receiptUrl` text;--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `rejectionReason` text;--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `verificationSource` varchar(64);--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `verifiedBy` int;--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `verifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `reviewNotes` text;--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD CONSTRAINT `chat_unlocks_internal_reference_unique` UNIQUE(`internalReference`);--> statement-breakpoint
ALTER TABLE `chat_unlocks` ADD CONSTRAINT `chat_unlocks_transaction_id_unique` UNIQUE(`transactionId`);