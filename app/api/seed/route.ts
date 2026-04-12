export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SEED_SECRET = process.env.SEED_SECRET || "azalea-seed-2024";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Upsert admin user
    const admin = await prisma.user.upsert({
      where: { email: "muhammedf0704@gmail.com" },
      update: { role: "ADMIN" },
      create: {
        email: "muhammedf0704@gmail.com",
        name: "Admin",
        role: "ADMIN",
      },
    });

    // Seed categories
    const categories = [
      { name: "Kurtis", slug: "kurtis" },
      { name: "Salwar Sets", slug: "salwar-sets" },
      { name: "Co-ord Sets", slug: "coord-sets" },
      { name: "Dupattas", slug: "dupattas" },
      { name: "Ethnic Tops", slug: "ethnic-tops" },
      { name: "Sharara Sets", slug: "sharara-sets" },
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const c = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: { name: cat.name, slug: cat.slug },
      });
      createdCategories.push(c);
    }

    // Seed settings
    const existingSettings = await prisma.settings.findFirst();
    if (!existingSettings) {
      await prisma.settings.create({
        data: {
          storeName: "Azalea by Zehra",
          contactEmail: "hello@azaleabyzehra.com",
          whatsappNumber: "+91-000-0000000",
          paymentGateway: "RAZORPAY",
        },
      });
    }

    return NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, role: admin.role },
      categories: createdCategories.map((c) => c.name),
      message: "Database seeded successfully! Delete /api/seed after this.",
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
