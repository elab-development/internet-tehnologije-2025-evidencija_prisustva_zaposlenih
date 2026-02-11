import { Router } from "express";
import { eq } from "drizzle-orm";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { db } from "../db/index.js";
import { subjects, userSubjects } from "../db/schema.js";

const router = Router();

// predmeti ulogovanog korisnika
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    const rows = await db
      .select({
        id: subjects.id,
        name: subjects.name,
      })
      .from(userSubjects)
      .innerJoin(subjects, eq(userSubjects.subjectId, subjects.id))
      .where(eq(userSubjects.userId, userId));

    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Greška na serveru." });
  }
});

export default router;
