"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    storeName: "Azalea by Zehra",
    contactEmail: "hello@azaleabyzehra.com",
    whatsappNumber: "+92-300-0000000",
    razorpayKeyId: "",
    razorpaySecret: "",
    resendApiKey: "",
    twilioSid: "",
    twilioToken: "",
    twilioPhone: "",
  });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Settings saved");
    setSaving(false);
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
          <Input label="WhatsApp Number" {...f("whatsappNumber")} placeholder="+92-300-0000000" />
        </div>

        {/* Payments */}
        <div className="bg-white border border-ivory-200 p-6 space-y-5">
          <h2 className="font-playfair text-xl text-charcoal">Payment Gateway</h2>
          <p className="font-inter text-xs text-mauve">Set via environment variables for security. These override .env.local.</p>
          <Input label="Razorpay Key ID" {...f("razorpayKeyId")} placeholder="rzp_live_..." />
          <Input label="Razorpay Secret" type="password" {...f("razorpaySecret")} />
        </div>

        {/* Email */}
        <div className="bg-white border border-ivory-200 p-6 space-y-5">
          <h2 className="font-playfair text-xl text-charcoal">Email (Resend)</h2>
          <Input label="Resend API Key" type="password" {...f("resendApiKey")} placeholder="re_..." />
        </div>

        {/* SMS */}
        <div className="bg-white border border-ivory-200 p-6 space-y-5">
          <h2 className="font-playfair text-xl text-charcoal">SMS (Twilio)</h2>
          <Input label="Account SID" {...f("twilioSid")} placeholder="AC..." />
          <Input label="Auth Token" type="password" {...f("twilioToken")} />
          <Input label="Phone Number" {...f("twilioPhone")} placeholder="+1..." />
        </div>

        <Button type="submit" loading={saving} size="lg">Save Settings</Button>
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
