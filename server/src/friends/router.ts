import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../auth/requireAuth.js";

export const friendsRouter = Router();

const FRIEND_SELECT = {
  id: true,
  displayName: true,
  character: true,
} as const;

async function areFriends(userId: string, otherId: string): Promise<boolean> {
  const existing = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId, friendId: otherId } },
  });
  return existing !== null;
}

async function makeFriends(userId: string, otherId: string) {
  await prisma.friendship.createMany({
    data: [
      { userId, friendId: otherId },
      { userId: otherId, friendId: userId },
    ],
    skipDuplicates: true,
  });
}

friendsRouter.get("/", requireAuth, async (req, res) => {
  const friendships = await prisma.friendship.findMany({
    where: { userId: req.userId! },
    select: { friend: { select: FRIEND_SELECT } },
    orderBy: { createdAt: "desc" },
  });
  res.json(friendships.map((f) => f.friend));
});

friendsRouter.get("/requests", requireAuth, async (req, res) => {
  const [incoming, outgoing] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { receiverId: req.userId! },
      select: { id: true, createdAt: true, sender: { select: FRIEND_SELECT } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendRequest.findMany({
      where: { senderId: req.userId! },
      select: { id: true, createdAt: true, receiver: { select: FRIEND_SELECT } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  res.json({
    incoming: incoming.map((r) => ({ id: r.id, createdAt: r.createdAt, user: r.sender })),
    outgoing: outgoing.map((r) => ({ id: r.id, createdAt: r.createdAt, user: r.receiver })),
  });
});

const sendRequestSchema = z
  .object({
    receiverId: z.string().min(1).optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => !!data.receiverId || !!data.email, {
    message: "receiverId or email is required",
  });

friendsRouter.post("/requests", requireAuth, async (req, res) => {
  const parsed = sendRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const receiver = await prisma.user.findUnique({
    where: parsed.data.receiverId ? { id: parsed.data.receiverId } : { email: parsed.data.email! },
    select: { id: true },
  });
  if (!receiver) {
    return res.status(404).json({ error: "User not found" });
  }
  if (receiver.id === req.userId) {
    return res.status(400).json({ error: "You can't friend yourself" });
  }

  if (await areFriends(req.userId!, receiver.id)) {
    return res.status(409).json({ error: "Already friends" });
  }

  const reverseRequest = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: receiver.id, receiverId: req.userId! } },
  });
  if (reverseRequest) {
    await prisma.friendRequest.delete({ where: { id: reverseRequest.id } });
    await makeFriends(req.userId!, receiver.id);
    return res.status(201).json({ status: "friends" });
  }

  try {
    await prisma.friendRequest.create({
      data: { senderId: req.userId!, receiverId: receiver.id },
    });
  } catch {
    return res.status(409).json({ error: "Request already sent" });
  }
  res.status(201).json({ status: "pending" });
});

friendsRouter.post("/requests/:id/accept", requireAuth, async (req, res) => {
  const request = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
  if (!request || request.receiverId !== req.userId) {
    return res.status(404).json({ error: "Request not found" });
  }

  await prisma.friendRequest.delete({ where: { id: request.id } });
  await makeFriends(request.senderId, request.receiverId);
  res.json({ status: "friends" });
});

friendsRouter.delete("/requests/:id", requireAuth, async (req, res) => {
  const request = await prisma.friendRequest.findUnique({ where: { id: req.params.id } });
  if (!request || (request.senderId !== req.userId && request.receiverId !== req.userId)) {
    return res.status(404).json({ error: "Request not found" });
  }

  await prisma.friendRequest.delete({ where: { id: request.id } });
  res.json({ ok: true });
});

friendsRouter.delete("/:friendId", requireAuth, async (req, res) => {
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { userId: req.userId!, friendId: req.params.friendId },
        { userId: req.params.friendId, friendId: req.userId! },
      ],
    },
  });
  res.json({ ok: true });
});

friendsRouter.get("/status/:userId", requireAuth, async (req, res) => {
  const otherId = req.params.userId;
  if (otherId === req.userId) {
    return res.json({ status: "self" });
  }

  if (await areFriends(req.userId!, otherId)) {
    return res.json({ status: "friends" });
  }

  const [outgoing, incoming] = await Promise.all([
    prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: req.userId!, receiverId: otherId } },
    }),
    prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: otherId, receiverId: req.userId! } },
    }),
  ]);

  if (outgoing) return res.json({ status: "outgoing", requestId: outgoing.id });
  if (incoming) return res.json({ status: "incoming", requestId: incoming.id });
  res.json({ status: "none" });
});
