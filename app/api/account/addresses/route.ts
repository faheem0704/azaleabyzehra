import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { id: "desc" }],
  });
  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone, line1, line2, city, state, pincode, isDefault } = await req.json();
  if (!name || !phone || !line1 || !city || !state || !pincode) {
    return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
  }

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: { userId: session.user.id, name, phone, line1, line2: line2 || null, city, state, pincode, isDefault: !!isDefault },
  });
  return NextResponse.json(address, { status: 201 });
}
