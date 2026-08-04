import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/requireAuth.js";
import { getPlayerCount } from "../socket/rooms.js";
import { deleteUploadedFile, uploadRoomBackground } from "./upload.js";

export const roomsRouter = Router();

const MAX_ROOM_CAPACITY = 20;

roomsRouter.get("/", async (_req, res) => {
  const rooms = await prisma.room.findMany({
    select: { id: true, name: true, maxCapacity: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(rooms.map((room) => ({ ...room, currentCount: getPlayerCount(room.id) })));
});

roomsRouter.get("/:id", async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, backgroundUrl: true, maxCapacity: true },
  });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }
  res.json({ ...room, currentCount: getPlayerCount(room.id) });
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

const changeNameSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

roomsRouter.patch("/:id/name", requireAuth, async (req, res) => {
  const parsed = changeNameSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  await prisma.room.update({ where: { id: room.id }, data: { name: parsed.data.name } });
  res.json({ name: parsed.data.name });
});

const changeCapacitySchema = z.object({
  maxCapacity: z.number().int().min(1).max(MAX_ROOM_CAPACITY),
});

roomsRouter.patch("/:id/capacity", requireAuth, async (req, res) => {
  const parsed = changeCapacitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  await prisma.room.update({
    where: { id: room.id },
    data: { maxCapacity: parsed.data.maxCapacity },
  });
  res.json({ maxCapacity: parsed.data.maxCapacity });
});

roomsRouter.post("/:id/background", requireAuth, uploadRoomBackground.single("background"), async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  const backgroundUrl = `/uploads/rooms/${req.file.filename}`;
  await prisma.room.update({ where: { id: room.id }, data: { backgroundUrl } });
  deleteUploadedFile(room.backgroundUrl);

  res.json({ backgroundUrl });
});

roomsRouter.delete("/:id/background", requireAuth, async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  await prisma.room.update({ where: { id: room.id }, data: { backgroundUrl: null } });
  deleteUploadedFile(room.backgroundUrl);

  res.json({ backgroundUrl: null });
});
