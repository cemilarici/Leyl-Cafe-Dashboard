"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError("E-posta veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--cream)" }}
    >
      {/* Left panel — espresso */}
      <div
        className="hidden lg:flex flex-col justify-between w-96 p-12"
        style={{ background: "var(--espresso)" }}
      >
        <div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-12"
            style={{ background: "var(--amber)", fontFamily: "var(--font-display)" }}
          >
            L
          </div>
          <h1
            className="text-4xl font-semibold leading-tight mb-4"
            style={{ color: "#FBF5EC", fontFamily: "var(--font-display)" }}
          >
            Dükkanınızın<br />
            <em className="not-italic" style={{ color: "var(--amber-light)" }}>nabzını</em><br />
            tutun.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(251,245,236,0.45)" }}>
            Satış, stok, gider — her şey tek ekranda.
          </p>
        </div>
        <p className="text-xs" style={{ color: "rgba(251,245,236,0.2)", letterSpacing: "0.06em" }}>
          LEYL PASTANE © {new Date().getFullYear()}
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fadeUp">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ background: "var(--amber)", fontFamily: "var(--font-display)" }}
            >L</div>
            <span className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>Leyl Pastane</span>
          </div>

          <h2
            className="text-2xl font-semibold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}
          >
            Hoş geldiniz
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            Devam etmek için giriş yapın
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="ad@pastane.com"
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p
                className="text-xs text-center py-2 px-3 rounded-lg"
                style={{ background: "var(--danger-light)", color: "var(--danger)" }}
              >
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
