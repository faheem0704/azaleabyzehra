"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Category } from "@/types";
import toast from "react-hot-toast";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: parentId || null }),
    });
    const cat = await res.json();
    setCategories((prev) => [...prev, cat]);
    setName(""); setParentId("");
    setSaving(false);
    toast.success("Category created");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error || "Failed to delete category");
      return;
    }
    // BUG-21: only update local state after confirmed server deletion
    setCategories((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
    toast.success("Category deleted");
  };

  const roots = categories.filter((c) => !c.parentId);

  return (
    <div>
      <h1 className="font-playfair text-3xl text-charcoal mb-8">Categories</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Form */}
        <div className="bg-white border border-ivory-200 p-6">
          <h2 className="font-playfair text-xl text-charcoal mb-6">Add Category</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Category Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kurtis" required />
            <div>
              <label className="block text-xs font-inter tracking-widest uppercase text-charcoal-light mb-2">Parent Category (optional)</label>
              <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full border border-ivory-200 px-4 py-3 text-sm font-inter focus:outline-none focus:border-rose-gold bg-white">
                <option value="">None (Top-level)</option>
                {roots.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Button type="submit" loading={saving} className="w-full">
              <Plus size={16} className="mr-2" />
              Create Category
            </Button>
          </form>
        </div>

        {/* Category List */}
        <div className="bg-white border border-ivory-200 p-6">
          <h2 className="font-playfair text-xl text-charcoal mb-6">All Categories</h2>
          <div className="space-y-2">
            {roots.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center justify-between py-2.5 border-b border-ivory-200">
                  <span className="font-inter text-sm text-charcoal">{cat.name}</span>
                  <button onClick={() => handleDelete(cat.id)} className="text-mauve hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
                {cat.children?.map((child) => (
                  <div key={child.id} className="flex items-center justify-between py-2 pl-6 border-b border-ivory-200/50">
                    <span className="font-inter text-xs text-charcoal-light">↳ {child.name}</span>
                    <button onClick={() => handleDelete(child.id)} className="text-mauve hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            ))}
            {categories.length === 0 && <p className="font-inter text-sm text-mauve text-center py-8">No categories yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
