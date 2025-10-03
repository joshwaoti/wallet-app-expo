import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;

    const transactions = await sql`
        SELECT t.*, a.name as account_name, a.type as account_type, c.name as category_name, c.icon as category_icon
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ${userId} ORDER BY t.created_at DESC
      `;

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
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
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

    if (typeof amount !== 'number') {
      return res.status(400).json({ message: "Amount must be a number" });
    }

    if (amount <= 0 && source !== 'manual') {
      return res.status(400).json({ message: "Amount must be positive for SMS-detected transactions" });
    }

    if (!['manual', 'sms', 'bank_api'].includes(source)) {
      return res.status(400).json({ message: "Invalid transaction source" });
    }

    if (source === 'sms' && (!sms_id || confidence === null || typeof confidence !== 'number' || confidence < 0 || confidence > 1)) {
      return res.status(400).json({ message: "SMS ID and a valid confidence score (0-1) are required for SMS transactions" });
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

    console.log(transaction);
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

    const result = await sql`
      DELETE FROM transactions WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.log("Error deleting the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSummaryByUserId(req, res) {
  try {
    const { userId } = req.params;

    const balanceResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE user_id = ${userId}
    `;

    const incomeResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as income FROM transactions
      WHERE user_id = ${userId} AND amount > 0
    `;

    const expensesResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as expenses FROM transactions
      WHERE user_id = ${userId} AND amount < 0
    `;

    res.status(200).json({
      balance: balanceResult[0].balance,
      income: incomeResult[0].income,
      expenses: expensesResult[0].expenses,
    });
  } catch (error) {
    console.log("Error gettin the summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function exportTransactionsCsv(req, res) {
  try {
    const { userId } = req.params;

    const transactions = await sql`
      SELECT t.id, t.user_id, t.title, t.amount, t.category_id, t.created_at, t.account_id
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ${userId}
      ORDER BY t.created_at DESC
    `;

    if (transactions.length === 0) {
      return res.status(404).json({ message: "No transactions found for this user." });
    }

    // Generate CSV header
    const header = Object.keys(transactions[0]).join(",");

    // Generate CSV rows
    const csvRows = transactions.map(row =>
      Object.values(row).map(value => {
        // Handle null values and escape commas/quotes in string values
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    );

    const csvString = [header, ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
    res.status(200).send(csvString);

  } catch (error) {
    console.log("Error exporting transactions to CSV", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
