import { useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

// Keeps dragged tiles from being moved up underneath the topbar (RoomPage.css .room-topbar height).
const TOPBAR_HEIGHT = 46;

// Shared across all tiles so clicking one always raises it above every other open tile.
let highestTileZIndex = 20;

interface TileProps {
  title: string;
  initialPosition: { x: number; y: number };
  onClose: () => void;
  children: ReactNode;
  width?: number;
  resizable?: boolean;
  resizeAxis?: "width" | "both";
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export function Tile({
  title,
  initialPosition,
  onClose,
  children,
  width,
  resizable = false,
  resizeAxis = "both",
  minWidth = 220,
  maxWidth = 640,
  minHeight = 160,
  maxHeight = 720,
}: TileProps) {
  const [position, setPosition] = useState(() => ({
    x: initialPosition.x,
    y: Math.max(TOPBAR_HEIGHT, initialPosition.y),
  }));
  const [minimized, setMinimized] = useState(false);
  const [zIndex, setZIndex] = useState(() => ++highestTileZIndex);

  const bringToFront = () => setZIndex(++highestTileZIndex);
  const [size, setSize] = useState<{ width: number; height: number | undefined }>({
    width: width ?? 280,
    height: undefined,
  });
  const tileRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const resizeState = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(
    null,
  );

  const handleMouseDown = (e: ReactMouseEvent) => {
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragState.current) return;
      const dx = moveEvent.clientX - dragState.current.startX;
      const dy = moveEvent.clientY - dragState.current.startY;
      setPosition({
        x: dragState.current.originX + dx,
        y: Math.max(TOPBAR_HEIGHT, dragState.current.originY + dy),
      });
    };

    const handleMouseUp = () => {
      dragState.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeMouseDown = (e: ReactMouseEvent) => {
    e.stopPropagation();
    const startHeight = size.height ?? tileRef.current?.getBoundingClientRect().height ?? minHeight;
    resizeState.current = { startX: e.clientX, startY: e.clientY, startWidth: size.width, startHeight };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeState.current) return;
      const dx = moveEvent.clientX - resizeState.current.startX;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, resizeState.current.startWidth + dx));
      if (resizeAxis === "width") {
        setSize({ width: nextWidth, height: undefined });
        return;
      }
      const dy = moveEvent.clientY - resizeState.current.startY;
      const nextHeight = Math.min(maxHeight, Math.max(minHeight, resizeState.current.startHeight + dy));
      setSize({ width: nextWidth, height: nextHeight });
    };

    const handleMouseUp = () => {
      resizeState.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={tileRef}
      className={`tile${minimized ? " tile--minimized" : ""}`}
      style={{
        left: position.x,
        top: position.y,
        width: resizable ? size.width : width,
        height: minimized ? undefined : resizable ? size.height : undefined,
        zIndex,
      }}
      onMouseDown={(e) => {
        // Stops the click from also reaching the game canvas underneath (which would
        // otherwise open a player's profile if their sprite happens to be behind the tile).
        e.stopPropagation();
        bringToFront();
      }}
    >
      <div className="tile-header" onMouseDown={handleMouseDown} onDoubleClick={() => setMinimized((prev) => !prev)}>
        <span>{title}</span>
        <div className="tile-header-actions">
          <button
            onClick={() => setMinimized((prev) => !prev)}
            aria-label={minimized ? `Restore ${title}` : `Minimize ${title}`}
          >
            {minimized ? "▢" : "─"}
          </button>
          <button onClick={onClose} aria-label={`Close ${title}`}>
            ×
          </button>
        </div>
      </div>
      {/* Hidden via CSS rather than unmounted so embeds (YouTube/Spotify) keep playing
          in the background, and other tiles keep their scroll/form state, while minimized. */}
      <div className="tile-body" hidden={minimized}>
        {children}
      </div>
      {!minimized && resizable && (
        <div className="tile-resize-handle" onMouseDown={handleResizeMouseDown} aria-hidden="true" />
      )}
    </div>
  );
}
