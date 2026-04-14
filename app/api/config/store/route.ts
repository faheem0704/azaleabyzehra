// Store config changes rarely — cache GET for 5 minutes
export const revalidate = 300;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getSettings() {
  let s = await prisma.settings.findFirst();
  if (!s) s = await prisma.settings.create({ data: {} });
  return s;
}

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    storeName: s.storeName,
    contactEmail: s.contactEmail,
    whatsappNumber: s.whatsappNumber,
    address: s.address,
    phone: s.phone,
    lowStockThreshold: s.lowStockThreshold,
    adminEmail: s.adminEmail,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { storeName, contactEmail, whatsappNumber, address, phone, lowStockThreshold, adminEmail } = await req.json();

  // BUG-18: lowStockThreshold must be a positive integer
  if (lowStockThreshold !== undefined) {
    const threshold = Number(lowStockThreshold);
    if (!Number.isInteger(threshold) || threshold < 1) {
      return NextResponse.json({ error: "Low stock threshold must be a whole number of at least 1" }, { status: 400 });
    }
  }

  const s = await getSettings();
  const updated = await prisma.settings.update({
    where: { id: s.id },
    data: {
      storeName,
      contactEmail,
      whatsappNumber,
      address,
      phone,
      ...(lowStockThreshold !== undefined ? { lowStockThreshold: Number(lowStockThreshold) } : {}),
      ...(adminEmail !== undefined ? { adminEmail } : {}),
    },
  });
  return NextResponse.json({
    storeName: updated.storeName,
    contactEmail: updated.contactEmail,
    whatsappNumber: updated.whatsappNumber,
    address: updated.address,
    phone: updated.phone,
    lowStockThreshold: updated.lowStockThreshold,
    adminEmail: updated.adminEmail,
  });
}
