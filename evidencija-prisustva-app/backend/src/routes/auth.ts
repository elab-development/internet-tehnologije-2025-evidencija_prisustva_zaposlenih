import type { Request, Response } from "express";
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
