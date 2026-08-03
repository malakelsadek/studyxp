import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socket = useMemo<AppSocket | null>(() => {
    if (!user) return null;
    const auth = user.isGuest ? { guestName: user.displayName } : { token };
    return io(SERVER_URL, { auth, autoConnect: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setConnected(true);
      setConnectionError(null);
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (err: Error) => {
      setConnectionError(err.message);
      if (err.message.includes("token")) logout();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
    };
  }, [socket, logout]);

  return (
    <SocketContext.Provider value={{ socket, connected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  return useContext(SocketContext);
}
