import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;

    const transactions = await sql`
        SELECT t.*, a.name as account_name, a.type as account_type 
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
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
    const { title, amount, category, account_id, user_id, source = 'manual', sms_id = null, confidence = null } = req.body;

    if (!title || !user_id || !category || amount === undefined || !account_id) {
      return res.status(400).json({ message: "All required fields (title, user_id, category, amount, account_id) are required" });
    }

    if (typeof amount !== 'number') {
      return res.status(400).json({ message: "Amount must be a number" });
    }

    if (amount <= 0 && source !== 'manual') { // Allow 0 or negative for manual adjustments if needed, but not for SMS
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
      INSERT INTO transactions(user_id, title, amount, category, account_id, source, sms_id, confidence)
      VALUES (${user_id}, ${title}, ${amount}, ${category}, ${account_id}, ${source}, ${sms_id}, ${confidence})
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
      SELECT id, user_id, title, amount, category, created_at, account_id
      FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
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
