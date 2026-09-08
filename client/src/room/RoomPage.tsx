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
import { MediaTile, type MediaTab } from "./MediaTile";
import { CelebrationPopup } from "./CelebrationPopup";
import { useTimerSoundPreference } from "./useTimerSoundPreference";
import { useTimerAutoBreakPreference } from "./useTimerAutoBreakPreference";
import { useChatSizePreference } from "./useChatSizePreference";
import { ChatSizeSetting } from "./ChatSizeSetting";
import { NameColorSetting } from "./NameColorSetting";
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
    media: false,
    outfit: false,
    people: false,
  });
  const [mediaTab, setMediaTab] = useState<MediaTab>("youtube");
  const [chatActive, setChatActive] = useState(false);
  const [showChatMessages, setShowChatMessages] = useState(true);
  const phaserRef = useRef<PhaserGameHandle>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const {
    connected,
    joined,
    selfId,
    players,
    typingPlayerIds,
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
    disableChatDuringSharedTimer,
    restrictTimerControlToCreator,
    joinError,
    selfProfile,
    move,
    sendChat,
    setChatTyping,
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

  const chatLocked = disableChatDuringSharedTimer && timer.status === "running";

  useEffect(() => {
    if (chatLocked) setChatActive(false);
  }, [chatLocked]);

  useEffect(() => {
    setChatTyping(chatActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatActive]);

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
        !chatLocked &&
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
        setMediaTab("youtube");
        setOpenPanels((prev) => ({ ...prev, media: true }));
      } else if (key === "s") {
        e.preventDefault();
        setMediaTab("spotify");
        setOpenPanels((prev) => ({ ...prev, media: true }));
      } else if (key === "h") {
        e.preventDefault();
        setShowChatMessages((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatActive, chatLocked]);

  const handleSendChat = (text: string) => {
    if (chatLocked) return;
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
  const { chatSize, setChatSize } = useChatSizePreference();

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
          typingPlayerIds={typingPlayerIds}
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
            width={240}
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
              sharedControlAllowed={!restrictTimerControlToCreator || user.id === creatorId}
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
            width={300}
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
          <Tile
            title="People"
            initialPosition={{ x: 880, y: 448 }}
            onClose={() => togglePanel("people")}
            width={240}
            resizable
            minWidth={240}
            maxWidth={480}
            minHeight={200}
            maxHeight={600}
          >
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
            <ChatSizeSetting chatSize={chatSize} onChange={setChatSize} />
            <NameColorSetting currentNameColor={user.nameColor} />
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
              disableChatDuringSharedTimer={disableChatDuringSharedTimer}
              restrictTimerControlToCreator={restrictTimerControlToCreator}
              onPermissionsChange={broadcastPermissions}
            />
          </Tile>
        )}

        {openPanels.outfit && (
          <Tile title="Outfit" initialPosition={{ x: 480, y: 448 }} onClose={() => togglePanel("outfit")}>
            <OutfitPanel currentCharacter={user.character} />
          </Tile>
        )}

        {openPanels.calendar && (
          <Tile
            title="Calendar"
            initialPosition={{ x: 860, y: 72 }}
            onClose={() => togglePanel("calendar")}
            width={300}
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

        {openPanels.media && (
          <Tile
            title="Media"
            initialPosition={{ x: 860, y: 260 }}
            onClose={() => togglePanel("media")}
            width={240}
            resizable
            resizeAxis="width"
            minWidth={240}
            maxWidth={720}
          >
            <MediaTile
              tab={mediaTab}
              onTabChange={setMediaTab}
              youtubeUrl={youtubeUrl}
              onSetYoutubeUrl={setYoutubeUrl}
              spotifyUrl={spotifyUrl}
              onSetSpotifyUrl={setSpotifyUrl}
              canEdit={!user.isGuest}
            />
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
          locked={chatLocked}
          size={chatSize}
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
