import { useState, type FormEvent } from "react";
import { changeRoomPassword } from "../lib/api";

interface RoomSettingsProps {
  roomId: string;
  token: string | null;
}

export function RoomSettings({ roomId, token }: RoomSettingsProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return <p className="profile-muted">Sign in to change this room's password.</p>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      await changeRoomPassword(token, roomId, oldPassword, newPassword);
      sessionStorage.setItem(`studyxp.roomPassword.${roomId}`, newPassword);
      setOldPassword("");
      setNewPassword("");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
      setStatus("idle");
    }
  };

  return (
    <form className="room-settings-form" onSubmit={handleSubmit}>
      <input
        type="password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        placeholder="Current password"
        required
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New password"
        minLength={4}
        required
      />
      {error && <p className="profile-error">{error}</p>}
      {status === "done" && <p className="room-settings-success">Password updated.</p>}
      <button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
