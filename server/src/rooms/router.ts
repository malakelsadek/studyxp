import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/requireAuth.js";

export const roomsRouter = Router();

roomsRouter.get("/", async (_req, res) => {
  const rooms = await prisma.room.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(rooms);
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(4).max(100),
});

roomsRouter.patch("/:id/password", requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const valid = await bcrypt.compare(parsed.data.oldPassword, room.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.room.update({ where: { id: room.id }, data: { passwordHash } });
  res.json({ ok: true });
});
