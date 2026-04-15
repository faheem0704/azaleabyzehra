"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Upload, Star, Sparkles, Download, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { Product, Category, ProductVariant } from "@/types";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

interface Props {
  products: Product[];
  categories: Category[];
  lowStockThreshold: number;
}

const EMPTY_FORM = {
  name: "", description: "", price: "", compareAtPrice: "",
  categoryId: "", sizes: "S,M,L,XL", colors: "Black,White",
  fabric: "", featured: false, isNewArrival: false,
};

type ImageEntry = { url: string; alt: string };

// Build variant map key
const vkey = (size: string, color: string) => `${size}||${color}`;

export default function AdminProductsClient({ products: initial, categories, lowStockThreshold }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [variantStock, setVariantStock] = useState<Record<string, number>>({});
  const [variantSku, setVariantSku] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const parsedSizes = form.sizes.split(",").map((s) => s.trim()).filter(Boolean);
  const parsedColors = form.colors.split(",").map((c) => c.trim()).filter(Boolean);

  // Rebuild variant map when sizes/colors change — preserve existing stock values
  const buildVariantMap = (sizes: string[], colors: string[]) => {
    const newStock: Record<string, number> = {};
    const newSku: Record<string, string> = {};
    for (const s of sizes) {
      for (const c of colors) {
        const k = vkey(s, c);
        newStock[k] = variantStock[k] ?? 0;
        newSku[k] = variantSku[k] ?? "";
      }
    }
    setVariantStock(newStock);
    setVariantSku(newSku);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM });
    setImages([]);
    const sizes = EMPTY_FORM.sizes.split(",").map(s => s.trim()).filter(Boolean);
    const colors = EMPTY_FORM.colors.split(",").map(c => c.trim()).filter(Boolean);
    const stock: Record<string, number> = {};
    const sku: Record<string, string> = {};
    for (const s of sizes) for (const c of colors) { stock[vkey(s, c)] = 0; sku[vkey(s, c)] = ""; }
    setVariantStock(stock);
    setVariantSku(sku);
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, description: p.description, price: p.price.toString(),
      compareAtPrice: p.compareAtPrice?.toString() || "", categoryId: p.categoryId,
      sizes: p.sizes.join(","), colors: p.colors.join(","),
      fabric: p.fabric || "", featured: p.featured, isNewArrival: p.isNewArrival,
    });
    setImages(p.images.map((url, i) => ({ url, alt: p.imageAlts?.[i] ?? "" })));

    const stock: Record<string, number> = {};
    const sku: Record<string, string> = {};
    for (const s of p.sizes) for (const c of p.colors) { stock[vkey(s, c)] = 0; sku[vkey(s, c)] = ""; }
    if (p.variants) {
      for (const v of p.variants) { stock[vkey(v.size, v.color)] = v.stock; sku[vkey(v.size, v.color)] = v.sku ?? ""; }
    }
    setVariantStock(stock);
    setVariantSku(sku);
    setIsModalOpen(true);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    const uploaded: ImageEntry[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) uploaded.push({ url: data.url, alt: "" });
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
    toast.success(`${uploaded.length} image(s) uploaded`);
  };

  const moveImage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    setImages(next);
  };

  const updateImageAlt = (i: number, alt: string) => {
    setImages((prev) => prev.map((img, idx) => idx === i ? { ...img, alt } : img));
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) { toast.error("Fill required fields"); return; }
    setSaving(true);
    try {
      const variants = parsedSizes.flatMap((size) =>
        parsedColors.map((color) => ({
          size, color,
          stock: variantStock[vkey(size, color)] ?? 0,
          sku: variantSku[vkey(size, color)] || undefined,
        }))
      );
      const totalStock = variants.reduce((s, v) => s + v.stock, 0);

      const body = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
        categoryId: form.categoryId,
        sizes: parsedSizes,
        colors: parsedColors,
        fabric: form.fabric || null,
        stock: totalStock,
        featured: form.featured,
        isNewArrival: form.isNewArrival,
        images: images.map((i) => i.url),
        imageAlts: images.map((i) => i.alt),
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error);

      // Save variants
      await fetch(`/api/products/${saved.id}/variants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants }),
      });

      if (editingProduct) {
        setProducts((prev) => prev.map((p) => p.id === saved.id ? { ...p, ...saved, variants: variants as ProductVariant[] } : p));
        toast.success("Product updated");
      } else {
        setProducts((prev) => [{ ...saved, variants: variants as ProductVariant[] }, ...prev]);
        toast.success("Product created");
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    // BUG-30: check response before updating local state
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to delete product");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted");
  };

  const handleCSVExport = () => {
    // BUG-34 (intentional): window.location.href is correct here — file downloads
    // require a full browser navigation to trigger the Content-Disposition header.
    // router.push() would attempt a client-side fetch and silently discard the file.
    window.location.href = "/api/admin/csv/export";
  };

  const handleCSVImport = async (file: File | null) => {
    if (!file) return;
    setCsvImporting(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/admin/csv/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Imported: ${data.created} created, ${data.updated} updated${data.errors.length > 0 ? ` (${data.errors.length} errors)` : ""}`);
      // BUG-29: use router.refresh() instead of window.location.reload() to stay in Next.js
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setCsvImporting(false);
    }
  };

  // BUG-25: use settings lowStockThreshold instead of hardcoded 5
  const isLowStock = (p: Product) => {
    if (p.variants && p.variants.length > 0) {
      return p.variants.some((v) => v.stock <= lowStockThreshold);
    }
    return p.stock <= lowStockThreshold && p.stock >= 0;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-playfair text-3xl text-charcoal">Products</h1>
          <p className="font-inter text-sm text-charcoal-light mt-1">{products.length} products</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* CSV */}
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-2 px-4 py-2 border border-ivory-200 font-inter text-xs tracking-widest uppercase text-charcoal-light hover:border-charcoal hover:text-charcoal transition-all"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={csvImporting}
            className="flex items-center gap-2 px-4 py-2 border border-ivory-200 font-inter text-xs tracking-widest uppercase text-charcoal-light hover:border-charcoal hover:text-charcoal transition-all disabled:opacity-40"
          >
            <Upload size={14} />
            {csvImporting ? "Importing…" : "Import CSV"}
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleCSVImport(e.target.files?.[0] ?? null)}
          />
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-ivory-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-ivory-200">
              <tr>
                {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left font-inter text-xs tracking-widest uppercase text-charcoal-light">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-ivory-200/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 flex-shrink-0 bg-ivory-200 overflow-hidden">
                        {p.images[0] && <img src={p.images[0]} alt={p.imageAlts?.[0] || p.name} className="w-full h-full object-cover" />}
                      </div>
                      <p className="font-inter text-sm text-charcoal line-clamp-1 max-w-[200px]">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-inter text-xs text-mauve">{(p as any).category?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-inter text-sm text-charcoal">{formatPrice(p.price)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {isLowStock(p) && <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />}
                      <span className={`font-inter text-sm ${p.stock === 0 ? "text-red-500" : isLowStock(p) ? "text-amber-500" : "text-charcoal"}`}>
                        {p.stock}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {p.featured && <span className="text-[10px] font-inter bg-rose-gold/10 text-rose-gold px-2 py-0.5">Featured</span>}
                      {p.isNewArrival && <span className="text-[10px] font-inter bg-charcoal/10 text-charcoal px-2 py-0.5">New</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(p)} className="text-charcoal-light hover:text-rose-gold transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-charcoal-light hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-16">
              <p className="font-inter text-sm text-mauve">No products yet. Add your first product!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-[70] bg-charcoal/40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed inset-4 md:inset-8 z-[80] bg-ivory overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between px-8 py-5 border-b border-ivory-200 sticky top-0 bg-ivory z-10">
                <h2 className="font-playfair text-2xl text-charcoal">{editingProduct ? "Edit Product" : "New Product"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-charcoal-light hover:text-charcoal"><X size={20} /></button>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left — Product Info */}
                <div className="space-y-5">
                  <Input label="Product Name *" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Elegant Lawn Kurti" />
                  <div>
                    <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-2">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                      rows={4}
                      placeholder="Beautiful hand-crafted kurti..."
                      className="w-full border border-ivory-200 px-4 py-3 text-sm font-inter focus:outline-none focus:border-rose-gold resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Price (₹) *" type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} placeholder="2499" />
                    <Input label="Compare At Price" type="number" value={form.compareAtPrice} onChange={(e) => setForm(p => ({ ...p, compareAtPrice: e.target.value }))} placeholder="3499" />
                  </div>
                  <div>
                    <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-2">Category *</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full border border-ivory-200 px-4 py-3 text-sm font-inter focus:outline-none focus:border-rose-gold bg-white"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Sizes (comma-separated)"
                      value={form.sizes}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm(p => ({ ...p, sizes: val }));
                        const sizes = val.split(",").map(s => s.trim()).filter(Boolean);
                        buildVariantMap(sizes, parsedColors);
                      }}
                      placeholder="S,M,L,XL,XXL"
                    />
                    <Input
                      label="Colors (comma-separated)"
                      value={form.colors}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm(p => ({ ...p, colors: val }));
                        const colors = val.split(",").map(c => c.trim()).filter(Boolean);
                        buildVariantMap(parsedSizes, colors);
                      }}
                      placeholder="Black,White,Navy"
                    />
                  </div>
                  <Input label="Fabric" value={form.fabric} onChange={(e) => setForm(p => ({ ...p, fabric: e.target.value }))} placeholder="Lawn Cotton" />

                  {/* Variant Stock Grid */}
                  {parsedSizes.length > 0 && parsedColors.length > 0 && (
                    <div>
                      <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-3">
                        Stock per Variant
                      </label>
                      <div className="border border-ivory-200 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-ivory-200/50">
                              <th className="px-3 py-2 text-left font-inter text-xs text-charcoal-light font-normal">Size / Color</th>
                              {parsedColors.map((c) => (
                                <th key={c} className="px-3 py-2 text-center font-inter text-xs text-charcoal font-medium min-w-[80px]">{c}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ivory-200">
                            {parsedSizes.map((s) => (
                              <tr key={s} className="hover:bg-ivory-200/20">
                                <td className="px-3 py-2 font-inter text-xs font-medium text-charcoal">{s}</td>
                                {parsedColors.map((c) => {
                                  const k = vkey(s, c);
                                  return (
                                    <td key={c} className="px-2 py-1.5">
                                      <input
                                        type="number"
                                        min="0"
                                        value={variantStock[k] ?? 0}
                                        onChange={(e) => setVariantStock(prev => ({ ...prev, [k]: parseInt(e.target.value) || 0 }))}
                                        className="w-full border border-ivory-200 px-2 py-1.5 text-center text-sm font-inter focus:outline-none focus:border-rose-gold"
                                      />
                                      <input
                                        type="text"
                                        value={variantSku[k] ?? ""}
                                        onChange={(e) => setVariantSku(prev => ({ ...prev, [k]: e.target.value.toUpperCase() }))}
                                        placeholder="SKU"
                                        title="Stock Keeping Unit — must be globally unique"
                                        className="w-full mt-1 border border-ivory-200 px-2 py-1 text-center text-[11px] font-inter focus:outline-none focus:border-rose-gold text-charcoal-light placeholder:text-ivory-200 tracking-wider"
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="font-inter text-xs text-mauve mt-2">
                        Total stock: {parsedSizes.flatMap(s => parsedColors.map(c => variantStock[vkey(s, c)] ?? 0)).reduce((a, b) => a + b, 0)} units
                      </p>
                    </div>
                  )}

                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.featured} onChange={(e) => setForm(p => ({ ...p, featured: e.target.checked }))} className="w-4 h-4 accent-rose-gold" />
                      <span className="font-inter text-sm text-charcoal flex items-center gap-1"><Star size={14} className="text-rose-gold" /> Featured</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.isNewArrival} onChange={(e) => setForm(p => ({ ...p, isNewArrival: e.target.checked }))} className="w-4 h-4 accent-rose-gold" />
                      <span className="font-inter text-sm text-charcoal flex items-center gap-1"><Sparkles size={14} className="text-rose-gold" /> New Arrival</span>
                    </label>
                  </div>
                </div>

                {/* Right — Images with reordering + alt text */}
                <div>
                  <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-4">Product Images</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-ivory-200 p-8 text-center cursor-pointer hover:border-rose-gold transition-colors mb-4"
                  >
                    <Upload size={24} className="mx-auto text-mauve mb-2" />
                    <p className="font-inter text-sm text-charcoal-light">Click to upload images</p>
                    <p className="font-inter text-xs text-mauve mt-1">JPG, PNG, WebP — First image is thumbnail</p>
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
                  {uploading && <p className="text-sm font-inter text-rose-gold mb-3">Uploading…</p>}

                  <div className="space-y-3">
                    {images.map((img, i) => (
                      <div key={i} className="flex gap-3 border border-ivory-200 p-3">
                        {/* Thumbnail */}
                        <div className="relative w-16 h-20 flex-shrink-0 bg-ivory-200 overflow-hidden">
                          <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                          {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-rose-gold text-white text-[9px] font-inter text-center py-0.5">Thumbnail</span>}
                        </div>
                        {/* Alt text + controls */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={img.alt}
                            onChange={(e) => updateImageAlt(i, e.target.value)}
                            placeholder="Alt text (for SEO & accessibility)"
                            className="w-full border border-ivory-200 px-2 py-1.5 text-xs font-inter focus:outline-none focus:border-rose-gold"
                          />
                        </div>
                        {/* Order + remove buttons */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button onClick={() => moveImage(i, -1)} disabled={i === 0} className="w-6 h-6 flex items-center justify-center text-mauve hover:text-charcoal disabled:opacity-20">
                            <ChevronUp size={14} />
                          </button>
                          <button onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} className="w-6 h-6 flex items-center justify-center text-mauve hover:text-charcoal disabled:opacity-20">
                            <ChevronDown size={14} />
                          </button>
                          <button onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} className="w-6 h-6 flex items-center justify-center text-mauve hover:text-red-500">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {images.length === 0 && (
                      <p className="font-inter text-xs text-mauve text-center py-4">No images yet</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 px-8 py-6 border-t border-ivory-200 sticky bottom-0 bg-ivory">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} loading={saving}>{editingProduct ? "Update Product" : "Create Product"}</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
