export const dynamic = "force-dynamic";

import { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import OrderSuccessClient from "@/components/checkout/OrderSuccessClient";

export const metadata = { title: "Order Confirmed" };

export default function OrderSuccessPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="pt-40 text-center font-inter text-sm text-mauve">Loading…</div>}>
        <OrderSuccessClient />
      </Suspense>
    </MainLayout>
  );
}
