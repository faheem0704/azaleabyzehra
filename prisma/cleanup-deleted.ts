/**
 * Run once: removes ghost [Deleted] user rows left behind when address FK blocked full delete.
 * Usage: npx ts-node --project tsconfig.json prisma/cleanup-deleted.ts
 */
import { PrismaClient } from "../src/generated/prisma";
const prisma = new PrismaClient();

async function main() {
  const ghosts = await prisma.user.findMany({ where: { name: "[Deleted]" } });
  console.log(`Found ${ghosts.length} ghost rows`);

  for (const u of ghosts) {
    try {
      // Nullify orders.userId (already done, but idempotent)
      await prisma.order.updateMany({ where: { userId: u.id }, data: { userId: null } });
      // Clean up carts, wishlist, reviews
      await prisma.cartItem.deleteMany({ where: { cart: { userId: u.id } } });
      await prisma.cart.deleteMany({ where: { userId: u.id } });
      await prisma.wishlist.deleteMany({ where: { userId: u.id } });
      await prisma.review.deleteMany({ where: { userId: u.id } });
      // Addresses may be blocked by orders referencing them — skip if so
      try {
        await prisma.address.deleteMany({ where: { userId: u.id } });
      } catch {
        console.log(`  Skipped address delete for ${u.id} (referenced by orders)`);
      }
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`  Deleted ghost: ${u.id}`);
    } catch (e) {
      console.error(`  Failed to delete ${u.id}:`, e);
    }
  }
}

main().finally(() => prisma.$disconnect());
