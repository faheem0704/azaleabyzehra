export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import AccountPageClient from "@/components/account/AccountPageClient";

export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");

  return (
    <MainLayout>
      <AccountPageClient user={session.user as any} />
    </MainLayout>
  );
}
