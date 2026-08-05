import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/requireAuth.js";

export const statsRouter = Router();

const MAX_SESSION_DURATION_MS = 6 * 60 * 60 * 1000;
const COIN_INTERVAL_MS = 15 * 60 * 1000;

const logSessionSchema = z.object({
  durationMs: z.number().int().positive().max(MAX_SESSION_DURATION_MS),
  mode: z.enum(["pomodoro", "stopwatch"]),
  roomId: z.string().min(1).max(100),
});

statsRouter.post("/sessions", requireAuth, async (req, res) => {
  const parsed = logSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { session, coins } = await prisma.$transaction(async (tx) => {
    const session = await tx.studySession.create({
      data: { userId: req.userId!, ...parsed.data },
    });

    const current = await tx.user.findUniqueOrThrow({
      where: { id: req.userId! },
      select: { studyMsBanked: true },
    });
    const bankedMs = current.studyMsBanked + parsed.data.durationMs;
    const earnedCoins = Math.floor(bankedMs / COIN_INTERVAL_MS);
    const remainderMs = bankedMs % COIN_INTERVAL_MS;

    const user = await tx.user.update({
      where: { id: req.userId! },
      data: { studyMsBanked: remainderMs, coins: { increment: earnedCoins } },
      select: { coins: true },
    });

    return { session, coins: user.coins };
  });

  res.status(201).json({ session, coins });
});
