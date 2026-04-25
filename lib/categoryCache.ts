import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Cached separately from product queries so a category slug→ids lookup is
// never a live DB round-trip. Tags ["categories"] so it only invalidates when
// categories change — not when products are added/updated.
export const getCachedCategoryIds = unstable_cache(
  async (slug: string): Promise<string[] | null> => {
    const cat = await prisma.category.findFirst({
      where: { slug },
      include: { children: { select: { id: true } } },
    });
    if (!cat) return null;
    return [cat.id, ...cat.children.map((c) => c.id)];
  },
  ["category-ids-by-slug"],
  { tags: ["categories"], revalidate: 86400 }
);
