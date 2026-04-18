// Shipping config changes rarely — cache GET for 5 minutes
export const revalidate = 300;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }
  return settings;
}

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(
    { shippingFee: settings.shippingFee, freeShippingThreshold: settings.freeShippingThreshold },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shippingFee, freeShippingThreshold } = await req.json();

  if (typeof shippingFee !== "number" || typeof freeShippingThreshold !== "number") {
    return NextResponse.json({ error: "Invalid values" }, { status: 400 });
  }

  const settings = await getSettings();
  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: { shippingFee, freeShippingThreshold },
  });

  return NextResponse.json({
    shippingFee: updated.shippingFee,
    freeShippingThreshold: updated.freeShippingThreshold,
  });
}
