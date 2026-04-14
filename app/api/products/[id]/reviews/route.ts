import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to leave a review" }, { status: 401 });
  }

  const { rating, comment } = await req.json();
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  // BUG-11: only allow reviews from users who have received this product
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId: params.id,
      order: { userId: session.user.id, status: "DELIVERED" },
    },
  });
  if (!hasPurchased) {
    return NextResponse.json(
      { error: "You can only review products you have purchased and received" },
      { status: 403 }
    );
  }

  // Check if user already reviewed this product
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId: session.user.id, productId: params.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      userId: session.user.id,
      productId: params.id,
      rating: Number(rating),
      comment: comment?.trim() || null,
    },
    include: { user: { select: { name: true, id: true } } },
  });

  return NextResponse.json(review, { status: 201 });
}
