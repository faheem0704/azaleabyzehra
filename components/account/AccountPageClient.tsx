"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, Star, MapPin, Loader } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

type Address = {
  id: string; name: string; phone: string; line1: string;
  line2?: string | null; city: string; state: string; pincode: string; isDefault: boolean;
};

const EMPTY: Omit<Address, "id" | "isDefault"> = { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };

export default function AccountPageClient({ user }: { user: { name?: string; email?: string } }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    fetch("/api/account/addresses").then((r) => r.json()).then(setAddresses).catch(() => {});
  }, []);

  const f = (key: keyof typeof form) => ({
    value: form[key] || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const lookupPincode = async (pin: string) => {
    if (!/^\d{6}$/.test(pin)) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setForm((prev) => ({ ...prev, city: po.District, state: po.State }));
      }
    } catch {
      // silently fail
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isDefault: addresses.length === 0 }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const newAddr = await res.json();
      setAddresses((p) => [...p, newAddr]);
      setForm({ ...EMPTY });
      setShowForm(false);
      toast.success("Address saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      setAddresses((p) => p.filter((a) => a.id !== id));
      toast.success("Address removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      setAddresses((p) => p.map((a) => ({ ...a, isDefault: a.id === id })));
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="pt-32 pb-24 section-padding">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-playfair text-4xl text-charcoal mb-2">My Account</h1>
        <p className="font-inter text-sm text-charcoal-light mb-10">
          {user.name || user.email}
        </p>

        <div className="flex gap-4 mb-12 flex-wrap">
          <Link href="/orders" className="btn-outline text-sm px-5 py-2.5">My Orders</Link>
          <Link href="/wishlist" className="btn-outline text-sm px-5 py-2.5">Wishlist</Link>
        </div>

        {/* Saved Addresses */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-playfair text-2xl text-charcoal">Saved Addresses</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 font-inter text-sm text-rose-gold hover:text-rose-gold-dark transition-colors"
            >
              <Plus size={16} />
              Add New
            </button>
          </div>

          {/* Add Form */}
          {showForm && (
            <form onSubmit={handleSave} className="border border-ivory-200 bg-white p-6 mb-6 space-y-4">
              <h3 className="font-playfair text-lg text-charcoal">New Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name *" {...f("name")} required placeholder="Priya Sharma" />
                <Input label="Phone *" {...f("phone")} required placeholder="+91 900 000 0000" />
              </div>
              <Input label="Address Line 1 *" {...f("line1")} required placeholder="House No., Street" />
              <Input label="Address Line 2" {...f("line2")} placeholder="Area, Landmark (optional)" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="City *" {...f("city")} required placeholder="Mumbai" />
                <Input label="State *" {...f("state")} required placeholder="Maharashtra" />
                <div className="relative">
                  <Input
                    label="Pincode *"
                    value={form.pincode || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setForm((p) => ({ ...p, pincode: val }));
                      if (val.length === 6) lookupPincode(val);
                    }}
                    required
                    placeholder="400001"
                    maxLength={6}
                  />
                  {pincodeLoading && (
                    <div className="absolute right-3 bottom-2.5">
                      <Loader size={14} className="text-rose-gold animate-spin" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" loading={saving} size="sm">Save Address</Button>
                <button type="button" onClick={() => setShowForm(false)} className="font-inter text-sm text-charcoal-light hover:text-charcoal transition-colors">Cancel</button>
              </div>
            </form>
          )}

          {/* Address List */}
          {addresses.length === 0 && !showForm ? (
            <div className="border border-ivory-200 text-center py-12">
              <MapPin size={32} className="mx-auto text-mauve mb-3" />
              <p className="font-inter text-sm text-charcoal-light">No saved addresses yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div key={addr.id} className={`border p-5 ${addr.isDefault ? "border-rose-gold bg-rose-gold/5" : "border-ivory-200"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="font-inter text-sm leading-relaxed">
                      {addr.isDefault && (
                        <span className="inline-block mb-2 text-xs font-medium text-rose-gold border border-rose-gold/40 px-2 py-0.5">Default</span>
                      )}
                      <p className="font-medium text-charcoal">{addr.name}</p>
                      <p className="text-charcoal-light">{addr.phone}</p>
                      <p className="text-charcoal-light">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                      <p className="text-charcoal-light">{addr.city}, {addr.state} — {addr.pincode}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!addr.isDefault && (
                        <button onClick={() => handleSetDefault(addr.id)} title="Set as default"
                          className="text-mauve hover:text-rose-gold transition-colors">
                          <Star size={15} />
                        </button>
                      )}
                      {confirmDeleteId === addr.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setConfirmDeleteId(null); handleDelete(addr.id); }}
                            disabled={deletingId === addr.id}
                            className="text-xs font-inter text-red-500 hover:text-red-700 transition-colors disabled:opacity-40"
                          >
                            Remove
                          </button>
                          <span className="text-mauve">·</span>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-inter text-charcoal-light hover:text-charcoal transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(addr.id)} title="Remove"
                          className="text-mauve hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
