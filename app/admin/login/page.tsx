"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import OTPInput from "@/components/auth/OTPInput";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

type AuthMode = "otp" | "password";
type OtpStep = "contact" | "otp";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("password");

  // OTP state
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("contact");

  // Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const switchMode = (m: AuthMode) => {
    setMode(m);
    setContact(""); setOtp(""); setOtpStep("contact");
    setEmail(""); setPassword("");
  };

  // --- OTP flow ---
  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setOtpStep("otp");
      toast.success("Code sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    try {
      const result = await signIn("otp-credentials", { contact, otp, redirect: false });
      if (result?.error) throw new Error("Invalid code or not an admin");
      toast.success("Welcome, Admin!");
      router.push("/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Password flow ---
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("password-credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("Invalid email or password");
      toast.success("Welcome, Admin!");
      router.push("/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-ivory p-10">
        <h1 className="font-playfair text-3xl text-charcoal mb-1">Admin Login</h1>
        <p className="font-inter text-sm text-mauve mb-8">Azalea by Zehra Management</p>

        {/* Mode toggle */}
        <div className="flex border border-ivory-200 mb-8">
          {(["password", "otp"] as AuthMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 font-inter text-xs tracking-widest uppercase transition-all duration-200 ${
                mode === m ? "bg-charcoal text-ivory" : "text-charcoal-light hover:text-charcoal"
              }`}
            >
              {m === "password" ? "Password" : "OTP"}
            </button>
          ))}
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <Input label="Email Address" type="email" placeholder="admin@azaleabyzehra.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            <Input label="Password" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" loading={loading} className="w-full">Sign In</Button>
          </form>
        ) : (
          <>
            {otpStep === "contact" ? (
              <form onSubmit={sendOTP} className="space-y-5">
                <Input label="Admin Email or Phone" value={contact}
                  onChange={(e) => setContact(e.target.value)} required autoFocus />
                <Button type="submit" loading={loading} className="w-full">Send Code</Button>
              </form>
            ) : (
              <div className="space-y-8">
                <OTPInput value={otp} onChange={setOtp} />
                <Button onClick={verifyOTP} loading={loading} className="w-full" disabled={otp.length !== 6}>
                  Sign In
                </Button>
                <button onClick={() => { setOtpStep("contact"); setOtp(""); }}
                  className="w-full text-center font-inter text-sm text-mauve hover:text-charcoal transition-colors">
                  ← Change contact
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
