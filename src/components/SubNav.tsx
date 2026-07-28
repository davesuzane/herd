// src/components/SubNav.tsx

import Link from "next/link";

export default function SubNav() {
  return (
    <div className="border-b border-line bg-bg-alt">
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
    </div>
  );
}
