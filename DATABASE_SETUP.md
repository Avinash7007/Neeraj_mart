# Database Architecture and Migration Guide

## Production Database Schema
This application is fully compatible with MySQL 8.0+. When initialized, the `server/db.ts` file automatically spins up all requested relational collections:
- `admins`
- `customers`
- `products`
- `categories`
- `inventory`
- `orders` & `order_items`
- `store_settings`

## Transitioning from JSON to MySQL
1. Stop the application server.
2. Ensure you have a valid MySQL database running.
3. Configure the following environment variables:
   ```env
   DB_HOST=my-mysql-instance.aws.com
   DB_USER=admin
   DB_PASSWORD=secret
   DB_NAME=saas_db
   ```
4. Restart the server. Upon boot, `server.ts` will trigger `initializeDatabase()` which detects the `DB_HOST` variable and automatically provisions the SQL schema structure.
5. In production mode, the application immediately starts enforcing referential integrity (Foreign Keys, Constraints) defined in the MySQL setup logic.
