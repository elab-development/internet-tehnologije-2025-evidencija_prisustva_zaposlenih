import { Router } from "express";
import { and, eq, gte, lte } from "drizzle-orm";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { db } from "../db/index.js";
import { activities } from "../db/schema.js";

const router = Router();

/**

 * Vraća aktivnosti u zadatom opsegu za ulogovanog korisnika.
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    const fromRaw = String(req.query.from ?? "");
    const toRaw = String(req.query.to ?? "");

    const from = new Date(fromRaw);
    const to = new Date(toRaw);

    if (!fromRaw || !toRaw || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return res.status(400).json({ message: "Pošalji validne query parametre from i to (ISO)." });
    }

    const rows = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          gte(activities.startTime, from),
          lte(activities.endTime, to)
        )
      );

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Greška na serveru." });
  }
});
// ZA SWAGGER
/**
 * @openapi
 * /activities:
 *   post:
 *     summary: Kreiranje aktivnosti (evidencija)
 *     tags:
 *       - Activities
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subjectId:
 *                 type: string
 *               type:
 *                 type: string
 *                 example: VEZBE
 *               title:
 *                 type: string
 *                 example: Vežbe 1
 *               startTime:
 *                 type: string
 *                 example: "2026-02-27T10:00:00.000Z"
 *               endTime:
 *                 type: string
 *                 example: "2026-02-27T12:00:00.000Z"
 *     responses:
 *       201:
 *         description: Aktivnost kreirana
 *       403:
 *         description: Zabranjeno
 */
 
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    const { subjectId, type, room, title, description, startTime, endTime } = req.body ?? {};

    if (!subjectId || !type || !title || !startTime || !endTime) {
      return res.status(400).json({ message: "Nedostaju obavezna polja." });
    }

    
    const normalizedType = String(type).trim().toUpperCase();

    
    if (
      req.user?.role === "EMPLOYEE" &&
      req.user.employeeType === "ASSISTANT" &&
      normalizedType === "PREDAVANJE"
    ) {
      return res.status(403).json({ message: "Asistent ne može da zakazuje predavanja." });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ message: "Nevalidan startTime/endTime." });
    }

    const inserted = await db
      .insert(activities)
      .values({
        userId,
        subjectId,
        type: normalizedType, 
        room: room ?? null,
        title,
        description: description ?? null,
        startTime: start,
        endTime: end,
      })
      .returning();

    return res.status(201).json(inserted[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Greška na serveru." });
  }
});

export default router;