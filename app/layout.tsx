import "./globals.css";
import { Orbitron, Space_Grotesk } from "next/font/google";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata = {
  title: "Ravro Supplier Intelligence",
  description: "Supplier insights, opportunity scoring, and catalog intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${spaceGrotesk.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
