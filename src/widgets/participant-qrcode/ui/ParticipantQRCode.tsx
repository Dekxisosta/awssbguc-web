"use client";

import { QRCodeSVG } from "qrcode.react";

interface ParticipantQRCodeProps {
  token: string;
  appUrl?: string;
  size?: number;
}

export function ParticipantQRCode({ token, appUrl, size = 256 }: ParticipantQRCodeProps) {
  const base =
    appUrl ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const qrValue = `${base}/check-in/p/${token}`;

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="rounded-xl border border-neutral-700 bg-white p-3">
        <QRCodeSVG value={qrValue} size={size} level="M" />
      </div>
      <p className="font-mono text-xs text-neutral-500">
        {token.slice(0, 8)}…{token.slice(-8)}
      </p>
    </div>
  );
}
