"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard",     label: "Özet",    icon: "◈" },
  { href: "/sales",         label: "Satış",   icon: "◎" },
  { href: "/product-stock", label: "Stok",    icon: "◱" },
  { href: "/inventory",     label: "Malzeme", icon: "◧" },
  { href: "/expenses",      label: "Gider",   icon: "◉" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "var(--espresso)",
        borderTop: "1px solid rgba(251,245,236,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-all duration-150"
              style={{
                color: active ? "var(--amber)" : "rgba(251,245,236,0.4)",
                fontFamily: "var(--font-body)",
              }}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
