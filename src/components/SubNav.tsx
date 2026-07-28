// src/components/SubNav.tsx

import Link from "next/link";

export default function SubNav() {
  return (
    <div className="border-b border-line bg-bg-alt">
      <div className="max-w-5xl mx-auto px-6 h-10 flex items-center gap-6">
        <Link
          href="/leaked"
          className="text-xs font-mono text-ink-faint hover:text-ink-dim transition"
        >
          Leaked
        </Link>
        <Link
          href="/util-sites"
          className="text-xs font-mono text-ink-faint hover:text-ink-dim transition"
        >
          Util Sites
        </Link>
        <Link
          href="/methods"
          className="text-xs font-mono text-ink-faint hover:text-ink-dim transition"
        >
          Methods
        </Link>
        <Link
          href="/myparty"
          className="text-xs font-mono text-ink-faint hover:text-ink-dim transition"
        >
          party
        </Link>
        <Link
          href="/TruthDump"
          className="text-xs font-mono text-ink-faint hover:text-ink-dim transition"
        >
          TruthDump
        </Link>
      </div>
    </div>
  );
}
