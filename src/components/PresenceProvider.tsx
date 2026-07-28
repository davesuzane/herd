// src/components/PresenceProvider.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const PresenceContext = createContext<Set<string>>(new Set());
export const useOnlineUsers = () => useContext(PresenceContext);

export default function PresenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("show_online_status")
        .eq("id", user.id)
        .single();

      channel = supabase.channel("online-users", {
        config: { presence: { key: user.id } },
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel!.presenceState();
        setOnlineIds(new Set(Object.keys(state)));
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED" && profile?.show_online_status !== false) {
          await channel!.track({ online_at: new Date().toISOString() });
        }
      });
    }
    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <PresenceContext.Provider value={onlineIds}>
      {children}
    </PresenceContext.Provider>
  );
}
