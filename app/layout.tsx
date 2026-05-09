import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ravro — Command Your Data",
  description: "Real-time product intelligence for suppliers and merchants. Enterprise analytics, machine-speed decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "var(--obsidian)", color: "var(--text-primary)", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
