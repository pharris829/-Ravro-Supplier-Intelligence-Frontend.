import "./globals.css";

export const metadata = {
  title: "Ravro Supplier Intelligence",
  description: "Supplier insights, opportunity scoring, and catalog intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
