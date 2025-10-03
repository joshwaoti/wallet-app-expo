import { sql } from "../config/db.js";

export async function getStatistics(req, res) {
  try {
    const { userId } = req.params;
    const { period = "month" } = req.query; // Default to 'month'

    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case "week":
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start of week, assuming 0 is Sunday
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        endDate = new Date(now.getFullYear(), now.getMonth(), diff + 6);
        break;
      default:
        startDate = new Date(0); // Epoch, to get all data
        endDate = now;
    }

    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // 1. Total income and total expenses within the date range
    const totalsResult = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) AS total_expenses
      FROM transactions
      WHERE user_id = ${userId} AND created_at >= ${formattedStartDate} AND created_at <= ${formattedEndDate};
    `;
    const { total_income, total_expenses } = totalsResult[0];

    // 2. Spending broken down by category
    const spendingByCategory = await sql`
      SELECT 
        c.name as category_name, 
        c.icon as category_icon,
        COALESCE(SUM(t.amount), 0) AS amount_spent
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ${userId} 
      AND t.amount < 0 
      AND t.created_at >= ${formattedStartDate} AND t.created_at <= ${formattedEndDate}
      GROUP BY c.name, c.icon
      ORDER BY amount_spent ASC;
    `;

    // 3. Time-series of expenses (daily or weekly totals for the line graph)
    let timeSeriesQuery;
    if (period === "month" || period === "week") {
      // Daily totals for month/week
      timeSeriesQuery = await sql`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
          COALESCE(SUM(amount), 0) AS daily_expenses
        FROM transactions
        WHERE user_id = ${userId} 
        AND amount < 0 
        AND created_at >= ${formattedStartDate} AND created_at <= ${formattedEndDate}
        GROUP BY date
        ORDER BY date ASC;
      `;
    } else {
      // Monthly totals for year (or all time)
      timeSeriesQuery = await sql`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') AS month,
          COALESCE(SUM(amount), 0) AS monthly_expenses
        FROM transactions
        WHERE user_id = ${userId} 
        AND amount < 0 
        AND created_at >= ${formattedStartDate} AND created_at <= ${formattedEndDate}
        GROUP BY month
        ORDER BY month ASC;
      `;
    }

    res.status(200).json({
      totalIncome: parseFloat(total_income).toFixed(2),
      totalExpenses: parseFloat(total_expenses).toFixed(2),
      spendingByCategory: spendingByCategory.map(item => ({ category: item.category_name, icon: item.category_icon, amount: parseFloat(item.amount_spent).toFixed(2) })),
      timeSeries: timeSeriesQuery.map(item => ({ date: item.date || item.month, expenses: parseFloat(item.daily_expenses || item.monthly_expenses).toFixed(2) })),
    });

  } catch (error) {
    console.log("Error getting statistics", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
