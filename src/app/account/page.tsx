// src/app/account/page.tsx
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function AccountPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [showStatus, setShowStatus] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url, show_online_status")
        .eq("id", data.user.id)
        .single();

      setUsername(profile?.username ?? "");
      setBio(profile?.bio ?? "");
      setAvatarUrl(profile?.avatar_url ?? null);
      setShowStatus(profile?.show_online_status ?? true);
      setCurrentEmail(data.user.email ?? null);
    });
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setProfileError("Username needs to be at least 3 characters.");
      return;
    }

    setProfileSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: cleanUsername, bio })
      .eq("id", user.id);
    setProfileSaving(false);

    if (error) {
      setProfileError(
        error.message.includes("duplicate")
          ? "That username is taken."
          : error.message,
      );
      return;
    }
    setProfileMessage("Saved ✓");
  }

  async function toggleStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const next = !showStatus;
    await supabase
      .from("profiles")
      .update({ show_online_status: next })
      .eq("id", user.id);
    setShowStatus(next);
    window.location.reload();
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      setAvatarError(uploadError.message);
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id);

    setAvatarUrl(urlData.publicUrl);
    setAvatarUploading(false);
  }

  async function handleAddEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const { error } = await supabase.auth.updateUser(
      { email },
      {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    );

    if (error) {
      setError(error.message);
      return;
    }
    setMessage(
      "Check your inbox to confirm — your account switches to email login once confirmed.",
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-16 px-6 mb-24 space-y-5">
      {/* Header, with the avatar front and center */}
      <div className="text-center">
        <div className="relative inline-block mb-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-2 border-tag"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-surface border-2 border-line flex items-center justify-center text-3xl">
              🐐
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 bg-tag text-[#1a2015] w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer hover:brightness-110 transition shadow-lg">
            📷
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={avatarUploading}
              className="hidden"
            />
          </label>
        </div>
        <h1 className="font-display font-bold text-2xl">Your space</h1>
        {avatarUploading && <p className="text-xs text-tag mt-1">Uploading…</p>}
        {avatarError && <p className="text-xs text-flag mt-1">{avatarError}</p>}
      </div>
      <div className="bg-surface border border-line rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg">📧 Your email</h2>
          <p className="text-xs text-ink-faint mt-1">
            {currentEmail
              ? currentEmail
              : "No email yet — you're on a Quick Access code"}
          </p>
        </div>
      </div>
      {/* Edit profile */}
      <div className="bg-surface border border-line rounded-xl p-6">
        <h2 className="font-display font-bold text-lg mb-1">Who are you? 👋</h2>
        <p className="text-xs text-ink-faint mb-4">
          This is what the herd sees on your profile.
        </p>
        <form onSubmit={handleProfileSave} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase font-mono text-ink-faint block mb-1">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-tag transition"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-mono text-ink-faint block mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people what you're about"
              rows={3}
              maxLength={200}
              className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-tag transition"
            />
          </div>
          {profileError && <p className="text-flag text-xs">{profileError}</p>}
          {profileMessage && (
            <p className="text-safe text-xs">{profileMessage}</p>
          )}
          <button
            type="submit"
            disabled={profileSaving}
            className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition disabled:opacity-60"
          >
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </div>

      {/* Online status */}
      <div className="bg-surface border border-line rounded-xl p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg">
            {showStatus ? "🟢" : "⚪"} Online status
          </h2>
          <p className="text-xs text-ink-faint mt-1">
            Let others see when you're around
          </p>
        </div>
        <button
          onClick={toggleStatus}
          className={`text-xs font-mono px-4 py-2 rounded-full border transition flex-shrink-0 ${
            showStatus
              ? "border-safe-dim text-safe bg-safe-dim/40"
              : "border-line text-ink-faint"
          }`}
        >
          {showStatus ? "Visible" : "Hidden"}
        </button>
      </div>

      {/* Add email */}
      <div className="bg-surface border border-line rounded-xl p-6">
        <h2 className="font-display font-bold text-lg mb-1">
          Back yourself up ✉️
        </h2>
        <p className="text-xs text-ink-faint mb-4">
          Keeps your account recoverable even if you lose your code.
        </p>
        <form onSubmit={handleAddEmail} className="space-y-3">
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-tag transition"
            required
          />
          {error && <p className="text-flag text-xs">{error}</p>}
          {message && <p className="text-safe text-xs">{message}</p>}
          <button
            type="submit"
            className="w-full bg-tag text-[#1a2015] font-semibold py-2.5 rounded hover:brightness-110 transition"
          >
            Send confirmation link
          </button>
        </form>
      </div>
    </div>
  );
}
