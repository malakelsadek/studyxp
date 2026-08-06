import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  MAX_ROOM_CAPACITY,
  changeRoomCapacity,
  changeRoomName,
  changeRoomPassword,
  removeRoomPassword,
  resetRoomBackground,
  uploadRoomBackground,
} from "../lib/api";

const ROOM_SETTINGS_ADMIN_EMAIL = "mika07@gmail.com";

type SectionKey = "name" | "password" | "capacity" | "background";

interface RoomSettingsProps {
  roomId: string;
  token: string | null;
  currentUserEmail: string | null;
  currentName: string;
  onNameChange: (name: string) => void;
  currentBackgroundUrl: string | null;
  onBackgroundChange: (url: string | null) => void;
  currentCapacity: number;
  onCapacityChange: (maxCapacity: number) => void;
  currentHasPassword: boolean;
  onHasPasswordChange: (hasPassword: boolean) => void;
}

function roomPasswordKey(roomId: string) {
  return `studyxp.roomPassword.${roomId}`;
}

function SettingsSection({
  title,
  meta,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  meta: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`room-settings-section${isOpen ? " open" : ""}`}>
      <button type="button" className="room-settings-section-header" onClick={onToggle}>
        <span className="room-settings-section-chevron">▸</span>
        <span className="room-settings-section-title">{title}</span>
        <span className="room-settings-section-meta">{meta}</span>
      </button>
      {isOpen && <div className="room-settings-section-body">{children}</div>}
    </div>
  );
}

export function RoomSettings({
  roomId,
  token,
  currentUserEmail,
  currentName,
  onNameChange,
  currentBackgroundUrl,
  onBackgroundChange,
  currentCapacity,
  onCapacityChange,
  currentHasPassword,
  onHasPasswordChange,
}: RoomSettingsProps) {
  const canEdit = currentUserEmail === ROOM_SETTINGS_ADMIN_EMAIL;
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const toggleSection = (key: SectionKey) => setOpenSection((prev) => (prev === key ? null : key));

  const [nameDraft, setNameDraft] = useState(currentName);
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "done">("idle");
  const [nameError, setNameError] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [removePasswordInput, setRemovePasswordInput] = useState("");
  const [removeStatus, setRemoveStatus] = useState<"idle" | "saving">("idle");
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [bgStatus, setBgStatus] = useState<"idle" | "uploading">("idle");
  const [bgError, setBgError] = useState<string | null>(null);
  const [capacityDraft, setCapacityDraft] = useState(currentCapacity);
  const [capacityStatus, setCapacityStatus] = useState<"idle" | "saving" | "done">("idle");
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!token) {
    return <p className="profile-muted">Sign in to view this room's settings.</p>;
  }

  if (!canEdit) {
    return <p className="profile-muted">Only mika can change room settings.</p>;
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
      const { hasPassword } = await changeRoomPassword(
        token,
        roomId,
        currentHasPassword ? oldPassword : undefined,
        newPassword,
      );
      sessionStorage.setItem(roomPasswordKey(roomId), newPassword);
      onHasPasswordChange(hasPassword);
      setOldPassword("");
      setNewPassword("");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
      setStatus("idle");
    }
  };

  const handleRemovePassword = async (e: FormEvent) => {
    e.preventDefault();
    setRemoveStatus("saving");
    setRemoveError(null);
    try {
      const { hasPassword } = await removeRoomPassword(token, roomId, removePasswordInput);
      sessionStorage.removeItem(roomPasswordKey(roomId));
      onHasPasswordChange(hasPassword);
      setRemovePasswordInput("");
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : "Failed to remove password");
    } finally {
      setRemoveStatus("idle");
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
      <SettingsSection
        title="Room name"
        meta={currentName}
        isOpen={openSection === "name"}
        onToggle={() => toggleSection("name")}
      >
        <form className="room-settings-form" onSubmit={handleNameSubmit}>
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
      </SettingsSection>

      <SettingsSection
        title="Password protection"
        meta={currentHasPassword ? "Protected" : "Open"}
        isOpen={openSection === "password"}
        onToggle={() => toggleSection("password")}
      >
        <p className="profile-muted">
          {currentHasPassword
            ? "Anyone joining this room must enter the password."
            : "This room is open — anyone can join without a password."}
        </p>

        <form className="room-settings-form" onSubmit={handleSubmit}>
          <label className="room-settings-label">
            {currentHasPassword ? "Change password" : "Set a password"}
          </label>
          {currentHasPassword && (
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Current password"
              required
            />
          )}
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

        {currentHasPassword && (
          <form className="room-settings-form" onSubmit={handleRemovePassword}>
            <label className="room-settings-label">Remove password protection</label>
            <div className="room-settings-row">
              <input
                type="password"
                value={removePasswordInput}
                onChange={(e) => setRemovePasswordInput(e.target.value)}
                placeholder="Current password"
                required
              />
              <button type="submit" disabled={removeStatus === "saving"}>
                {removeStatus === "saving" ? "..." : "Remove"}
              </button>
            </div>
            {removeError && <p className="profile-error">{removeError}</p>}
          </form>
        )}
      </SettingsSection>

      <SettingsSection
        title="Max people"
        meta={`${currentCapacity} / ${MAX_ROOM_CAPACITY}`}
        isOpen={openSection === "capacity"}
        onToggle={() => toggleSection("capacity")}
      >
        <form className="room-settings-form" onSubmit={handleCapacitySubmit}>
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
      </SettingsSection>

      <SettingsSection
        title="Room background"
        meta={currentBackgroundUrl ? "Custom" : "Default"}
        isOpen={openSection === "background"}
        onToggle={() => toggleSection("background")}
      >
        <div className="room-settings-form">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={bgStatus === "uploading"}
          />
          {bgError && <p className="profile-error">{bgError}</p>}
          {bgStatus === "uploading" && <p className="profile-muted">Uploading...</p>}
          {currentBackgroundUrl && (
            <button type="button" onClick={handleReset} disabled={bgStatus === "uploading"}>
              Reset to default map
            </button>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}
