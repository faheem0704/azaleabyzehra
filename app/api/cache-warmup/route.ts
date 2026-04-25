import { NextRequest, NextResponse } from "next/server";

// Top-traffic product page combos — keeps ISR cache warm so first visitors
// always hit a cached response instead of a live DB query.
// Call this from a Vercel deploy hook or a cron job after deploys.
const WARMUP_COMBOS = [
  "",
  "?isNewArrival=true",
  "?featured=true",
  "?sort=popular",
];

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { origin } = new URL(req.url);

  const results = await Promise.allSettled(
    WARMUP_COMBOS.map((qs) =>
      fetch(`${origin}/api/products${qs}`, { cache: "no-store" })
        .then((r) => ({ path: `/api/products${qs}`, status: r.status }))
    )
  );

  const warmed = results
    .filter((r): r is PromiseFulfilledResult<{ path: string; status: number }> => r.status === "fulfilled")
    .map((r) => r.value);

  return NextResponse.json({ warmed: warmed.length, paths: warmed });
}
