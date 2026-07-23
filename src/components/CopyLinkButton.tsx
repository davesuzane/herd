// src/components/CopyLinkButton.tsx
"use client";
import { useState } from "react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-line text-ink-faint hover:text-ink-dim hover:border-ink-faint transition"
    >
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}
