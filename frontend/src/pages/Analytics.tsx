import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import { getStats, getRecent } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const COLORS: Record<string, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
};

export default function Analytics() {
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: 30_000,
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-analytics"],
    queryFn: () => getRecent(50),
    refetchInterval: 30_000,
  });

  // ── Derived data ──
  const totalAnalyzed = stats?.total_predictions ?? 0;
  const avgConfidence = stats?.average_confidence ?? 0;
  const positiveCount = stats?.distribution?.positive ?? 0;
  const negativeCount = stats?.distribution?.negative ?? 0;
  const positiveRate = totalAnalyzed > 0 ? positiveCount / totalAnalyzed : 0;
  const negativeRate = totalAnalyzed > 0 ? negativeCount / totalAnalyzed : 0;

  // Sentiment pie data
  const pieData = stats?.distribution
    ? Object.entries(stats.distribution).map(([name, value]) => ({ name, value }))
    : [];

  // Sentiment trend (group by date)
  const trendData = useMemo(() => {
    if (!recent || recent.length === 0) return [];

    const grouped: Record<string, { positive: number; negative: number }> = {};
    for (const item of recent) {
      const date = item.created_at?.slice(0, 10) || "unknown";
      if (!grouped[date]) grouped[date] = { positive: 0, negative: 0 };
      if (item.sentiment === "positive") grouped[date].positive++;
      else grouped[date].negative++;
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));
  }, [recent]);

  // Word frequency from processed texts
  const wordFreqData = useMemo(() => {
    if (!recent || recent.length === 0) return [];

    const stopWords = new Set([
      "في", "من", "على", "إلى", "عن", "مع", "هذا", "هذه", "التي", "الذي",
      "كان", "كانت", "هو", "هي", "أن", "لا", "ما", "لم", "قد", "بعد",
      "كل", "ذلك", "تلك", "بين", "حتى", "عند", "ثم", "أو", "إذا", "و",
      "ال", "ان", "لن", "يا", "اذا", "فقط", "جدا", "لكن", "او",
    ]);

    const freq: Record<string, number> = {};
    for (const item of recent) {
      const words = (item.processed_text || "")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));
      for (const word of words) {
        freq[word] = (freq[word] || 0) + 1;
      }
    }

    return Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));
  }, [recent]);

  // Confidence distribution
  const confidenceDistData = useMemo(() => {
    if (!recent || recent.length === 0) return [];

    const buckets: Record<string, number> = {
      "50-60%": 0,
      "60-70%": 0,
      "70-80%": 0,
      "80-90%": 0,
      "90-100%": 0,
    };

    for (const item of recent) {
      const pct = item.confidence * 100;
      if (pct < 60) buckets["50-60%"]++;
      else if (pct < 70) buckets["60-70%"]++;
      else if (pct < 80) buckets["70-80%"]++;
      else if (pct < 90) buckets["80-90%"]++;
      else buckets["90-100%"]++;
    }

    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [recent]);

  // ── Export functions ──
  const exportCSV = () => {
    if (!recent || recent.length === 0) return;
    const header = "review,processed_text,sentiment,confidence,created_at\n";
    const rows = recent
      .map(
        (r) =>
          `"${r.review.replace(/"/g, '""')}","${r.processed_text.replace(/"/g, '""')}",${r.sentiment},${r.confidence},${r.created_at}`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!recent || recent.length === 0) return;
    const blob = new Blob([JSON.stringify(recent, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics_export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Sentiment trends, word analysis, and exportable reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-200" onClick={exportCSV}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button
            size="sm"
            className="bg-[var(--color-coral)] hover:bg-[var(--color-coral)]/90 text-white"
            onClick={exportJSON}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Avg Confidence"
          value={`${(avgConfidence * 100).toFixed(1)}%`}
        />
        <StatCard
          label="Positive Rate"
          value={totalAnalyzed > 0 ? `${(positiveRate * 100).toFixed(1)}%` : "—"}
          indicator={<span className="inline-block h-0.5 w-6 rounded bg-green-500" />}
        />
        <StatCard
          label="Negative Rate"
          value={totalAnalyzed > 0 ? `${(negativeRate * 100).toFixed(1)}%` : "—"}
          indicator={<span className="inline-block h-0.5 w-6 rounded bg-red-500" />}
        />
        <StatCard label="Total Analyses" value={totalAnalyzed} />
      </div>

      {/* Sentiment Trends */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sentiment Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="positive"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="negative"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Analyze some text on the Dashboard to see trends here.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row: Word Frequency + Confidence Dist + Sentiment Dist */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Word Frequency */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Word Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wordFreqData.length > 0 ? (
              <div className="max-h-[240px] overflow-y-auto space-y-2">
                {wordFreqData.map(({ word, count }) => {
                  const maxCount = wordFreqData[0].count;
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={word} className="flex items-center gap-2">
                      <span
                        className="text-xs text-right font-medium w-20 truncate"
                        dir="rtl"
                        title={word}
                      >
                        {word}
                      </span>
                      <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full rounded bg-primary/70 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono w-6 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No word data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Confidence Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {confidenceDistData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={confidenceDistData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
