import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type YearsChoice = "all" | "1" | "2" | "3";

type Props = {
  /** Years of data detected in the source (system maximum). */
  available: number;
  /** Minimum years that must stay connected (already-connected years). */
  minYears?: number;
  choice: YearsChoice;
  onChange: (choice: YearsChoice, years: number) => void;
  sourceName: string;
  cyYear: number;
};

const OPTION_LABELS: Record<"1" | "2" | "3", string> = {
  "1": "Current Year only",
  "2": "Current Year + Prior Year 1",
  "3": "Current Year + Prior Year 1 + Prior Year 2",
};

/** System detects the years in source; the user can only reduce. */
export function SourceYearSelection({ available, minYears = 1, choice, onChange, sourceName, cyYear }: Props) {
  const max = Math.max(1, Math.min(3, available));
  const years = choice === "all" ? max : Math.min(max, Number(choice));
  const options = (["1", "2", "3"] as const).filter((n) => Number(n) <= max && Number(n) >= minYears);
  const rows = [
    { tag: "CY", year: cyYear },
    { tag: "PY1", year: cyYear - 1 },
    { tag: "PY2", year: cyYear - 2 },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">
        {sourceName} has {max} year{max === 1 ? "" : "s"} of data available.
      </p>
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">Years to connect</p>
        <Select value={choice} onValueChange={(v) => { const c = v as YearsChoice; onChange(c, c === "all" ? max : Number(c)); }}>
          <SelectTrigger className="h-9 w-fit min-w-72 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All available years</SelectItem>
            {options.map((n) => <SelectItem key={n} value={n}>{OPTION_LABELS[n]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-[10px] border border-border divide-y divide-border">
        {rows.map((r, i) => {
          const isSource = i < years;
          return (
            <div key={r.tag} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isSource ? "bg-emerald-500" : "bg-muted-foreground/30"}`} aria-hidden="true" />
              <span className="font-medium whitespace-nowrap">{r.tag} {r.year || ""}:</span>
              <span>{isSource ? `Source - ${sourceName}` : "CSV"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
