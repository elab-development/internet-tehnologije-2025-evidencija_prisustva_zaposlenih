import { Router } from "express";
import bcrypt from "bcrypt";
import { and, eq, inArray, sql } from "drizzle-orm";

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
  // UTC: YYYYMMDDTHHMMSSZ
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

// sve admin rute su auth + admin
router.use(authMiddleware, requireAdmin);

/** GET /admin/subjects */
router.get("/subjects", async (_req, res) => {
  const rows = await db.select({ id: subjects.id, name: subjects.name }).from(subjects);
  res.json(rows);
});

/** GET /admin/users (sa predmetima) */
router.get("/users", async (_req, res) => {
  const rows = await db
    .select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: roles.name,
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
        subjects: [],
      });
    }
    if (r.subjectId) {
      map.get(r.userId).subjects.push({ id: r.subjectId, name: r.subjectName });
    }
  }

  res.json(Array.from(map.values()));
});

/** GET /admin/next-professor-code -> npr 0003 */
router.get("/next-professor-code", async (_req, res) => {
  const rows = await db.select({ email: users.email }).from(users);

  let max = 0;
  for (const r of rows) {
    const m = r.email.match(/\.([0-9]{4})@fon\.bg\.ac\.rs$/i);
    if (!m) continue;
    const n = Number(m[1]);
    if (!Number.isNaN(n)) max = Math.max(max, n);
  }

  res.json({ nextCode: pad4(max + 1) });
});

/** POST /admin/users */
router.post("/users", async (req, res) => {
  const { firstName, lastName, professorCode, password, subjectIds } = req.body ?? {};

  if (!firstName || !lastName || !/^\d{4}$/.test(String(professorCode)) || !password) {
    return res.status(400).json({ message: "Nedostaju podaci (ime, prezime, šifra 4 cifre, lozinka)." });
  }

  const employeeRole = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, "EMPLOYEE"))
    .limit(1);

  if (employeeRole.length === 0) {
    return res.status(500).json({ message: "Uloga EMPLOYEE ne postoji u bazi." });
  }

  const email = buildProfessorEmail(firstName, lastName, professorCode);
  const passwordHash = await bcrypt.hash(String(password), 10);

  // provera email unique
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ message: "Korisnik sa ovim email-om već postoji." });
  }

  const inserted = await db
    .insert(users)
    .values({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email,
      passwordHash,
      roleId: employeeRole[0]!.id,
    })
    .returning({ id: users.id });

  const newUserId = inserted[0]!.id;

  if (Array.isArray(subjectIds) && subjectIds.length > 0) {
    await db.insert(userSubjects).values(
      subjectIds.map((sid: string) => ({ userId: newUserId, subjectId: sid }))
    );
  }

  res.status(201).json({ id: newUserId, email });
});

/** PUT /admin/users/:id */
router.put("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const { firstName, lastName, professorCode, password, subjectIds } = req.body ?? {};

  if (!firstName || !lastName || !/^\d{4}$/.test(String(professorCode))) {
    return res.status(400).json({ message: "Nedostaju podaci (ime, prezime, šifra 4 cifre)." });
  }

  const email = buildProfessorEmail(firstName, lastName, professorCode);

  // update osnovnih polja
  const updateData: any = {
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email,
  };

  if (password && String(password).length > 0) {
    updateData.passwordHash = await bcrypt.hash(String(password), 10);
  }

  // provera da li email vec koristi neko drugi
  const collision = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), sql`${users.id} <> ${userId}`))
    .limit(1);

  if (collision.length > 0) {
    return res.status(409).json({ message: "Neki drugi korisnik već ima ovaj email." });
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  // update predmeta: obriši pa upiši nove
  await db.delete(userSubjects).where(eq(userSubjects.userId, userId));
  if (Array.isArray(subjectIds) && subjectIds.length > 0) {
    await db.insert(userSubjects).values(
      subjectIds.map((sid: string) => ({ userId, subjectId: sid }))
    );
  }

  res.json({ message: "Sačuvano." });
});

/** DELETE /admin/users/:id */
router.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;

  // ne brisemo admina
  const u = await db
    .select({ role: roles.name })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (u[0]?.role === "ADMIN") {
    return res.status(400).json({ message: "Admin se ne može obrisati." });
  }

  // prvo aktivnosti, veze sa predmetima, pa user
  await db.delete(activities).where(eq(activities.userId, userId));
  await db.delete(userSubjects).where(eq(userSubjects.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  res.json({ message: "Obrisano." });
});

/** GET /admin/users/:id/ics */
router.get("/users/:id/ics", async (req, res) => {
  const userId = req.params.id;

  const rows = await db
    .select({
      id: activities.id,
      title: activities.title,
      description: activities.description,
      startTime: activities.startTime,
      endTime: activities.endTime,
      room: activities.room,
    })
    .from(activities)
    .where(eq(activities.userId, userId));

  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FON Evidencija//SRB//EN",
    "CALSCALE:GREGORIAN",
  ];

  for (const a of rows) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${a.id}`);
    lines.push(`DTSTAMP:${toIcsDate(now)}`);
    lines.push(`DTSTART:${toIcsDate(new Date(a.startTime))}`);
    lines.push(`DTEND:${toIcsDate(new Date(a.endTime))}`);
    lines.push(`SUMMARY:${(a.title ?? "").replace(/\n/g, " ")}`);
    if (a.room) lines.push(`LOCATION:${String(a.room).replace(/\n/g, " ")}`);
    if (a.description) lines.push(`DESCRIPTION:${String(a.description).replace(/\n/g, " ")}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="profesor_${userId}.ics"`);
  res.send(lines.join("\r\n"));
});

export default router;
