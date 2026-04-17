"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    storeName: "Azalea by Zehra",
    contactEmail: "hello@azaleabyzehra.com",
    whatsappNumber: "+91-900-000-0000",
    address: "123 Fashion Street, Bandra West, Mumbai, India",
    phone: "+91 900 123 4567",
    lowStockThreshold: "5",
    adminEmail: "",
  });
  const [saving, setSaving] = useState(false);
  const [salePageActive, setSalePageActive] = useState(false);
  const [saleSaving, setSaleSaving] = useState(false);

  useEffect(() => {
    fetch("/api/config/store")
      .then((r) => r.json())
      .then((d) => {
        setForm((p) => ({ ...p, ...d }));
        if (typeof d.salePageActive === "boolean") setSalePageActive(d.salePageActive);
      })
      .catch(() => {});
  }, []);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const [inviteForm, setInviteForm] = useState({ name: "", email: "", password: "" });
  const [inviteSaving, setInviteSaving] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteForm.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setInviteSaving(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Admin account created for ${inviteForm.email}`);
      setInviteForm({ name: "", email: "", password: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setInviteSaving(false);
    }
  };

  const [shipping, setShipping] = useState({ shippingFee: 199, freeShippingThreshold: 2999 });
  const [shippingSaving, setShippingSaving] = useState(false);

  useEffect(() => {
    fetch("/api/config/shipping")
      .then((r) => r.json())
      .then((d) => setShipping(d))
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/config/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: form.storeName,
          contactEmail: form.contactEmail,
          whatsappNumber: form.whatsappNumber,
          address: form.address,
          phone: form.phone,
          lowStockThreshold: Number(form.lowStockThreshold),
          adminEmail: form.adminEmail,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Store settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleShippingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setShippingSaving(true);
    try {
      const res = await fetch("/api/config/shipping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingFee: Number(shipping.shippingFee),
          freeShippingThreshold: Number(shipping.freeShippingThreshold),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShipping(data);
      toast.success("Shipping settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setShippingSaving(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword || undefined,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Password updated successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPwSaving(false);
    }
  };

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div>
      <h1 className="font-playfair text-3xl text-charcoal mb-8">Settings</h1>
      <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
        {/* Store */}
        <div className="bg-white border border-ivory-200 p-6 space-y-5">
          <h2 className="font-playfair text-xl text-charcoal">Store Information</h2>
          <Input label="Store Name" {...f("storeName")} />
          <Input label="Contact Email" type="email" {...f("contactEmail")} />
          <Input label="Phone Number" {...f("phone")} placeholder="+91 900 000 0000" />
          <Input label="WhatsApp Number" {...f("whatsappNumber")} placeholder="+91-900-000-0000" />
          <Input label="Address" {...f("address")} placeholder="Street, City, State, Country" />
        </div>

        {/* Alerts */}
        <div className="bg-white border border-ivory-200 p-6 space-y-5">
          <div>
            <h2 className="font-playfair text-xl text-charcoal">Stock Alerts</h2>
            <p className="font-inter text-xs text-mauve mt-1">
              Get notified when a product variant falls below the stock threshold after an order.
            </p>
          </div>
          <Input label="Alert Email" type="email" {...f("adminEmail")} placeholder="admin@example.com" />
          <Input label="Low Stock Threshold" type="number" min="1" {...f("lowStockThreshold")} placeholder="5" />
        </div>

        <Button type="submit" loading={saving} size="lg">Save Settings</Button>
      </form>

      {/* Shipping */}
      <form onSubmit={handleShippingSave} className="space-y-8 max-w-2xl mt-12">
        <div className="bg-white border border-ivory-200 p-6 space-y-5">
          <div>
            <h2 className="font-playfair text-xl text-charcoal">Shipping Charges</h2>
            <p className="font-inter text-xs text-mauve mt-1">
              Set the flat shipping fee and the order threshold above which shipping becomes free.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Shipping Fee (₹)"
                type="number"
                min="0"
                value={String(shipping.shippingFee)}
                onChange={(e) => setShipping((p) => ({ ...p, shippingFee: Number(e.target.value) }))}
              />
              <p className="font-inter text-xs text-mauve mt-1">Charged on orders below the free threshold</p>
            </div>
            <div>
              <Input
                label="Free Shipping Above (₹)"
                type="number"
                min="0"
                value={String(shipping.freeShippingThreshold)}
                onChange={(e) => setShipping((p) => ({ ...p, freeShippingThreshold: Number(e.target.value) }))}
              />
              <p className="font-inter text-xs text-mauve mt-1">Orders at or above this get free shipping</p>
            </div>
          </div>
          <Button type="submit" loading={shippingSaving}>Save Shipping Settings</Button>
        </div>
      </form>

      {/* Sale Section */}
      <div className="space-y-8 max-w-2xl mt-12">
        <div className="bg-white border border-ivory-200 p-6 space-y-5">
          <div>
            <h2 className="font-playfair text-xl text-charcoal">Sale Section</h2>
            <p className="font-inter text-xs text-mauve mt-1">
              When active, a &quot;Sale&quot; tab appears in red on the navigation bar and a dedicated sale page goes live.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-inter text-sm text-charcoal font-medium">Sale Page</p>
              <p className="font-inter text-xs text-mauve mt-0.5">
                {salePageActive ? "Active — Sale tab is visible to customers" : "Inactive — Sale tab is hidden"}
              </p>
            </div>
            <button
              type="button"
              disabled={saleSaving}
              onClick={async () => {
                setSaleSaving(true);
                try {
                  const next = !salePageActive;
                  const res = await fetch("/api/config/store", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ salePageActive: next }),
                  });
                  if (!res.ok) throw new Error((await res.json()).error);
                  setSalePageActive(next);
                  toast.success(next ? "Sale section activated" : "Sale section deactivated");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to update");
                } finally {
                  setSaleSaving(false);
                }
              }}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${salePageActive ? "bg-red-500" : "bg-ivory-200"} disabled:opacity-50`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${salePageActive ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Invite Admin */}
      <form onSubmit={handleInvite} className="space-y-8 max-w-2xl mt-12">
        <div className="bg-white border border-ivory-200 p-6 space-y-5">
          <div>
            <h2 className="font-playfair text-xl text-charcoal">Add Admin User</h2>
            <p className="font-inter text-xs text-mauve mt-1">
              Create a new admin account. They can log in at /admin/login with these credentials.
            </p>
          </div>
          <Input
            label="Name"
            placeholder="e.g. Zehra"
            value={inviteForm.name}
            onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="their@gmail.com"
            value={inviteForm.email}
            onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={inviteForm.password}
            onChange={(e) => setInviteForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <Button type="submit" loading={inviteSaving}>Create Admin Account</Button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleSetPassword} className="space-y-8 max-w-2xl mt-12">
        <div className="bg-white border border-ivory-200 p-6 space-y-5">
          <div>
            <h2 className="font-playfair text-xl text-charcoal">Admin Password</h2>
            <p className="font-inter text-xs text-mauve mt-1">
              Set or change your password for the admin panel. Leave "Current Password" blank if setting for the first time.
            </p>
          </div>
          <Input
            label="Current Password"
            type="password"
            placeholder="Leave blank if setting for the first time"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Min. 8 characters"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            required
          />
          <Button type="submit" loading={pwSaving}>Update Password</Button>
        </div>
      </form>
    </div>
  );
}
