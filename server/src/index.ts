import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { authRouter } from "./auth/router.js";
import { usersRouter } from "./users/router.js";
import { statsRouter } from "./stats/router.js";
import { roomsRouter } from "./rooms/router.js";
import { registerSocketHandlers } from "./socket/index.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./socket/types.js";

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/stats", statsRouter);
app.use("/rooms", roomsRouter);

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  { cors: { origin: CLIENT_ORIGIN } },
);

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
