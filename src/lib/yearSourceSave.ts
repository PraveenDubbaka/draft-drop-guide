import type { AccountingProvider } from "@/lib/clientSource";
import type { EngagementMeta, YearSourceKind } from "@/store/engagementsStore";

const YEAR_KEYS = ["cy", "py1", "py2"] as const;
const isSourceRow = (v?: string) => !!v && v.startsWith("source:") && v !== "source:none";

/**
 * Per-year fields saved by Create/Edit Engagement from the Data Source rows
 * ("csv" | "source:<provider>" | "source:none" | "locked" | "nodata").
 * `priorToCsv` turns locked roll-forward prior years to CSV (Partial year, or roll forward CY Source → CSV);
 * their existing data is kept (no remove-data flag).
 */
export function savedYearSources(opts: {
  rows: string[];
  lockedSource: (k: "py1" | "py2") => YearSourceKind | "nodata";
  priorToCsv: boolean;
  priorYearSources?: EngagementMeta["priorYearSources"];
  sourceRollForward?: boolean;
}): Pick<EngagementMeta, "yearDataSources" | "yearSourceProviders" | "priorYearSources" | "sourceRollForward"> {
  const { rows, lockedSource, priorToCsv, priorYearSources } = opts;
  const lockedKind = (i: number) => (priorToCsv ? "csv" : lockedSource(YEAR_KEYS[i] as "py1" | "py2"));
  const rowKind = (v: string | undefined, i: number): "csv" | "source" =>
    v === "locked" ? (lockedKind(i) === "csv" || lockedKind(i) === "nodata" ? "csv" : "source") : (isSourceRow(v) || v?.startsWith("source:") ? "source" : "csv");
  const rowProvider = (v: string | undefined, i: number): AccountingProvider | undefined => {
    if (v === "locked") { const k = lockedKind(i); return k === "csv" || k === "nodata" ? undefined : k; }
    return isSourceRow(v) ? (v!.slice(7) as AccountingProvider) : undefined;
  };
  return {
    yearDataSources: { cy: rowKind(rows[0], 0), py1: rowKind(rows[1], 1), py2: rowKind(rows[2], 2) },
    yearSourceProviders: Object.fromEntries(YEAR_KEYS.map((k, i) => [k, rowProvider(rows[i], i)]).filter(([, v]) => v)) as EngagementMeta["yearSourceProviders"],
    priorYearSources: priorToCsv && priorYearSources
      ? { py1: "csv", py2: priorYearSources.py2 === "nodata" ? "nodata" : "csv" }
      : priorYearSources,
    sourceRollForward: opts.sourceRollForward,
  };
}
