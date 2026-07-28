// src/components/FloatingChatButton.tsx
"use client";
import Link from "next/link";

export default function FloatingChatButton() {
  return (
    <Link
      href="/chat"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-tag text-[#1a2015] font-semibold text-sm px-5 py-3 rounded-full shadow-lg hover:brightness-110 hover:scale-105 transition-all"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-safe"></span>
      </span>
      Chat
    </Link>
  );
}
