CREATE DATABASE IF NOT EXISTS SMS;
USE SMS;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

-- 2. StockIn Table
CREATE TABLE IF NOT EXISTS StockIn (
  stock_id INT AUTO_INCREMENT PRIMARY KEY,
  ItemName VARCHAR(255) NOT NULL,
  Description TEXT,
  quantityin INT NOT NULL,
  totalquantityin INT NOT NULL,
  stockDate DATE NOT NULL,
  supplierName VARCHAR(255) NOT NULL,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- 3. StockOut Table
CREATE TABLE IF NOT EXISTS StockOut (
  stock_id INT AUTO_INCREMENT PRIMARY KEY,
  quantityout INT NOT NULL,
  totalquantityout INT NOT NULL,
  stockoutDate DATE NOT NULL,
  stock_id_fk INT NOT NULL,
  user_id INT,
  FOREIGN KEY (stock_id_fk) REFERENCES StockIn(stock_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);
