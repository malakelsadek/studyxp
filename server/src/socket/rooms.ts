import type {
  ChatMessage,
  PersonalTodoItem,
  PlayerDTO,
  RoomSnapshot,
  TimerMode,
  TimerState,
  TodoItem,
} from "./types.js";

const DEFAULT_WORK_MS = 25 * 60 * 1000;
const DEFAULT_BREAK_MS = 5 * 60 * 1000;
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
  personalTodos: Map<string, PersonalTodoItem[]>;
}

const rooms = new Map<string, RoomState>();

function defaultTimer(
  mode: TimerMode = "pomodoro",
  workDurationMs = DEFAULT_WORK_MS,
  breakDurationMs = DEFAULT_BREAK_MS,
): TimerState {
  return {
    mode,
    phase: "work",
    status: "idle",
    workDurationMs,
    breakDurationMs,
    elapsedMsAtStart: 0,
    startedAt: null,
  };
}

function getOrCreateRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = { players: new Map(), timer: defaultTimer(), messages: [], todos: [], personalTodos: new Map() };
    rooms.set(roomId, room);
  }
  return room;
}

export interface RoomDbMeta {
  name: string;
  backgroundUrl: string | null;
  maxCapacity: number;
}

function visiblePersonalTodos(room: RoomState, viewerId: string): Record<string, PersonalTodoItem[]> {
  const result: Record<string, PersonalTodoItem[]> = {};
  for (const [ownerId, items] of room.personalTodos) {
    result[ownerId] = ownerId === viewerId ? items : items.filter((t) => !t.private);
  }
  return result;
}

function toSnapshot(roomId: string, room: RoomState, selfId: string, dbMeta: RoomDbMeta): RoomSnapshot {
  return {
    roomId,
    selfId,
    players: Array.from(room.players.values()).map(({ socketId: _socketId, ...player }) => player),
    timer: room.timer,
    messages: room.messages,
    todos: room.todos,
    personalTodos: visiblePersonalTodos(room, selfId),
    name: dbMeta.name,
    backgroundUrl: dbMeta.backgroundUrl,
    maxCapacity: dbMeta.maxCapacity,
  };
}

export function joinRoom(roomId: string, socketId: string, player: PlayerDTO, dbMeta: RoomDbMeta): RoomSnapshot {
  const room = getOrCreateRoom(roomId);
  room.players.set(socketId, { ...player, socketId });
  return toSnapshot(roomId, room, player.id, dbMeta);
}

export function getPlayerCount(roomId: string): number {
  return rooms.get(roomId)?.players.size ?? 0;
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
    room.timer = defaultTimer(mode, room.timer.workDurationMs, room.timer.breakDurationMs);
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
  room.timer = defaultTimer(room.timer.mode, room.timer.workDurationMs, room.timer.breakDurationMs);
  return room.timer;
}

export function switchTimerPhase(roomId: string): TimerState | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const nextPhase = room.timer.phase === "work" ? "break" : "work";
  room.timer = defaultTimer(room.timer.mode, room.timer.workDurationMs, room.timer.breakDurationMs);
  room.timer.phase = nextPhase;
  return room.timer;
}

export function configureTimer(roomId: string, workDurationMs: number, breakDurationMs: number): TimerState | null {
  const room = rooms.get(roomId);
  if (!room || room.timer.status === "running") return null;
  room.timer.workDurationMs = workDurationMs;
  room.timer.breakDurationMs = breakDurationMs;
  room.timer.elapsedMsAtStart = 0;
  return room.timer;
}

function nextOrder(items: { order: number }[]): number {
  return items.length === 0 ? 0 : Math.max(...items.map((i) => i.order)) + 1;
}

export function addTodo(
  roomId: string,
  text: string,
  addedBy: string,
  estimatedMinutes: number | null,
): TodoItem[] | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.todos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: text.slice(0, MAX_TODO_TEXT_LENGTH),
    done: false,
    addedBy,
    estimatedMinutes,
    order: nextOrder(room.todos),
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

export function reorderTodos(roomId: string, orderedIds: string[]): TodoItem[] | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const orderIndex = new Map(orderedIds.map((id, i) => [id, i]));
  for (const todo of room.todos) {
    const idx = orderIndex.get(todo.id);
    if (idx !== undefined) todo.order = idx;
  }
  room.todos.sort((a, b) => a.order - b.order);
  return room.todos;
}

export function addPersonalTodo(
  roomId: string,
  ownerId: string,
  text: string,
  estimatedMinutes: number | null,
  isPrivate: boolean,
): PersonalTodoItem[] | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const items = room.personalTodos.get(ownerId) ?? [];
  items.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: text.slice(0, MAX_TODO_TEXT_LENGTH),
    done: false,
    addedBy: ownerId,
    estimatedMinutes,
    order: nextOrder(items),
    private: isPrivate,
  });
  room.personalTodos.set(ownerId, items);
  return items;
}

export function togglePersonalTodo(roomId: string, ownerId: string, todoId: string): PersonalTodoItem[] | null {
  const room = rooms.get(roomId);
  const items = room?.personalTodos.get(ownerId);
  if (!room || !items) return null;
  const todo = items.find((t) => t.id === todoId);
  if (!todo) return null;
  todo.done = !todo.done;
  return items;
}

export function removePersonalTodo(roomId: string, ownerId: string, todoId: string): PersonalTodoItem[] | null {
  const room = rooms.get(roomId);
  const items = room?.personalTodos.get(ownerId);
  if (!room || !items) return null;
  const next = items.filter((t) => t.id !== todoId);
  room.personalTodos.set(ownerId, next);
  return next;
}

export function reorderPersonalTodos(roomId: string, ownerId: string, orderedIds: string[]): PersonalTodoItem[] | null {
  const room = rooms.get(roomId);
  const items = room?.personalTodos.get(ownerId);
  if (!room || !items) return null;
  const orderIndex = new Map(orderedIds.map((id, i) => [id, i]));
  for (const todo of items) {
    const idx = orderIndex.get(todo.id);
    if (idx !== undefined) todo.order = idx;
  }
  items.sort((a, b) => a.order - b.order);
  return items;
}

export function getVisiblePersonalTodos(roomId: string, ownerId: string, viewerId: string): PersonalTodoItem[] | null {
  const room = rooms.get(roomId);
  const items = room?.personalTodos.get(ownerId);
  if (!room || !items) return null;
  return ownerId === viewerId ? items : items.filter((t) => !t.private);
}
