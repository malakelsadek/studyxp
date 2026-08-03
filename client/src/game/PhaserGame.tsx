import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { MainScene } from "./MainScene";
import type { ChatMessage, PlayerDTO } from "../socket/types";

interface PhaserGameProps {
  players: Record<string, PlayerDTO>;
  selfId: string | null;
  selfDisplayName: string;
  messages: ChatMessage[];
  onLocalMove: (x: number, y: number) => void;
}

export function PhaserGame({ players, selfId, selfDisplayName, messages, onLocalMove }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<MainScene | null>(null);
  const onLocalMoveRef = useRef(onLocalMove);
  onLocalMoveRef.current = onLocalMove;
  const playersRef = useRef(players);
  playersRef.current = players;
  const selfRef = useRef({ selfId, selfDisplayName });
  selfRef.current = { selfId, selfDisplayName };
  const seenMessageIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 1200,
      height: 800,
      parent: containerRef.current,
      backgroundColor: "#1e1e2e",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [MainScene],
    });
    gameRef.current = game;

    game.events.once(Phaser.Core.Events.READY, () => {
      const scene = game.scene.getScene("main") as MainScene;
      sceneRef.current = scene;
      scene.setOnLocalMove((x, y) => onLocalMoveRef.current(x, y));
      if (selfRef.current.selfId) {
        scene.setSelf(selfRef.current.selfId, selfRef.current.selfDisplayName);
      }
      scene.syncPlayers(playersRef.current);
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (selfId) sceneRef.current?.setSelf(selfId, selfDisplayName);
  }, [selfId, selfDisplayName]);

  useEffect(() => {
    sceneRef.current?.syncPlayers(players);
  }, [players]);

  useEffect(() => {
    if (seenMessageIds.current === null) {
      seenMessageIds.current = new Set(messages.map((m) => m.id));
      return;
    }
    for (const message of messages) {
      if (seenMessageIds.current.has(message.id)) continue;
      seenMessageIds.current.add(message.id);
      sceneRef.current?.showChatBubble(message.fromId, message.text);
    }
  }, [messages]);

  return <div ref={containerRef} />;
}
