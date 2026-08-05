import { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../socket/SocketProvider";
import type {
  ChatMessage,
  LeaderboardEntry,
  PersonalTodoItem,
  PlayerDTO,
  TimerMode,
  TimerState,
  TodoItem,
} from "../socket/types";
import { defaultTimer } from "./timerMath";
import { resolveAssetUrl } from "../lib/api";

export function useRoomState(roomId: string) {
  const { socket, connected } = useSocketContext();
  const [selfId, setSelfId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Record<string, PlayerDTO>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [timer, setTimer] = useState<TimerState>(defaultTimer());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [personalTodos, setPersonalTodos] = useState<Record<string, PersonalTodoItem[]>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [name, setName] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [maxCapacity, setMaxCapacity] = useState(20);
  const [joinError, setJoinError] = useState<string | null>(null);
  const joinedRoomId = useRef<string | null>(null);

  useEffect(() => {
    if (!socket || !connected) return;

    if (joinedRoomId.current !== roomId) {
      const password = sessionStorage.getItem(`studyxp.roomPassword.${roomId}`) ?? undefined;
      socket.emit("room:join", { roomId, password });
      joinedRoomId.current = roomId;
    }

    const onSnapshot = (snapshot: {
      selfId: string;
      players: PlayerDTO[];
      messages: ChatMessage[];
      timer: TimerState;
      todos: TodoItem[];
      personalTodos: Record<string, PersonalTodoItem[]>;
      leaderboard: LeaderboardEntry[];
      name: string;
      backgroundUrl: string | null;
      maxCapacity: number;
    }) => {
      setSelfId(snapshot.selfId);
      setPlayers(Object.fromEntries(snapshot.players.map((p) => [p.id, p])));
      setMessages(snapshot.messages);
      setTimer(snapshot.timer);
      setTodos(snapshot.todos);
      setPersonalTodos(snapshot.personalTodos);
      setLeaderboard(snapshot.leaderboard);
      setName(snapshot.name);
      setBackgroundUrl(snapshot.backgroundUrl ? resolveAssetUrl(snapshot.backgroundUrl) : null);
      setMaxCapacity(snapshot.maxCapacity);
    };

    const onPlayerJoined = ({ player }: { player: PlayerDTO }) => {
      setPlayers((prev) => ({ ...prev, [player.id]: player }));
    };

    const onPlayerLeft = ({ id }: { id: string }) => {
      setPlayers((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    };

    const onPlayerMoved = ({ id, x, y }: { id: string; x: number; y: number }) => {
      setPlayers((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], x, y } } : prev));
    };

    const onChatMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-49), message]);
    };

    const onTimerUpdate = (next: TimerState) => setTimer(next);
    const onTodoUpdate = ({ todos: next }: { todos: TodoItem[] }) => setTodos(next);
    const onPersonalUpdate = ({ ownerId, todos: next }: { ownerId: string; todos: PersonalTodoItem[] }) => {
      setPersonalTodos((prev) => ({ ...prev, [ownerId]: next }));
    };
    const onBackgroundUpdate = ({ url }: { url: string | null }) => {
      setBackgroundUrl(url ? resolveAssetUrl(url) : null);
    };
    const onNameUpdate = ({ name: next }: { name: string }) => setName(next);
    const onLeaderboardUpdate = ({ leaderboard: next }: { leaderboard: LeaderboardEntry[] }) =>
      setLeaderboard(next);
    const onPlayerCharacter = ({ id, character }: { id: string; character: string }) => {
      setPlayers((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], character } } : prev));
    };
    const onRoomError = ({ message }: { message: string }) => {
      joinedRoomId.current = null;
      setJoinError(message);
    };

    socket.on("room:snapshot", onSnapshot);
    socket.on("player:joined", onPlayerJoined);
    socket.on("player:left", onPlayerLeft);
    socket.on("player:moved", onPlayerMoved);
    socket.on("chat:message", onChatMessage);
    socket.on("timer:update", onTimerUpdate);
    socket.on("todo:update", onTodoUpdate);
    socket.on("personal:update", onPersonalUpdate);
    socket.on("room:background", onBackgroundUpdate);
    socket.on("room:name", onNameUpdate);
    socket.on("leaderboard:update", onLeaderboardUpdate);
    socket.on("player:character", onPlayerCharacter);
    socket.on("room:error", onRoomError);

    return () => {
      socket.off("room:snapshot", onSnapshot);
      socket.off("player:joined", onPlayerJoined);
      socket.off("player:left", onPlayerLeft);
      socket.off("player:moved", onPlayerMoved);
      socket.off("chat:message", onChatMessage);
      socket.off("timer:update", onTimerUpdate);
      socket.off("todo:update", onTodoUpdate);
      socket.off("personal:update", onPersonalUpdate);
      socket.off("room:background", onBackgroundUpdate);
      socket.off("room:name", onNameUpdate);
      socket.off("leaderboard:update", onLeaderboardUpdate);
      socket.off("player:character", onPlayerCharacter);
      socket.off("room:error", onRoomError);
    };
  }, [socket, connected, roomId]);

  const move = (x: number, y: number) => socket?.emit("player:move", { x, y });
  const sendChat = (text: string) => socket?.emit("chat:send", { text });
  const startTimer = (mode: TimerMode) => socket?.emit("timer:start", { mode });
  const pauseTimer = () => socket?.emit("timer:pause");
  const resetTimer = () => socket?.emit("timer:reset");
  const switchTimerPhase = () => socket?.emit("timer:switchPhase");
  const configureTimer = (workDurationMs: number, breakDurationMs: number) =>
    socket?.emit("timer:configure", { workDurationMs, breakDurationMs });
  const addTodo = (text: string, estimatedMinutes: number | null) =>
    socket?.emit("todo:add", { text, estimatedMinutes });
  const toggleTodo = (id: string) => socket?.emit("todo:toggle", { id });
  const removeTodo = (id: string) => socket?.emit("todo:remove", { id });
  const reorderTodos = (orderedIds: string[]) => socket?.emit("todo:reorder", { orderedIds });
  const addPersonalTodo = (text: string, estimatedMinutes: number | null, isPrivate: boolean) =>
    socket?.emit("personal:add", { text, estimatedMinutes, private: isPrivate });
  const togglePersonalTodo = (id: string) => socket?.emit("personal:toggle", { id });
  const removePersonalTodo = (id: string) => socket?.emit("personal:remove", { id });
  const reorderPersonalTodos = (orderedIds: string[]) => socket?.emit("personal:reorder", { orderedIds });
  const broadcastBackground = (url: string | null) => socket?.emit("room:background", { url });
  const broadcastName = (nextName: string) => socket?.emit("room:name", { name: nextName });
  const logStudyTime = (durationMs: number) => socket?.emit("study:log", { durationMs });

  return {
    connected,
    selfId,
    players,
    messages,
    timer,
    todos,
    personalTodos,
    leaderboard,
    name,
    backgroundUrl,
    maxCapacity,
    joinError,
    move,
    sendChat,
    startTimer,
    pauseTimer,
    resetTimer,
    switchTimerPhase,
    configureTimer,
    addTodo,
    toggleTodo,
    removeTodo,
    reorderTodos,
    addPersonalTodo,
    togglePersonalTodo,
    removePersonalTodo,
    reorderPersonalTodos,
    broadcastBackground,
    broadcastName,
    setMaxCapacity,
    logStudyTime,
  };
}
