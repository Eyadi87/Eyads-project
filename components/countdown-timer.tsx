"use client";

import { useEffect, useState } from "react";

interface Props {
  expiresAt: string;
  onExpired?: () => void;
}

export function CountdownTimer({ expiresAt, onExpired }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    if (secondsLeft <= 0) { onExpired?.(); return; }
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) { clearInterval(id); onExpired?.(); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 60;
  const isExpired = secondsLeft === 0;
  const progress = Math.max(0, Math.min(100, (secondsLeft / 600) * 100));

  if (isExpired) {
    return (
      <div className="border border-[#FECACA] bg-[#FEF2F2] rounded-lg px-5 py-4">
        <p className="text-sm font-semibold text-[#DC2626]">Hold expired</p>
        <p className="text-xs text-[#DC2626] mt-0.5">The reserved units have been returned to available stock.</p>
      </div>
    );
  }

  return (
    <div
      className="border rounded-lg px-5 py-4 transition-colors duration-300"
      style={{
        borderColor: isUrgent ? "#FDE68A" : "#E4E4E7",
        background: isUrgent ? "#FFFBEB" : "#FFFFFF",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: isUrgent ? "#D97706" : "#71717A" }}>
          Hold expires in
        </p>
        <p
          className="text-2xl font-bold num"
          style={{ color: isUrgent ? "#D97706" : "#0A0A0A" }}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>
      <div className="stock-bar">
        <div
          className="stock-bar-fill transition-all duration-1000"
          style={{
            width: `${progress}%`,
            background: isUrgent ? "#D97706" : "#059669",
          }}
        />
      </div>
    </div>
  );
}
