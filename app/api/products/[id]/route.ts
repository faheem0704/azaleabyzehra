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

  // Fix 2: extract only allowed fields — never spread raw body
  const {
    name, description, price, compareAtPrice,
    images, imageAlts, colorImages, categoryId,
    sizes, colors, fabric, featured, isNewArrival, isOnSale, stock,
    variants,
  } = body;

  try {
    const product = await prisma.$transaction(async (tx) => {
      // Fix 3: only regenerate slug when name meaningfully changes
      let slug: string | undefined;
      if (name) {
        const existing = await tx.product.findUnique({
          where: { id: params.id },
          select: { slug: true },
        });
        const newSlugCandidate = slugify(name);
        if (existing && newSlugCandidate !== existing.slug) {
          // Check if the new slug collides with a different product
          const collision = await tx.product.findFirst({
            where: { slug: newSlugCandidate, NOT: { id: params.id } },
            select: { id: true },
          });
          slug = collision ? `${newSlugCandidate}-${Date.now()}` : newSlugCandidate;
        } else {
          slug = existing?.slug;
        }
      }

      const updated = await tx.product.update({
        where: { id: params.id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price }),
          ...(compareAtPrice !== undefined && { compareAtPrice }),
          ...(images !== undefined && { images }),
          ...(imageAlts !== undefined && { imageAlts }),
          ...(colorImages !== undefined && { colorImages }),
          ...(categoryId !== undefined && { categoryId }),
          ...(sizes !== undefined && { sizes }),
          ...(colors !== undefined && { colors }),
          ...(fabric !== undefined && { fabric }),
          ...(featured !== undefined && { featured }),
          ...(isNewArrival !== undefined && { isNewArrival }),
          ...(isOnSale !== undefined && { isOnSale }),
          ...(stock !== undefined && { stock }),
          ...(slug !== undefined && { slug }),
        },
      });

      // Fix 1: if variants included, upsert them atomically in the same transaction
      if (variants && Array.isArray(variants) && variants.length > 0) {
        await tx.productVariant.deleteMany({
          where: {
            productId: params.id,
            NOT: {
              OR: variants.map((v: { size: string; color: string }) => ({ size: v.size, color: v.color })),
            },
          },
        });

        await Promise.all(
          (variants as { size: string; color: string; stock: number; sku?: string }[]).map((v) =>
            tx.productVariant.upsert({
              where: { productId_size_color: { productId: params.id, size: v.size, color: v.color } },
              update: { stock: v.stock, sku: v.sku?.trim().toUpperCase() || null },
              create: { productId: params.id, size: v.size, color: v.color, stock: v.stock, sku: v.sku?.trim().toUpperCase() || null },
            })
          )
        );

        const total = variants.reduce((s: number, v: { stock: number }) => s + v.stock, 0);
        await tx.product.update({ where: { id: params.id }, data: { stock: total } });
      }

      return updated;
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
