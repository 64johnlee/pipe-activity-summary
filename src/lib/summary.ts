import { pipe } from "@screenpipe/js";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export type Period = "daily" | "weekly";

const AppUsageSchema = z.object({
  app: z.string(),
  minutes: z.number(),
  category: z.enum(["coding", "communication", "browser", "design", "docs", "meetings", "other"]),
});

const SummarySchema = z.object({
  headline: z.string().describe("One sentence summary of the period"),
  totalActiveMinutes: z.number(),
  topApps: z.array(AppUsageSchema).max(8),
  focusScore: z.number().min(0).max(100).describe("0-100 productivity/focus score"),
  highlights: z.array(z.string()).max(5).describe("Key accomplishments or notable activities"),
  distractions: z.array(z.string()).max(3).describe("Time sinks or frequent distractions"),
  recommendation: z.string().describe("One actionable tip to improve productivity next period"),
});

export type ActivitySummary = z.infer<typeof SummarySchema> & {
  period: Period;
  startTime: string;
  endTime: string;
  generatedAt: string;
};

export async function generateSummary(period: Period): Promise<ActivitySummary> {
  const now = new Date();
  let startTime: Date;

  if (period === "daily") {
    startTime = new Date(now);
    startTime.setHours(0, 0, 0, 0);
  } else {
    startTime = new Date(now);
    startTime.setDate(now.getDate() - 7);
    startTime.setHours(0, 0, 0, 0);
  }

  // Fetch screen + audio data for the period
  const [screenData, audioData] = await Promise.all([
    pipe.queryScreenpipe({
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      limit: period === "daily" ? 200 : 500,
      contentType: "ocr",
    }),
    pipe.queryScreenpipe({
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      limit: period === "daily" ? 100 : 300,
      contentType: "audio",
    }),
  ]);

  const allData = [
    ...(screenData?.data ?? []),
    ...(audioData?.data ?? []),
  ];

  // Guard: no data available
  if (allData.length === 0) {
    throw new Error(
      "No screen activity data found for this period. Make sure screenpipe is running and has recorded some activity."
    );
  }

  // Build compact context for LLM — explicit type guard on filter
  const context = allData
    .map((item): string | null => {
      if (item.type === "OCR") {
        return `[${item.content.timestamp}] APP:${item.content.appName} WIN:${item.content.windowName} TEXT:${item.content.text?.slice(0, 150)}`;
      } else if (item.type === "Audio") {
        return `[${item.content.timestamp}] AUDIO:${item.content.transcription?.slice(0, 150)}`;
      }
      return null;
    })
    .filter((x): x is string => x !== null)
    .join("\n");

  const settings = await pipe.settings.getAll();
  const aiModel = settings?.aiModel ?? "gpt-4o-mini";
  const openaiKey = settings?.openaiApiKey ?? process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    throw new Error(
      "No OpenAI API key found. Please add your API key in screenpipe settings under AI > OpenAI API Key."
    );
  }

  const openai = createOpenAI({ apiKey: openaiKey });

  const { object } = await generateObject({
    model: openai(aiModel),
    schema: SummarySchema,
    prompt: `You are a productivity analyst. Analyze the following ${period} screen activity data and generate an insightful summary.

Period: ${period === "daily" ? "Today" : "This week"} (${startTime.toLocaleDateString()} - ${now.toLocaleDateString()})
Total data points: ${allData.length}

Screen & Audio Activity:
${context.slice(0, 8000)}

Generate a clear, honest productivity summary. Be specific about apps and activities you see. Estimate time spent in each app based on timestamp density.`,
  });

  return {
    ...object,
    period,
    startTime: startTime.toISOString(),
    endTime: now.toISOString(),
    generatedAt: now.toISOString(),
  };
}

// Store summaries in screenpipe's inbox as notifications
export async function storeSummary(summary: ActivitySummary): Promise<void> {
  await pipe.inbox.send({
    title: `${summary.period === "daily" ? "📅 Daily" : "📊 Weekly"} Activity Summary`,
    body: `${summary.headline}\n\nFocus Score: ${summary.focusScore}/100\nActive Time: ${summary.totalActiveMinutes} min\n\n${summary.highlights.join("\n")}`,
    actions: [{ label: "View Full Report", action: "open" }],
  });
}
