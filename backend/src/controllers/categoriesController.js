import { sql } from "../config/db.js";

export async function getCategories(req, res) {
  try {
    const categories = await sql`
      SELECT * FROM categories
    `;
    res.status(200).json(categories);
  } catch (error) {
    console.log("Error getting categories", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, icon } = req.body;

    if (!name || !icon) {
      return res.status(400).json({ message: "Name and icon are required" });
    }

    const category = await sql`
      INSERT INTO categories (name, icon)
      VALUES (${name}, ${icon})
      RETURNING *
    `;

    res.status(201).json(category[0]);
  } catch (error) {
    console.log("Error creating category", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
