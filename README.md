# activity-summary

> Daily & weekly AI-powered productivity insights from your screenpipe screen history.

## What it does

- **Daily summary** — runs automatically at 6pm every day, analyzing everything you did since midnight
- **Weekly summary** — runs every Monday at 9am covering the past 7 days
- **On-demand** — generate a summary any time from the dashboard UI

Each summary includes:
- 📊 **App usage breakdown** with time estimates per app, color-coded by category (coding, communication, browser, etc.)
- ⚡ **Focus score** (0–100) based on context-switching frequency and deep-work time
- ✅ **Highlights** — key accomplishments and productive stretches
- ⚠️ **Distractions** — time sinks and frequent interruptions
- 💡 **Actionable tip** — one recommendation to improve next period

Summaries are also sent to your screenpipe inbox as notifications.

## Setup

1. Install the pipe from the screenpipe pipe store or point screenpipe at this directory
2. Make sure you have an OpenAI API key configured in screenpipe settings (or use a local model via Ollama)
3. The crons run automatically — or open the UI and click **Generate** any time

## Tech

- Next.js 14 (App Router)
- `@screenpipe/js` SDK for querying screen + audio history
- Vercel AI SDK (`generateObject`) with zod schema validation
- Recharts for the app usage bar chart
- Tailwind CSS

## Development

```bash
bun install
bun dev
```

Then open http://localhost:3001
