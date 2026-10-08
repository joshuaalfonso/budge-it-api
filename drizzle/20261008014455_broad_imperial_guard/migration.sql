CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`user_id` int,
	`name` varchar(100) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`icon` varchar(50),
	`color` varchar(20),
	`is_default` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`user_id` int NOT NULL,
	`wallet_id` int NOT NULL,
	`category_id` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` varchar(500),
	`transaction_date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `transfers` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`user_id` int NOT NULL,
	`from_wallet_id` int NOT NULL,
	`to_wallet_id` int NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` varchar(500),
	`transfer_date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`google_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`picture` text,
	`role` varchar(50) NOT NULL DEFAULT 'user',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_id_unique` UNIQUE INDEX(`google_id`),
	CONSTRAINT `email_unique` UNIQUE INDEX(`email`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`user_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('cash','e_wallet','credit_card','savings','other') NOT NULL,
	`initial_balance` decimal(15,2) NOT NULL DEFAULT (0.00),
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_user_id_users_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_users_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_wallet_id_wallets_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`);--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_category_id_categories_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`);--> statement-breakpoint
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_user_id_users_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`);--> statement-breakpoint
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_from_wallet_id_wallets_id_fkey` FOREIGN KEY (`from_wallet_id`) REFERENCES `wallets`(`id`);--> statement-breakpoint
ALTER TABLE `transfers` ADD CONSTRAINT `transfers_to_wallet_id_wallets_id_fkey` FOREIGN KEY (`to_wallet_id`) REFERENCES `wallets`(`id`);--> statement-breakpoint
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_user_id_users_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`);