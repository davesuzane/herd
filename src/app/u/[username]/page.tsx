// src/app/u/[username]/page.tsx
import { createClient } from "@/utils/supabase/server";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile)
    return (
      <div className="max-w-md mx-auto mt-24 px-6 text-ink-dim">
        User not found.
      </div>
    );

  const { data: emojiSummary } = await supabase
    .from("profile_emoji_summary")
    .select("*")
    .eq("profile_id", profile.id)
    .order("votes", { ascending: false });

  const { data: apis } = await supabase
    .from("apis")
    .select("id, name, pricing_type, scan_result")
    .eq("submitted_by", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: methods } = await supabase
    .from("methods")
    .select("id, title")
    .eq("submitted_by", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: links } = await supabase
    .from("useful_links")
    .select("id, url, title")
    .eq("submitted_by", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  let myVote: string | null = null;
  if (user) {
    const { data: existing } = await supabase
      .from("profile_emoji_votes")
      .select("emoji")
      .eq("profile_id", profile.id)
      .eq("voter_id", user.id)
      .maybeSingle();
    myVote = existing?.emoji ?? null;
  }

  return (
    <ProfileClient
      profile={profile}
      emojiSummary={emojiSummary || []}
      myVote={myVote}
      currentUserId={user?.id ?? null}
      apis={apis || []}
      methods={methods || []}
      links={links || []}
    />
  );
}
