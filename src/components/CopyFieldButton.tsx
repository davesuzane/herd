// src/components/CopyFieldButton.tsx
"use client";
import { useState } from "react";

export default function CopyFieldButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] font-mono text-ink-faint hover:text-ink-dim transition ml-2"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
