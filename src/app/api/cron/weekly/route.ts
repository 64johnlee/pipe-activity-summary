import { NextResponse } from "next/server";
import { generateSummary, storeSummary } from "@/lib/summary";

export async function GET() {
  try {
    console.log("[activity-summary] running weekly cron...");
    const summary = await generateSummary("weekly");
    await storeSummary(summary);
    console.log("[activity-summary] weekly summary generated:", summary.headline);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("[activity-summary] weekly cron error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
