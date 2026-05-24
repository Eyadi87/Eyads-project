"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface Props {
  expiresAt: string;
  onExpired?: () => void;
}

export function CountdownTimer({ expiresAt, onExpired }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpired?.();
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onExpired?.();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 60;
  const isExpired = secondsLeft === 0;
  const progress = Math.max(0, Math.min(100, (secondsLeft / 600) * 100));

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span className="text-sm font-semibold">Reservation expired</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border px-4 py-3 transition-colors duration-300 ${isUrgent ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isUrgent ? "text-amber-500 animate-pulse" : "text-slate-400"}`} />
          <span className={`text-xs font-medium ${isUrgent ? "text-amber-700" : "text-slate-500"}`}>
            Hold expires in
          </span>
        </div>
        <span className={`text-xl font-bold tabular-nums ${isUrgent ? "text-amber-600" : "text-[#0F172A]"}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? "bg-amber-400" : "bg-emerald-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
