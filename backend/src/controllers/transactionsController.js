import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query; // Set defaults for safety

    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    // Correctly structured SQL query with proper clause order
    const transactions = await sql`
      SELECT
        t.*,
        a.name as account_name,
        a.type as account_type,
        c.name as category_name,
        c.icon as category_icon
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ${userId}
      ORDER BY t.created_at DESC
      LIMIT ${parsedLimit}
      OFFSET ${parsedOffset}
    `;

    console.log("Fetched transaction IDs:", transactions.map(t => t.id));

    res.status(200).json(transactions);
  } catch (error) {
    console.log("Error getting the transactions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createTransaction(req, res) {
  try {
    const { title, amount, category_id, account_id, user_id, source = 'manual', sms_id = null, confidence = null } = req.body;

    if (!title.trim()) {
      return res.status(400).json({ message: "Please enter a transaction title" });
    }
    if (!amount || isNaN(parseFloat(amount))) { // Simplified amount check
      return res.status(400).json({ message: "Please enter a valid amount" });
    }
    if (!category_id) {
      return res.status(400).json({ message: "Please select a category" });
    }
    if (!account_id) {
      return res.status(400).json({ message: "Please select an account" });
    }
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Start a transaction to ensure atomicity
    await sql`BEGIN`;

    const transaction = await sql`
      INSERT INTO transactions(user_id, title, amount, category_id, account_id, source, sms_id, confidence)
      VALUES (${user_id}, ${title}, ${amount}, ${category_id}, ${account_id}, ${source}, ${sms_id}, ${confidence})
      RETURNING *
    `;

    // Update account balance
    await sql`
      UPDATE accounts
      SET balance = balance + ${amount}
      WHERE id = ${account_id}
    `;

    await sql`COMMIT`;

    res.status(201).json(transaction[0]);
  } catch (error) {
    await sql`ROLLBACK`; // Rollback in case of error
    console.log("Error creating the transaction or updating account balance", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    // You might want to wrap this in a SQL transaction to also adjust account balance
    const result = await sql`
      DELETE FROM transactions WHERE id = ${id} RETURNING *
    `;

    if (result.count === 0) { // Check 'count' for postgres-js
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Optional: Adjust account balance after deletion
    // const deletedTx = result[0];
    // await sql`UPDATE accounts SET balance = balance - ${deletedTx.amount} WHERE id = ${deletedTx.account_id}`;

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.log("Error deleting the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSummaryByUserId(req, res) {
  try {
    const { userId } = req.params;

    const [summary] = await sql`
      SELECT
        COALESCE(SUM(amount), 0) AS balance,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) AS expenses
      FROM transactions
      WHERE user_id = ${userId}
    `;

    res.status(200).json(summary);
  } catch (error) {
    console.log("Error getting the summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function exportTransactionsCsv(req, res) {
    // Your export function here...
}