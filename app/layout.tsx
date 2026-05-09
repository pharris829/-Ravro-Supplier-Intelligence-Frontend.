import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ravro — Command Your Data",
  description: "Real-time product intelligence for suppliers and merchants. Enterprise scoring, machine-speed decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/*
        React 19 hoists <link> to <head> automatically — no <head> wrapper needed.
        Putting <head> explicitly in a Next.js App Router layout can cause hydration mismatches.
      */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <body style={{ background: "var(--obsidian)", color: "var(--text-primary)", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
