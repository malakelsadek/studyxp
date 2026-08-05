import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Server, Socket } from "socket.io";
import { prisma } from "../prisma.js";
import { verifyToken } from "../auth/jwt.js";
import {
  addChatMessage,
  addPersonalTodo,
  addTodo,
  changeCharacter,
  configureTimer,
  getPlayerCount,
  joinRoom,
  leaveRoom,
  logStudyTime,
  movePlayer,
  pauseTimer,
  removePersonalTodo,
  removeTodo,
  reorderPersonalTodos,
  reorderTodos,
  resetTimer,
  startTimer,
  switchTimerPhase,
  toggleTodo,
  togglePersonalTodo,
} from "./rooms.js";
import { FREE_CHARACTER_IDS } from "../users/characters.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  PersonalTodoItem,
  ServerToClientEvents,
  SocketData,
} from "./types.js";

const MAX_DISPLAY_NAME_LENGTH = 24;
const MAX_CHAT_LENGTH = 500;
const MAX_TODO_LENGTH = 200;
const DEFAULT_CHARACTER = "char-1";
const CHARACTER_PATTERN = /^char-[a-z0-9-]+$/;
const MIN_TIMER_MS = 60 * 1000;
const MAX_TIMER_MS = 180 * 60 * 1000;
const MAX_ESTIMATE_MINUTES = 24 * 60;
const MAX_STUDY_LOG_MS = 6 * 60 * 60 * 1000;

function sanitizeCharacter(character: unknown): string {
  return typeof character === "string" && CHARACTER_PATTERN.test(character) ? character : DEFAULT_CHARACTER;
}

function sanitizeOwnedCharacter(character: unknown, owned: string[]): string {
  const sanitized = sanitizeCharacter(character);
  return owned.includes(sanitized) ? sanitized : DEFAULT_CHARACTER;
}

function clampMs(value: unknown, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(MAX_TIMER_MS, Math.max(MIN_TIMER_MS, n));
}

function sanitizeEstimate(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return Math.min(MAX_ESTIMATE_MINUTES, Math.round(value));
}

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerSocketHandlers(io: AppServer) {
  function broadcastPersonalUpdate(roomId: string, ownerId: string, fullItems: PersonalTodoItem[]) {
    const socketIds = io.sockets.adapter.rooms.get(roomId);
    if (!socketIds) return;
    const filtered = fullItems.filter((t) => !t.private);
    for (const socketId of socketIds) {
      const target = io.sockets.sockets.get(socketId) as AppSocket | undefined;
      if (!target) continue;
      const isOwner = target.data.user.id === ownerId;
      target.emit("personal:update", { ownerId, todos: isOwner ? fullItems : filtered });
    }
  }

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
          character: sanitizeOwnedCharacter(user.character, user.ownedCharacters),
          ownedCharacters: user.ownedCharacters,
        };
      } else if (guestName && guestName.trim().length > 0) {
        socket.data.user = {
          id: `guest-${randomUUID()}`,
          displayName: guestName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH),
          isGuest: true,
          character: sanitizeOwnedCharacter(character, FREE_CHARACTER_IDS),
          ownedCharacters: FREE_CHARACTER_IDS,
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

    socket.on("character:change", ({ character }) => {
      const sanitized = sanitizeCharacter(character);
      if (!socket.data.user.ownedCharacters.includes(sanitized)) return;
      socket.data.user.character = sanitized;

      const roomId = socket.data.roomId;
      if (!roomId) return;
      const player = changeCharacter(roomId, socket.id, sanitized);
      if (player) io.to(roomId).emit("player:character", { id: player.id, character: sanitized });
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

    socket.on("timer:switchPhase", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const timer = switchTimerPhase(roomId);
      if (timer) io.to(roomId).emit("timer:update", timer);
    });

    socket.on("timer:configure", ({ workDurationMs, breakDurationMs }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const timer = configureTimer(roomId, clampMs(workDurationMs, 25 * 60 * 1000), clampMs(breakDurationMs, 5 * 60 * 1000));
      if (timer) io.to(roomId).emit("timer:update", timer);
    });

    socket.on("todo:add", ({ text, estimatedMinutes }) => {
      const roomId = socket.data.roomId;
      if (!roomId || !text?.trim()) return;
      const todos = addTodo(
        roomId,
        text.trim().slice(0, MAX_TODO_LENGTH),
        socket.data.user.displayName,
        sanitizeEstimate(estimatedMinutes),
      );
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

    socket.on("todo:reorder", ({ orderedIds }) => {
      const roomId = socket.data.roomId;
      if (!roomId || !Array.isArray(orderedIds)) return;
      const todos = reorderTodos(roomId, orderedIds);
      if (todos) io.to(roomId).emit("todo:update", { todos });
    });

    socket.on("personal:add", ({ text, estimatedMinutes, private: isPrivate }) => {
      const roomId = socket.data.roomId;
      if (!roomId || !text?.trim()) return;
      const items = addPersonalTodo(
        roomId,
        socket.data.user.id,
        text.trim().slice(0, MAX_TODO_LENGTH),
        sanitizeEstimate(estimatedMinutes),
        Boolean(isPrivate),
      );
      if (items) broadcastPersonalUpdate(roomId, socket.data.user.id, items);
    });

    socket.on("personal:toggle", ({ id }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const items = togglePersonalTodo(roomId, socket.data.user.id, id);
      if (items) broadcastPersonalUpdate(roomId, socket.data.user.id, items);
    });

    socket.on("personal:remove", ({ id }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const items = removePersonalTodo(roomId, socket.data.user.id, id);
      if (items) broadcastPersonalUpdate(roomId, socket.data.user.id, items);
    });

    socket.on("personal:reorder", ({ orderedIds }) => {
      const roomId = socket.data.roomId;
      if (!roomId || !Array.isArray(orderedIds)) return;
      const items = reorderPersonalTodos(roomId, socket.data.user.id, orderedIds);
      if (items) broadcastPersonalUpdate(roomId, socket.data.user.id, items);
    });

    socket.on("study:log", ({ durationMs }) => {
      const roomId = socket.data.roomId;
      if (!roomId || typeof durationMs !== "number" || !Number.isFinite(durationMs) || durationMs <= 0) return;
      const leaderboard = logStudyTime(
        roomId,
        socket.data.user.id,
        socket.data.user.displayName,
        Math.min(durationMs, MAX_STUDY_LOG_MS),
      );
      if (leaderboard) io.to(roomId).emit("leaderboard:update", { leaderboard });
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const player = leaveRoom(roomId, socket.id);
      if (player) socket.to(roomId).emit("player:left", { id: player.id });
    });
  });
}
