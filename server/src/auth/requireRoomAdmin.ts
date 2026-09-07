import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./jwt.js";
import { prisma } from "../prisma.js";

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

export async function requireRoomCreator(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const payload = verifyToken(token);
    const room = await prisma.room.findUnique({ where: { id: req.params.id }, select: { creatorId: true } });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    if (room.creatorId !== payload.userId) {
      return res.status(403).json({ error: "Only the room creator can change this" });
    }
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRoomEditPermission(kind: "name" | "background") {
  return async function (req: Request, res: Response, next: NextFunction) {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    try {
      const payload = verifyToken(token);
      const room = await prisma.room.findUnique({
        where: { id: req.params.id },
        select: { creatorId: true, allowNameChangeByMembers: true, allowBackgroundChangeByMembers: true },
      });
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      const isCreator = room.creatorId === payload.userId;
      const allowed = kind === "name" ? room.allowNameChangeByMembers : room.allowBackgroundChangeByMembers;
      if (!isCreator && !allowed) {
        return res.status(403).json({ error: "Only the room creator can change this" });
      }
      req.userId = payload.userId;
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}
