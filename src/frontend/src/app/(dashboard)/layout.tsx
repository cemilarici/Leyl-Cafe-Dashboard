"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg blink"
            style={{ background: "var(--amber)", fontFamily: "var(--font-display)" }}
          >
            L
          </div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--cream)" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
