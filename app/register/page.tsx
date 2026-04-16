"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import OTPInput from "@/components/auth/OTPInput";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

type Step = "details" | "otp";
type ContactMethod = "email" | "phone";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [method, setMethod] = useState<ContactMethod>("email");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

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
      router.push("/");
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

                  {/* Google */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 border border-ivory-200 bg-white hover:bg-ivory transition-colors duration-200 py-3 font-inter text-sm text-charcoal disabled:opacity-60 mb-6"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                    </svg>
                    {googleLoading ? "Redirecting…" : "Continue with Google"}
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-ivory-200" />
                    <span className="font-inter text-xs text-mauve">or register with email</span>
                    <div className="flex-1 h-px bg-ivory-200" />
                  </div>

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
