// src/components/HerdisClient.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { validateFile } from "@/utils/validateFile";
import { getVideoDuration } from "@/utils/getVideoDuration";
import { generateThumbnail } from "@/utils/generateThumbnail";

type Item = {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  username: string;
  likeCount: number;
  liked: boolean;
  viewCount: number;
};

export default function HerdisClient({
  items,
  currentUserId,
}: {
  items: Item[];
  currentUserId: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [list, setList] = useState(items);
  const [showUpload, setShowUpload] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [sendFor, setSendFor] = useState<string | null>(null);
  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setList(items);
  }, [items]);

  async function toggleLike(id: string) {
    if (!currentUserId) {
      router.push("/login?redirect=/herdis");
      return;
    }
    const item = list.find((i) => i.id === id);
    if (!item) return;

    if (item.liked) {
      await supabase
        .from("herdis_likes")
        .delete()
        .eq("herdi_id", id)
        .eq("user_id", currentUserId);
    } else {
      await supabase
        .from("herdis_likes")
        .insert({ herdi_id: id, user_id: currentUserId });
    }
    setList((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              liked: !i.liked,
              likeCount: i.likeCount + (i.liked ? -1 : 1),
            }
          : i,
      ),
    );
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const validationError = validateFile(file, {
      maxSizeMB: 25,
      allowedTypes: ["video/mp4", "video/webm"],
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function confirmUpload() {
    if (!pendingFile || !currentUserId) return;
    setError("");

    try {
      const duration = await getVideoDuration(pendingFile);
      if (duration > 30) {
        setError("Keep it under 30 seconds.");
        return;
      }
    } catch {
      setError("Could not read that video.");
      return;
    }

    setUploading(true);

    const ext =
      pendingFile.name
        .split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase() || "mp4";
    const videoPath = `${currentUserId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("herdis")
      .upload(videoPath, pendingFile);

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: videoUrlData } = supabase.storage
      .from("herdis")
      .getPublicUrl(videoPath);

    let thumbnailUrl: string | null = null;
    try {
      const thumbBlob = await generateThumbnail(pendingFile);
      const thumbPath = `${currentUserId}/${crypto.randomUUID()}-thumb.jpg`;
      const { error: thumbError } = await supabase.storage
        .from("herdis")
        .upload(thumbPath, thumbBlob);
      if (!thumbError) {
        const { data: thumbUrlData } = supabase.storage
          .from("herdis")
          .getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      }
    } catch {
      // non-fatal
    }

    const { error: insertError } = await supabase.from("herdis").insert({
      profile_id: currentUserId,
      video_url: videoUrlData.publicUrl,
      thumbnail_url: thumbnailUrl,
      caption: caption || null,
    });

    setUploading(false);

    if (insertError) {
      setError(`Post failed: ${insertError.message}`);
      return;
    }

    setShowUpload(false);
    setPendingFile(null);
    setPreviewUrl(null);
    setCaption("");
    router.refresh();
  }

  function trackView(id: string) {
    if (viewedRef.current.has(id)) return;
    viewedRef.current.add(id);
    supabase.rpc("increment_herdi_view", { target_id: id });
    setList((prev) =>
      prev.map((i) => (i.id === id ? { ...i, viewCount: i.viewCount + 1 } : i)),
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="fixed top-[132px] right-4 z-40">
        <button
          onClick={() =>
            currentUserId
              ? setShowUpload(true)
              : router.push("/login?redirect=/herdis")
          }
          className="w-12 h-12 rounded-full bg-tag text-[#1a2015] text-2xl flex items-center justify-center shadow-lg hover:brightness-110 transition"
        >
          +
        </button>
      </div>

      {showUpload && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          onClick={() => setShowUpload(false)}
        >
          <div
            className="bg-surface border border-line rounded-xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display font-bold text-lg mb-3">
              Post a Herdi
            </h2>

            {previewUrl ? (
              <video
                src={previewUrl}
                className="w-full rounded-lg mb-3 max-h-64 object-contain bg-black"
                controls
              />
            ) : (
              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={pickFile}
                className="text-sm text-ink-dim file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-surface-2 file:text-ink-dim file:text-xs mb-3"
              />
            )}

            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm mb-3 focus:outline-none focus:border-tag transition"
            />
            <p className="text-[10px] text-ink-faint mb-2">Up to 30 seconds.</p>
            {error && <p className="text-xs text-flag mb-2">{error}</p>}

            {previewUrl && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPendingFile(null);
                    setPreviewUrl(null);
                  }}
                  className="flex-1 text-xs font-mono border border-line text-ink-dim py-2 rounded hover:border-ink-faint transition"
                >
                  Choose different
                </button>
                <button
                  onClick={confirmUpload}
                  disabled={uploading}
                  className="flex-1 text-xs font-mono bg-tag text-[#1a2015] font-semibold py-2 rounded hover:brightness-110 transition disabled:opacity-60"
                >
                  {uploading ? "Posting…" : "Post it"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <HerdisPlayer
        list={list}
        onLike={toggleLike}
        onView={trackView}
        onComment={(id) => setCommentsFor(id)}
        onSend={(id) => setSendFor(id)}
      />

      {commentsFor && (
        <CommentsDrawer
          herdiId={commentsFor}
          currentUserId={currentUserId}
          onClose={() => setCommentsFor(null)}
        />
      )}
      {sendFor && (
        <SendToDmModal
          herdiId={sendFor}
          currentUserId={currentUserId}
          onClose={() => setSendFor(null)}
        />
      )}
    </div>
  );
}

// ---------- The custom shorts player ----------

function HerdisPlayer({
  list,
  onLike,
  onView,
  onComment,
  onSend,
}: {
  list: Item[];
  onLike: (id: string) => void;
  onView: (id: string) => void;
  onComment: (id: string) => void;
  onSend: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const transitioningRef = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Plays exactly one video, pauses the rest. Called SYNCHRONOUSLY from
  // inside the gesture handlers below (wheel/touch/key), not from a
  // useEffect — iOS Safari silently blocks .play() if it isn't called
  // directly within the user gesture's own call stack. That's what was
  // causing the video to "disappear" (go black/frozen) after swiping.
  function playAt(i: number) {
    videoRefs.current.forEach((v, vi) => {
      if (!v) return;
      if (vi === i) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }

  // Handles the very first video on initial mount only — every
  // subsequent change goes through goTo(), which plays synchronously.
  useEffect(() => {
    playAt(index);
    if (list[index]) onView(list[index].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goTo(newIndex: number) {
    if (transitioningRef.current) return;
    const clamped = Math.max(0, Math.min(list.length - 1, newIndex));
    if (clamped === index) return;

    transitioningRef.current = true;
    playAt(clamped);
    setIndex(clamped);
    if (list[clamped]) onView(list[clamped].id);
    setTimeout(() => {
      transitioningRef.current = false;
    }, 320);
  }

  function handleWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaY) < 15) return;
    goTo(e.deltaY > 0 ? index + 1 : index - 1);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 50) goTo(delta > 0 ? index + 1 : index - 1);
    touchStartY.current = null;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      goTo(index + 1);
    }
    if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      goTo(index - 1);
    }
  }

  if (list.length === 0) {
    return (
      <div className="h-[100dvh] flex items-center justify-center text-ink-faint text-sm">
        No Herdis yet — post the first one.
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
      className="relative h-[calc(100dvh-132px)] overflow-hidden outline-none w-full"
    >
      <div
        className="transition-transform duration-300 ease-out"
        style={{ transform: `translateY(-${index * 100}%)` }}
      >
        {list.map((item, i) => (
          <HerdiSlide
            key={item.id}
            item={item}
            isActive={i === index}
            muted={muted}
            setMuted={setMuted}
            videoRef={(el) => {
              videoRefs.current[i] = el;
            }}
            onLike={onLike}
            onComment={() => onComment(item.id)}
            onSend={() => onSend(item.id)}
          />
        ))}
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
        {list.map((_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full transition ${i === index ? "bg-tag" : "bg-white/20"}`}
          />
        ))}
      </div>
    </div>
  );
}

function HerdiSlide({
  item,
  isActive,
  muted,
  setMuted,
  videoRef,
  onLike,
  onComment,
  onSend,
}: {
  item: Item;
  isActive: boolean;
  muted: boolean;
  setMuted: (fn: (m: boolean) => boolean) => void;
  videoRef: (el: HTMLVideoElement | null) => void;
  onLike: (id: string) => void;
  onComment: () => void;
  onSend: () => void;
}) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  function setRefs(el: HTMLVideoElement | null) {
    localRef.current = el;
    videoRef(el);
  }

  function togglePlay() {
    const v = localRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function handleTimeUpdate() {
    const v = localRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/herdis/${item.id}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="h-[calc(100dvh-132px)] w-full relative flex items-center justify-center bg-black overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-10">
        <div
          className="h-full bg-tag"
          style={{ width: `${isActive ? progress : 0}%` }}
        />
      </div>

      <video
        ref={setRefs}
        src={item.videoUrl}
        poster={item.thumbnailUrl ?? undefined}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
      />

      {!playing && isActive && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <span className="text-6xl text-white/85">▶</span>
        </button>
      )}

      <button
        onClick={() => setMuted((m) => !m)}
        className="absolute top-4 right-4 text-white text-xl z-10"
      >
        {muted ? "🔇" : "🔊"}
      </button>

      <div className="absolute bottom-6 left-4 right-16 text-white z-10">
        <Link
          href={`/u/${item.username}`}
          className="font-mono text-sm font-semibold"
        >
          @{item.username}
        </Link>
        {item.caption && <p className="text-sm mt-1">{item.caption}</p>}
        <p className="text-[10px] text-white/60 mt-1 font-mono">
          {item.viewCount} views
        </p>
      </div>

      <div className="absolute bottom-6 right-4 flex flex-col items-center gap-4 z-10">
        <button
          onClick={() => onLike(item.id)}
          className="flex flex-col items-center gap-1"
        >
          <span className={`text-3xl ${item.liked ? "" : "opacity-60"}`}>
            {item.liked ? "❤️" : "🤍"}
          </span>
          <span className="text-white text-xs font-mono">{item.likeCount}</span>
        </button>
        <button
          onClick={onComment}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-2xl opacity-80">💬</span>
        </button>
        <button onClick={onSend} className="flex flex-col items-center gap-1">
          <span className="text-2xl opacity-80">➤</span>
        </button>
        <button
          onClick={copyShareLink}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-2xl opacity-80">🔗</span>
          {copied && (
            <span className="text-white text-[9px] font-mono">Copied</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------- Unchanged from before ----------

function CommentsDrawer({
  herdiId,
  currentUserId,
  onClose,
}: {
  herdiId: string;
  currentUserId: string | null;
  onClose: () => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [comments, setComments] = useState<any[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("herdis_comments")
        .select("id, user_id, body, created_at")
        .eq("herdi_id", herdiId)
        .order("created_at");
      setComments(data || []);
      const ids = [...new Set((data || []).map((c) => c.user_id))];
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", ids);
        const map: Record<string, string> = {};
        profiles?.forEach((p) => {
          map[p.id] = p.username;
        });
        setUsernames(map);
      }
    }
    load();
  }, [herdiId]);

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) {
      router.push("/login?redirect=/herdis");
      return;
    }
    if (!body.trim()) return;

    const { data } = await supabase
      .from("herdis_comments")
      .insert({ herdi_id: herdiId, user_id: currentUserId, body })
      .select()
      .single();
    if (data) {
      setComments((prev) => [...prev, data]);
      setBody("");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-h-[70vh] rounded-t-xl p-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-display font-semibold">Comments</h3>
          <button onClick={onClose} className="text-ink-faint">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-mono text-xs text-tag mr-2">
                {usernames[c.user_id] ?? "…"}
              </span>
              {c.body}
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-ink-faint">No comments yet.</p>
          )}
        </div>
        <form onSubmit={postComment} className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment"
            className="flex-1 bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-tag transition"
          />
          <button
            type="submit"
            className="text-xs font-mono bg-tag text-[#1a2015] font-semibold px-4 rounded hover:brightness-110 transition"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

function SendToDmModal({
  herdiId,
  currentUserId,
  onClose,
}: {
  herdiId: string;
  currentUserId: string | null;
  onClose: () => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId) {
      router.push("/login?redirect=/herdis");
      return;
    }
    setStatus("");

    const { data: target } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", username.trim())
      .maybeSingle();
    if (!target) {
      setStatus("No user with that username.");
      return;
    }

    const [userA, userB] = [currentUserId, target.id].sort();
    const { data: existing } = await supabase
      .from("dm_conversations")
      .select("id")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .maybeSingle();

    let conversationId = existing?.id;
    if (!conversationId) {
      const { data: created, error } = await supabase
        .from("dm_conversations")
        .insert({ user_a: userA, user_b: userB })
        .select()
        .single();
      if (error) {
        setStatus(error.message);
        return;
      }
      conversationId = created.id;
    }

    const link = `${window.location.origin}/herdis/${herdiId}`;
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: `Sent a Herdi: ${link}`,
    });

    setStatus("Sent ✓");
    setTimeout(() => {
      onClose();
      router.push(`/chat?dm=${target.username}`);
    }, 700);
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <form
        onSubmit={send}
        className="bg-surface border border-line rounded-xl p-6 max-w-xs w-full space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-semibold">Send this Herdi</h3>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          className="w-full bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-tag transition"
        />
        {status && <p className="text-xs text-ink-faint">{status}</p>}
        <button
          type="submit"
          className="w-full text-xs font-mono bg-tag text-[#1a2015] font-semibold py-2 rounded hover:brightness-110 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
