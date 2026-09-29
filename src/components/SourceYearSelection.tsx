import { Checkbox } from "@/components/ui/checkbox";

export type YearRow = { tag: "CY" | "PY1" | "PY2"; label: string; start: string; end: string };

type Props = {
  rows: YearRow[];
  /** Number of years selected for source (1 = CY only). */
  selected: number;
  onChange: (n: number) => void;
  /** Years already connected to source — shown checked and locked. Min 1 (CY). */
  lockedCount?: number;
  /** Years available in source (API). Undefined = unknown (no API call). */
  available?: number;
  sourceName: string;
};

export function SourceYearSelection({ rows, selected, onChange, lockedCount = 1, available, sourceName }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground">Select years to connect to source</p>
      <div className="rounded-[10px] border border-border divide-y divide-border">
        {rows.map((r, i) => {
          const idx = i + 1;
          const checked = selected >= idx;
          const locked = idx <= Math.max(1, lockedCount);
          const unavailable = available !== undefined && idx > available;
          const disabled = locked || unavailable || (idx > 1 && selected < idx - 1);
          return (
            <label
              key={r.tag}
              className={`flex items-center gap-3 px-3 py-2 text-sm ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${unavailable ? "opacity-50" : ""}`}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={(v) => onChange(v ? idx : idx - 1)}
                aria-label={r.label}
              />
              <span className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{r.label}</span>
                <span className="block text-xs text-foreground">{r.start} — {r.end}</span>
              </span>
              <span className="flex items-center gap-2 font-medium text-foreground whitespace-nowrap">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${checked ? "bg-emerald-500" : "bg-muted-foreground/30"}`} aria-hidden="true" />
                {checked ? `Source — ${sourceName}` : unavailable ? "CSV · not available in source" : "CSV"}
              </span>
            </label>
          );
        })}
      </div>
      <p className="text-xs text-foreground">Years must be selected in order. You cannot skip a year.</p>
    </div>
  );
}
