"use client";

import { useState, useRef } from "react";
import { uploadCSV, getBatchStatus, type BatchStatus } from "@/lib/api";

function statusColor(s: string): string {
  return s === "done" ? "var(--mint)" : s === "processing" ? "var(--amber)" : s === "failed" ? "var(--red)" : "var(--text-dim)";
}

export default function IngestPage() {
  const [type, setType]       = useState<"suppliers" | "products">("products");
  const [file, setFile]       = useState<File | null>(null);
  const [status, setStatus]   = useState<BatchStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState("");
  const fileRef               = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true); setError(""); setStatus(null);
    try {
      const { batchId } = await uploadCSV(file, type);
      poll(batchId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  }

  async function poll(batchId: string) {
    const interval = setInterval(async () => {
      try {
        const s = await getBatchStatus(batchId);
        setStatus(s);
        if (s.status === "done" || s.status === "failed") { clearInterval(interval); setUploading(false); }
      } catch { clearInterval(interval); setUploading(false); }
    }, 1500);
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 7, letterSpacing: 2.5, color: "var(--text-dim)", marginBottom: 4 }} className="font-orbitron">DATA</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Ingest CSV</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>Upload supplier or product data from a CSV file.</p>
      </div>

      <form onSubmit={handleUpload} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "22px 22px" }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 8, letterSpacing: 0.3 }}>Type</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["products","suppliers"] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)} style={{
                padding: "7px 18px", borderRadius: 4, fontSize: 11, fontWeight: 500, textTransform: "capitalize",
                border: "none", cursor: "pointer",
                background: type === t ? "var(--mint)" : "var(--surface3)",
                color: type === t ? "var(--obsidian)" : "var(--text-secondary)",
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 8, letterSpacing: 0.3 }}>CSV File</label>
          <input ref={fileRef} type="file" accept=".csv,text/csv"
            onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ display: "block", width: "100%", fontSize: 11, color: "var(--text-secondary)", cursor: "pointer" }} />
        </div>

        {error && <p style={{ fontSize: 11, color: "var(--red)", marginBottom: 14 }}>{error}</p>}

        <button type="submit" disabled={!file || uploading} style={{
          width: "100%", background: "var(--mint)", color: "var(--obsidian)", border: "none",
          borderRadius: 4, padding: "9px 0", fontSize: 11, fontWeight: 600, cursor: "pointer",
          opacity: !file || uploading ? 0.5 : 1,
        }}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {status && (
        <div style={{ marginTop: 16, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{status.filename}</p>
            <span style={{ fontSize: 9, letterSpacing: 1, color: statusColor(status.status), textTransform: "uppercase" }}>{status.status}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
            {[{ label: "Total Rows", value: status.total_rows }, { label: "Processed", value: status.processed_rows }, { label: "Errors", value: status.error_count }].map(({ label, value }) => (
              <div key={label} style={{ background: "var(--surface3)", borderRadius: 4, padding: "10px 12px", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>

          {status.errors?.length > 0 && (
            <div>
              <p style={{ fontSize: 9, color: "var(--text-secondary)", marginBottom: 6, letterSpacing: 0.3 }}>Row errors:</p>
              <div style={{ maxHeight: 140, overflowY: "auto" }}>
                {status.errors.map((e, i) => (
                  <p key={i} style={{ fontSize: 10, color: "var(--red)", margin: "2px 0" }}>Row {e.row}: {e.error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
