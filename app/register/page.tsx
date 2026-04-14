"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import OTPInput from "@/components/auth/OTPInput";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

type Step = "details" | "otp";
type ContactMethod = "email" | "phone";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("details");
  const [method, setMethod] = useState<ContactMethod>("email");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !password || !confirmPassword) {
      toast.error("Please fill all fields"); return;
    }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStep("otp");
      toast.success(`Verification code sent to your ${method}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      // Create account
      const res = await fetch("/api/auth/register-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim(), password, otp }),
      });
      if (!res.ok) throw new Error((await res.json()).error);

      // Auto sign in
      const result = await signIn("password-credentials", {
        contact: contact.trim(),
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("Account created but sign-in failed. Please log in.");
      toast.success("Welcome to Azalea by Zehra!");
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("New code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:flex-1 bg-charcoal-dark relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `repeating-linear-gradient(45deg, #C9956C, #C9956C 1px, transparent 1px, transparent 14px)` }}
        />
        <div className="relative z-10 text-center px-12">
          <h1 className="font-playfair text-5xl text-ivory mb-4">
            Join the <span className="text-rose-gold italic">Family</span>
          </h1>
          <p className="font-inter text-sm text-ivory/50 tracking-widest uppercase mt-4">Exclusive offers await</p>
          <div className="mt-12 w-24 h-px bg-rose-gold/30 mx-auto" />
          <p className="mt-8 font-inter text-xs text-ivory/30 max-w-xs leading-relaxed">
            India&apos;s premier destination for exquisite ethnic wear
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="block lg:hidden mb-10">
            <span className="font-playfair text-2xl text-charcoal">
              Azalea <span className="text-rose-gold">by Zehra</span>
            </span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <AnimatePresence mode="wait">
              {step === "details" ? (
                <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-playfair text-3xl text-charcoal mb-2">Create Account</h2>
                  <p className="font-inter text-sm text-charcoal-light mb-8">
                    Join Azalea by Zehra for exclusive access
                  </p>

                  <form onSubmit={handleSendOTP} className="space-y-5">
                    <Input
                      label="Full Name"
                      type="text"
                      placeholder="Ayesha Khan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                    />

                    {/* Contact method toggle */}
                    <div>
                      <div className="flex border border-ivory-200 mb-3">
                        {(["email", "phone"] as ContactMethod[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => { setMethod(m); setContact(""); }}
                            className={`flex-1 py-2.5 font-inter text-xs tracking-widest uppercase transition-all duration-200 ${
                              method === m ? "bg-charcoal text-ivory" : "text-charcoal-light hover:text-charcoal"
                            }`}
                          >
                            {m === "email" ? "Email" : "Phone"}
                          </button>
                        ))}
                      </div>
                      <Input
                        label={method === "email" ? "Email Address" : "Phone Number"}
                        type={method === "email" ? "email" : "tel"}
                        placeholder={method === "email" ? "you@example.com" : "+91 900 000 0000"}
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        required
                      />
                    </div>

                    <Input
                      label="Password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />

                    <Button type="submit" loading={loading} className="w-full">
                      Create Account
                    </Button>
                  </form>

                  <p className="text-center font-inter text-sm text-charcoal-light mt-8">
                    Already have an account?{" "}
                    <Link href="/login" className="text-rose-gold hover:text-rose-gold-dark transition-colors">
                      Sign In
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-playfair text-3xl text-charcoal mb-2">Verify Your {method === "email" ? "Email" : "Phone"}</h2>
                  <p className="font-inter text-sm text-charcoal-light mb-2">
                    We sent a 6-digit code to
                  </p>
                  <p className="font-inter text-sm font-medium text-charcoal mb-8">{contact}</p>

                  <div className="space-y-8">
                    <OTPInput value={otp} onChange={setOtp} />

                    <Button onClick={handleVerifyAndCreate} loading={loading} className="w-full" disabled={otp.length !== 6}>
                      Verify & Create Account
                    </Button>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => { setStep("details"); setOtp(""); }}
                        className="font-inter text-sm text-charcoal-light hover:text-charcoal transition-colors"
                      >
                        ← Go Back
                      </button>
                      <button
                        onClick={handleResend}
                        disabled={loading}
                        className="font-inter text-sm text-rose-gold hover:text-rose-gold-dark transition-colors disabled:opacity-50"
                      >
                        Resend Code
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
