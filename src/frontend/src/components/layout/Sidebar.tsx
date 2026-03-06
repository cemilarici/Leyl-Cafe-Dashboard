"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",     label: "Genel Bakış",    icon: "◈" },
  { href: "/sales",         label: "Satışlar",        icon: "◎" },
  { href: "/products",      label: "Ürünler",         icon: "⬡" },
  { href: "/product-stock", label: "Ürün Stoku",      icon: "◱" },
  { href: "/inventory",     label: "Hammadde",        icon: "◧" },
  { href: "/expenses",      label: "Giderler",        icon: "◉" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside
      className="hidden md:flex flex-col w-56 min-h-screen shrink-0"
      style={{ background: "var(--espresso)" }}
    >
      {/* Brand */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--amber)", color: "#fff", fontFamily: "var(--font-display)" }}
          >
            L
          </div>
          <span
            className="text-lg font-semibold tracking-tight"
            style={{ color: "#FBF5EC", fontFamily: "var(--font-display)" }}
          >
            Leyl
          </span>
        </div>
        <p className="text-xs pl-11" style={{ color: "rgba(251,245,236,0.35)", letterSpacing: "0.08em" }}>
          PASTANE YÖNETİMİ
        </p>
      </div>

      {/* Divider */}
      <div className="mx-6 mb-4" style={{ height: "1px", background: "rgba(251,245,236,0.08)" }} />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group",
                active
                  ? "font-semibold"
                  : "font-normal"
              )}
              style={
                active
                  ? { background: "var(--amber)", color: "#fff" }
                  : { color: "rgba(251,245,236,0.55)" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#FBF5EC";
                  (e.currentTarget as HTMLElement).style.background = "rgba(251,245,236,0.07)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "rgba(251,245,236,0.55)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <span className="text-base w-5 text-center leading-none">{item.icon}</span>
              <span style={{ fontFamily: "var(--font-body)", letterSpacing: "0.01em" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-5">
        <div className="rounded-xl p-3" style={{ background: "rgba(251,245,236,0.06)" }}>
          <p className="text-xs font-semibold mb-0.5 truncate" style={{ color: "rgba(251,245,236,0.85)", fontFamily: "var(--font-body)" }}>
            {user?.full_name}
          </p>
          <p className="text-xs capitalize" style={{ color: "rgba(251,245,236,0.4)" }}>
            {user?.role === "owner" ? "İşletme Sahibi" : "Yönetici"}
          </p>
          <button
            onClick={handleLogout}
            className="mt-2 text-xs transition-colors"
            style={{ color: "rgba(251,245,236,0.3)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#C44A35"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(251,245,236,0.3)"; }}
          >
            Çıkış Yap →
          </button>
        </div>
      </div>
    </aside>
  );
}
