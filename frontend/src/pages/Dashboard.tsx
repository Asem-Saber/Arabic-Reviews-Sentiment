import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Upload, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatCard from "@/components/StatCard";
import { predict, submitFeedback, getStats, getRecent } from "@/lib/api";
import type { PredictResponse } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";

const COLORS: Record<string, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
};

export default function Dashboard() {
  const [reviewText, setReviewText] = useState("");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Queries ──
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: 30_000,
  });

  const { data: recent } = useQuery({
    queryKey: ["recent"],
    queryFn: () => getRecent(10),
    refetchInterval: 30_000,
  });

  // ── Mutations ──
  const predictMutation = useMutation({
    mutationFn: predict,
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent"] });
      toast.success("Analysis complete!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Prediction failed");
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => toast.success("Thanks for your feedback!"),
    onError: () => toast.error("Failed to submit feedback"),
  });

  const handleAnalyze = () => {
    if (!reviewText.trim()) {
      toast.warning("Please enter Arabic text to analyze.");
      return;
    }
    predictMutation.mutate(reviewText);
  };

  const handleFeedback = (isCorrect: boolean) => {
    if (!result) return;
    feedbackMutation.mutate({
      review: result.review,
      predicted_sentiment: result.sentiment,
      is_correct: isCorrect,
    });
  };

  // ── Chart data ──
  const pieData = stats?.distribution
    ? Object.entries(stats.distribution).map(([name, value]) => ({ name, value }))
    : [];

  const totalPositive = stats?.distribution?.positive ?? 0;
  const totalNegative = stats?.distribution?.negative ?? 0;
  const totalAnalyzed = stats?.total_predictions ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Analyze Arabic text sentiment
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total Analyzed"
          value={totalAnalyzed}
        />
        <StatCard
          label="Positive"
          value={totalPositive}
          indicator={<span className="inline-block h-0.5 w-6 rounded bg-green-500" />}
        />
        <StatCard
          label="Negative"
          value={totalNegative}
          indicator={<span className="inline-block h-0.5 w-6 rounded bg-red-500" />}
        />
        <StatCard
          label="Avg Confidence"
          value={stats ? `${(stats.average_confidence * 100).toFixed(1)}%` : "0.0%"}
        />
      </div>

      {/* Text Area + Result */}
      <Card className="shadow-sm border-border/60">
        <CardContent className="p-6 space-y-4">
          <Textarea
            dir="rtl"
            placeholder="أدخل النص العربي هنا..."
            className="min-h-[120px] text-base resize-none"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />

          {/* Result inline */}
          {result && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/60 p-4">
              <Badge
                variant={result.sentiment === "positive" ? "default" : "destructive"}
                className="text-xs px-3 py-1"
              >
                {result.sentiment.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Confidence: <strong>{(result.confidence * 100).toFixed(1)}%</strong>
              </span>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-200"
                  onClick={() => handleFeedback(true)}
                  disabled={feedbackMutation.isPending}
                >
                  <ThumbsUp className="mr-1 h-3.5 w-3.5" /> Correct
                </Button>
                <Button
                  size="sm"
                  className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-200"
                  onClick={() => handleFeedback(false)}
                  disabled={feedbackMutation.isPending}
                >
                  <ThumbsDown className="mr-1 h-3.5 w-3.5" /> Wrong
                </Button>
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-end">
            <div className="flex gap-2">
              <Button size="sm" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-200" onClick={() => navigate("/batch")}>
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload CSV
              </Button>
              <Button
                size="sm"
                className="bg-[var(--color-coral)] hover:bg-[var(--color-coral)]/90 text-white"
                onClick={handleAnalyze}
                disabled={predictMutation.isPending}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {predictMutation.isPending ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: History + Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Analysis History */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Analysis History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recent && recent.length > 0 ? (
              <div className="max-h-[260px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Review</TableHead>
                      <TableHead className="text-xs w-[90px]">Sentiment</TableHead>
                      <TableHead className="text-xs w-[80px] text-right">Conf.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell
                          className="max-w-[200px] truncate text-xs"
                          dir="rtl"
                          title={item.review}
                        >
                          {item.review}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.sentiment === "positive" ? "default" : "destructive"}
                            className="text-[10px] px-2"
                          >
                            {item.sentiment}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {(item.confidence * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                No analyses yet. Enter Arabic text above to get started.
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
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[entry.name] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px" }}
                  />
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
