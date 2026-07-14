-- =========================================================
-- Shop Management System — Database Schema
-- Engine: InnoDB (required for foreign keys + transactions)
-- Charset: utf8mb4
-- =========================================================

CREATE DATABASE IF NOT EXISTS shop_management_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE shop_management_db;

-- Drop in dependency-safe order (children before parents) for re-runs during development
DROP TABLE IF EXISTS stock_history;
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS purchase_items;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;


-- =========================================================
-- USERS  (Admin / Staff — authentication & role-based access)
-- =========================================================
CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100)        NOT NULL,
    username      VARCHAR(50)         NOT NULL UNIQUE,
    email         VARCHAR(100)        NOT NULL UNIQUE,
    password_hash VARCHAR(255)        NOT NULL,
    role          ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    is_active     BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================================
-- CATEGORIES
-- =========================================================
CREATE TABLE categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    description   VARCHAR(255) DEFAULT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- =========================================================
-- SUPPLIERS
-- =========================================================
CREATE TABLE suppliers (
    supplier_id   INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    phone         VARCHAR(20)  DEFAULT NULL,
    email         VARCHAR(100) DEFAULT NULL,
    address       VARCHAR(255) DEFAULT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_supplier_name (name)   -- speeds up LIKE search on name
) ENGINE=InnoDB;


-- =========================================================
-- CUSTOMERS
-- =========================================================
CREATE TABLE customers (
    customer_id   INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    phone         VARCHAR(20)  DEFAULT NULL,
    email         VARCHAR(100) DEFAULT NULL,
    address       VARCHAR(255) DEFAULT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_customer_name (name)
) ENGINE=InnoDB;


-- =========================================================
-- PRODUCTS
-- =========================================================
CREATE TABLE products (
    product_id    INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150)   NOT NULL,
    category_id   INT            DEFAULT NULL,
    supplier_id   INT            DEFAULT NULL,
    cost_price    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,  -- price paid to supplier
    selling_price DECIMAL(10,2)  NOT NULL DEFAULT 0.00,  -- price charged to customer
    stock_quantity INT           NOT NULL DEFAULT 0,
    low_stock_threshold INT      NOT NULL DEFAULT 10,
    image_path    VARCHAR(255)   DEFAULT NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT fk_product_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT chk_product_stock_nonnegative CHECK (stock_quantity >= 0),
    CONSTRAINT chk_product_prices_nonnegative CHECK (cost_price >= 0 AND selling_price >= 0),

    INDEX idx_product_name (name)   -- speeds up LIKE search on name
) ENGINE=InnoDB;


-- =========================================================
-- PURCHASES (header) — one purchase invoice from a supplier
-- =========================================================
CREATE TABLE purchases (
    purchase_id   INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id   INT            NOT NULL,
    user_id       INT            NOT NULL,           -- staff/admin who recorded it
    total_amount  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    purchase_date TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_purchase_supplier
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_purchase_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;


-- =========================================================
-- PURCHASE_ITEMS (line items) — products within a purchase invoice
-- =========================================================
CREATE TABLE purchase_items (
    purchase_item_id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id      INT            NOT NULL,
    product_id       INT            NOT NULL,
    quantity         INT            NOT NULL,
    unit_cost        DECIMAL(10,2)  NOT NULL,
    subtotal         DECIMAL(12,2)  NOT NULL,   -- quantity * unit_cost

    CONSTRAINT fk_purchase_item_purchase
        FOREIGN KEY (purchase_id) REFERENCES purchases(purchase_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_purchase_item_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_purchase_item_quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB;


-- =========================================================
-- SALES (header) — one sales invoice to a customer
-- =========================================================
CREATE TABLE sales (
    sale_id       INT AUTO_INCREMENT PRIMARY KEY,
    customer_id   INT            DEFAULT NULL,   -- nullable: walk-in customer with no record
    user_id       INT            NOT NULL,       -- staff/admin who recorded it
    subtotal      DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    discount      DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    total_amount  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
    sale_date     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sale_customer
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT fk_sale_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_sale_amounts_nonnegative
        CHECK (subtotal >= 0 AND discount >= 0 AND total_amount >= 0)
) ENGINE=InnoDB;


-- =========================================================
-- SALE_ITEMS (line items) — products within a sales invoice
-- =========================================================
CREATE TABLE sale_items (
    sale_item_id  INT AUTO_INCREMENT PRIMARY KEY,
    sale_id       INT            NOT NULL,
    product_id    INT            NOT NULL,
    quantity      INT            NOT NULL,
    unit_price    DECIMAL(10,2)  NOT NULL,
    subtotal      DECIMAL(12,2)  NOT NULL,   -- quantity * unit_price

    CONSTRAINT fk_sale_item_sale
        FOREIGN KEY (sale_id) REFERENCES sales(sale_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_sale_item_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_sale_item_quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB;


-- =========================================================
-- STOCK_HISTORY — audit log of every stock change (purchase, sale, manual adjustment)
-- Populated by the application inside the same transaction as the purchase/sale.
-- =========================================================
CREATE TABLE stock_history (
    history_id     INT AUTO_INCREMENT PRIMARY KEY,
    product_id     INT NOT NULL,
    change_type    ENUM('purchase', 'sale', 'adjustment') NOT NULL,
    quantity_change INT NOT NULL,        -- positive for purchase/adjustment-in, negative for sale/adjustment-out
    reference_id   INT DEFAULT NULL,     -- purchase_id or sale_id that caused this change
    resulting_stock INT NOT NULL,        -- stock_quantity AFTER this change, for easy auditing
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_history_product_date (product_id, created_at)
) ENGINE=InnoDB;
