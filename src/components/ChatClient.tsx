"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Channel = { id: string; name: string };
type Conversation = { id: string; otherUsername: string };
type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
type Thread = { type: "channel" | "dm"; id: string; label: string };

export default function ChatClient({
  channels,
  conversations,
  currentUserId,
  isAdmin,
}: {
  channels: Channel[];
  conversations: Conversation[];
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [convos, setConvos] = useState(conversations);
  const [thread, setThread] = useState<Thread | null>(
    channels[0]
      ? { type: "channel", id: channels[0].id, label: `#${channels[0].name}` }
      : null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [newDmUsername, setNewDmUsername] = useState("");
  const [dmError, setDmError] = useState("");

  async function ensureUsernames(senderIds: string[]) {
    const missing = [...new Set(senderIds)].filter((id) => !usernames[id]);
    if (missing.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", missing);

    if (data) {
      setUsernames((prev) => {
        const next = { ...prev };
        data.forEach((p) => {
          next[p.id] = p.username;
        });
        return next;
      });
    }
  }

  useEffect(() => {
    if (!thread) return;
    let cancelled = false;

    async function load() {
      const column =
        thread!.type === "channel" ? "channel_id" : "conversation_id";
      const { data } = await supabase
        .from("chat_messages")
        .select("id, sender_id, body, created_at")
        .eq(column, thread!.id)
        .order("created_at", { ascending: true })
        .limit(50);

      if (cancelled) return;
      setMessages(data || []);
      if (data) await ensureUsernames(data.map((m) => m.sender_id));
    }
    load();

    const channel = supabase
      .channel(`messages-${thread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `${thread.type === "channel" ? "channel_id" : "conversation_id"}=eq.${thread.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          await ensureUsernames([newMessage.sender_id]);
          setMessages((prev) => [...prev, newMessage]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
          filter: `${thread.type === "channel" ? "channel_id" : "conversation_id"}=eq.${thread.id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.filter((m) => m.id !== (payload.old as Message).id),
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [thread?.id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !thread) return;
    if (!currentUserId) {
      router.push("/login?redirect=/chat");
      return;
    }

    const payload = {
      channel_id: thread.type === "channel" ? thread.id : null,
      conversation_id: thread.type === "dm" ? thread.id : null,
      sender_id: currentUserId,
      body: input.trim(),
    };

    const { error } = await supabase.from("chat_messages").insert(payload);
    if (!error) setInput("");
  }

  async function deleteMessage(messageId: string) {
    if (!confirm("Delete this message?")) return;
    await supabase.from("chat_messages").delete().eq("id", messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }

  async function startDm(e: React.FormEvent) {
    e.preventDefault();
    setDmError("");
    if (!currentUserId) {
      router.push("/login?redirect=/chat");
      return;
    }

    const username = newDmUsername.trim();
    if (!username) return;

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();

    if (!targetProfile) {
      setDmError("No user with that username.");
      return;
    }
    if (targetProfile.id === currentUserId) {
      setDmError("That's you.");
      return;
    }

    const [userA, userB] = [currentUserId, targetProfile.id].sort();

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
        setDmError(error.message);
        return;
      }
      conversationId = created.id;
      setConvos((prev) => [
        ...prev,
        { id: conversationId!, otherUsername: targetProfile.username },
      ]);
    }

    setThread({
      type: "dm",
      id: conversationId!,
      label: `@${targetProfile.username}`,
    });
    setNewDmUsername("");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pt-12 pb-24 grid md:grid-cols-[220px_1fr] gap-6">
      <aside className="space-y-6">
        <div>
          <h3 className="font-mono text-xs uppercase text-ink-faint mb-2">
            Channels
          </h3>
          <div className="space-y-1">
            {channels.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  setThread({ type: "channel", id: c.id, label: `#${c.name}` })
                }
                className={`block w-full text-left text-sm px-2 py-1.5 rounded transition ${
                  thread?.type === "channel" && thread.id === c.id
                    ? "bg-tag/10 text-tag"
                    : "text-ink-dim hover:bg-surface"
                }`}
              >
                #{c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase text-ink-faint mb-2">
            Direct messages
          </h3>
          <div className="space-y-1 mb-3">
            {convos.map((c) => (
              <button
                key={c.id}
                onClick={() =>
                  setThread({
                    type: "dm",
                    id: c.id,
                    label: `@${c.otherUsername}`,
                  })
                }
                className={`block w-full text-left text-sm px-2 py-1.5 rounded transition ${
                  thread?.type === "dm" && thread.id === c.id
                    ? "bg-tag/10 text-tag"
                    : "text-ink-dim hover:bg-surface"
                }`}
              >
                @{c.otherUsername}
              </button>
            ))}
            {convos.length === 0 && (
              <p className="text-xs text-ink-faint">No DMs yet.</p>
            )}
          </div>

          <form onSubmit={startDm} className="space-y-1">
            <input
              value={newDmUsername}
              onChange={(e) => setNewDmUsername(e.target.value)}
              placeholder="username"
              className="w-full bg-bg-alt border border-line rounded px-2 py-1.5 text-xs focus:outline-none focus:border-ink-faint transition"
            />
            <button
              type="submit"
              className="w-full text-xs font-mono bg-tag text-[#1a2015] font-semibold py-1.5 rounded hover:brightness-110 transition"
            >
              Message
            </button>
            {dmError && <p className="text-[11px] text-flag">{dmError}</p>}
          </form>
        </div>
      </aside>

      <div className="bg-surface border border-line rounded-lg flex flex-col h-[70vh]">
        <div className="px-4 py-3 border-b border-line font-mono text-sm">
          {thread?.label ?? "Pick a channel"}
        </div>

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`text-sm flex items-start justify-between gap-2 group ${
                m.sender_id === currentUserId ? "text-tag" : "text-ink-dim"
              }`}
            >
              <div>
                <span className="font-mono text-xs text-ink-faint mr-2">
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="font-mono text-xs mr-2 opacity-70">
                  {usernames[m.sender_id] ?? "…"}
                </span>
                {m.body}
              </div>
              {(m.sender_id === currentUserId || isAdmin) && (
                <button
                  onClick={() => deleteMessage(m.id)}
                  className="text-[10px] text-flag opacity-0 group-hover:opacity-100 transition flex-shrink-0"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={sendMessage}
          className="p-3 border-t border-line flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-bg-alt border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-ink-faint transition"
          />
          <button
            type="submit"
            className="text-sm font-mono bg-tag text-[#1a2015] font-semibold px-4 rounded hover:brightness-110 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}