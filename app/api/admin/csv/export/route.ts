export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function esc(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "id", "name", "description", "price", "compareAtPrice",
    "category_slug", "sizes", "colors", "fabric",
    "total_stock", "featured", "isNewArrival",
    "images", "image_alts",
    "variants_size_color_stock_sku",
  ];

  const rows = products.map((p) => [
    p.id,
    p.name,
    p.description.replace(/\n/g, " "),
    p.price.toString(),
    p.compareAtPrice?.toString() ?? "",
    (p as { category?: { slug?: string } }).category?.slug ?? "",
    p.sizes.join(";"),
    p.colors.join(";"),
    p.fabric ?? "",
    p.stock.toString(),
    p.featured ? "true" : "false",
    p.isNewArrival ? "true" : "false",
    p.images.join(";"),
    p.imageAlts.join(";"),
    (p as { variants?: { size: string; color: string; stock: number; sku: string | null }[] }).variants
      ?.map((v) => `${v.size}:${v.color}:${v.stock}:${v.sku ?? ""}`)
      .join("|") ?? "",
  ].map(esc));

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
