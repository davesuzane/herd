// src/components/ProfileShare.tsx
"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function ProfileShare({ username }: { username: string }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/u/${username}`;
    setProfileUrl(url);
    QRCode.toDataURL(url, {
      margin: 1,
      width: 160,
      color: { dark: "#ECE8DC", light: "#1A2620" },
    }).then(setQrDataUrl);
  }, [username]);

  async function copyLink() {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-4 flex flex-col items-center gap-3">
      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrDataUrl} alt="Profile QR code" className="rounded" />
      )}
      <div className="flex items-center gap-2 w-full">
        <span className="flex-1 text-xs font-mono text-ink-faint truncate">
          {profileUrl}
        </span>
        <button
          onClick={copyLink}
          className="text-[10px] font-mono text-tag hover:brightness-110 transition flex-shrink-0"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}
