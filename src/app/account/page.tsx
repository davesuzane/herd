// src/app/account/page.tsx
"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showStatus, setShowStatus] = useState(true);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("show_online_status")
        .eq("id", data.user.id)
        .single();
      setShowStatus(profile?.show_online_status ?? true);
    });
  }, []);
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
    window.location.reload(); // simplest way to re-run the presence provider with the new setting
  }
  const supabase = createClient();
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

    setAvatarUploading(false);
    window.location.reload();
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
      "Check your inbox to confirm — your account will switch to email login once confirmed.",
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-24 px-6">
      <div className="bg-surface border border-line rounded-xl p-8">
        <div className="bg-surface border border-line rounded-xl p-8 mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg">Online status</h2>
            <p className="text-xs text-ink-faint mt-1">
              Let others see when you're active
            </p>
          </div>
          <button
            onClick={toggleStatus}
            className={`text-xs font-mono px-4 py-2 rounded-full border transition ${
              showStatus
                ? "border-safe-dim text-safe"
                : "border-line text-ink-faint"
            }`}
          >
            {showStatus ? "Visible" : "Hidden"}
          </button>
        </div>
        <h1 className="font-display font-bold text-2xl mb-1">Add an email</h1>
        <p className="text-sm text-ink-faint mb-6">
          Keeps your account recoverable even if you lose your code.
        </p>
        <form onSubmit={handleAddEmail} className="space-y-3">
          <div className="bg-surface border border-line rounded-xl p-8 mb-4">
            <h2 className="font-display font-bold text-lg mb-3">
              Profile picture
            </h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={avatarUploading}
              className="text-sm text-ink-dim file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-surface-2 file:text-ink-dim file:text-xs"
            />
            {avatarUploading && (
              <p className="text-xs text-ink-faint mt-2">Uploading…</p>
            )}
            {avatarError && (
              <p className="text-xs text-flag mt-2">{avatarError}</p>
            )}
          </div>
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-bg-alt border border-line rounded px-3 py-2.5 text-sm focus:outline-none focus:border-ink-faint transition"
            required
          />
          {error && <p className="text-flag text-xs">{error}</p>}
          {message && <p className="text-tag text-xs">{message}</p>}
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
