"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Upload, Star, Sparkles } from "lucide-react";
import { Product, Category } from "@/types";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

interface Props {
  products: Product[];
  categories: Category[];
}

const EMPTY_FORM = {
  name: "", description: "", price: "", compareAtPrice: "",
  categoryId: "", sizes: "S,M,L,XL", colors: "Black,White",
  fabric: "", stock: "10", featured: false, isNewArrival: false,
};

export default function AdminProductsClient({ products: initial, categories }: Props) {
  const [products, setProducts] = useState(initial);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => { setEditingProduct(null); setForm({ ...EMPTY_FORM }); setImages([]); setIsModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, description: p.description, price: p.price.toString(),
      compareAtPrice: p.compareAtPrice?.toString() || "", categoryId: p.categoryId,
      sizes: p.sizes.join(","), colors: p.colors.join(","),
      fabric: p.fabric || "", stock: p.stock.toString(),
      featured: p.featured, isNewArrival: p.isNewArrival,
    });
    setImages(p.images);
    setIsModalOpen(true);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) uploaded.push(data.url);
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
    toast.success(`${uploaded.length} image(s) uploaded`);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) { toast.error("Fill required fields"); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
        categoryId: form.categoryId,
        sizes: form.sizes.split(",").map(s => s.trim()).filter(Boolean),
        colors: form.colors.split(",").map(c => c.trim()).filter(Boolean),
        fabric: form.fabric || null,
        stock: parseInt(form.stock) || 0,
        featured: form.featured,
        isNewArrival: form.isNewArrival,
        images,
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error);

      if (editingProduct) {
        setProducts((prev) => prev.map((p) => p.id === saved.id ? { ...p, ...saved } : p));
        toast.success("Product updated");
      } else {
        setProducts((prev) => [saved, ...prev]);
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
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-playfair text-3xl text-charcoal">Products</h1>
          <p className="font-inter text-sm text-charcoal-light mt-1">{products.length} products</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Add Product
        </Button>
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
                        {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
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
                    <span className={`font-inter text-sm ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-amber-500" : "text-charcoal"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
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
                {/* Left */}
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
                  <Input label="Sizes (comma-separated)" value={form.sizes} onChange={(e) => setForm(p => ({ ...p, sizes: e.target.value }))} placeholder="S,M,L,XL,XXL" />
                  <Input label="Colors (comma-separated)" value={form.colors} onChange={(e) => setForm(p => ({ ...p, colors: e.target.value }))} placeholder="Black,White,Navy" />
                  <Input label="Fabric" value={form.fabric} onChange={(e) => setForm(p => ({ ...p, fabric: e.target.value }))} placeholder="Lawn Cotton" />
                  <Input label="Stock Quantity" type="number" value={form.stock} onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))} />
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

                {/* Right — Images */}
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

                  {uploading && <p className="text-sm font-inter text-rose-gold mb-3">Uploading...</p>}

                  <div className="grid grid-cols-3 gap-3">
                    {images.map((url, i) => (
                      <div key={i} className="relative aspect-square bg-ivory-200 overflow-hidden group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                        {i === 0 && <span className="absolute bottom-1 left-1 bg-rose-gold text-white text-[10px] font-inter px-1.5 py-0.5">Thumbnail</span>}
                      </div>
                    ))}
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
