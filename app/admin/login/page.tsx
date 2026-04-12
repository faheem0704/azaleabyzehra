"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import OTPInput from "@/components/auth/OTPInput";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"contact" | "otp">("contact");
  const [loading, setLoading] = useState(false);

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact }),
    });
    if (res.ok) { setStep("otp"); toast.success("Code sent"); }
    else toast.error("Failed to send code");
    setLoading(false);
  };

  const verify = async () => {
    setLoading(true);
    const result = await signIn("otp-credentials", { contact, otp, redirect: false });
    if (result?.error) { toast.error("Invalid code or not an admin"); }
    else { toast.success("Welcome, Admin!"); router.push("/admin"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-charcoal-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-ivory p-10">
        <h1 className="font-playfair text-3xl text-charcoal mb-2">Admin Login</h1>
        <p className="font-inter text-sm text-mauve mb-8">Azalea by Zehra Management</p>

        {step === "contact" ? (
          <form onSubmit={sendOTP} className="space-y-5">
            <Input label="Admin Email or Phone" value={contact} onChange={(e) => setContact(e.target.value)} required autoFocus />
            <Button type="submit" loading={loading} className="w-full">Send Code</Button>
          </form>
        ) : (
          <div className="space-y-8">
            <OTPInput value={otp} onChange={setOtp} />
            <Button onClick={verify} loading={loading} className="w-full" disabled={otp.length !== 6}>Sign In</Button>
            <button onClick={() => { setStep("contact"); setOtp(""); }} className="w-full text-center font-inter text-sm text-mauve hover:text-charcoal transition-colors">
              ← Change contact
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
