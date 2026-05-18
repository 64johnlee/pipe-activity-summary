"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, RefreshCw, Calendar, TrendingUp, Zap, AlertTriangle, Lightbulb } from "lucide-react";
import type { ActivitySummary } from "@/lib/summary";

const CATEGORY_COLORS: Record<string, string> = {
  coding: "#6366f1",
  communication: "#22c55e",
  browser: "#f59e0b",
  design: "#ec4899",
  docs: "#3b82f6",
  meetings: "#8b5cf6",
  other: "#6b7280",
};

export default function Home() {
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [error, setError] = useState<string | null>(null);

  async function fetchSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSummary(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const chartData = summary?.topApps.map((a) => ({
    name: a.app.length > 12 ? a.app.slice(0, 12) + "…" : a.app,
    minutes: a.minutes,
    category: a.category,
  })) ?? [];

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Summary</h1>
            <p className="text-gray-400 text-sm mt-0.5">AI-powered insights from your screen history</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-800 rounded-lg p-1">
              {(["daily", "weekly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    period === p ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {p === "daily" ? "Today" : "This Week"}
                </button>
              ))}
            </div>
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {loading ? "Analyzing…" : "Generate"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">{error}</div>
        )}

        {!summary && !loading && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Click Generate to analyze your screen activity</p>
          </div>
        )}

        {summary && (
          <>
            {/* Headline */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-lg text-white font-medium">{summary.headline}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <span>🕐 {summary.totalActiveMinutes} min active</span>
                <span>📅 {new Date(summary.startTime).toLocaleDateString()}{period === "weekly" ? ` → ${new Date(summary.endTime).toLocaleDateString()}` : ""}</span>
              </div>
            </div>

            {/* Focus score */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium">Focus Score</span>
                </div>
                <span className="text-2xl font-bold text-white">{summary.focusScore}<span className="text-gray-500 text-base">/100</span></span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${summary.focusScore}%`,
                    background: summary.focusScore >= 70 ? "#22c55e" : summary.focusScore >= 40 ? "#f59e0b" : "#ef4444",
                  }}
                />
              </div>
            </div>

            {/* App usage chart */}
            {chartData.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium">App Usage</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} unit="m" />
                    <Tooltip
                      contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                      formatter={(v: number) => [`${v} min`, "Time"]}
                    />
                    <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.category] ?? "#6b7280"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-400">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                      {cat}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights & distractions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="font-medium text-sm">Highlights</span>
                </div>
                <ul className="space-y-2">
                  {summary.highlights.map((h, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>{h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium text-sm">Distractions</span>
                </div>
                <ul className="space-y-2">
                  {summary.distractions.map((d, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-yellow-500 mt-0.5">⚠</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-indigo-950/50 border border-indigo-800/50 rounded-xl p-5 flex gap-3">
              <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-300 mb-1">Tip for next {period === "daily" ? "day" : "week"}</p>
                <p className="text-sm text-gray-300">{summary.recommendation}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 text-center">
              Generated at {new Date(summary.generatedAt).toLocaleString()} · Auto-runs daily at 6pm & weekly Mondays at 9am
            </p>
          </>
        )}
      </div>
    </main>
  );
}
