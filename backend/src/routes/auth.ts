import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { users, roles } from "../db/schema.js";

const router = Router();

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Nedostaju obavezna polja.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        message: "Email je već registrovan.",
      });
    }

    const roleName = role ?? "EMPLOYEE";

    const roleQuery = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);

    const roleRecord = roleQuery[0];

    if (!roleRecord) {
      return res.status(500).json({
        message: "Role nije pronađen u bazi.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertedUser = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email: normalizedEmail,
        passwordHash,
        roleId: roleRecord.id,
      })
      .returning({
        id: users.id,
        email: users.email,
      });

    return res.status(201).json({
      message: "Korisnik uspešno registrovan.",
      user: insertedUser[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Greška na serveru.",
    });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Nedostaju email ili lozinka.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userQuery = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        roleId: users.roleId,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const user = userQuery[0];

    if (!user) {
      return res.status(401).json({
        message: "Pogrešan email ili lozinka.",
      });
    }

    const isValidPassword = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Pogrešan email ili lozinka.",
      });
    }

    const jwtSecret = mustEnv("JWT_SECRET");

    const token = jwt.sign(
      {
        sub: user.id,
        roleId: user.roleId,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Uspešna prijava.",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Greška na serveru.",
    });
  }
});

export default router;
