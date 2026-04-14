export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: params.id }, { slug: params.id }],
      isDeleted: false,
    },
    include: {
      category: { include: { parent: true } },
      reviews: { include: { user: { select: { name: true, id: true } } }, orderBy: { createdAt: "desc" } },
      variants: { orderBy: [{ size: "asc" }, { color: "asc" }] },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // BUG-24: catch slug collision on rename (same P2002 issue as POST)
  try {
    const product = await prisma.product.update({
      where: { id: params.id },
      data: { ...body, slug: body.name ? slugify(body.name) : undefined },
    });
    return NextResponse.json(product);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this name already exists. Please use a different name." },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Soft delete
  await prisma.product.update({
    where: { id: params.id },
    data: { isDeleted: true },
  });

  return NextResponse.json({ message: "Product deleted" });
}
