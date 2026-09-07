import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  acceptFriendRequest,
  declineFriendRequest,
  listFriendRequests,
  listFriends,
  removeFriend,
  sendFriendRequest,
  type Friend,
  type FriendRequestEntry,
} from "../lib/api";
import { CharacterPreview } from "../game/CharacterPreview";
import { ProfileModal } from "../profile/ProfileModal";

function roomPasswordKey(roomId: string) {
  return `studyxp.roomPassword.${roomId}`;
}

export function FriendsSection() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestEntry[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailDraft, setEmailDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingFriend, setViewingFriend] = useState<Friend | null>(null);
  const [joiningFriend, setJoiningFriend] = useState<Friend | null>(null);
  const [passwordDraft, setPasswordDraft] = useState("");

  const refresh = (currentToken: string) => {
    Promise.all([listFriends(currentToken), listFriendRequests(currentToken)])
      .then(([f, r]) => {
        setFriends(f);
        setIncoming(r.incoming);
        setOutgoing(r.outgoing);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load friends"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    refresh(token);
    const interval = setInterval(() => refresh(token), 15000);
    return () => clearInterval(interval);
  }, [token]);

  if (!token) {
    return <p className="dashboard-muted">Sign up for an account to add friends.</p>;
  }

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailDraft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendFriendRequest(token, { email: emailDraft.trim() });
      setEmailDraft("");
      refresh(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    await acceptFriendRequest(token, requestId);
    refresh(token);
  };

  const handleDecline = async (requestId: string) => {
    await declineFriendRequest(token, requestId);
    refresh(token);
  };

  const handleRemove = async (friendId: string) => {
    await removeFriend(token, friendId);
    refresh(token);
  };

  const handleJoinClick = (friend: Friend) => {
    if (!friend.roomId) return;
    if (!friend.hasPassword) {
      sessionStorage.removeItem(roomPasswordKey(friend.roomId));
      navigate(`/room/${friend.roomId}`);
      return;
    }
    setJoiningFriend(friend);
    setPasswordDraft("");
    setError(null);
  };

  const handleJoinSubmit = (e: FormEvent, roomId: string) => {
    e.preventDefault();
    sessionStorage.setItem(roomPasswordKey(roomId), passwordDraft);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="friends-section">
      <form className="friend-add-form" onSubmit={handleSend}>
        <input
          type="email"
          value={emailDraft}
          onChange={(e) => setEmailDraft(e.target.value)}
          placeholder="Add a friend by email"
        />
        <button type="submit" disabled={sending || !emailDraft.trim()}>
          {sending ? "..." : "Send request"}
        </button>
      </form>
      {error && <p className="dashboard-error">{error}</p>}

      {incoming.length > 0 && (
        <div className="friend-requests">
          <h3>Requests</h3>
          <ul className="friend-list">
            {incoming.map((r) => (
              <li key={r.id} className="friend-list-item">
                <span className="friend-name">
                  <CharacterPreview characterId={r.user.character} size={32} />
                  {r.user.displayName}
                </span>
                <div className="friend-list-actions">
                  <button onClick={() => handleAccept(r.id)}>Accept</button>
                  <button onClick={() => handleDecline(r.id)}>Decline</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <p className="dashboard-muted">Loading friends...</p>
      ) : friends.length === 0 && outgoing.length === 0 ? (
        <p className="dashboard-muted">No friends yet — add one above.</p>
      ) : (
        <ul className="friend-list">
          {friends.map((f) => (
            <li
              key={f.id}
              className="friend-list-item friend-list-item-clickable"
              onClick={() => setViewingFriend(f)}
            >
              <span className="friend-name">
                <CharacterPreview characterId={f.character} size={56} />
                {f.displayName}
                <span className={`friend-status ${f.roomId ? "friend-status-in-room" : "friend-status-away"}`}>
                  {f.roomId ? `In room: ${f.roomName}` : "Not in a room"}
                  {f.roomId && f.hasPassword && <span title="Password protected"> 🔒</span>}
                </span>
              </span>
              <div className="friend-list-actions">
                {f.roomId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinClick(f);
                    }}
                  >
                    Join
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(f.id);
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
          {outgoing.map((r) => (
            <li key={r.id} className="friend-list-item">
              <span className="friend-name">
                <CharacterPreview characterId={r.user.character} size={32} />
                {r.user.displayName}
              </span>
              <div className="friend-list-actions">
                <span className="friend-pending">Pending</span>
                <button onClick={() => handleDecline(r.id)}>Cancel</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewingFriend && user && (
        <ProfileModal
          userId={viewingFriend.id}
          isGuest={false}
          fallbackDisplayName={viewingFriend.displayName}
          currentUserId={user.id}
          token={token}
          onClose={() => setViewingFriend(null)}
        />
      )}

      {joiningFriend && joiningFriend.roomId && (
        <div className="friend-join-modal-backdrop" onClick={() => setJoiningFriend(null)}>
          <div className="friend-join-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{joiningFriend.displayName}</h3>
            <p className="friend-status friend-status-in-room">In room: {joiningFriend.roomName}</p>
            <form className="room-join-form" onSubmit={(e) => handleJoinSubmit(e, joiningFriend.roomId!)}>
              <input
                type="password"
                value={passwordDraft}
                onChange={(e) => setPasswordDraft(e.target.value)}
                placeholder="Room password"
                autoFocus
              />
              <button type="submit">Go</button>
              <button type="button" onClick={() => setJoiningFriend(null)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
