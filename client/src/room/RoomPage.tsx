import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PhaserGame, type PhaserGameHandle } from "../game/PhaserGame";
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
import { YoutubePanel } from "./YoutubePanel";
import { SpotifyPanel } from "./SpotifyPanel";
import { CelebrationPopup } from "./CelebrationPopup";
import { useTimerSoundPreference } from "./useTimerSoundPreference";
import { useTimerAutoBreakPreference } from "./useTimerAutoBreakPreference";
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
    youtube: false,
    spotify: false,
    outfit: false,
    people: false,
  });
  const [chatActive, setChatActive] = useState(false);
  const [showChatMessages, setShowChatMessages] = useState(true);
  const phaserRef = useRef<PhaserGameHandle>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    const isTypingInField = () => {
      const el = document.activeElement;
      return (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLButtonElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && chatActive) {
        e.preventDefault();
        setChatActive(false);
        return;
      }

      if (
        !chatActive &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        (e.key === "Enter" || e.key.toLowerCase() === "t") &&
        !isTypingInField()
      ) {
        e.preventDefault();
        setChatActive(true);
        return;
      }

      if (!e.altKey) return;
      const key = e.key.toLowerCase();

      if (key === "t") {
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
      } else if (key === "y") {
        e.preventDefault();
        setOpenPanels((prev) => ({ ...prev, youtube: !prev.youtube }));
      } else if (key === "s") {
        e.preventDefault();
        setOpenPanels((prev) => ({ ...prev, spotify: !prev.spotify }));
      } else if (key === "h") {
        e.preventDefault();
        setShowChatMessages((prev) => !prev);
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
    youtubeUrl,
    spotifyUrl,
    name,
    backgroundUrl,
    maxCapacity,
    hasPassword,
    setHasPassword,
    creatorId,
    allowNameChangeByMembers,
    allowBackgroundChangeByMembers,
    joinError,
    selfProfile,
    move,
    sendChat,
    startTimer,
    pauseTimer,
    resetTimer,
    switchTimerPhase,
    advanceTimerPhase,
    configureTimer,
    startPersonalTimer,
    pausePersonalTimer,
    resetPersonalTimer,
    switchPersonalTimerPhase,
    advancePersonalTimerPhase,
    configurePersonalTimer,
    addTodo,
    editTodo,
    toggleTodo,
    removeTodo,
    reorderTodos,
    assignTodo,
    addPersonalTodo,
    editPersonalTodo,
    togglePersonalTodo,
    removePersonalTodo,
    reorderPersonalTodos,
    broadcastBackground,
    broadcastName,
    broadcastPermissions,
    setMaxCapacity,
    logStudyTime,
    addTimeBlock,
    removeTimeBlock,
    addSharedTimeBlock,
    removeSharedTimeBlock,
    setYoutubeUrl,
    setSpotifyUrl,
    leaveRoom,
  } = useRoomState(roomId);

  const handleSendChat = (text: string) => {
    // Show the sender's own bubble immediately instead of waiting on the round trip
    // through the server, which otherwise makes the bubble feel delayed.
    phaserRef.current?.showLocalChatBubble(text);
    sendChat(text);
  };

  const personalTimer = {
    timer: personalTimerState,
    startTimer: startPersonalTimer,
    pauseTimer: pausePersonalTimer,
    resetTimer: resetPersonalTimer,
    switchPhase: switchPersonalTimerPhase,
    configureDurations: configurePersonalTimer,
  };
  const { soundId, setSoundId, play: playTimerDoneSound } = useTimerSoundPreference();
  const { autoBreak, setAutoBreak } = useTimerAutoBreakPreference();

  useStudySessionLogger(timer, roomId, token, logStudyTime, setCoins);
  useStudySessionLogger(personalTimer.timer, roomId, token, logStudyTime, setCoins);
  useTimerCompletionSound(timer, playTimerDoneSound, autoBreak, advanceTimerPhase);
  useTimerCompletionSound(personalTimer.timer, playTimerDoneSound, autoBreak, advancePersonalTimerPhase);

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
          <button onClick={() => { leaveRoom(); navigate("/dashboard"); }}>Home</button>
          <button onClick={() => setShowLeaderboard((prev) => !prev)}>Leaderboard</button>
          <button onClick={() => { logout(); navigate("/"); }}>Log out</button>
        </div>
      </div>

      <div className="room-body">
        <PhaserGame
          ref={phaserRef}
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
          <Tile
            title="Timer"
            initialPosition={{ x: 880, y: 72 }}
            onClose={() => togglePanel("timer")}
            resizable
            minWidth={240}
            maxWidth={520}
            minHeight={200}
            maxHeight={640}
          >
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
              autoBreak={autoBreak}
              onAutoBreakChange={setAutoBreak}
            />
          </Tile>
        )}

        {openPanels.todo && (
          <Tile
            title="To-do"
            initialPosition={{ x: 880, y: 260 }}
            onClose={() => togglePanel("todo")}
            width={360}
            resizable
            minWidth={300}
            maxWidth={640}
            minHeight={240}
            maxHeight={800}
          >
            <TodoTile
              onOpenPeople={() => togglePanel("people")}
              peopleOpen={openPanels.people}
              selfId={selfId}
              players={players}
              sharedTodos={todos}
              onSharedAdd={addTodo}
              onSharedEdit={editTodo}
              onSharedToggle={toggleTodo}
              onSharedRemove={removeTodo}
              onSharedReorder={reorderTodos}
              onSharedAssign={assignTodo}
              personalTodos={personalTodos}
              onPersonalAdd={addPersonalTodo}
              onPersonalEdit={editPersonalTodo}
              onPersonalToggle={togglePersonalTodo}
              onPersonalRemove={removePersonalTodo}
              onPersonalReorder={reorderPersonalTodos}
            />
          </Tile>
        )}

        {openPanels.people && (
          <Tile title="People" initialPosition={{ x: 880, y: 448 }} onClose={() => togglePanel("people")}>
            <PeopleProgress players={players} personalTodos={personalTodos} todos={todos} selfId={selfId} />
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
              currentUserId={user.id}
              creatorId={creatorId}
              currentName={name}
              onNameChange={broadcastName}
              currentBackgroundUrl={backgroundUrl}
              onBackgroundChange={broadcastBackground}
              currentCapacity={maxCapacity}
              onCapacityChange={setMaxCapacity}
              currentHasPassword={hasPassword}
              onHasPasswordChange={setHasPassword}
              allowNameChangeByMembers={allowNameChangeByMembers}
              allowBackgroundChangeByMembers={allowBackgroundChangeByMembers}
              onPermissionsChange={broadcastPermissions}
            />
          </Tile>
        )}

        {openPanels.outfit && (
          <Tile title="Outfit" initialPosition={{ x: 480, y: 448 }} onClose={() => togglePanel("outfit")}>
            <OutfitPanel currentCharacter={user.character} currentNameColor={user.nameColor} />
          </Tile>
        )}

        {openPanels.calendar && (
          <Tile
            title="Calendar"
            initialPosition={{ x: 860, y: 72 }}
            onClose={() => togglePanel("calendar")}
            width={340}
            resizable
            minWidth={300}
            maxWidth={640}
            minHeight={320}
            maxHeight={800}
          >
            <CalendarPanel
              timeBlocks={timeBlocks}
              sharedTimeBlocks={sharedTimeBlocks}
              personalTodos={selfId ? (personalTodos[selfId] ?? []) : []}
              sharedTodos={todos}
              onAdd={addTimeBlock}
              onRemove={removeTimeBlock}
              onSharedAdd={addSharedTimeBlock}
              onSharedRemove={removeSharedTimeBlock}
            />
          </Tile>
        )}

        {openPanels.youtube && (
          <Tile
            title="YouTube"
            initialPosition={{ x: 860, y: 260 }}
            onClose={() => togglePanel("youtube")}
            width={320}
            resizable
            resizeAxis="width"
            minWidth={240}
            maxWidth={720}
          >
            <YoutubePanel url={youtubeUrl} onSetUrl={setYoutubeUrl} canEdit={!user.isGuest} />
          </Tile>
        )}

        {openPanels.spotify && (
          <Tile
            title="Spotify"
            initialPosition={{ x: 860, y: 480 }}
            onClose={() => togglePanel("spotify")}
            width={320}
            resizable
            minWidth={240}
            maxWidth={640}
            minHeight={180}
            maxHeight={500}
          >
            <SpotifyPanel url={spotifyUrl} onSetUrl={setSpotifyUrl} canEdit={!user.isGuest} />
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

        <ChatOverlay
          messages={messages}
          onSend={handleSendChat}
          active={chatActive}
          showMessages={showChatMessages}
          onToggleMessages={() => setShowChatMessages((prev) => !prev)}
        />

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
