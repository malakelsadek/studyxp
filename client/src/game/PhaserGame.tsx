import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Phaser from "phaser";
import { MainScene } from "./MainScene";
import type { ChatMessage, PlayerDTO } from "../socket/types";

interface PhaserGameProps {
  players: Record<string, PlayerDTO>;
  selfId: string | null;
  selfDisplayName: string;
  selfCharacter: string;
  backgroundUrl: string | null;
  messages: ChatMessage[];
  typingPlayerIds: Set<string>;
  onLocalMove: (x: number, y: number) => void;
  onPlayerClick: (id: string) => void;
}

export interface PhaserGameHandle {
  showLocalChatBubble: (text: string) => void;
}

export const PhaserGame = forwardRef<PhaserGameHandle, PhaserGameProps>(function PhaserGame({
  players,
  selfId,
  selfDisplayName,
  selfCharacter,
  backgroundUrl,
  messages,
  typingPlayerIds,
  onLocalMove,
  onPlayerClick,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<MainScene | null>(null);
  const onLocalMoveRef = useRef(onLocalMove);
  onLocalMoveRef.current = onLocalMove;
  const onPlayerClickRef = useRef(onPlayerClick);
  onPlayerClickRef.current = onPlayerClick;
  const playersRef = useRef(players);
  playersRef.current = players;
  const selfRef = useRef({ selfId, selfDisplayName, selfCharacter });
  selfRef.current = { selfId, selfDisplayName, selfCharacter };
  const backgroundUrlRef = useRef(backgroundUrl);
  backgroundUrlRef.current = backgroundUrl;
  const seenMessageIds = useRef<Set<string> | null>(null);

  useImperativeHandle(ref, () => ({
    showLocalChatBubble: (text: string) => {
      if (selfRef.current.selfId) {
        sceneRef.current?.showChatBubble(selfRef.current.selfId, text);
      }
    },
  }), []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: "#1e1e2e",
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      },
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
      scene.setOnPlayerClick((id) => onPlayerClickRef.current(id));
      if (selfRef.current.selfId) {
        scene.setSelf(selfRef.current.selfId, selfRef.current.selfDisplayName, selfRef.current.selfCharacter);
      }
      scene.syncPlayers(playersRef.current);
      if (backgroundUrlRef.current) {
        scene.setBackground(backgroundUrlRef.current);
      }
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (selfId) sceneRef.current?.setSelf(selfId, selfDisplayName, selfCharacter);
  }, [selfId, selfDisplayName, selfCharacter]);

  useEffect(() => {
    sceneRef.current?.syncPlayers(players);
  }, [players]);

  const prevTypingRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const prev = prevTypingRef.current;
    for (const id of typingPlayerIds) {
      if (!prev.has(id)) sceneRef.current?.setTyping(id, true);
    }
    for (const id of prev) {
      if (!typingPlayerIds.has(id)) sceneRef.current?.setTyping(id, false);
    }
    prevTypingRef.current = typingPlayerIds;
  }, [typingPlayerIds]);

  useEffect(() => {
    sceneRef.current?.setBackground(backgroundUrl);
  }, [backgroundUrl]);

  useEffect(() => {
    if (seenMessageIds.current === null) {
      seenMessageIds.current = new Set(messages.map((m) => m.id));
      return;
    }
    for (const message of messages) {
      if (seenMessageIds.current.has(message.id)) continue;
      seenMessageIds.current.add(message.id);
      // The sender already saw their own bubble instantly via showLocalChatBubble; showing
      // it again here (once the server echo arrives) would stack a duplicate on top of it.
      if (message.fromId === selfRef.current.selfId) continue;
      sceneRef.current?.showChatBubble(message.fromId, message.text);
    }
  }, [messages]);

  return <div ref={containerRef} />;
});
