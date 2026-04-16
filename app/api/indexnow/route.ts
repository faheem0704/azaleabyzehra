import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const INDEXNOW_KEY = "774f6303b43edc263f11ac7e4458f729";
const BASE_URL = "https://azaleabyzehra.com";

// GET /api/indexnow — admin triggers this to ping Bing/IndexNow with all product URLs
export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: { slug: true },
  });

  const urls = [
    BASE_URL,
    `${BASE_URL}/products`,
    ...products.map((p) => `${BASE_URL}/products/${p.slug}`),
  ];

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "azaleabyzehra.com",
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });

  return NextResponse.json({ submitted: urls.length, status: res.status });
}
