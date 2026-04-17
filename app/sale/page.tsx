export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import MainLayout from "@/components/layout/MainLayout";
import SalePageClient from "@/components/products/SalePageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sale | Azalea by Zehra",
  description: "Shop our curated sale collection — premium Indian ethnic wear at special prices.",
};

export default async function SalePage() {
  const settings = await prisma.settings.findFirst({ select: { salePageActive: true } });
  if (!settings?.salePageActive) notFound();

  return (
    <MainLayout>
      <Suspense fallback={<div className="pt-32 pb-24 section-padding"><div className="h-96 bg-ivory-200 animate-pulse" /></div>}>
        <SalePageClient />
      </Suspense>
    </MainLayout>
  );
}
