// src/app/chat/page.tsx
import { createClient } from "@/utils/supabase/server";
import ChatClient from "@/components/ChatClient";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: channels } = await supabase
    .from("chat_channels")
    .select("*")
    .order("name");

  let conversations: any[] = [];
  if (user) {
    const { data: convos } = await supabase
      .from("dm_conversations")
      .select("id, user_a, user_b")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

    if (convos) {
      const otherIds = convos.map((c) =>
        c.user_a === user.id ? c.user_b : c.user_a,
      );
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", otherIds);

      conversations = convos.map((c) => {
        const otherId = c.user_a === user.id ? c.user_b : c.user_a;
        return {
          id: c.id,
          otherUsername:
            profiles?.find((p) => p.id === otherId)?.username ?? "someone",
        };
      });
    }
  }

  return (
    <ChatClient
      channels={channels || []}
      conversations={conversations}
      currentUserId={user?.id ?? null}
    />
  );
}
