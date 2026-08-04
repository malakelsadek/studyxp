import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PhaserGame } from "../game/PhaserGame";
import { useRoomState } from "./useRoomState";
import { usePersonalTimer } from "./usePersonalTimer";
import { useStudySessionLogger } from "./useStudySessionLogger";
import { ChatOverlay } from "./ChatOverlay";
import { TimerTile } from "./TimerTile";
import { TodoTile } from "./TodoTile";
import { ShortcutsPanel } from "./ShortcutsPanel";
import { RoomSettings } from "./RoomSettings";
import { SideNav, type PanelKey } from "./SideNav";
import { Tile } from "./Tile";
import { ProfileModal } from "../profile/ProfileModal";
import "./RoomPage.css";

export function RoomPage() {
  const { roomId = "lobby" } = useParams();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>({
    timer: false,
    todo: false,
    shortcuts: false,
    settings: false,
  });
  const [chatActive, setChatActive] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && chatActive) {
        e.preventDefault();
        setChatActive(false);
        return;
      }

      if (!e.altKey) return;
      const key = e.key.toLowerCase();

      if (key === "c") {
        e.preventDefault();
        setChatActive(true);
      } else if (key === "t") {
        e.preventDefault();
        setOpenPanels((prev) => ({ ...prev, timer: !prev.timer }));
      } else if (key === "d") {
        e.preventDefault();
        setOpenPanels((prev) => ({ ...prev, todo: !prev.todo }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatActive]);

  const {
    connected,
    selfId,
    players,
    messages,
    timer,
    todos,
    joinError,
    move,
    sendChat,
    startTimer,
    pauseTimer,
    resetTimer,
    addTodo,
    toggleTodo,
    removeTodo,
  } = useRoomState(roomId);

  const personalTimer = usePersonalTimer();

  useStudySessionLogger(timer, roomId, token);
  useStudySessionLogger(personalTimer.timer, roomId, token);

  useEffect(() => {
    if (joinError) {
      sessionStorage.removeItem(`studyxp.roomPassword.${roomId}`);
      navigate("/dashboard", { state: { error: joinError } });
    }
  }, [joinError, roomId, navigate]);

  if (!user) return null;

  const playerCount = Object.keys(players).length;
  const togglePanel = (panel: PanelKey) =>
    setOpenPanels((prev) => ({ ...prev, [panel]: !prev[panel] }));

  const viewingPlayer = viewingProfileId ? players[viewingProfileId] : null;

  return (
    <div className="room-page">
      <div className="room-topbar">
        <span>Room: {roomId}</span>
        <span>{connected ? `Connected — ${playerCount} here` : "Connecting..."}</span>
        <span>
          {user.displayName} {user.isGuest && "(guest)"}
        </span>
        <button onClick={() => navigate("/dashboard")}>Dashboard</button>
        <button onClick={() => { logout(); navigate("/"); }}>Leave</button>
      </div>

      <div className="room-body">
        <PhaserGame
          players={players}
          selfId={selfId}
          selfDisplayName={user.displayName}
          selfCharacter={user.character}
          messages={messages}
          onLocalMove={move}
          onPlayerClick={setViewingProfileId}
        />

        {openPanels.timer && (
          <Tile title="Timer" initialPosition={{ x: 880, y: 16 }} onClose={() => togglePanel("timer")}>
            <TimerTile
              shared={{ timer, startTimer, pauseTimer, resetTimer }}
              personal={personalTimer}
            />
          </Tile>
        )}

        {openPanels.todo && (
          <Tile title="To-do" initialPosition={{ x: 880, y: 260 }} onClose={() => togglePanel("todo")}>
            <TodoTile
              userId={user.id}
              sharedTodos={todos}
              onSharedAdd={addTodo}
              onSharedToggle={toggleTodo}
              onSharedRemove={removeTodo}
            />
          </Tile>
        )}

        {openPanels.shortcuts && (
          <Tile
            title="Keyboard shortcuts"
            initialPosition={{ x: 480, y: 16 }}
            onClose={() => togglePanel("shortcuts")}
          >
            <ShortcutsPanel />
          </Tile>
        )}

        {openPanels.settings && (
          <Tile
            title="Room settings"
            initialPosition={{ x: 480, y: 260 }}
            onClose={() => togglePanel("settings")}
          >
            <RoomSettings roomId={roomId} token={token} />
          </Tile>
        )}

        <ChatOverlay messages={messages} onSend={sendChat} active={chatActive} />

        <SideNav openPanels={openPanels} onToggle={togglePanel} />

        {viewingProfileId && viewingPlayer && (
          <ProfileModal
            userId={viewingProfileId}
            isGuest={viewingPlayer.isGuest}
            fallbackDisplayName={viewingPlayer.displayName}
            currentUserId={user.id}
            token={token}
            onClose={() => setViewingProfileId(null)}
          />
        )}
      </div>
    </div>
  );
}
