import express from "express";
import { getStatistics } from "../controllers/statisticsController.js";

const router = express.Router();

router.get("/:userId", getStatistics);

export default router;
