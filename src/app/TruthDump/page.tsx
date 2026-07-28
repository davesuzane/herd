import {
  Archive,
  Flag,
  Link2,
  ImageIcon,
  Users,
  Sparkles,
  ShieldCheck,
  MapPinned,
  Camera,
  FileText,
} from "lucide-react";

export default function Dumpster() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-6 text-white">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <section className="w-full max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-900/80 p-10 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <Archive className="h-12 w-12 animate-pulse text-emerald-400" />
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-300">
            <Sparkles className="h-4 w-4" />
            Coming Soon
          </div>

          <h1 className="mt-8 text-5xl font-black tracking-tight">
            Community Reports
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            A place where the community investigates online claims, reports
            local issues, and contributes evidence that helps everyone stay
            informed.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<Link2 className="h-6 w-6" />}
            title="Submit Articles"
            desc="Share news, tweets, videos, or any online claim."
          />

          <Feature
            icon={<ImageIcon className="h-6 w-6" />}
            title="Upload Evidence"
            desc="Attach screenshots, photos, or documents."
          />

          <Feature
            icon={<Flag className="h-6 w-6" />}
            title="Explain Your Report"
            desc="Describe missing context, misinformation, or inaccuracies."
          />

          <Feature
            icon={<Users className="h-6 w-6" />}
            title="Community Review"
            desc="Everyone can add evidence and different perspectives."
          />

          <Feature
            icon={<MapPinned className="h-6 w-6" />}
            title="Local Issues"
            desc="Report potholes, broken lights, litter, unsafe roads, and more."
          />

          <Feature
            icon={<Camera className="h-6 w-6" />}
            title="Photo Proof"
            desc="Show exactly what's happening in your neighbourhood."
          />

          <Feature
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Request Re-review"
            desc="Ask the community to reassess a report."
          />

          <Feature
            icon={<FileText className="h-6 w-6" />}
            title="Official Sources"
            desc="Support reports with government documents or trusted sources."
          />

          <Feature
            icon={<Sparkles className="h-6 w-6" />}
            title="Built by Everyone"
            desc="Knowledge improves when evidence comes from many people."
          />
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
          <h2 className="text-3xl font-bold">
            Help improve both the internet and your community.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
            Soon you'll be able to submit online claims for review, upload
            supporting evidence, report local infrastructure problems, suggest
            additional context, and help others verify information
            together(anonymously).
          </p>

          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-sm uppercase tracking-widest text-emerald-400">
              Our philosophy
            </p>

            <p className="mt-3 text-xl font-semibold">
              "Truth isn't owned by one source. It's strengthened by evidence
              from many."
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl">
      <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
        {icon}
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-zinc-400">{desc}</p>
    </div>
  );
}
