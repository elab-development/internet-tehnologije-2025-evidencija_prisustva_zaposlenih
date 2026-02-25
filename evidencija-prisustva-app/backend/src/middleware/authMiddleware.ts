import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { users, roles } from "../db/schema.js";

type JwtPayload = {
  sub: string;
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function parseBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

type AppUser = {
  id: string;
  role: "ADMIN" | "EMPLOYEE";
  roleId: string;
  employeeType?: "PROFESSOR" | "ASSISTANT";
};

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = parseBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: "Niste prijavljeni." });
  }

  const secret = mustEnv("JWT_SECRET");

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, secret) as JwtPayload;
  } catch {
    return res.status(401).json({ message: "Nevažeći token." });
  }

const result = await db
  .select({
    id: users.id,
    roleId: users.roleId,
    roleName: roles.name,
    employeeType: users.employeeType, 
  })
  .from(users)
  .innerJoin(roles, eq(users.roleId, roles.id))
  .where(eq(users.id, payload.sub))
  .limit(1);

  const u = result[0];
  if (!u) {
    return res.status(401).json({ message: "Korisnik ne postoji." });
  }

  const roleName = u.roleName;
  if (roleName !== "ADMIN" && roleName !== "EMPLOYEE") {
    return res.status(500).json({ message: "Nepoznata uloga u bazi." });
  }

req.user = {
  id: u.id,
  roleId: u.roleId,
  role: roleName,

  employeeType: roleName === "EMPLOYEE" ? (u.employeeType as any) : undefined,
};

  return next();
}