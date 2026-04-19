"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import { Trash2, ToggleLeft, ToggleRight, Plus, X } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  productIds: string[];
  active: boolean;
  expiresAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
}

const empty = {
  code: "",
  discountPercent: "",
  maxDiscount: "",
  minOrderAmount: "",
  expiresAt: "",
  usageLimit: "",
};

export default function PromoCodesPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const fetchPromos = async () => {
    const res = await fetch("/api/admin/promo-codes");
    const data = await res.json();
    setPromos(data);
    setLoading(false);
  };

  useEffect(() => { fetchPromos(); }, []);

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountPercent) {
      toast.error("Code and discount % are required"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discountPercent: Number(form.discountPercent),
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
          expiresAt: form.expiresAt || null,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Promo code created");
      setForm(empty);
      setShowForm(false);
      fetchPromos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promo: PromoCode) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !promo.active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error || "Failed to update promo code");
        return;
      }
      fetchPromos();
    } catch {
      toast.error("Failed to update promo code");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error || "Failed to delete promo code");
        return;
      }
      toast.success("Deleted");
      fetchPromos();
    } catch {
      toast.error("Failed to delete promo code");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-playfair text-3xl text-charcoal">Promo Codes</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? <><X size={16} className="mr-2" /> Cancel</> : <><Plus size={16} className="mr-2" /> New Code</>}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-ivory-200 p-6 mb-8 space-y-5 max-w-2xl">
          <h2 className="font-playfair text-xl text-charcoal">Create Promo Code</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Code *" placeholder="SUMMER30" {...f("code")} />
            <Input label="Discount %" placeholder="30" type="number" min="1" max="100" {...f("discountPercent")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Max Discount (₹)" placeholder="2000 — leave blank for no cap" type="number" {...f("maxDiscount")} />
              <p className="font-inter text-xs text-mauve mt-1">e.g. 30% off but no more than ₹2,000</p>
            </div>
            <div>
              <Input label="Min Order Amount (₹)" placeholder="500 — leave blank for no minimum" type="number" {...f("minOrderAmount")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Expires On" type="datetime-local" {...f("expiresAt")} />
            <div>
              <Input label="Usage Limit" placeholder="e.g. 100 — leave blank for unlimited" type="number" {...f("usageLimit")} />
            </div>
          </div>

          <p className="font-inter text-xs text-mauve bg-ivory p-3 border border-ivory-200">
            <strong>Applies to:</strong> All products (product-specific eligibility can be configured via the Products page in a future update).
          </p>

          <Button type="submit" loading={saving}>Create Promo Code</Button>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-ivory-200 animate-pulse" />)}</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-16 text-charcoal-light font-inter">No promo codes yet.</div>
      ) : (
        <div className="bg-white border border-ivory-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F8F5F0]">
              <tr>
                {["Code", "Discount", "Cap", "Min Order", "Usage", "Expires", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-inter text-xs tracking-widest uppercase text-charcoal-light">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {promos.map((p) => (
                <tr key={p.id} className="hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3 font-inter text-sm font-medium text-charcoal tracking-widest">{p.code}</td>
                  <td className="px-4 py-3 font-inter text-sm text-charcoal">{p.discountPercent}%</td>
                  <td className="px-4 py-3 font-inter text-sm text-charcoal-light">
                    {p.maxDiscount ? `₹${p.maxDiscount.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-inter text-sm text-charcoal-light">
                    {p.minOrderAmount ? `₹${p.minOrderAmount.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-inter text-sm text-charcoal-light">
                    {p.usageCount}{p.usageLimit ? ` / ${p.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3 font-inter text-xs text-charcoal-light">
                    {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("en-IN") : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)} title={p.active ? "Deactivate" : "Activate"}>
                      {p.active
                        ? <ToggleRight size={22} className="text-rose-gold" />
                        : <ToggleLeft size={22} className="text-mauve" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(p.id)} className="text-mauve hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
