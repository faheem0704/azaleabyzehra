import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Cleaning up customer data...\n");

  // Delete all OTP records (no user dependency)
  const otpDel = await prisma.oTPRecord.deleteMany({});
  console.log(`  Deleted ${otpDel.count} OTP record(s)`);

  // Find all CUSTOMER users (never touch ADMIN accounts)
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, email: true, phone: true },
  });
  console.log(`  Found ${customers.length} customer(s)`);

  if (customers.length > 0) {
    const ids = customers.map((c) => c.id);

    // Delete in dependency order
    const cartItems = await prisma.cartItem.deleteMany({
      where: { cart: { userId: { in: ids } } },
    });
    console.log(`  Deleted ${cartItems.count} cart item(s)`);

    const carts = await prisma.cart.deleteMany({ where: { userId: { in: ids } } });
    console.log(`  Deleted ${carts.count} cart(s)`);

    const wishlists = await prisma.wishlist.deleteMany({ where: { userId: { in: ids } } });
    console.log(`  Deleted ${wishlists.count} wishlist(s)`);

    const reviews = await prisma.review.deleteMany({ where: { userId: { in: ids } } });
    console.log(`  Deleted ${reviews.count} review(s)`);

    // Orders reference addresses — delete order items first, then orders, then addresses
    const orderItems = await prisma.orderItem.deleteMany({
      where: { order: { userId: { in: ids } } },
    });
    console.log(`  Deleted ${orderItems.count} order item(s)`);

    const orders = await prisma.order.deleteMany({ where: { userId: { in: ids } } });
    console.log(`  Deleted ${orders.count} order(s)`);

    const addresses = await prisma.address.deleteMany({ where: { userId: { in: ids } } });
    console.log(`  Deleted ${addresses.count} address(es)`);

    const users = await prisma.user.deleteMany({ where: { id: { in: ids } } });
    console.log(`  Deleted ${users.count} customer user(s)`);

    console.log("\n  Customers removed:");
    customers.forEach((c) =>
      console.log(`    - ${c.email ?? c.phone ?? c.id}`)
    );
  }

  // Show remaining users (admins)
  const remaining = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log(`\n✅ Done. Remaining users (${remaining.length}):`);
  remaining.forEach((u) => console.log(`  - ${u.email} [${u.role}]`));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
