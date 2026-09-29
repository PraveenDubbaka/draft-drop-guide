import { AlertTriangle } from "lucide-react";

export const SOURCE_SWITCH_CONSEQUENCES = [
  "Adjusting entries will be deleted",
  "Manually added accounts will be deleted",
  "Issues, comments and requests will be deleted",
  "Documents under Procedures and Financial Statements sections will be moved to a temporary folder automatically",
  "All document references will be deleted",
];

/** Always-visible warning shown for every source switch scenario. */
export function SourceSwitchDisclaimer({
  title = "Before you proceed — the following will happen:",
  footnote = "These changes apply when you click Update Engagement.",
}: { title?: string; footnote?: string | null }) {
  return (
    <div className="w-full rounded-[10px] border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{title}</p>
          <ul className="mt-1.5 list-disc pl-5 space-y-0.5 text-sm text-amber-900 dark:text-amber-100">
            {SOURCE_SWITCH_CONSEQUENCES.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          {footnote && <p className="mt-2 text-xs text-foreground">{footnote}</p>}
        </div>
      </div>
    </div>
  );
}
