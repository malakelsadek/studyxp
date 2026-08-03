import { useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

interface TileProps {
  title: string;
  initialPosition: { x: number; y: number };
  onClose: () => void;
  children: ReactNode;
}

export function Tile({ title, initialPosition, onClose, children }: TileProps) {
  const [position, setPosition] = useState(initialPosition);
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
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

  return (
    <div className="tile" style={{ left: position.x, top: position.y }}>
      <div className="tile-header" onMouseDown={handleMouseDown}>
        <span>{title}</span>
        <button onClick={onClose} aria-label={`Close ${title}`}>
          ×
        </button>
      </div>
      <div className="tile-body">{children}</div>
    </div>
  );
}
