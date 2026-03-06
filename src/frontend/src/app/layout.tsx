import type { Metadata } from "next";
import { Fraunces, Sora, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "600", "700", "900"],
  style: ["normal", "italic"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Leyl Pastane",
  description: "Tatlıcı yönetim paneli",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${fraunces.variable} ${sora.variable} ${spaceMono.variable}`}>
      <body className="antialiased font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
