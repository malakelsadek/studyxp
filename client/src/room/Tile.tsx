import { useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

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
  const [position, setPosition] = useState(initialPosition);
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
      setPosition({ x: dragState.current.originX + dx, y: dragState.current.originY + dy });
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
      className="tile"
      style={{
        left: position.x,
        top: position.y,
        width: resizable ? size.width : width,
        height: resizable ? size.height : undefined,
      }}
    >
      <div className="tile-header" onMouseDown={handleMouseDown}>
        <span>{title}</span>
        <button onClick={onClose} aria-label={`Close ${title}`}>
          ×
        </button>
      </div>
      <div className="tile-body">{children}</div>
      {resizable && (
        <div className="tile-resize-handle" onMouseDown={handleResizeMouseDown} aria-hidden="true" />
      )}
    </div>
  );
}
