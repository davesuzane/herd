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

  // 1. Fetch authenticated user first
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Fetch profile next
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

  // 3. Now it is safe to use profile.id and user.id
  let isAdded = false;
  let addedByCount = 0;

  const { data: countRow } = await supabase
    .from("connection_counts")
    .select("added_by_count")
    .eq("added_id", profile.id)
    .maybeSingle();

  addedByCount = countRow?.added_by_count ?? 0;

  if (user) {
    const { data: existingConnection } = await supabase
      .from("connections")
      .select("id")
      .eq("owner_id", user.id)
      .eq("added_id", profile.id)
      .maybeSingle();

    isAdded = !!existingConnection;
  }

  // 4. Remaining database queries
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
  const { data: followingRow } = await supabase
    .from("following_counts")
    .select("following_count")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const { data: followerRow } = await supabase
    .from("follower_counts")
    .select("follower_count")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const { data: friendRow } = await supabase
    .from("friend_counts")
    .select("friend_count")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const { data: photos } = await supabase
    .from("profile_photos")
    .select("id, image_url")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });
  return (
    <ProfileClient
      profile={profile}
      emojiSummary={emojiSummary || []}
      myVote={myVote}
      currentUserId={user?.id ?? null}
      apis={apis || []}
      methods={methods || []}
      links={links || []}
      isAdded={isAdded}
      addedByCount={addedByCount}
      followingCount={followingRow?.following_count ?? 0}
      followerCount={followerRow?.follower_count ?? 0}
      friendCount={friendRow?.friend_count ?? 0}
      photos={photos || []}
    />
  );
}
