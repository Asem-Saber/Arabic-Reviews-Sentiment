import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  indicator?: ReactNode;
}

export default function StatCard({ label, value, indicator }: StatCardProps) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardContent className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {indicator && <div className="mt-1">{indicator}</div>}
      </CardContent>
    </Card>
  );
}
