export const dynamic = "force-dynamic";

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
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { storeName, contactEmail, whatsappNumber, address, phone } = await req.json();
  const s = await getSettings();
  const updated = await prisma.settings.update({
    where: { id: s.id },
    data: { storeName, contactEmail, whatsappNumber, address, phone },
  });
  return NextResponse.json({
    storeName: updated.storeName,
    contactEmail: updated.contactEmail,
    whatsappNumber: updated.whatsappNumber,
    address: updated.address,
    phone: updated.phone,
  });
}
