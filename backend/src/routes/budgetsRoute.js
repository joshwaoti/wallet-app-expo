import express from "express";
import {
  createBudget,
  getBudgetsByUserId,
  updateBudget,
  deleteBudget,
} from "../controllers/budgetsController.js";

const router = express.Router();

router.get("/:userId/:month", getBudgetsByUserId);
router.post("/", createBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
