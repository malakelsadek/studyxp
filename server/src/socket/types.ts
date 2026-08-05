export interface SessionUser {
  id: string;
  displayName: string;
  isGuest: boolean;
  character: string;
  ownedCharacters: string[];
}

export type TimerMode = "pomodoro" | "stopwatch";
export type TimerPhase = "work" | "break";
export type TimerStatus = "idle" | "running" | "paused";

export interface TimerState {
  mode: TimerMode;
  phase: TimerPhase;
  status: TimerStatus;
  workDurationMs: number;
  breakDurationMs: number;
  elapsedMsAtStart: number;
  startedAt: number | null;
}

export interface PlayerDTO {
  id: string;
  displayName: string;
  isGuest: boolean;
  character: string;
  x: number;
  y: number;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  from: string;
  text: string;
  at: number;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  addedBy: string;
  estimatedMinutes: number | null;
  order: number;
}

export interface PersonalTodoItem extends TodoItem {
  private: boolean;
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  studyMs: number;
  tasksCompleted: number;
}

export interface TimeBlock {
  id: string;
  date: string;
  startMinute: number;
  endMinute: number;
  label: string;
  tasks: string[];
}

export interface RoomSnapshot {
  roomId: string;
  selfId: string;
  players: PlayerDTO[];
  timer: TimerState;
  messages: ChatMessage[];
  todos: TodoItem[];
  personalTodos: Record<string, PersonalTodoItem[]>;
  leaderboard: LeaderboardEntry[];
  timeBlocks: TimeBlock[];
  musicUrl: string | null;
  name: string;
  backgroundUrl: string | null;
  maxCapacity: number;
}

export interface ClientToServerEvents {
  "room:join": (payload: { roomId: string; password?: string }) => void;
  "player:move": (payload: { x: number; y: number }) => void;
  "chat:send": (payload: { text: string }) => void;
  "timer:start": (payload: { mode: TimerMode }) => void;
  "timer:pause": () => void;
  "timer:reset": () => void;
  "timer:switchPhase": () => void;
  "timer:configure": (payload: { workDurationMs: number; breakDurationMs: number }) => void;
  "todo:add": (payload: { text: string; estimatedMinutes: number | null }) => void;
  "todo:toggle": (payload: { id: string }) => void;
  "todo:remove": (payload: { id: string }) => void;
  "todo:reorder": (payload: { orderedIds: string[] }) => void;
  "personal:add": (payload: { text: string; estimatedMinutes: number | null; private: boolean }) => void;
  "personal:toggle": (payload: { id: string }) => void;
  "personal:remove": (payload: { id: string }) => void;
  "personal:reorder": (payload: { orderedIds: string[] }) => void;
  "room:background": (payload: { url: string | null }) => void;
  "room:name": (payload: { name: string }) => void;
  "room:music": (payload: { url: string | null }) => void;
  "study:log": (payload: { durationMs: number }) => void;
  "character:change": (payload: { character: string }) => void;
  "timeblock:add": (payload: {
    date: string;
    startMinute: number;
    endMinute: number;
    label: string;
    tasks: string[];
  }) => void;
  "timeblock:remove": (payload: { id: string }) => void;
}

export interface ServerToClientEvents {
  "room:snapshot": (payload: RoomSnapshot) => void;
  "player:joined": (payload: { player: PlayerDTO }) => void;
  "player:left": (payload: { id: string }) => void;
  "player:moved": (payload: { id: string; x: number; y: number }) => void;
  "chat:message": (payload: ChatMessage) => void;
  "timer:update": (payload: TimerState) => void;
  "todo:update": (payload: { todos: TodoItem[] }) => void;
  "personal:update": (payload: { ownerId: string; todos: PersonalTodoItem[] }) => void;
  "room:background": (payload: { url: string | null }) => void;
  "room:name": (payload: { name: string }) => void;
  "room:music": (payload: { url: string | null }) => void;
  "leaderboard:update": (payload: { leaderboard: LeaderboardEntry[] }) => void;
  "player:character": (payload: { id: string; character: string }) => void;
  "timeblock:update": (payload: { timeBlocks: TimeBlock[] }) => void;
  "room:error": (payload: { message: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: SessionUser;
  roomId: string | null;
}
