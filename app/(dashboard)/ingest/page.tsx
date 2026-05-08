"use client";

import { useState, useRef } from "react";
import { uploadCSV, getBatchStatus, type BatchStatus } from "@/lib/api";

export default function IngestPage() {
  const [type, setType] = useState<"suppliers" | "products">("products");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<BatchStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    setStatus(null);

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
        if (s.status === "done" || s.status === "failed") {
          clearInterval(interval);
          setUploading(false);
        }
      } catch {
        clearInterval(interval);
        setUploading(false);
      }
    }, 1500);
  }

  const statusColor = {
    pending:    "text-neutral-400",
    processing: "text-yellow-400",
    done:       "text-emerald-400",
    failed:     "text-red-400",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-white mb-1">Ingest CSV</h1>
      <p className="text-sm text-neutral-400 mb-8">Upload supplier or product data from a CSV file.</p>

      <form onSubmit={handleUpload} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Type</label>
          <div className="flex gap-3">
            {(["products", "suppliers"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  type === t
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">CSV File</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-neutral-700 file:text-white hover:file:bg-neutral-600 cursor-pointer"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {status && (
        <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-white">{status.filename}</p>
            <span className={`text-xs font-semibold uppercase ${statusColor[status.status]}`}>
              {status.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm mb-4">
            {[
              { label: "Total Rows",     value: status.total_rows },
              { label: "Processed",      value: status.processed_rows },
              { label: "Errors",         value: status.error_count },
            ].map(({ label, value }) => (
              <div key={label} className="bg-neutral-800 rounded-lg p-3">
                <p className="text-neutral-500 text-xs mb-0.5">{label}</p>
                <p className="text-white font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {status.errors?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-neutral-400 mb-2">Row errors:</p>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {status.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-400">Row {e.row}: {e.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
