export interface SessionUser {
  id: string;
  email: string | null;
  displayName: string;
  isGuest: boolean;
  character: string;
  ownedCharacters: string[];
  coins: number;
  nameColor: string | null;
  country: string | null;
}

export interface SelfProfile {
  displayName: string;
  character: string;
  ownedCharacters: string[];
  coins: number;
  nameColor: string | null;
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

export type PlayerDirection = "still" | "up" | "down" | "left" | "right";

export interface PlayerDTO {
  id: string;
  displayName: string;
  isGuest: boolean;
  character: string;
  nameColor: string | null;
  x: number;
  y: number;
  direction: PlayerDirection;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  from: string;
  nameColor: string | null;
  country: string | null;
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
  assigneeId: string | null;
  assigneeName: string | null;
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
  addedBy: string;
}

export interface RoomSnapshot {
  roomId: string;
  selfId: string;
  players: PlayerDTO[];
  timer: TimerState;
  personalTimer: TimerState;
  messages: ChatMessage[];
  todos: TodoItem[];
  personalTodos: Record<string, PersonalTodoItem[]>;
  leaderboard: LeaderboardEntry[];
  timeBlocks: TimeBlock[];
  sharedTimeBlocks: TimeBlock[];
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  name: string;
  backgroundUrl: string | null;
  maxCapacity: number;
  hasPassword: boolean;
  creatorId: string | null;
  allowNameChangeByMembers: boolean;
  allowBackgroundChangeByMembers: boolean;
  disableChatDuringSharedTimer: boolean;
  restrictTimerControlToCreator: boolean;
  selfProfile: SelfProfile | null;
}

export interface ClientToServerEvents {
  "room:join": (payload: { roomId: string; password?: string }) => void;
  "room:leave": () => void;
  "player:move": (payload: { x: number; y: number; direction: PlayerDirection }) => void;
  "chat:send": (payload: { text: string }) => void;
  "chat:typing": (payload: { typing: boolean }) => void;
  "timer:start": (payload: { mode: TimerMode }) => void;
  "timer:pause": () => void;
  "timer:reset": () => void;
  "timer:switchPhase": () => void;
  "timer:configure": (payload: { workDurationMs: number; breakDurationMs: number }) => void;
  "timer:advancePhase": () => void;
  "todo:add": (payload: { text: string; estimatedMinutes: number | null; assigneeId?: string | null }) => void;
  "todo:edit": (payload: { id: string; text: string; estimatedMinutes: number | null }) => void;
  "todo:toggle": (payload: { id: string }) => void;
  "todo:remove": (payload: { id: string }) => void;
  "todo:reorder": (payload: { orderedIds: string[] }) => void;
  "todo:assign": (payload: { id: string; assigneeId: string | null }) => void;
  "personal:add": (payload: { text: string; estimatedMinutes: number | null; private: boolean }) => void;
  "personal:edit": (payload: {
    id: string;
    text: string;
    estimatedMinutes: number | null;
    private: boolean;
  }) => void;
  "personal:toggle": (payload: { id: string }) => void;
  "personal:remove": (payload: { id: string }) => void;
  "personal:reorder": (payload: { orderedIds: string[] }) => void;
  "room:background": (payload: { url: string | null }) => void;
  "room:name": (payload: { name: string }) => void;
  "room:permissions": (payload: {
    allowNameChangeByMembers: boolean;
    allowBackgroundChangeByMembers: boolean;
    disableChatDuringSharedTimer: boolean;
    restrictTimerControlToCreator: boolean;
  }) => void;
  "room:music": (payload: { kind: "youtube" | "spotify"; url: string | null }) => void;
  "study:log": (payload: { durationMs: number }) => void;
  "character:change": (payload: { character: string }) => void;
  "nameColor:change": (payload: { nameColor: string | null }) => void;
  "timeblock:add": (payload: {
    date: string;
    startMinute: number;
    endMinute: number;
    label: string;
    tasks: string[];
  }) => void;
  "timeblock:remove": (payload: { id: string }) => void;
  "sharedTimeblock:add": (payload: {
    date: string;
    startMinute: number;
    endMinute: number;
    label: string;
    tasks: string[];
  }) => void;
  "sharedTimeblock:remove": (payload: { id: string }) => void;
  "personalTimer:start": (payload: { mode: TimerMode }) => void;
  "personalTimer:pause": () => void;
  "personalTimer:reset": () => void;
  "personalTimer:switchPhase": () => void;
  "personalTimer:configure": (payload: { workDurationMs: number; breakDurationMs: number }) => void;
  "personalTimer:advancePhase": () => void;
}

export interface ServerToClientEvents {
  "room:snapshot": (payload: RoomSnapshot) => void;
  "player:joined": (payload: { player: PlayerDTO }) => void;
  "player:left": (payload: { id: string }) => void;
  "player:moved": (payload: { id: string; x: number; y: number; direction: PlayerDirection }) => void;
  "chat:message": (payload: ChatMessage) => void;
  "player:typing": (payload: { id: string; typing: boolean }) => void;
  "timer:update": (payload: TimerState) => void;
  "todo:update": (payload: { todos: TodoItem[] }) => void;
  "personal:update": (payload: { ownerId: string; todos: PersonalTodoItem[] }) => void;
  "room:background": (payload: { url: string | null }) => void;
  "room:name": (payload: { name: string }) => void;
  "room:permissions": (payload: {
    allowNameChangeByMembers: boolean;
    allowBackgroundChangeByMembers: boolean;
    disableChatDuringSharedTimer: boolean;
    restrictTimerControlToCreator: boolean;
  }) => void;
  "room:music": (payload: { kind: "youtube" | "spotify"; url: string | null }) => void;
  "leaderboard:update": (payload: { leaderboard: LeaderboardEntry[] }) => void;
  "player:character": (payload: { id: string; character: string }) => void;
  "player:nameColor": (payload: { id: string; nameColor: string | null }) => void;
  "timeblock:update": (payload: { timeBlocks: TimeBlock[] }) => void;
  "sharedTimeblock:update": (payload: { sharedTimeBlocks: TimeBlock[] }) => void;
  "personalTimer:update": (payload: TimerState) => void;
  "room:error": (payload: { message: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: SessionUser;
  roomId: string | null;
}
