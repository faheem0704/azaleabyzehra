export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, parentId } = await req.json();
  const category = await prisma.category.update({
    where: { id: params.id },
    data: { name, slug: slugify(name), parentId: parentId || null },
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // BUG-21: guard against FK violation — Postgres will throw a 500 if products exist
  const productCount = await prisma.product.count({
    where: { categoryId: params.id, isDeleted: false },
  });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${productCount} product(s) are in this category. Reassign them first.` },
      { status: 400 }
    );
  }

  // Also check children categories
  const childCount = await prisma.category.count({ where: { parentId: params.id } });
  if (childCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${childCount} sub-category(ies) belong to this category. Delete them first.` },
      { status: 400 }
    );
  }

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Category deleted" });
}
