import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginPageClient from "@/components/auth/LoginPageClient";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your Azalea by Zehra account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await auth();

  // Already authenticated — send them where they wanted to go
  if (session?.user?.id) {
    const target = searchParams?.callbackUrl;
    // Guard: never loop back to /login or /register
    const safe =
      target && !target.startsWith("/login") && !target.startsWith("/register")
        ? target
        : "/";
    redirect(safe);
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <LoginPageClient />
    </Suspense>
  );
}
