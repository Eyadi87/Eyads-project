"use client";

import Link from "next/link";
import { Package2 } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E6E8EA] bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-[#334155] flex items-center justify-center group-hover:bg-[#059669] transition-colors duration-200">
            <Package2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[#0F172A] tracking-tight">Allo Health</span>
          <span className="hidden sm:inline text-xs text-[#64748B] ml-1 font-medium">Inventory</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#64748B] font-medium">Multi-warehouse fulfillment</span>
        </div>
      </div>
    </header>
  );
}
