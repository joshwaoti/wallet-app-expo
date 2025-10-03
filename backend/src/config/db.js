import { neon } from "@neondatabase/serverless";

import "dotenv/config";

// Creates a SQL connection using our DB URL
export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  try {
    // Create users table first as it's referenced by accounts and budgets
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255),
        name VARCHAR(255),
        created_at DATE NOT NULL DEFAULT CURRENT_DATE
      )
    `;

    // Create categories table first as it's referenced by budgets and transactions
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        icon VARCHAR(255) NOT NULL
      )
    `;

    // Create accounts table as it's referenced by transactions
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL, -- e.g., 'bank', 'card', 'cash'
        balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE
      )
    `;

    // Create budgets table after users and categories
    await sql`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INT REFERENCES categories(id),
        amount DECIMAL(10, 2) NOT NULL,
        month VARCHAR(7) NOT NULL, -- YYYY-MM format
        created_at DATE NOT NULL DEFAULT CURRENT_DATE,
        UNIQUE (user_id, category_id, month)
      )
    `;

    // Create transactions table last, as it references accounts and categories
    await sql`
      CREATE TABLE IF NOT EXISTS transactions(
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title  VARCHAR(255) NOT NULL,
        amount  DECIMAL(10,2) NOT NULL,
        category_id INT REFERENCES categories(id),
        account_id INT REFERENCES accounts(id) ON DELETE CASCADE,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE
      )
    `;

    // Seed initial categories
    await sql`
      INSERT INTO categories (name, icon) VALUES
        ('Food & Drink', 'fast-food-outline'),
        ('Shopping', 'bag-handle-outline'),
        ('Transportation', 'car-outline'),
        ('Housing', 'home-outline'),
        ('Bills & Utilities', 'receipt-outline'),
        ('Entertainment', 'film-outline'),
        ('Health & Wellness', 'heart-outline'),
        ('Groceries', 'basket-outline'),
        ('Income', 'wallet-outline'),
        ('Other', 'ellipsis-horizontal-circle-outline')
      ON CONFLICT (name) DO NOTHING;
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializing DB", error);
    process.exit(1); // status code 1 means failure, 0 success
  }
}
