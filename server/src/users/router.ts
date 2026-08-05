import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/requireAuth.js";
import { getUserStats } from "./stats.js";
import { getCharacterPrice, isKnownCharacter } from "./characters.js";

export const usersRouter = Router();

const PROFILE_SELECT = {
  id: true,
  displayName: true,
  bio: true,
  interests: true,
  character: true,
  ownedCharacters: true,
  coins: true,
  tasksCompleted: true,
  createdAt: true,
} as const;

usersRouter.get("/:id/profile", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: PROFILE_SELECT,
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const stats = await getUserStats(user.id);
  res.json({ ...user, stats });
});

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(24).optional(),
  bio: z.string().max(300).optional(),
  interests: z.array(z.string().min(1).max(30)).max(10).optional(),
  character: z
    .string()
    .regex(/^char-[a-z0-9-]+$/)
    .max(20)
    .optional(),
});

usersRouter.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  if (parsed.data.character) {
    const current = await prisma.user.findUniqueOrThrow({
      where: { id: req.userId! },
      select: { ownedCharacters: true },
    });
    if (!current.ownedCharacters.includes(parsed.data.character)) {
      return res.status(403).json({ error: "Outfit not owned" });
    }
  }

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: parsed.data,
    select: PROFILE_SELECT,
  });
  res.json(user);
});

const purchaseCharacterSchema = z.object({
  characterId: z
    .string()
    .regex(/^char-[a-z0-9-]+$/)
    .max(20),
});

usersRouter.post("/me/purchase-character", requireAuth, async (req, res) => {
  const parsed = purchaseCharacterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { characterId } = parsed.data;
  if (!isKnownCharacter(characterId)) {
    return res.status(400).json({ error: "Unknown outfit" });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.userId! },
    select: { ownedCharacters: true, coins: true },
  });

  if (user.ownedCharacters.includes(characterId)) {
    return res.status(409).json({ error: "Outfit already owned" });
  }

  const price = getCharacterPrice(characterId);
  if (user.coins < price) {
    return res.status(402).json({ error: "Not enough coins" });
  }

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      coins: { decrement: price },
      ownedCharacters: { push: characterId },
    },
    select: { ownedCharacters: true, coins: true },
  });
  res.json(updated);
});
