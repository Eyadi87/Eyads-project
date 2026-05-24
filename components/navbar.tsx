"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E4E4E7] bg-[#FAFAFA]/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-5 h-5 rounded bg-[#0A0A0A] group-hover:bg-[#059669] transition-colors duration-200" />
          <span className="text-sm font-semibold text-[#0A0A0A] tracking-tight">Allo Health</span>
          <span className="hidden sm:block text-xs text-[#71717A] font-medium pl-1 border-l border-[#E4E4E7] ml-1">
            Inventory Platform
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <span className="text-xs text-[#71717A]">Multi-warehouse fulfillment</span>
        </nav>
      </div>
    </header>
  );
}
