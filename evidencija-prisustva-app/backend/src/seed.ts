import "dotenv/config";
import bcrypt from "bcrypt";
import { and, eq } from "drizzle-orm";
import { db } from "./db/index.js";
import {
  roles,
  users,
  departments,
  subjects,
  userSubjects,
} from "./db/schema.js";

async function ensureRole(name: string): Promise<string> {
  const existing = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, name))
    .limit(1);

  if (existing.length > 0) return existing[0]!.id;

  const inserted = await db
    .insert(roles)
    .values({ name })
    .returning({ id: roles.id });

  return inserted[0]!.id;
}

async function ensureUser(params: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
}): Promise<string> {
  const normalizedEmail = params.email.trim().toLowerCase();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    console.log(`User exists: ${normalizedEmail}`);
    return existing[0]!.id;
  }

  const passwordHash = await bcrypt.hash(params.password, 10);

  const inserted = await db
    .insert(users)
    .values({
      firstName: params.firstName,
      lastName: params.lastName,
      email: normalizedEmail,
      passwordHash,
      roleId: params.roleId,
    })
    .returning({ id: users.id });

  console.log(`Inserted user: ${normalizedEmail}`);
  return inserted[0]!.id;
}

async function ensureDepartment(name: string): Promise<string> {
  const existing = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.name, name))
    .limit(1);

  if (existing.length > 0) return existing[0]!.id;

  const inserted = await db
    .insert(departments)
    .values({ name })
    .returning({ id: departments.id });

  return inserted[0]!.id;
}

async function ensureSubject(params: {
  code: string;
  name: string;
  departmentId: string;
}): Promise<string> {
  const existing = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.code, params.code))
    .limit(1);

  if (existing.length > 0) return existing[0]!.id;

  const inserted = await db
    .insert(subjects)
    .values(params)
    .returning({ id: subjects.id });

  return inserted[0]!.id;
}

async function ensureUserSubject(userId: string, subjectId: string) {
  const existing = await db
    .select({ id: userSubjects.id })
    .from(userSubjects)
    .where(
      and(
        eq(userSubjects.userId, userId),
        eq(userSubjects.subjectId, subjectId)
      )
    )
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(userSubjects).values({ userId, subjectId });
}

/* ================= MAIN SEED ================= */

async function main() {
  console.log("Seeding database...");

  // Roles
  const adminRoleId = await ensureRole("ADMIN");
  const employeeRoleId = await ensureRole("EMPLOYEE");

  // Korisnici
  const adminId = await ensureUser({
    firstName: "Admin",
    lastName: "FON",
    email: "admin@podrska.fon.bg.ac.rs",
    password: "admin",
    roleId: adminRoleId,
  });

  const peraId = await ensureUser({
    firstName: "Pera",
    lastName: "Perić",
    email: "pera.peric.0001@fon.bg.ac.rs",
    password: "profesor1",
    roleId: employeeRoleId,
  });

  const markoId = await ensureUser({
    firstName: "Marko",
    lastName: "Marković",
    email: "marko.markovic.0002@fon.bg.ac.rs",
    password: "profesor2",
    roleId: employeeRoleId,
  });

  // Katedre
  const epDeptId = await ensureDepartment(
    "Katedra za elektronsko poslovanje"
  );

  const isDeptId = await ensureDepartment(
    "Katedra za informacione sisteme"
  );

  // Elektronsko poslovanje
  const epSubjects = [
    { code: "ITEH", name: "Internet tehnologije" },
    { code: "IMDM", name: "Internet marketing i društveni mediji" },
    { code: "BDIS", name: "Big Data infrastruktura i servisi" },
    { code: "KVT", name: "Klijentske veb tehnologije" },
    { code: "EPOS", name: "Elektronsko poslovanje" },
    { code: "SVT", name: "Serverske veb tehnologije" },
  ];

  const epSubjectIds: string[] = [];
  for (const s of epSubjects) {
    const id = await ensureSubject({
      ...s,
      departmentId: epDeptId,
    });
    epSubjectIds.push(id);
  }

  // Informacioni sistemi
  const isSubjects = [
    { code: "UIS", name: "Uvod u informacione sisteme" },
    { code: "BP", name: "Baze podataka" },
    { code: "SPA", name: "Strukture podataka i algoritmi" },
  ];

  const isSubjectIds: string[] = [];
  for (const s of isSubjects) {
    const id = await ensureSubject({
      ...s,
      departmentId: isDeptId,
    });
    isSubjectIds.push(id);
  }

  // Korisnik <-> Predmet povezanost
  for (const subjectId of epSubjectIds.slice(0, 4)) {
    await ensureUserSubject(peraId, subjectId);
  }

  for (const subjectId of isSubjectIds) {
    await ensureUserSubject(markoId, subjectId);
  }

  console.log("Seed finished successfully");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
