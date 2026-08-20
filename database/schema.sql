-- MySQL Database Schema for Neeraj General Store Commerce System (Phase 7)
-- Suitable for production deployment.

CREATE DATABASE IF NOT EXISTS `grocery_store` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `grocery_store`;

-- 1. Whitelisted Administrator accounts
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default whitelisted administrator
INSERT IGNORE INTO `admins` (`email`) VALUES ('dubeyavinash157@gmail.com');

-- 2. Customer Directory synced from Firebase Auth accounts
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(128) PRIMARY KEY, -- Firebase Auth UID
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `address` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Inventory / Food Catalog items
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `hindiName` VARCHAR(255),
  `category` VARCHAR(100) NOT NULL,
  `price` INT NOT NULL,
  `originalPrice` INT,
  `unit` VARCHAR(50) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `imageUrl` TEXT,
  `description` TEXT,
  `isPopular` TINYINT(1) DEFAULT 0,
  `isAvailable` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Customer Order lifecycle records
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(50) PRIMARY KEY, -- e.g., 'NG-5011'
  `customerName` VARCHAR(255) NOT NULL,
  `customerPhone` VARCHAR(20) NOT NULL,
  `customerAddress` TEXT NOT NULL,
  `paymentMethod` VARCHAR(20) NOT NULL, -- 'COD' or 'UPI'
  `subtotal` INT NOT NULL,
  `deliveryFee` INT NOT NULL,
  `total` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled'
  `createdAt` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Individual purchased items mapping to order
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(50) NOT NULL,
  `productId` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `price` INT NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Dynamic Promotional Banner data
CREATE TABLE IF NOT EXISTS `banners` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255),
  `imageUrl` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Store Environment customization table
CREATE TABLE IF NOT EXISTS `store_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `storeName` VARCHAR(255) NOT NULL,
  `tagline` VARCHAR(255) NOT NULL,
  `address` TEXT NOT NULL,
  `pincode` VARCHAR(10) NOT NULL,
  `deliveryFee` INT NOT NULL,
  `freeDeliveryThreshold` INT NOT NULL,
  `announcement` TEXT,
  `upiId` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default settings
INSERT IGNORE INTO `store_settings` (`id`, `storeName`, `tagline`, `address`, `pincode`, `deliveryFee`, `freeDeliveryThreshold`, `announcement`, `upiId`)
VALUES (1, 'Neeraj General Store & Hypermarket', 'Apna Store, Swadeshi Aur Sasta! Low Prices Everyday.', 'Awadh Market, Jalalpur Panwara, Kannauj', '209727', 30, 500, '🎉 Grand Scheme Offer: Free Delivery in Jalalpur Panwara and adjacent areas for orders above ₹500!', '9935118811@okbizaxis');
