import { Suspense } from "react";
import LoginPageClient from "@/components/auth/LoginPageClient";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your Azalea by Zehra account.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <LoginPageClient />
    </Suspense>
  );
}
