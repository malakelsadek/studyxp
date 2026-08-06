import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  MAX_ROOM_CAPACITY,
  changeRoomCapacity,
  changeRoomName,
  changeRoomPassword,
  resetRoomBackground,
  uploadRoomBackground,
} from "../lib/api";

interface RoomSettingsProps {
  roomId: string;
  token: string | null;
  currentName: string;
  onNameChange: (name: string) => void;
  currentBackgroundUrl: string | null;
  onBackgroundChange: (url: string | null) => void;
  currentCapacity: number;
  onCapacityChange: (maxCapacity: number) => void;
}

export function RoomSettings({
  roomId,
  token,
  currentName,
  onNameChange,
  currentBackgroundUrl,
  onBackgroundChange,
  currentCapacity,
  onCapacityChange,
}: RoomSettingsProps) {
  const [nameDraft, setNameDraft] = useState(currentName);
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "done">("idle");
  const [nameError, setNameError] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [bgStatus, setBgStatus] = useState<"idle" | "uploading">("idle");
  const [bgError, setBgError] = useState<string | null>(null);
  const [capacityDraft, setCapacityDraft] = useState(currentCapacity);
  const [capacityStatus, setCapacityStatus] = useState<"idle" | "saving" | "done">("idle");
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!token) {
    return <p className="profile-muted">Sign in to change this room's settings.</p>;
  }

  const handleNameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNameStatus("saving");
    setNameError(null);
    try {
      const { name } = await changeRoomName(token, roomId, nameDraft);
      onNameChange(name);
      setNameStatus("done");
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Failed to update name");
      setNameStatus("idle");
    }
  };

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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgStatus("uploading");
    setBgError(null);
    try {
      const { backgroundUrl } = await uploadRoomBackground(token, roomId, file);
      onBackgroundChange(backgroundUrl);
    } catch (err) {
      setBgError(err instanceof Error ? err.message : "Failed to upload background");
    } finally {
      setBgStatus("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReset = async () => {
    setBgStatus("uploading");
    setBgError(null);
    try {
      await resetRoomBackground(token, roomId);
      onBackgroundChange(null);
    } catch (err) {
      setBgError(err instanceof Error ? err.message : "Failed to reset background");
    } finally {
      setBgStatus("idle");
    }
  };

  const handleCapacitySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCapacityStatus("saving");
    setCapacityError(null);
    try {
      const { maxCapacity } = await changeRoomCapacity(token, roomId, capacityDraft);
      onCapacityChange(maxCapacity);
      setCapacityStatus("done");
    } catch (err) {
      setCapacityError(err instanceof Error ? err.message : "Failed to update capacity");
      setCapacityStatus("idle");
    }
  };

  return (
    <div className="room-settings">
      <form className="room-settings-form" onSubmit={handleNameSubmit}>
        <label className="room-settings-label">Room name</label>
        <div className="room-settings-row">
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={50}
            required
          />
          <button type="submit" disabled={nameStatus === "saving"}>
            {nameStatus === "saving" ? "..." : "Save"}
          </button>
        </div>
        {nameError && <p className="profile-error">{nameError}</p>}
        {nameStatus === "done" && <p className="room-settings-success">Name updated.</p>}
      </form>

      <div className="room-settings-divider" />

      <form className="room-settings-form" onSubmit={handleSubmit}>
        <label className="room-settings-label">Room password</label>
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Current password"
          required
        />
        <div className="room-settings-row">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            minLength={4}
            required
          />
          <button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "..." : "Save"}
          </button>
        </div>
        {error && <p className="profile-error">{error}</p>}
        {status === "done" && <p className="room-settings-success">Password updated.</p>}
      </form>

      <div className="room-settings-divider" />

      <form className="room-settings-form" onSubmit={handleCapacitySubmit}>
        <label className="room-settings-label">Max people (up to {MAX_ROOM_CAPACITY})</label>
        <div className="room-settings-row">
          <input
            type="number"
            min={1}
            max={MAX_ROOM_CAPACITY}
            value={capacityDraft}
            onChange={(e) => setCapacityDraft(Number(e.target.value))}
            required
          />
          <button type="submit" disabled={capacityStatus === "saving"}>
            {capacityStatus === "saving" ? "..." : "Save"}
          </button>
        </div>
        {capacityError && <p className="profile-error">{capacityError}</p>}
        {capacityStatus === "done" && <p className="room-settings-success">Capacity updated.</p>}
      </form>

      <div className="room-settings-divider" />

      <div className="room-settings-form">
        <label className="room-settings-label">Room background</label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={bgStatus === "uploading"} />
        {bgError && <p className="profile-error">{bgError}</p>}
        {bgStatus === "uploading" && <p className="profile-muted">Uploading...</p>}
        {currentBackgroundUrl && (
          <button type="button" onClick={handleReset} disabled={bgStatus === "uploading"}>
            Reset to default map
          </button>
        )}
      </div>
    </div>
  );
}
