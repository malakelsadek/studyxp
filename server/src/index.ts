import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { authRouter } from "./auth/router.js";
import { usersRouter } from "./users/router.js";
import { statsRouter } from "./stats/router.js";
import { roomsRouter } from "./rooms/router.js";
import { friendsRouter } from "./friends/router.js";
import { registerSocketHandlers } from "./socket/index.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket/types.js";

const PORT = Number(process.env.PORT ?? 4000);
// comma-separated list, e.g. "http://localhost:5173,https://studyxp.vercel.app"
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/uploads", express.static("uploads"));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/stats", statsRouter);
app.use("/rooms", roomsRouter);
app.use("/friends", friendsRouter);

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  { cors: { origin: CLIENT_ORIGINS } },
);

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
