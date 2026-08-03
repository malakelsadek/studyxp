import { randomUUID } from "node:crypto";
import type { Server, Socket } from "socket.io";
import { prisma } from "../prisma.js";
import { verifyToken } from "../auth/jwt.js";
import {
  addChatMessage,
  addTodo,
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

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerSocketHandlers(io: AppServer) {
  io.use(async (socket, next) => {
    const { token, guestName } = socket.handshake.auth as { token?: string; guestName?: string };

    try {
      if (token) {
        const payload = verifyToken(token);
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) return next(new Error("invalid token"));
        socket.data.user = { id: user.id, displayName: user.displayName, isGuest: false };
      } else if (guestName && guestName.trim().length > 0) {
        socket.data.user = {
          id: `guest-${randomUUID()}`,
          displayName: guestName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH),
          isGuest: true,
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
    socket.on("room:join", ({ roomId }) => {
      if (!roomId) return;
      socket.data.roomId = roomId;
      socket.join(roomId);

      const player = { ...socket.data.user, x: 600, y: 400 };
      const snapshot = joinRoom(roomId, socket.id, player);

      socket.emit("room:snapshot", snapshot);
      socket.to(roomId).emit("player:joined", { player });
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
