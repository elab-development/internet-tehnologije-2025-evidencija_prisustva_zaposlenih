import { Router } from "express";
import bcrypt from "bcrypt";
import { and, eq, sql } from "drizzle-orm";

import { db } from "../db/index.js";
import { activities, roles, subjects, userSubjects, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

function normalizeEmailPart(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/đ/g, "dj")
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/\s+/g, "");
}

function buildProfessorEmail(firstName: string, lastName: string, code4: string) {
  const fn = normalizeEmailPart(firstName);
  const ln = normalizeEmailPart(lastName);
  return `${fn}.${ln}.${code4}@fon.bg.ac.rs`;
}

function pad4(n: number) {
  return String(n).padStart(4, "0");
}

function toIcsDate(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}


router.use(authMiddleware, requireAdmin);

router.get("/subjects", async (_req, res) => {
  const rows = await db.select({ id: subjects.id, name: subjects.name }).from(subjects);
  res.json(rows);
});



router.get("/users", async (_req, res) => {
  const rows = await db
    .select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: roles.name,
      employeeType: users.employeeType, 
      subjectId: subjects.id,
      subjectName: subjects.name,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(userSubjects, eq(userSubjects.userId, users.id))
    .leftJoin(subjects, eq(userSubjects.subjectId, subjects.id));

  const map = new Map<string, any>();

  for (const r of rows) {
    if (!map.has(r.userId)) {
      map.set(r.userId, {
        id: r.userId,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        role: r.role,
        employeeType: r.employeeType, 
        subjects: [],
      });
    }

    if (r.subjectId) {
      map.get(r.userId).subjects.push({
        id: r.subjectId,
        name: r.subjectName,
      });
    }
  }

  res.json(Array.from(map.values()));
});



router.post("/users", async (req, res) => {
  const {
    firstName,
    lastName,
    professorCode,
    password,
    subjectIds,
    employeeType,
  } = req.body ?? {};

  if (!firstName || !lastName || !/^\d{4}$/.test(String(professorCode)) || !password) {
    return res.status(400).json({
      message: "Nedostaju podaci (ime, prezime, šifra 4 cifre, lozinka).",
    });
  }

  const et = String(employeeType ?? "PROFESSOR").toUpperCase();

  if (et !== "PROFESSOR" && et !== "ASSISTANT") {
    return res.status(400).json({
      message: "employeeType mora biti PROFESSOR ili ASSISTANT.",
    });
  }

  const employeeRole = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, "EMPLOYEE"))
    .limit(1);

  if (employeeRole.length === 0) {
    return res.status(500).json({ message: "Uloga EMPLOYEE ne postoji." });
  }

  const email = buildProfessorEmail(firstName, lastName, professorCode);
  const passwordHash = await bcrypt.hash(String(password), 10);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return res.status(409).json({ message: "Korisnik već postoji." });
  }

  const inserted = await db
    .insert(users)
    .values({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email,
      passwordHash,
      roleId: employeeRole[0]!.id,
      employeeType: et,
    })
    .returning({ id: users.id });

  const newUserId = inserted[0]!.id;

  if (Array.isArray(subjectIds) && subjectIds.length > 0) {
    await db.insert(userSubjects).values(
      subjectIds.map((sid: string) => ({
        userId: newUserId,
        subjectId: sid,
      }))
    );
  }

  res.status(201).json({ id: newUserId, email });
});



router.put("/users/:id", async (req, res) => {
  const userId = req.params.id;

  const {
    firstName,
    lastName,
    professorCode,
    password,
    subjectIds,
    employeeType,
  } = req.body ?? {};

  if (!firstName || !lastName || !/^\d{4}$/.test(String(professorCode))) {
    return res.status(400).json({
      message: "Nedostaju podaci (ime, prezime, šifra 4 cifre).",
    });
  }

  const et = String(employeeType ?? "PROFESSOR").toUpperCase();

  if (et !== "PROFESSOR" && et !== "ASSISTANT") {
    return res.status(400).json({
      message: "employeeType mora biti PROFESSOR ili ASSISTANT.",
    });
  }

  const email = buildProfessorEmail(firstName, lastName, professorCode);

  const updateData: any = {
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email,
    employeeType: et,
  };

  if (password && String(password).length > 0) {
    updateData.passwordHash = await bcrypt.hash(String(password), 10);
  }

  const collision = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), sql`${users.id} <> ${userId}`))
    .limit(1);

  if (collision.length > 0) {
    return res.status(409).json({
      message: "Neki drugi korisnik već ima ovaj email.",
    });
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  await db.delete(userSubjects).where(eq(userSubjects.userId, userId));

  if (Array.isArray(subjectIds) && subjectIds.length > 0) {
    await db.insert(userSubjects).values(
      subjectIds.map((sid: string) => ({
        userId,
        subjectId: sid,
      }))
    );
  }

  res.json({ message: "Sačuvano." });
});



router.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;

  const u = await db
    .select({ role: roles.name })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (u[0]?.role === "ADMIN") {
    return res.status(400).json({ message: "Admin se ne može obrisati." });
  }

  await db.delete(activities).where(eq(activities.userId, userId));
  await db.delete(userSubjects).where(eq(userSubjects.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  res.json({ message: "Obrisano." });
});

export default router;