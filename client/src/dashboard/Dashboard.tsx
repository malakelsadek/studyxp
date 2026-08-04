import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listRooms, updateProfile, type RoomSummary } from "../lib/api";
import { CHARACTER_PRESETS } from "../game/characterPresets";
import { CharacterPreview } from "../game/CharacterPreview";
import "./Dashboard.css";

function roomPasswordKey(roomId: string) {
  return `studyxp.roomPassword.${roomId}`;
}

export function Dashboard() {
  const { user, token, updateCharacter, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeError = (location.state as { error?: string } | null)?.error ?? null;

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [error, setError] = useState<string | null>(routeError);

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    listRooms()
      .then(setRooms)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load rooms"))
      .finally(() => setLoadingRooms(false));
  }, []);

  if (!user) return null;

  const handleSelectCharacter = async (characterId: string) => {
    updateCharacter(characterId);
    if (token) {
      try {
        await updateProfile(token, { character: characterId });
      } catch {
        // cosmetic preference; not worth blocking the UI over a failed save
      }
    }
  };

  const handleJoinSubmit = (e: FormEvent, roomId: string) => {
    e.preventDefault();
    sessionStorage.setItem(roomPasswordKey(roomId), passwordDraft);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-topbar">
        <span>StudyXP</span>
        <span>
          {user.displayName} {user.isGuest && "(guest)"}
        </span>
        <button onClick={() => { logout(); navigate("/"); }}>Log out</button>
      </div>

      <div className="dashboard-body">
        <section className="dashboard-section">
          <h2>Pick your character</h2>
          <div className="character-grid">
            {CHARACTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={`character-option ${user.character === preset.id ? "selected" : ""}`}
                onClick={() => handleSelectCharacter(preset.id)}
              >
                <CharacterPreview characterId={preset.id} size={56} />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Rooms</h2>
          {error && <p className="dashboard-error">{error}</p>}
          {loadingRooms ? (
            <p className="dashboard-muted">Loading rooms...</p>
          ) : (
            <ul className="room-list">
              {rooms.map((room) => {
                const isFull = room.currentCount >= room.maxCapacity;
                return (
                <li key={room.id} className="room-list-item">
                  <span>
                    {room.name}{" "}
                    <span className="room-occupancy">
                      ({room.currentCount}/{room.maxCapacity})
                    </span>
                  </span>
                  {joiningRoomId === room.id ? (
                    <form className="room-join-form" onSubmit={(e) => handleJoinSubmit(e, room.id)}>
                      <input
                        type="password"
                        value={passwordDraft}
                        onChange={(e) => setPasswordDraft(e.target.value)}
                        placeholder="Room password"
                        autoFocus
                      />
                      <button type="submit">Go</button>
                      <button
                        type="button"
                        onClick={() => {
                          setJoiningRoomId(null);
                          setPasswordDraft("");
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      disabled={isFull}
                      onClick={() => {
                        setJoiningRoomId(room.id);
                        setPasswordDraft("");
                        setError(null);
                      }}
                    >
                      {isFull ? "Full" : "Join"}
                    </button>
                  )}
                </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
