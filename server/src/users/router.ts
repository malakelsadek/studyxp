import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/requireAuth.js";
import { getUserStats } from "./stats.js";

export const usersRouter = Router();

usersRouter.get("/:id/profile", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, displayName: true, bio: true, interests: true, character: true, createdAt: true },
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

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: parsed.data,
    select: { id: true, displayName: true, bio: true, interests: true, character: true, createdAt: true },
  });
  res.json(user);
});
