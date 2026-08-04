export type TimerMode = "pomodoro" | "stopwatch";
export type TimerStatus = "idle" | "running" | "paused";

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  durationMs: number;
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
}

export interface RoomSnapshot {
  roomId: string;
  selfId: string;
  players: PlayerDTO[];
  timer: TimerState;
  messages: ChatMessage[];
  todos: TodoItem[];
}

export interface ClientToServerEvents {
  "room:join": (payload: { roomId: string; password?: string }) => void;
  "player:move": (payload: { x: number; y: number }) => void;
  "chat:send": (payload: { text: string }) => void;
  "timer:start": (payload: { mode: TimerMode }) => void;
  "timer:pause": () => void;
  "timer:reset": () => void;
  "todo:add": (payload: { text: string }) => void;
  "todo:toggle": (payload: { id: string }) => void;
  "todo:remove": (payload: { id: string }) => void;
}

export interface ServerToClientEvents {
  "room:snapshot": (payload: RoomSnapshot) => void;
  "player:joined": (payload: { player: PlayerDTO }) => void;
  "player:left": (payload: { id: string }) => void;
  "player:moved": (payload: { id: string; x: number; y: number }) => void;
  "chat:message": (payload: ChatMessage) => void;
  "timer:update": (payload: TimerState) => void;
  "todo:update": (payload: { todos: TodoItem[] }) => void;
  "room:error": (payload: { message: string }) => void;
}
