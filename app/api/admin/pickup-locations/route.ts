export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPickupLocations } from "@/lib/shiprocket";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const locations = await getPickupLocations();
    return NextResponse.json({ locations });
  } catch {
    return NextResponse.json({ error: "Failed to fetch pickup locations" }, { status: 500 });
  }
}
