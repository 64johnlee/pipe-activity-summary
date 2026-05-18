import { NextResponse } from "next/server";
import { generateSummary, type Period } from "@/lib/summary";

export async function POST(request: Request) {
  try {
    const { period = "daily" } = await request.json() as { period?: Period };
    if (period !== "daily" && period !== "weekly") {
      return NextResponse.json({ error: "period must be daily or weekly" }, { status: 400 });
    }
    const summary = await generateSummary(period);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[activity-summary] summary error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
