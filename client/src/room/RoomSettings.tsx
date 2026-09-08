import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  MAX_ROOM_CAPACITY,
  changeRoomCapacity,
  changeRoomName,
  changeRoomPassword,
  changeRoomPermissions,
  removeRoomPassword,
  resetRoomBackground,
  uploadRoomBackground,
} from "../lib/api";
import { SettingsSection } from "./SettingsSection";

type SectionKey = "name" | "password" | "capacity" | "background" | "permissions" | "chat" | "timerControl";

interface RoomSettingsProps {
  roomId: string;
  token: string | null;
  currentUserId: string | null;
  creatorId: string | null;
  currentName: string;
  onNameChange: (name: string) => void;
  currentBackgroundUrl: string | null;
  onBackgroundChange: (url: string | null) => void;
  currentCapacity: number;
  onCapacityChange: (maxCapacity: number) => void;
  currentHasPassword: boolean;
  onHasPasswordChange: (hasPassword: boolean) => void;
  allowNameChangeByMembers: boolean;
  allowBackgroundChangeByMembers: boolean;
  disableChatDuringSharedTimer: boolean;
  restrictTimerControlToCreator: boolean;
  onPermissionsChange: (next: {
    allowNameChangeByMembers: boolean;
    allowBackgroundChangeByMembers: boolean;
    disableChatDuringSharedTimer: boolean;
    restrictTimerControlToCreator: boolean;
  }) => void;
}

function roomPasswordKey(roomId: string) {
  return `studyxp.roomPassword.${roomId}`;
}

export function RoomSettings({
  roomId,
  token,
  currentUserId,
  creatorId,
  currentName,
  onNameChange,
  currentBackgroundUrl,
  onBackgroundChange,
  currentCapacity,
  onCapacityChange,
  currentHasPassword,
  onHasPasswordChange,
  allowNameChangeByMembers,
  allowBackgroundChangeByMembers,
  disableChatDuringSharedTimer,
  restrictTimerControlToCreator,
  onPermissionsChange,
}: RoomSettingsProps) {
  const isCreator = !!currentUserId && currentUserId === creatorId;
  const canEditName = isCreator || allowNameChangeByMembers;
  const canEditBackground = isCreator || allowBackgroundChangeByMembers;
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);
  const toggleSection = (key: SectionKey) => setOpenSection((prev) => (prev === key ? null : key));

  const [nameDraft, setNameDraft] = useState(currentName);
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "done">("idle");
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordAction, setPasswordAction] = useState<"idle" | "set" | "change" | "remove">("idle");
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
  const [permissionsStatus, setPermissionsStatus] = useState<"idle" | "saving">("idle");
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!token) {
    return <p className="profile-muted">Sign in to view this room's settings.</p>;
  }

  if (!canEditName && !canEditBackground) {
    return <p className="profile-muted">Only the room creator can change room settings.</p>;
  }

  const handlePermissionToggle = async (
    field:
      | "allowNameChangeByMembers"
      | "allowBackgroundChangeByMembers"
      | "disableChatDuringSharedTimer"
      | "restrictTimerControlToCreator",
  ) => {
    const current = {
      allowNameChangeByMembers,
      allowBackgroundChangeByMembers,
      disableChatDuringSharedTimer,
      restrictTimerControlToCreator,
    };
    const next = { ...current, [field]: !current[field] };
    setPermissionsStatus("saving");
    setPermissionsError(null);
    try {
      const updated = await changeRoomPermissions(token, roomId, { [field]: next[field] });
      onPermissionsChange(updated);
    } catch (err) {
      setPermissionsError(err instanceof Error ? err.message : "Failed to update permissions");
    } finally {
      setPermissionsStatus("idle");
    }
  };

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

  const handleTogglePassword = () => {
    setError(null);
    setRemoveError(null);
    if (currentHasPassword) {
      setPasswordAction((prev) => (prev === "idle" ? "remove" : "idle"));
    } else {
      setPasswordAction((prev) => (prev === "idle" ? "set" : "idle"));
    }
    setOldPassword("");
    setNewPassword("");
    setRemovePasswordInput("");
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
      setPasswordAction("idle");
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
      setPasswordAction("idle");
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
      {canEditName && (
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
      )}

      {isCreator && (
        <SettingsSection
          title="Password protection"
          meta={currentHasPassword ? "Protected" : "Open"}
          isOpen={openSection === "password"}
          onToggle={() => toggleSection("password")}
        >
          <label className="room-settings-toggle">
            <input
              type="checkbox"
              checked={passwordAction === "idle" ? currentHasPassword : passwordAction !== "remove"}
              onChange={handleTogglePassword}
            />
            Require a password to join
          </label>
          <p className="profile-muted">
            {currentHasPassword
              ? "Anyone joining this room must enter the password."
              : "This room is open — anyone can join without a password."}
          </p>

          {passwordAction === "set" && (
            <form className="room-settings-form" onSubmit={handleSubmit}>
              <label className="room-settings-label">Set a password</label>
              <div className="room-settings-row">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  minLength={4}
                  required
                  autoFocus
                />
                <button type="submit" disabled={status === "saving"}>
                  {status === "saving" ? "..." : "Save"}
                </button>
                <button type="button" onClick={() => setPasswordAction("idle")}>
                  Cancel
                </button>
              </div>
              {error && <p className="profile-error">{error}</p>}
            </form>
          )}

          {passwordAction === "remove" && (
            <form className="room-settings-form" onSubmit={handleRemovePassword}>
              <label className="room-settings-label">Confirm current password to disable</label>
              <div className="room-settings-row">
                <input
                  type="password"
                  value={removePasswordInput}
                  onChange={(e) => setRemovePasswordInput(e.target.value)}
                  placeholder="Current password"
                  required
                  autoFocus
                />
                <button type="submit" disabled={removeStatus === "saving"}>
                  {removeStatus === "saving" ? "..." : "Confirm"}
                </button>
                <button type="button" onClick={() => setPasswordAction("idle")}>
                  Cancel
                </button>
              </div>
              {removeError && <p className="profile-error">{removeError}</p>}
            </form>
          )}

          {status === "done" && passwordAction === "idle" && (
            <p className="room-settings-success">Password updated.</p>
          )}

          {currentHasPassword && passwordAction === "idle" && (
            <button type="button" className="room-settings-link" onClick={() => setPasswordAction("change")}>
              Change password
            </button>
          )}

          {passwordAction === "change" && (
            <form className="room-settings-form" onSubmit={handleSubmit}>
              <label className="room-settings-label">Change password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Current password"
                required
                autoFocus
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
                <button type="button" onClick={() => setPasswordAction("idle")}>
                  Cancel
                </button>
              </div>
              {error && <p className="profile-error">{error}</p>}
            </form>
          )}
        </SettingsSection>
      )}

      {isCreator && (
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
      )}

      {canEditBackground && (
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
      )}

      {isCreator && (
        <SettingsSection
          title="Member permissions"
          meta={
            allowNameChangeByMembers && allowBackgroundChangeByMembers
              ? "Name, background"
              : allowNameChangeByMembers
                ? "Name"
                : allowBackgroundChangeByMembers
                  ? "Background"
                  : "Creator only"
          }
          isOpen={openSection === "permissions"}
          onToggle={() => toggleSection("permissions")}
        >
          <p className="profile-muted">Let anyone in the room (not just you) change these:</p>
          <label className="room-settings-toggle">
            <input
              type="checkbox"
              checked={allowNameChangeByMembers}
              disabled={permissionsStatus === "saving"}
              onChange={() => handlePermissionToggle("allowNameChangeByMembers")}
            />
            Room name
          </label>
          <label className="room-settings-toggle">
            <input
              type="checkbox"
              checked={allowBackgroundChangeByMembers}
              disabled={permissionsStatus === "saving"}
              onChange={() => handlePermissionToggle("allowBackgroundChangeByMembers")}
            />
            Room background
          </label>
          {permissionsError && <p className="profile-error">{permissionsError}</p>}
        </SettingsSection>
      )}

      {isCreator && (
        <SettingsSection
          title="Chat"
          meta={disableChatDuringSharedTimer ? "Paused during timer" : "Always on"}
          isOpen={openSection === "chat"}
          onToggle={() => toggleSection("chat")}
        >
          <label className="room-settings-toggle">
            <input
              type="checkbox"
              checked={disableChatDuringSharedTimer}
              disabled={permissionsStatus === "saving"}
              onChange={() => handlePermissionToggle("disableChatDuringSharedTimer")}
            />
            Disable chat while the shared timer is running
          </label>
          <p className="profile-muted">Everyone's chat locks automatically whenever the shared study timer is active.</p>
          {permissionsError && <p className="profile-error">{permissionsError}</p>}
        </SettingsSection>
      )}

      {isCreator && (
        <SettingsSection
          title="Shared timer control"
          meta={restrictTimerControlToCreator ? "Creator only" : "Everyone"}
          isOpen={openSection === "timerControl"}
          onToggle={() => toggleSection("timerControl")}
        >
          <label className="room-settings-toggle">
            <input
              type="checkbox"
              checked={restrictTimerControlToCreator}
              disabled={permissionsStatus === "saving"}
              onChange={() => handlePermissionToggle("restrictTimerControlToCreator")}
            />
            Only the room creator can start/pause/reset the shared timer
          </label>
          <p className="profile-muted">
            {restrictTimerControlToCreator
              ? "Members can view the shared timer but can't start, pause, or reset it."
              : "Anyone in the room can start, pause, or reset the shared timer."}
          </p>
          {permissionsError && <p className="profile-error">{permissionsError}</p>}
        </SettingsSection>
      )}
    </div>
  );
}
