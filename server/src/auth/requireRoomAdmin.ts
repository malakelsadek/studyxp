import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./jwt.js";
import { prisma } from "../prisma.js";

export const ROOM_SETTINGS_ADMIN_EMAIL = "mika07@gmail.com";

export async function requireRoomAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true } });
    if (!user || user.email !== ROOM_SETTINGS_ADMIN_EMAIL) {
      return res.status(403).json({ error: "Only mika can change room settings" });
    }
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
