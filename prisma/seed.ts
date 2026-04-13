import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/azalea_by_zehra",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Categories
  const kurtis = await prisma.category.upsert({
    where: { slug: "kurtis" },
    update: {},
    create: { name: "Kurtis", slug: "kurtis" },
  });

  const salwarSets = await prisma.category.upsert({
    where: { slug: "salwar-sets" },
    update: {},
    create: { name: "Salwar Sets", slug: "salwar-sets" },
  });

  const coordSets = await prisma.category.upsert({
    where: { slug: "coord-sets" },
    update: {},
    create: { name: "Co-ord Sets", slug: "coord-sets" },
  });

  const dupattas = await prisma.category.upsert({
    where: { slug: "dupattas" },
    update: {},
    create: { name: "Dupattas", slug: "dupattas" },
  });

  // Sub-categories
  await prisma.category.upsert({
    where: { slug: "lawn-kurtis" },
    update: {},
    create: { name: "Lawn Kurtis", slug: "lawn-kurtis", parentId: kurtis.id },
  });

  await prisma.category.upsert({
    where: { slug: "silk-kurtis" },
    update: {},
    create: { name: "Silk Kurtis", slug: "silk-kurtis", parentId: kurtis.id },
  });

  // Sample products
  const products = [
    {
      name: "Rose Garden Lawn Kurti",
      slug: "rose-garden-lawn-kurti",
      description: "A beautiful floral lawn kurti perfect for summer days. Features intricate embroidery detailing and a flattering A-line silhouette.",
      price: 2499,
      compareAtPrice: 3199,
      categoryId: kurtis.id,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Pink", "Ivory", "Peach"],
      fabric: "Premium Lawn Cotton",
      stock: 25,
      featured: true,
      isNewArrival: true,
      images: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
        "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80",
      ],
    },
    {
      name: "Midnight Embroidered Salwar Set",
      slug: "midnight-embroidered-salwar-set",
      description: "Elegant three-piece salwar set with heavy thread embroidery. Perfect for evening wear and special occasions.",
      price: 4999,
      compareAtPrice: 6500,
      categoryId: salwarSets.id,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Navy", "Black", "Deep Maroon"],
      fabric: "Chiffon",
      stock: 15,
      featured: true,
      isNewArrival: true,
      images: ["https://images.unsplash.com/photo-1617119109767-1f5a6cc49c65?w=600&q=80"],
    },
    {
      name: "Golden Hour Co-ord Set",
      slug: "golden-hour-coord-set",
      description: "Stunning two-piece co-ord set in warm golden tones. Features a cropped kurti and wide-leg palazzo pants.",
      price: 3799,
      compareAtPrice: null,
      categoryId: coordSets.id,
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Gold", "Ivory", "Rust"],
      fabric: "Georgette",
      stock: 20,
      featured: true,
      isNewArrival: false,
      images: ["https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=600&q=80"],
    },
    {
      name: "Silk Dupatta with Kiran Border",
      slug: "silk-dupatta-kiran-border",
      description: "Luxurious pure silk dupatta with traditional kiran (fringe) border. Hand-crafted in Bahawalpur.",
      price: 1999,
      compareAtPrice: 2500,
      categoryId: dupattas.id,
      sizes: ["One Size"],
      colors: ["Red", "Green", "Blue", "Pink"],
      fabric: "Pure Silk",
      stock: 40,
      featured: false,
      isNewArrival: true,
      images: ["https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&q=80"],
    },
    {
      name: "Spring Blossom Kurti",
      slug: "spring-blossom-kurti",
      description: "Light and breezy cotton kurti with delicate block-print florals. Ideal for casual days.",
      price: 1799,
      compareAtPrice: null,
      categoryId: kurtis.id,
      sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
      colors: ["White", "Light Blue", "Mint"],
      fabric: "Cotton",
      stock: 50,
      featured: false,
      isNewArrival: true,
      images: ["https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=600&q=80"],
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  // Admin user
  await prisma.user.upsert({
    where: { email: "muhammedf0704@gmail.com" },
    update: { role: "ADMIN" },
    create: {
      email: "muhammedf0704@gmail.com",
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("✅ Seeding complete!");
  console.log("   Admin email: muhammedf0704@gmail.com");
  console.log("   Use OTP or Password login to access admin panel");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
