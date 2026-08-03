import { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../socket/SocketProvider";
import type { ChatMessage, PlayerDTO, TimerMode, TimerState, TodoItem } from "../socket/types";
import { defaultTimer } from "./timerMath";

export function useRoomState(roomId: string) {
  const { socket, connected } = useSocketContext();
  const [selfId, setSelfId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Record<string, PlayerDTO>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [timer, setTimer] = useState<TimerState>(defaultTimer());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const joinedRoomId = useRef<string | null>(null);

  useEffect(() => {
    if (!socket || !connected) return;

    if (joinedRoomId.current !== roomId) {
      socket.emit("room:join", { roomId });
      joinedRoomId.current = roomId;
    }

    const onSnapshot = (snapshot: {
      selfId: string;
      players: PlayerDTO[];
      messages: ChatMessage[];
      timer: TimerState;
      todos: TodoItem[];
    }) => {
      setSelfId(snapshot.selfId);
      setPlayers(Object.fromEntries(snapshot.players.map((p) => [p.id, p])));
      setMessages(snapshot.messages);
      setTimer(snapshot.timer);
      setTodos(snapshot.todos);
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

    socket.on("room:snapshot", onSnapshot);
    socket.on("player:joined", onPlayerJoined);
    socket.on("player:left", onPlayerLeft);
    socket.on("player:moved", onPlayerMoved);
    socket.on("chat:message", onChatMessage);
    socket.on("timer:update", onTimerUpdate);
    socket.on("todo:update", onTodoUpdate);

    return () => {
      socket.off("room:snapshot", onSnapshot);
      socket.off("player:joined", onPlayerJoined);
      socket.off("player:left", onPlayerLeft);
      socket.off("player:moved", onPlayerMoved);
      socket.off("chat:message", onChatMessage);
      socket.off("timer:update", onTimerUpdate);
      socket.off("todo:update", onTodoUpdate);
    };
  }, [socket, connected, roomId]);

  const move = (x: number, y: number) => socket?.emit("player:move", { x, y });
  const sendChat = (text: string) => socket?.emit("chat:send", { text });
  const startTimer = (mode: TimerMode) => socket?.emit("timer:start", { mode });
  const pauseTimer = () => socket?.emit("timer:pause");
  const resetTimer = () => socket?.emit("timer:reset");
  const addTodo = (text: string) => socket?.emit("todo:add", { text });
  const toggleTodo = (id: string) => socket?.emit("todo:toggle", { id });
  const removeTodo = (id: string) => socket?.emit("todo:remove", { id });

  return {
    connected,
    selfId,
    players,
    messages,
    timer,
    todos,
    move,
    sendChat,
    startTimer,
    pauseTimer,
    resetTimer,
    addTodo,
    toggleTodo,
    removeTodo,
  };
}
