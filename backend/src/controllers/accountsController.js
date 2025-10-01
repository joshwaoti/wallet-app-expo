import { sql } from "../config/db.js";

export async function getAccountsByUserId(req, res) {
  try {
    const { userId } = req.params;

    const accounts = await sql`
      SELECT * FROM accounts WHERE user_id = ${userId} ORDER BY created_at DESC
    `;

    res.status(200).json(accounts);
  } catch (error) {
    console.log("Error getting accounts", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createAccount(req, res) {
  try {
    const { name, type, balance, user_id } = req.body;

    if (!name || !type || balance === undefined || !user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists in our users table, and create if not
    const existingUser = await sql`SELECT id FROM users WHERE id = ${user_id}`;
    if (existingUser.length === 0) {
      // User does not exist, create a new user entry with placeholder values
      await sql`
        INSERT INTO users(id, email, name)
        VALUES (${user_id}, 'placeholder@example.com', 'New User')
      `;
      console.log(`New user ${user_id} created in the database during account creation.`);
    }

    const account = await sql`
      INSERT INTO accounts(user_id, name, type, balance)
      VALUES (${user_id}, ${name}, ${type}, ${balance})
      RETURNING *
    `;

    res.status(201).json(account[0]);
  } catch (error) {
    console.log("Error creating account", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAccount(req, res) {
  try {
    const { id } = req.params;
    const { name, type, balance } = req.body;

    if (!name || !type || balance === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await sql`
      UPDATE accounts
      SET name = ${name}, type = ${type}, balance = ${balance}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.log("Error updating account", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAccount(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    const result = await sql`
      DELETE FROM accounts WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.log("Error deleting account", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
