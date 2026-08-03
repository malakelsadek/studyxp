import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [lastPong, setLastPong] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) {
      socket = io(SERVER_URL);
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onPong = (message: string) => setLastPong(message);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("pong", onPong);

    return () => {
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
      socket?.off("pong", onPong);
    };
  }, []);

  const ping = () => socket?.emit("ping", "hello from client");

  return { connected, lastPong, ping };
}
