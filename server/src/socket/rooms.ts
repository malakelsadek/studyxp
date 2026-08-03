import type { ChatMessage, PlayerDTO, RoomSnapshot, TimerMode, TimerState, TodoItem } from "./types.js";

const POMODORO_DURATION_MS = 25 * 60 * 1000;
const MAX_CHAT_HISTORY = 50;
const MAX_TODO_TEXT_LENGTH = 200;

interface Player extends PlayerDTO {
  socketId: string;
}

interface RoomState {
  players: Map<string, Player>;
  timer: TimerState;
  messages: ChatMessage[];
  todos: TodoItem[];
}

const rooms = new Map<string, RoomState>();

function defaultTimer(mode: TimerMode = "pomodoro"): TimerState {
  return {
    mode,
    status: "idle",
    durationMs: mode === "pomodoro" ? POMODORO_DURATION_MS : 0,
    elapsedMsAtStart: 0,
    startedAt: null,
  };
}

function getOrCreateRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = { players: new Map(), timer: defaultTimer(), messages: [], todos: [] };
    rooms.set(roomId, room);
  }
  return room;
}

function toSnapshot(roomId: string, room: RoomState, selfId: string): RoomSnapshot {
  return {
    roomId,
    selfId,
    players: Array.from(room.players.values()).map(({ socketId: _socketId, ...player }) => player),
    timer: room.timer,
    messages: room.messages,
    todos: room.todos,
  };
}

export function joinRoom(roomId: string, socketId: string, player: PlayerDTO): RoomSnapshot {
  const room = getOrCreateRoom(roomId);
  room.players.set(socketId, { ...player, socketId });
  return toSnapshot(roomId, room, player.id);
}

export function leaveRoom(roomId: string, socketId: string): PlayerDTO | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const player = room.players.get(socketId);
  if (!player) return null;
  room.players.delete(socketId);
  if (room.players.size === 0) {
    rooms.delete(roomId);
  }
  const { socketId: _socketId, ...dto } = player;
  return dto;
}

export function movePlayer(roomId: string, socketId: string, x: number, y: number): PlayerDTO | null {
  const room = rooms.get(roomId);
  const player = room?.players.get(socketId);
  if (!room || !player) return null;
  player.x = x;
  player.y = y;
  return player;
}

export function addChatMessage(roomId: string, fromId: string, from: string, text: string): ChatMessage | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const message: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fromId,
    from,
    text,
    at: Date.now(),
  };
  room.messages.push(message);
  if (room.messages.length > MAX_CHAT_HISTORY) {
    room.messages.shift();
  }
  return message;
}

function computeElapsed(timer: TimerState): number {
  if (timer.status === "running" && timer.startedAt !== null) {
    return timer.elapsedMsAtStart + (Date.now() - timer.startedAt);
  }
  return timer.elapsedMsAtStart;
}

export function startTimer(roomId: string, mode: TimerMode): TimerState | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.timer.mode !== mode || room.timer.status === "idle") {
    room.timer = defaultTimer(mode);
  }
  room.timer.status = "running";
  room.timer.startedAt = Date.now();
  return room.timer;
}

export function pauseTimer(roomId: string): TimerState | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.timer.elapsedMsAtStart = computeElapsed(room.timer);
  room.timer.status = "paused";
  room.timer.startedAt = null;
  return room.timer;
}

export function resetTimer(roomId: string): TimerState | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.timer = defaultTimer(room.timer.mode);
  return room.timer;
}

export function addTodo(roomId: string, text: string, addedBy: string): TodoItem[] | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.todos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: text.slice(0, MAX_TODO_TEXT_LENGTH),
    done: false,
    addedBy,
  });
  return room.todos;
}

export function toggleTodo(roomId: string, todoId: string): TodoItem[] | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const todo = room.todos.find((t) => t.id === todoId);
  if (!todo) return null;
  todo.done = !todo.done;
  return room.todos;
}

export function removeTodo(roomId: string, todoId: string): TodoItem[] | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.todos = room.todos.filter((t) => t.id !== todoId);
  return room.todos;
}
