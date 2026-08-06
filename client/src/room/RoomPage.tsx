import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PhaserGame } from "../game/PhaserGame";
import { useRoomState } from "./useRoomState";
import { useStudySessionLogger } from "./useStudySessionLogger";
import { ChatOverlay } from "./ChatOverlay";
import { TimerTile } from "./TimerTile";
import { TodoTile } from "./TodoTile";
import { PeopleProgress } from "./PeopleProgress";
import { ShortcutsPanel } from "./ShortcutsPanel";
import { RoomSettings } from "./RoomSettings";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { OutfitPanel } from "./OutfitPanel";
import { CalendarPanel } from "./CalendarPanel";
import { MusicPanel } from "./MusicPanel";
import { CelebrationPopup } from "./CelebrationPopup";
import { useTimerSoundPreference } from "./useTimerSoundPreference";
import { useTimerCompletionSound } from "./useTimerCompletionSound";
import { useAllTasksCelebration } from "./useAllTasksCelebration";
import { playPartySound } from "./timerSounds";
import { SideNav, type PanelKey } from "./SideNav";
import { Tile } from "./Tile";
import { ProfileModal } from "../profile/ProfileModal";
import "./RoomPage.css";

export function RoomPage() {
  const { roomId = "lobby" } = useParams();
  const { user, token, logout, setCoins, syncProfile } = useAuth();
  const navigate = useNavigate();
  const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>({
    settings: false,
    shortcuts: false,
    timer: false,
    todo: false,
    calendar: false,
    music: false,
    outfit: false,
    people: false,
  });
  const [chatActive, setChatActive] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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
      } else if (key === "b") {
        e.preventDefault();
        setOpenPanels((prev) => ({ ...prev, calendar: !prev.calendar }));
      } else if (key === "p") {
        e.preventDefault();
        setOpenPanels((prev) => ({ ...prev, people: !prev.people }));
      } else if (key === "m") {
        e.preventDefault();
        setOpenPanels((prev) => ({ ...prev, music: !prev.music }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatActive]);

  const {
    connected,
    joined,
    selfId,
    players,
    messages,
    timer,
    personalTimer: personalTimerState,
    todos,
    personalTodos,
    leaderboard,
    timeBlocks,
    sharedTimeBlocks,
    musicUrl,
    name,
    backgroundUrl,
    maxCapacity,
    joinError,
    selfProfile,
    move,
    sendChat,
    startTimer,
    pauseTimer,
    resetTimer,
    switchTimerPhase,
    configureTimer,
    startPersonalTimer,
    pausePersonalTimer,
    resetPersonalTimer,
    switchPersonalTimerPhase,
    configurePersonalTimer,
    addTodo,
    toggleTodo,
    removeTodo,
    reorderTodos,
    addPersonalTodo,
    togglePersonalTodo,
    removePersonalTodo,
    reorderPersonalTodos,
    broadcastBackground,
    broadcastName,
    setMaxCapacity,
    logStudyTime,
    addTimeBlock,
    removeTimeBlock,
    addSharedTimeBlock,
    removeSharedTimeBlock,
    setMusicUrl,
  } = useRoomState(roomId);

  const personalTimer = {
    timer: personalTimerState,
    startTimer: startPersonalTimer,
    pauseTimer: pausePersonalTimer,
    resetTimer: resetPersonalTimer,
    switchPhase: switchPersonalTimerPhase,
    configureDurations: configurePersonalTimer,
  };
  const { soundId, setSoundId, play: playTimerDoneSound } = useTimerSoundPreference();

  useStudySessionLogger(timer, roomId, token, logStudyTime, setCoins);
  useStudySessionLogger(personalTimer.timer, roomId, token, logStudyTime, setCoins);
  useTimerCompletionSound(timer, playTimerDoneSound);
  useTimerCompletionSound(personalTimer.timer, playTimerDoneSound);

  useEffect(() => {
    if (selfProfile) syncProfile(selfProfile);
  }, [selfProfile, syncProfile]);

  const celebrate = useCallback(() => {
    playPartySound();
    setShowCelebration(true);
  }, []);
  useAllTasksCelebration(todos, celebrate);
  useAllTasksCelebration(selfId ? (personalTodos[selfId] ?? []) : [], celebrate);

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
        <span>Room: {name || roomId}</span>
        <span>
          {joined ? `Connected — ${playerCount}/${maxCapacity} here` : connected ? "Joining room..." : "Connecting..."}
        </span>
        <span>
          {user.displayName} {user.isGuest && "(guest)"}
        </span>
        <div className="room-topbar-actions">
          <span className="room-topbar-coins">🪙 {user.coins}</span>
          <button onClick={() => navigate("/dashboard")}>Home</button>
          <button onClick={() => setShowLeaderboard((prev) => !prev)}>Leaderboard</button>
          <button onClick={() => { logout(); navigate("/"); }}>Leave</button>
        </div>
      </div>

      <div className="room-body">
        <PhaserGame
          players={players}
          selfId={selfId}
          selfDisplayName={user.displayName}
          selfCharacter={user.character}
          backgroundUrl={backgroundUrl}
          messages={messages}
          onLocalMove={move}
          onPlayerClick={setViewingProfileId}
        />

        {!joined && (
          <div className="room-joining-overlay">
            <p>{joinError ?? "Joining room..."}</p>
          </div>
        )}

        {openPanels.timer && (
          <Tile title="Timer" initialPosition={{ x: 880, y: 72 }} onClose={() => togglePanel("timer")}>
            <TimerTile
              shared={{
                timer,
                startTimer,
                pauseTimer,
                resetTimer,
                switchPhase: switchTimerPhase,
                configureDurations: configureTimer,
              }}
              personal={personalTimer}
              soundId={soundId}
              onSoundChange={setSoundId}
            />
          </Tile>
        )}

        {openPanels.todo && (
          <Tile title="To-do" initialPosition={{ x: 880, y: 260 }} onClose={() => togglePanel("todo")}>
            <TodoTile
              onOpenPeople={() => togglePanel("people")}
              peopleOpen={openPanels.people}
              selfId={selfId}
              sharedTodos={todos}
              onSharedAdd={addTodo}
              onSharedToggle={toggleTodo}
              onSharedRemove={removeTodo}
              onSharedReorder={reorderTodos}
              personalTodos={personalTodos}
              onPersonalAdd={addPersonalTodo}
              onPersonalToggle={togglePersonalTodo}
              onPersonalRemove={removePersonalTodo}
              onPersonalReorder={reorderPersonalTodos}
            />
          </Tile>
        )}

        {openPanels.people && (
          <Tile title="People" initialPosition={{ x: 880, y: 448 }} onClose={() => togglePanel("people")}>
            <PeopleProgress players={players} personalTodos={personalTodos} selfId={selfId} />
          </Tile>
        )}

        {openPanels.shortcuts && (
          <Tile
            title="Keyboard shortcuts"
            initialPosition={{ x: 480, y: 72 }}
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
            <RoomSettings
              roomId={roomId}
              token={token}
              currentName={name}
              onNameChange={broadcastName}
              currentBackgroundUrl={backgroundUrl}
              onBackgroundChange={broadcastBackground}
              currentCapacity={maxCapacity}
              onCapacityChange={setMaxCapacity}
            />
          </Tile>
        )}

        {openPanels.outfit && (
          <Tile title="Outfit" initialPosition={{ x: 480, y: 448 }} onClose={() => togglePanel("outfit")}>
            <OutfitPanel currentCharacter={user.character} ownedCharacters={user.ownedCharacters} />
          </Tile>
        )}

        {openPanels.calendar && (
          <Tile
            title="Calendar"
            initialPosition={{ x: 860, y: 72 }}
            onClose={() => togglePanel("calendar")}
            width={340}
          >
            <CalendarPanel
              timeBlocks={timeBlocks}
              sharedTimeBlocks={sharedTimeBlocks}
              personalTodos={selfId ? (personalTodos[selfId] ?? []) : []}
              onAdd={addTimeBlock}
              onRemove={removeTimeBlock}
              onSharedAdd={addSharedTimeBlock}
              onSharedRemove={removeSharedTimeBlock}
            />
          </Tile>
        )}

        {openPanels.music && (
          <Tile title="Music" initialPosition={{ x: 860, y: 260 }} onClose={() => togglePanel("music")} width={320}>
            <MusicPanel musicUrl={musicUrl} onSetMusic={setMusicUrl} canEdit={!user.isGuest} />
          </Tile>
        )}

        {showLeaderboard && (
          <Tile
            title="Leaderboard"
            initialPosition={{ x: 480, y: 72 }}
            onClose={() => setShowLeaderboard(false)}
          >
            <LeaderboardPanel leaderboard={leaderboard} selfId={selfId} />
          </Tile>
        )}

        <ChatOverlay messages={messages} onSend={sendChat} active={chatActive} />

        <SideNav openPanels={openPanels} onToggle={togglePanel} />

        {showCelebration && <CelebrationPopup onDismiss={() => setShowCelebration(false)} />}

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
