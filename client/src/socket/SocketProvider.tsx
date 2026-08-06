import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "../auth/AuthContext";
import type { ClientToServerEvents, ServerToClientEvents } from "./types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: AppSocket | null;
  connected: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  connectionError: null,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user, logout } = useAuth();
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const auth = user.isGuest ? { guestName: user.displayName, character: user.character } : { token };
    const nextSocket = io(SERVER_URL, { auth, autoConnect: true });

    const onConnect = () => {
      setConnected(true);
      setConnectionError(null);
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: Error) => {
      setConnectionError(err.message);
      if (err.message.includes("token")) logout();
    };

    nextSocket.on("connect", onConnect);
    nextSocket.on("disconnect", onDisconnect);
    nextSocket.on("connect_error", onConnectError);
    setSocket(nextSocket);

    return () => {
      nextSocket.off("connect", onConnect);
      nextSocket.off("disconnect", onDisconnect);
      nextSocket.off("connect_error", onConnectError);
      nextSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
    // Deliberately excludes user.character: later character changes are pushed live over
    // "character:change" instead of reconnecting, which would otherwise drop the player from their room.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token, logout]);

  return (
    <SocketContext.Provider value={{ socket, connected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  return useContext(SocketContext);
}
