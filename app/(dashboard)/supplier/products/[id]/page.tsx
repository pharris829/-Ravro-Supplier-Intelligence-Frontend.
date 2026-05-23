"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProduct, patchProduct, type Product } from "@/lib/api";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--surface3)", border: "1px solid var(--border)",
  borderRadius: 4, padding: "7px 10px", fontSize: 11, color: "var(--text-primary)",
  outline: "none", boxSizing: "border-box",
};

export default function EditProductPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  const [price,       setPrice]       = useState("");
  const [stock,       setStock]       = useState("");
  const [brand,       setBrand]       = useState("");
  const [description, setDescription] = useState("");
  const [leadTime,    setLeadTime]    = useState("");

  useEffect(() => {
    getProduct(id).then(r => {
      const p = r.product;
      setProduct(p);
      setPrice(p.price?.toString() ?? "");
      setStock(p.stock_quantity?.toString() ?? "");
      setBrand(p.brand ?? "");
      setDescription(p.description ?? "");
      const lt = (p as unknown as { attributes?: { lead_time_days?: number } }).attributes?.lead_time_days;
      setLeadTime(lt?.toString() ?? "");
    }).catch(() => setError("Product not found")).finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      const fields: Parameters<typeof patchProduct>[1] = {};
      if (price       !== "") fields.price          = parseFloat(price);
      if (stock       !== "") fields.stock_quantity = parseInt(stock);
      if (brand       !== "") fields.brand          = brand;
      if (description !== "") fields.description    = description;
      if (leadTime    !== "") fields.lead_time_days = parseInt(leadTime);
      const r = await patchProduct(id, fields);
      setProduct(r.product);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  if (loading) return <div style={{ fontSize: 11, color: "var(--text-dim)", padding: 16 }}>Loading…</div>;
  if (!product) return <div style={{ fontSize: 11, color: "var(--red)", padding: 16 }}>Product not found.</div>;

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 9, color: "var(--text-secondary)", marginBottom: 5, letterSpacing: 0.3 };

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/supplier/products" style={{ fontSize: 10, color: "var(--text-dim)", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
        ← Back to Product Feeds
      </Link>

      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{product.product_name}</h1>
        <p style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>{product.category} · {product.sku}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Opportunity Score", value: product.match_score?.toFixed(2) },
          { label: "Demand Score",      value: product.demand_score?.toFixed(2) },
          { label: "Ingestion Status",  value: product.ingestion_status },
          { label: "Stock Quantity",    value: product.stock_quantity },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "12px 14px" }}>
            <p style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>{value ?? "—"}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSave} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "20px 22px" }}>
        <div style={{ fontSize: 7, letterSpacing: 2, color: "var(--text-dim)", marginBottom: 16 }} className="font-orbitron">UPDATE PRODUCT</div>

        {error && <div style={{ fontSize: 11, color: "var(--red)", background: "rgba(255,75,110,0.06)", border: "1px solid rgba(255,75,110,0.25)", borderRadius: 4, padding: "10px 12px", marginBottom: 14 }}>{error}</div>}
        {saved && <div style={{ fontSize: 11, color: "var(--mint)", background: "rgba(0,245,196,0.06)", border: "1px solid rgba(0,245,196,0.25)", borderRadius: 4, padding: "10px 12px", marginBottom: 14 }}>Saved successfully</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={labelStyle}>Price ($)</label><input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder={product.price?.toString() ?? "0.00"} style={inputStyle} /></div>
          <div><label style={labelStyle}>Stock Quantity</label><input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder={product.stock_quantity?.toString() ?? "0"} style={inputStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={labelStyle}>Brand</label><input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder={product.brand ?? "Brand name"} style={inputStyle} /></div>
          <div><label style={labelStyle}>Lead Time (days)</label><input type="number" min="0" value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="e.g. 3" style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Description</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder={product.description ?? "Product description"} style={{ ...inputStyle, resize: "none" }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={{ background: "var(--mint)", color: "var(--obsidian)", border: "none", borderRadius: 4, padding: "8px 18px", fontSize: 11, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer", padding: "8px 12px" }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
