import express from "express";
import {
  createAccount,
  deleteAccount,
  getAccountsByUserId,
  updateAccount,
} from "../controllers/accountsController.js";

const router = express.Router();

router.get("/:userId", getAccountsByUserId);
router.post("/", createAccount);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);

export default router;
