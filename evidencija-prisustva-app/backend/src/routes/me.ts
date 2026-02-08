import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

export default router;
