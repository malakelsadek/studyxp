import { useEffect, useState } from "react";
import { getProfile, updateProfile, type UserProfile } from "../lib/api";
import { formatDurationLong } from "../room/timerMath";
import { useAuth } from "../auth/AuthContext";
import { ActivityHeatmap } from "./ActivityHeatmap";
import "./Profile.css";

interface ProfileModalProps {
  userId: string;
  isGuest: boolean;
  fallbackDisplayName: string;
  currentUserId: string;
  token: string | null;
  onClose: () => void;
}

export function ProfileModal({
  userId,
  isGuest,
  fallbackDisplayName,
  currentUserId,
  token,
  onClose,
}: ProfileModalProps) {
  const { updateDisplayName } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!isGuest);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");
  const [interestsDraft, setInterestsDraft] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;
    setLoading(true);
    getProfile(userId)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setDisplayNameDraft(p.displayName);
        setBioDraft(p.bio);
        setInterestsDraft(p.interests);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, isGuest]);

  const isSelf = userId === currentUserId;

  const handleSave = async () => {
    if (!token || !displayNameDraft.trim()) return;
    setSaving(true);
    try {
      const updated = await updateProfile(token, {
        displayName: displayNameDraft.trim(),
        bio: bioDraft,
        interests: interestsDraft,
      });
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      if (isSelf) updateDisplayName(updated.displayName);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {isGuest ? (
          <>
            <h2>{fallbackDisplayName} (guest)</h2>
            <p className="profile-muted">Guests don't have profiles.</p>
          </>
        ) : loading ? (
          <p className="profile-muted">Loading profile...</p>
        ) : error ? (
          <p className="profile-error">{error}</p>
        ) : profile ? (
          <>
            <h2>{profile.displayName}</h2>

            {editing ? (
              <>
                <input
                  className="display-name-editor"
                  value={displayNameDraft}
                  onChange={(e) => setDisplayNameDraft(e.target.value)}
                  maxLength={24}
                  placeholder="Display name"
                />
                <textarea
                  className="bio-editor"
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  maxLength={300}
                  placeholder="Write a short bio..."
                />
                <InterestsEditor interests={interestsDraft} onChange={setInterestsDraft} />
                <div className="profile-actions">
                  <button onClick={handleSave} disabled={saving || !displayNameDraft.trim()}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="profile-bio">
                  {profile.bio || (isSelf ? "No bio yet — click Edit to add one." : "No bio yet.")}
                </p>
                {profile.interests.length > 0 && (
                  <div className="interest-tags">
                    {profile.interests.map((tag) => (
                      <span key={tag} className="interest-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {isSelf && (
                  <button className="profile-edit-btn" onClick={() => setEditing(true)}>
                    Edit profile
                  </button>
                )}
              </>
            )}

            <div className="profile-stats">
              <div className="stat-tile">
                <div className="stat-value">{formatDurationLong(profile.stats.totalTodayMs)}</div>
                <div className="stat-label">Today</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value">{formatDurationLong(profile.stats.totalWeekMs)}</div>
                <div className="stat-label">This week</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value">{formatDurationLong(profile.stats.totalAllTimeMs)}</div>
                <div className="stat-label">All time</div>
              </div>
              <div className="stat-tile">
                <div className="stat-value">🔥 {profile.stats.streak}</div>
                <div className="stat-label">Day streak</div>
              </div>
            </div>

            <ActivityHeatmap heatmap={profile.stats.heatmap} />
          </>
        ) : null}
      </div>
    </div>
  );
}

interface InterestsEditorProps {
  interests: string[];
  onChange: (next: string[]) => void;
}

function InterestsEditor({ interests, onChange }: InterestsEditorProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const tag = draft.trim();
    if (!tag || interests.includes(tag) || interests.length >= 10) return;
    onChange([...interests, tag]);
    setDraft("");
  };

  return (
    <div className="interests-editor">
      <div className="interest-tags">
        {interests.map((tag) => (
          <span key={tag} className="interest-tag">
            {tag}
            <button type="button" onClick={() => onChange(interests.filter((t) => t !== tag))}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="interest-input-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Add an interest..."
          maxLength={30}
        />
        <button type="button" onClick={addTag}>
          Add
        </button>
      </div>
    </div>
  );
}
