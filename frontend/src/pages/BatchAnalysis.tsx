import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileText, Download, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatCard from "@/components/StatCard";
import { batchPredict } from "@/lib/api";
import type { BatchPredictResponse } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { toast } from "sonner";

const COLORS: Record<string, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
};

export default function BatchAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [results, setResults] = useState<BatchPredictResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResults(null);
    setSelectedColumn("");

    const ext = f.name.split(".").pop()?.toLowerCase();

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const rows = lines.map((line) => ({ text: line }));
        setParsedRows(rows);
        setColumns(["text"]);
        setSelectedColumn("text");
      };
      reader.readAsText(f);
    } else {
      Papa.parse<Record<string, string>>(f, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setParsedRows(result.data);
          const cols = result.meta.fields || [];
          setColumns(cols);
          if (cols.length === 1) setSelectedColumn(cols[0]);
        },
        error: () => toast.error("Failed to parse CSV file"),
      });
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleRunBatch = async () => {
    if (!selectedColumn || parsedRows.length === 0) return;

    const reviews = parsedRows
      .map((r) => r[selectedColumn]?.trim())
      .filter(Boolean);

    if (reviews.length === 0) {
      toast.warning("No valid reviews found in selected column.");
      return;
    }

    if (reviews.length > 1000) {
      toast.warning("Maximum 1000 rows allowed.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await batchPredict(reviews);
      setResults(data);
      toast.success(`Batch prediction completed for ${data.results.length} reviews!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Batch prediction failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!results) return;
    const csv = Papa.unparse(
      results.results.map((r) => ({
        review: r.review,
        processed_text: r.processed_text,
        sentiment: r.sentiment,
        confidence: r.confidence,
      }))
    );
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "predictions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setFile(null);
    setColumns([]);
    setSelectedColumn("");
    setParsedRows([]);
    setResults(null);
  };

  // Chart data
  const chartData = results
    ? Object.entries(
        results.results.reduce(
          (acc, r) => {
            acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Batch Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file and analyze each row
        </p>
      </div>

      {/* Upload Zone */}
      {!file ? (
        <Card
          className={`shadow-sm border-2 border-dashed transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-border/60"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Upload CSV File</p>
              <p className="text-xs text-muted-foreground mt-1">
                Each row should contain Arabic text. Supports .csv and .txt<br />
                files up to 5MB (1000 rows max).
              </p>
            </div>
            <Button size="sm" className="mt-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-200">
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Choose File
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border/60">
          <CardContent className="p-6 space-y-4">
            {/* File info bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {parsedRows.length} rows
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Column selector */}
            {columns.length > 1 && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Text column:
                </label>
                <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Run button */}
            <Button
              className="bg-[var(--color-coral)] hover:bg-[var(--color-coral)]/90 text-white"
              onClick={handleRunBatch}
              disabled={!selectedColumn || isLoading}
            >
              {isLoading ? "Analyzing..." : "Run Batch Prediction"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total" value={results.summary.total} />
            <StatCard
              label="Positive"
              value={results.summary.positive}
              indicator={<span className="inline-block h-0.5 w-6 rounded bg-green-500" />}
            />
            <StatCard
              label="Negative"
              value={results.summary.negative}
              indicator={<span className="inline-block h-0.5 w-6 rounded bg-red-500" />}
            />
            <StatCard
              label="Avg Confidence"
              value={`${(results.summary.average_confidence * 100).toFixed(1)}%`}
            />
          </div>

          {/* Results Table */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Results
              </CardTitle>
              <Button size="sm" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-200" onClick={handleDownload}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-[40px]">#</TableHead>
                      <TableHead className="text-xs">Review</TableHead>
                      <TableHead className="text-xs w-[90px]">Sentiment</TableHead>
                      <TableHead className="text-xs w-[80px] text-right">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.results.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell
                          className="max-w-[300px] truncate text-xs"
                          dir="rtl"
                          title={r.review}
                        >
                          {r.review}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={r.sentiment === "positive" ? "default" : "destructive"}
                            className="text-[10px] px-2"
                          >
                            {r.sentiment}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {(r.confidence * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Distribution Chart */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Sentiment Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[entry.name] || "#94a3b8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
