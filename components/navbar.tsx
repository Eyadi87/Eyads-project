"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";

const NAV_LINKS = [
  { href: "/",           label: "Catalog" },
  { href: "/orders",     label: "Orders" },
  { href: "/warehouses", label: "Warehouses" },
];

export function Navbar() {
  const pathname = usePathname();
  const isCheckout = pathname?.startsWith("/reservation");

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E4E4E7] bg-white/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 select-none shrink-0">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "#0A0A0A" }}
          >
            <Package className="w-3.5 h-3.5 text-white" />
          </div>
          <span
            className="text-sm text-[#0A0A0A] tracking-tight"
            style={{ fontWeight: 700 }}
          >
            Allo Health
          </span>
          <span
            className="hidden sm:inline-flex items-center text-[10px] uppercase tracking-[0.1em] text-[#71717A] border border-[#E4E4E7] rounded px-1.5 py-0.5"
            style={{ fontWeight: 600 }}
          >
            Inventory
          </span>
        </Link>

        {/* Center nav tabs (hidden on checkout) */}
        {!isCheckout ? (
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 rounded-md text-xs transition-colors duration-150"
                  style={{
                    fontWeight: active ? 600 : 500,
                    color: active ? "#0A0A0A" : "#71717A",
                    background: active ? "#F4F4F5" : "transparent",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#A1A1AA]">
            <Link href="/" className="hover:text-[#0A0A0A] transition-colors duration-150">
              Catalog
            </Link>
            <span>/</span>
            <span className="text-[#0A0A0A]" style={{ fontWeight: 500 }}>Checkout</span>
          </div>
        )}

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
          <span
            className="text-[11px] text-[#71717A]"
            style={{ fontWeight: 500 }}
          >
            Live
          </span>
        </div>
      </div>

      {/* Mobile nav row */}
      {!isCheckout && (
        <div className="sm:hidden border-t border-[#F4F4F5] flex">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 py-2 text-center text-xs transition-colors duration-150"
                style={{
                  fontWeight: active ? 600 : 500,
                  color: active ? "#0A0A0A" : "#71717A",
                  borderBottom: active ? "2px solid #0A0A0A" : "2px solid transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
