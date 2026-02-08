import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

function mustEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getTokenFromHeader(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({ message: "Nedostaje token (Bearer)." });
    }

    const secret = mustEnv("JWT_SECRET");

    const payload = jwt.verify(token, secret) as {
      sub?: string;
      role?: "ADMIN" | "EMPLOYEE";
      roleId?: string;
    };

    if (!payload?.sub || !payload?.role) {
      return res.status(401).json({ message: "Nevažeći token." });
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      ...(payload.roleId ? { roleId: payload.roleId } : {}),
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Nevažeći ili istekao token." });
  }
}

export function requireRole(role: "ADMIN" | "EMPLOYEE") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Niste autentifikovani." });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Nemate pravo pristupa." });
    }
    return next();
  };
}
