import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Period {
  start: Date;
  end: Date;
  label: string;
}

export function presetPeriod(days: number): Period {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end, label: `Últimos ${days} dias` };
}

export default function PeriodFilter({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const presets = [7, 30, 90];
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((d) => (
        <Button
          key={d}
          size="sm"
          variant={value.label === `Últimos ${d} dias` ? "default" : "outline"}
          onClick={() => onChange(presetPeriod(d))}
          className={cn("h-8")}
        >
          {d}d
        </Button>
      ))}
      <div className="flex items-center gap-1">
        <Input
          type="date"
          value={fmt(value.start)}
          onChange={(e) =>
            onChange({ start: new Date(e.target.value), end: value.end, label: "Personalizado" })
          }
          className="h-8 w-[140px]"
        />
        <span className="text-xs text-muted-foreground">até</span>
        <Input
          type="date"
          value={fmt(value.end)}
          onChange={(e) =>
            onChange({ start: value.start, end: new Date(e.target.value), label: "Personalizado" })
          }
          className="h-8 w-[140px]"
        />
      </div>
    </div>
  );
}