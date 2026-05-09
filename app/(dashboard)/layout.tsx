import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--obsidian)" }}>
      <Sidebar />
      <main style={{
        flex: 1, overflowY: "auto", padding: "20px 24px",
        background: "#060810",
      }}>
        {children}
      </main>
    </div>
  );
}
