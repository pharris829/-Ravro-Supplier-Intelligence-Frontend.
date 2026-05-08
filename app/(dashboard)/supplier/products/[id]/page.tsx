"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProduct, patchProduct, type Product } from "@/lib/api";

export default function EditProductPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  const [price,        setPrice]        = useState("");
  const [stock,        setStock]        = useState("");
  const [brand,        setBrand]        = useState("");
  const [description,  setDescription]  = useState("");
  const [leadTime,     setLeadTime]     = useState("");

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
    setSaving(true);
    setError("");
    setSaved(false);
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
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-neutral-500 text-sm">Loading…</div>;
  if (!product && !loading) return <div className="text-red-400 text-sm">Product not found.</div>;

  return (
    <div className="max-w-2xl">
      <Link href="/supplier/products" className="text-xs text-neutral-500 hover:text-white mb-4 inline-block">
        ← Back to Product Feeds
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">{product?.product_name}</h1>
        <p className="text-sm text-neutral-400 mt-0.5">{product?.category} · {product?.sku}</p>
      </div>

      {/* Read-only scores */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Opportunity Score", value: product?.match_score?.toFixed(2) },
          { label: "Demand Score",      value: product?.demand_score?.toFixed(2) },
          { label: "Ingestion Status",  value: product?.ingestion_status },
          { label: "Stock Quantity",    value: product?.stock_quantity },
        ].map(({ label, value }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
            <p className="text-white font-medium capitalize">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-white">Update Product Details</h2>

        {error && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">{error}</div>
        )}
        {saved && (
          <div className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-4 py-3">Saved successfully</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Price ($)</label>
            <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}
              placeholder={product?.price?.toString() ?? "0.00"}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Stock Quantity</label>
            <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)}
              placeholder={product?.stock_quantity?.toString() ?? "0"}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Brand</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)}
              placeholder={product?.brand ?? "Brand name"}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Lead Time (days)</label>
            <input type="number" min="0" value={leadTime} onChange={e => setLeadTime(e.target.value)}
              placeholder="e.g. 3"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-neutral-400 mb-1.5">Description</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
            placeholder={product?.description ?? "Product description"}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="text-sm text-neutral-400 hover:text-white px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
