import { sql } from "../config/db.js";

export async function getBudgetsByUserId(req, res) {
  try {
    const { userId } = req.params;
    const { month } = req.params;

    const budgets = await sql`
      SELECT b.*, c.name as category_name, c.icon as category_icon
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ${userId} AND b.month = ${month}
    `;

    // For each budget, calculate current spending
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spendingResult = await sql`
          SELECT COALESCE(SUM(amount), 0) as spent 
          FROM transactions 
          WHERE user_id = ${userId} 
          AND category_id = ${budget.category_id} 
          AND TO_CHAR(created_at, 'YYYY-MM') = ${month} 
          AND amount < 0;
        `;
        return { ...budget, spent: Math.abs(parseFloat(spendingResult[0].spent)) };
      })
    );

    res.status(200).json(budgetsWithSpending);
  } catch (error) {
    console.log("Error getting budgets", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createBudget(req, res) {
  try {
    const { category_id, amount, month, user_id } = req.body;

    if (!user_id || !category_id || amount === undefined || !month) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const budget = await sql`
      INSERT INTO budgets(user_id, category_id, amount, month)
      VALUES (${user_id}, ${category_id}, ${amount}, ${month})
      RETURNING *
    `;

    res.status(201).json(budget[0]);
  } catch (error) {
    console.log("Error creating budget", error);
    if (error.code === "23505") { // Unique violation error code for PostgreSQL
      return res.status(409).json({ message: "Budget for this category and month already exists." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBudget(req, res) {
  try {
    const { id } = req.params;
    const { category_id, amount, month } = req.body;

    if (!category_id || amount === undefined || !month) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await sql`
      UPDATE budgets
      SET category_id = ${category_id}, amount = ${amount}, month = ${month}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.log("Error updating budget", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteBudget(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid budget ID" });
    }

    const result = await sql`
      DELETE FROM budgets WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.log("Error deleting budget", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
