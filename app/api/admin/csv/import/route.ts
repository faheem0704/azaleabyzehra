export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim()); current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const text = await req.text();
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV must have header + at least one row" }, { status: 400 });
  }

  const headers = parseCSVLine(lines[0]);
  const idx = (name: string) => headers.indexOf(name);

  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map((c) => [c.slug, c.id]));

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 4) continue;

    try {
      const name = cols[idx("name")] || "";
      const description = cols[idx("description")] || "";
      const price = parseFloat(cols[idx("price")] || "0");
      const compareAtPrice = cols[idx("compareAtPrice")] ? parseFloat(cols[idx("compareAtPrice")]) : null;
      const catSlug = cols[idx("category_slug")] || "";
      const categoryId = catMap.get(catSlug) ?? categories[0]?.id ?? "";
      const sizes = cols[idx("sizes")] ? cols[idx("sizes")].split(";").filter(Boolean) : [];
      const colors = cols[idx("colors")] ? cols[idx("colors")].split(";").filter(Boolean) : [];
      const fabric = cols[idx("fabric")] || null;
      const stock = parseInt(cols[idx("total_stock")] || "0") || 0;
      const featured = cols[idx("featured")] === "true";
      const isNewArrival = cols[idx("isNewArrival")] === "true";
      const images = cols[idx("images")] ? cols[idx("images")].split(";").filter(Boolean) : [];
      const imageAlts = cols[idx("image_alts")] ? cols[idx("image_alts")].split(";").filter(Boolean) : [];
      const variantsRaw = cols[idx("variants_size_color_stock_sku")] || "";

      if (!name || !price || !categoryId) {
        errors.push(`Row ${i + 1}: missing name, price, or category`);
        continue;
      }

      const existingId = cols[idx("id")] || "";
      const slug = slugify(name);

      const productData = {
        name, description, price, compareAtPrice,
        categoryId, sizes, colors, fabric,
        stock, featured, isNewArrival, images, imageAlts,
      };

      let productId: string;

      const existing = existingId
        ? await prisma.product.findUnique({ where: { id: existingId } })
        : await prisma.product.findUnique({ where: { slug } });

      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data: productData });
        productId = existing.id;
        updated++;
      } else {
        const created_ = await prisma.product.create({ data: { ...productData, slug } });
        productId = created_.id;
        created++;
      }

      // Handle variants column: "S:Red:10:SKU1|M:Blue:5:"
      if (variantsRaw) {
        const variantsList = variantsRaw.split("|").filter(Boolean).map((v) => {
          const [size, color, stockStr, sku] = v.split(":");
          return { size: size || "", color: color || "", stock: parseInt(stockStr) || 0, sku: sku || null };
        }).filter((v) => v.size && v.color);

        for (const v of variantsList) {
          await prisma.productVariant.upsert({
            where: { productId_size_color: { productId, size: v.size, color: v.color } },
            update: { stock: v.stock, sku: v.sku },
            create: { productId, size: v.size, color: v.color, stock: v.stock, sku: v.sku },
          });
        }
      }
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return NextResponse.json({ created, updated, errors });
}
