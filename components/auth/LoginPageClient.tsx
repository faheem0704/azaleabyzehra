"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import OTPInput from "@/components/auth/OTPInput";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

type Step = "contact" | "otp";
type Method = "email" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [method, setMethod] = useState<Method>("email");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("contact");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;
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
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const result = await signIn("otp-credentials", {
        contact: contact.trim(),
        otp,
        redirect: false,
      });
      if (result?.error) throw new Error("Invalid or expired code");
      toast.success("Welcome back!");
      router.push(callbackUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:flex-1 bg-charcoal-dark relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #C9956C, #C9956C 1px, transparent 1px, transparent 14px)`,
          }}
        />
        <div className="relative z-10 text-center px-12">
          <h1 className="font-playfair text-5xl text-ivory mb-4">
            Azalea <span className="text-rose-gold italic">by Zehra</span>
          </h1>
          <p className="font-inter text-sm text-ivory/50 tracking-widest uppercase">Draped in Elegance</p>
          <div className="mt-12 w-24 h-px bg-rose-gold/30 mx-auto" />
          <p className="mt-8 font-inter text-xs text-ivory/30 max-w-xs leading-relaxed">
            India's premier destination for exquisite ethnic wear
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="block lg:hidden mb-10">
            <span className="font-playfair text-2xl text-charcoal">
              Azalea <span className="text-rose-gold">by Zehra</span>
            </span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-playfair text-3xl text-charcoal mb-2">
              {step === "contact" ? "Welcome Back" : "Enter Your Code"}
            </h2>
            <p className="font-inter text-sm text-charcoal-light mb-10">
              {step === "contact"
                ? "Sign in with your email or phone number"
                : `We sent a 6-digit code to ${contact}`}
            </p>

            <AnimatePresence mode="wait">
              {step === "contact" ? (
                <motion.form
                  key="contact"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSendOTP}
                  className="space-y-6"
                >
                  {/* Method toggle */}
                  <div className="flex border border-ivory-200">
                    {(["email", "phone"] as Method[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setMethod(m); setContact(""); }}
                        className={`flex-1 py-2.5 font-inter text-xs tracking-widest uppercase transition-all duration-200 ${
                          method === m ? "bg-charcoal text-ivory" : "text-charcoal-light hover:text-charcoal"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <Input
                    label={method === "email" ? "Email Address" : "Phone Number"}
                    type={method === "email" ? "email" : "tel"}
                    placeholder={method === "email" ? "you@example.com" : "+92 300 0000000"}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                    autoFocus
                  />

                  <Button type="submit" loading={loading} className="w-full">
                    Send Verification Code
                  </Button>

                  <p className="text-center font-inter text-sm text-charcoal-light">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-rose-gold hover:text-rose-gold-dark transition-colors">
                      Register
                    </Link>
                  </p>
                </motion.form>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <OTPInput value={otp} onChange={setOtp} />

                  <Button onClick={handleVerify} loading={loading} className="w-full" disabled={otp.length !== 6}>
                    Verify & Sign In
                  </Button>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setStep("contact"); setOtp(""); }}
                      className="font-inter text-sm text-charcoal-light hover:text-charcoal transition-colors"
                    >
                      ← Change {method}
                    </button>
                    <button
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="font-inter text-sm text-rose-gold hover:text-rose-gold-dark transition-colors disabled:opacity-50"
                    >
                      Resend Code
                    </button>
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
