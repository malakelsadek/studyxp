import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Server, Socket } from "socket.io";
import { prisma } from "../prisma.js";
import { verifyToken } from "../auth/jwt.js";
import {
  addChatMessage,
  addTodo,
  getPlayerCount,
  joinRoom,
  leaveRoom,
  movePlayer,
  pauseTimer,
  removeTodo,
  resetTimer,
  startTimer,
  toggleTodo,
} from "./rooms.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types.js";

const MAX_DISPLAY_NAME_LENGTH = 24;
const MAX_CHAT_LENGTH = 500;
const MAX_TODO_LENGTH = 200;
const DEFAULT_CHARACTER = "char-1";
const CHARACTER_PATTERN = /^char-[a-z0-9-]+$/;

function sanitizeCharacter(character: unknown): string {
  return typeof character === "string" && CHARACTER_PATTERN.test(character) ? character : DEFAULT_CHARACTER;
}

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerSocketHandlers(io: AppServer) {
  io.use(async (socket, next) => {
    const { token, guestName, character } = socket.handshake.auth as {
      token?: string;
      guestName?: string;
      character?: string;
    };

    try {
      if (token) {
        const payload = verifyToken(token);
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) return next(new Error("invalid token"));
        socket.data.user = {
          id: user.id,
          displayName: user.displayName,
          isGuest: false,
          character: sanitizeCharacter(user.character),
        };
      } else if (guestName && guestName.trim().length > 0) {
        socket.data.user = {
          id: `guest-${randomUUID()}`,
          displayName: guestName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH),
          isGuest: true,
          character: sanitizeCharacter(character),
        };
      } else {
        return next(new Error("authentication required"));
      }
      socket.data.roomId = null;
      next();
    } catch {
      next(new Error("invalid token"));
    }
  });

  io.on("connection", (socket: AppSocket) => {
    socket.on("room:join", async ({ roomId, password }) => {
      if (!roomId) return;

      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) {
        return socket.emit("room:error", { message: "Room not found" });
      }

      const validPassword = typeof password === "string" && (await bcrypt.compare(password, room.passwordHash));
      if (!validPassword) {
        return socket.emit("room:error", { message: "Incorrect room password" });
      }

      const alreadyJoined = socket.data.roomId === roomId;
      if (!alreadyJoined && getPlayerCount(roomId) >= room.maxCapacity) {
        return socket.emit("room:error", { message: "Room is full" });
      }

      socket.data.roomId = roomId;
      socket.join(roomId);

      const player = { ...socket.data.user, x: 768, y: 512 };
      const snapshot = joinRoom(roomId, socket.id, player, {
        name: room.name,
        backgroundUrl: room.backgroundUrl,
        maxCapacity: room.maxCapacity,
      });

      socket.emit("room:snapshot", snapshot);
      socket.to(roomId).emit("player:joined", { player });
    });

    socket.on("room:background", ({ url }) => {
      const roomId = socket.data.roomId;
      if (!roomId || socket.data.user.isGuest) return;
      if (url !== null && !url.startsWith("/uploads/rooms/")) return;
      io.to(roomId).emit("room:background", { url });
    });

    socket.on("room:name", ({ name }) => {
      const roomId = socket.data.roomId;
      if (!roomId || socket.data.user.isGuest) return;
      const trimmed = name?.trim().slice(0, 50);
      if (!trimmed) return;
      io.to(roomId).emit("room:name", { name: trimmed });
    });

    socket.on("player:move", ({ x, y }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const player = movePlayer(roomId, socket.id, x, y);
      if (!player) return;
      socket.to(roomId).emit("player:moved", { id: player.id, x, y });
    });

    socket.on("chat:send", ({ text }) => {
      const roomId = socket.data.roomId;
      if (!roomId || !text?.trim()) return;
      const message = addChatMessage(
        roomId,
        socket.data.user.id,
        socket.data.user.displayName,
        text.trim().slice(0, MAX_CHAT_LENGTH),
      );
      if (message) io.to(roomId).emit("chat:message", message);
    });

    socket.on("timer:start", ({ mode }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const timer = startTimer(roomId, mode);
      if (timer) io.to(roomId).emit("timer:update", timer);
    });

    socket.on("timer:pause", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const timer = pauseTimer(roomId);
      if (timer) io.to(roomId).emit("timer:update", timer);
    });

    socket.on("timer:reset", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const timer = resetTimer(roomId);
      if (timer) io.to(roomId).emit("timer:update", timer);
    });

    socket.on("todo:add", ({ text }) => {
      const roomId = socket.data.roomId;
      if (!roomId || !text?.trim()) return;
      const todos = addTodo(roomId, text.trim().slice(0, MAX_TODO_LENGTH), socket.data.user.displayName);
      if (todos) io.to(roomId).emit("todo:update", { todos });
    });

    socket.on("todo:toggle", ({ id }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const todos = toggleTodo(roomId, id);
      if (todos) io.to(roomId).emit("todo:update", { todos });
    });

    socket.on("todo:remove", ({ id }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const todos = removeTodo(roomId, id);
      if (todos) io.to(roomId).emit("todo:update", { todos });
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const player = leaveRoom(roomId, socket.id);
      if (player) socket.to(roomId).emit("player:left", { id: player.id });
    });
  });
}
