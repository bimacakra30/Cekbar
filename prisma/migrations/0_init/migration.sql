-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('user', 'admin', 'superadmin') NOT NULL DEFAULT 'user',
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `last_login_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_no_hp_key`(`no_hp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service_id` VARCHAR(100) NOT NULL,
    `service_name` VARCHAR(255) NOT NULL,
    `group_name` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NULL,
    `api_provider` VARCHAR(50) NOT NULL DEFAULT 'dhru',
    `api_service_id` VARCHAR(100) NULL,
    `api_type` VARCHAR(50) NULL,
    `buy_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sell_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `time_info` VARCHAR(255) NOT NULL DEFAULT '',
    `info` TEXT NULL,
    `min_qty` INTEGER NOT NULL DEFAULT 1,
    `max_qty` VARCHAR(10) NOT NULL DEFAULT '',
    `custom_field_name` VARCHAR(100) NOT NULL DEFAULT '',
    `custom_field_regex` VARCHAR(255) NOT NULL DEFAULT '',
    `custom_field_maxlen` VARCHAR(10) NOT NULL DEFAULT '',
    `allow_bulk` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_synced_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `services_service_id_key`(`service_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` VARCHAR(50) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `service_id` VARCHAR(100) NOT NULL,
    `service_name` VARCHAR(255) NOT NULL,
    `imei_list` JSON NOT NULL,
    `total_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDING_PAYMENT', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING_PAYMENT',
    `dhru_order_id` VARCHAR(100) NULL,
    `ceir_order_id` VARCHAR(100) NULL,
    `roamer_months` TINYINT NULL,
    `status_note` VARCHAR(255) NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `results` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,
    `completed_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `orders_order_id_key`(`order_id`),
    INDEX `idx_user_id`(`user_id`),
    INDEX `idx_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `payment_id` VARCHAR(50) NOT NULL,
    `order_id` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `fee` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `qris_id` VARCHAR(100) NULL,
    `trx_id` VARCHAR(100) NULL,
    `qr_image` TEXT NULL,
    `qris_url` TEXT NULL,
    `gopay_transaction_id` VARCHAR(100) NULL,
    `payer_issuer` VARCHAR(50) NULL,
    `payment_type` VARCHAR(50) NULL,
    `status` ENUM('MENUNGGU', 'LUNAS', 'KADALUARSA', 'GAGAL') NOT NULL DEFAULT 'MENUNGGU',
    `confirmed_at` TIMESTAMP(0) NULL,
    `expires_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `payments_payment_id_key`(`payment_id`),
    INDEX `idx_order_id`(`order_id`),
    INDEX `idx_payment_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `key_name` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `updated_at` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`key_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
