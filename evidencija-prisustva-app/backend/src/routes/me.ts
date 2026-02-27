import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();
// ZA SWAGGER
/**
 * @openapi
 * /me:
 *   get:
 *     summary: Vraća trenutno ulogovanog korisnika
 *     tags:
 *       - Me
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Podaci o korisniku
 *       401:
 *         description: Niste autentifikovani
 */

router.get("/", authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

export default router;
