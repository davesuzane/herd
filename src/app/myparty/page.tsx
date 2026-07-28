import {
  Construction,
  Users,
  PlayCircle,
  MessageCircle,
  History,
  Sparkles,
} from "lucide-react";

export default function MyParty() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-6 text-white">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-10 top-40 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <section className="w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-900/80 p-10 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10">
            <Construction className="h-12 w-12 animate-pulse text-yellow-400" />
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-1 text-sm font-medium text-yellow-300">
            <Sparkles className="h-4 w-4" />
            Under Construction
          </div>

          <h1 className="mt-8 text-5xl font-extrabold tracking-tight">
            MyParty
          </h1>

          <p className="mt-4 text-lg text-zinc-400">
            Watch movies and TV shows together with your friends.
          </p>

          {/* Progress */}
          <div className="mx-auto mt-10 max-w-md">
            <div className="mb-2 flex justify-between text-sm text-zinc-400">
              <span>Development Progress</span>
              <span>65%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-yellow-400 to-orange-500" />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Card
            icon={<Users className="h-6 w-6" />}
            title="Watch Together"
            desc="Create rooms and invite your mates."
          />

          <Card
            icon={<PlayCircle className="h-6 w-6" />}
            title="Synced Playback"
            desc="Everyone watches at the exact same moment."
          />

          <Card
            icon={<MessageCircle className="h-6 w-6" />}
            title="Live Chat"
            desc="Chat while watching without leaving the room."
          />

          <Card
            icon={<History className="h-6 w-6" />}
            title="Watch History"
            desc="Share everything you've watched—or pretend you did 👀."
          />
        </div>

        {/* Bottom Card */}
        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 text-center">
          <p className="text-lg font-semibold">
            🚀 We're actively building MyParty.
          </p>

          <p className="mt-3 text-zinc-400">
            Soon you'll be able to choose your preferred streaming source,
            configure your party settings, and enjoy synchronized watch parties
            with friends.
          </p>
        </div>
      </section>
    </main>
  );
}

function Card({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-yellow-500/40 hover:shadow-xl">
      <div className="mb-4 inline-flex rounded-xl bg-yellow-500/10 p-3 text-yellow-400">
        {icon}
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-zinc-400">{desc}</p>
    </div>
  );
}
