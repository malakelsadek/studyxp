import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listRooms, type RoomSummary } from "../lib/api";
import { CharacterStore } from "./CharacterStore";
import { ProfileModal } from "../profile/ProfileModal";
import "./Dashboard.css";

function roomPasswordKey(roomId: string) {
  return `studyxp.roomPassword.${roomId}`;
}

export function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeError = (location.state as { error?: string } | null)?.error ?? null;

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [error, setError] = useState<string | null>(routeError);
  const [showProfile, setShowProfile] = useState(false);

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

  const handleJoinSubmit = (e: FormEvent, roomId: string) => {
    e.preventDefault();
    sessionStorage.setItem(roomPasswordKey(roomId), passwordDraft);
    navigate(`/room/${roomId}`);
  };

  const handleJoinClick = (room: RoomSummary) => {
    if (!room.hasPassword) {
      sessionStorage.removeItem(roomPasswordKey(room.id));
      navigate(`/room/${room.id}`);
      return;
    }
    setJoiningRoomId(room.id);
    setPasswordDraft("");
    setError(null);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-topbar">
        <span>StudyXP</span>
        <span>
          {user.displayName} {user.isGuest && "(guest)"}
        </span>
        <div className="dashboard-topbar-actions">
          <span className="dashboard-topbar-coins">🪙 {user.coins}</span>
          <button className="dashboard-profile-btn" onClick={() => setShowProfile(true)}>
            Profile
          </button>
          <button onClick={() => { logout(); navigate("/"); }}>Log out</button>
        </div>
      </div>

      <div className="dashboard-body">
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
                    {room.hasPassword && <span title="Password protected">🔒 </span>}
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
                    <button disabled={isFull} onClick={() => handleJoinClick(room)}>
                      {isFull ? "Full" : "Join"}
                    </button>
                  )}
                </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="dashboard-section">
          <h2>Outfit store</h2>
          <CharacterStore />
        </section>
      </div>

      {showProfile && (
        <ProfileModal
          userId={user.id}
          isGuest={user.isGuest}
          fallbackDisplayName={user.displayName}
          currentUserId={user.id}
          token={token}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
