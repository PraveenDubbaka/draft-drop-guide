export type TbYear = "cy" | "py1" | "py2";

/** Legacy "uploaded" marker (any year) — honoured as "all years uploaded". */
export const TB_LOADED_KEY = (id: string) => `tb-loaded-${id}`;
/** Per-year "uploaded" marker: { cy?: true, py1?: true, py2?: true } */
export const TB_UPLOADED_KEY = (id: string) => `tb-uploaded-${id}`;

const NO_UPLOADS: Record<TbYear, boolean> = { cy: false, py1: false, py2: false };

export function readUploadedYears(id: string | undefined): Record<TbYear, boolean> {
  if (!id) return NO_UPLOADS;
  if (localStorage.getItem(TB_LOADED_KEY(id))) return { cy: true, py1: true, py2: true };
  try {
    const v = JSON.parse(localStorage.getItem(TB_UPLOADED_KEY(id)) || "{}");
    return { cy: !!v.cy, py1: !!v.py1, py2: !!v.py2 };
  } catch {
    return NO_UPLOADS;
  }
}

/** A year has TB data when the engagement is a seeded demo, the year is Source, or a TB was uploaded for it. */
export function tbYearHasData(opts: { isSeeded: boolean; isSource: boolean; uploaded: boolean }): boolean {
  return opts.isSeeded || opts.isSource || opts.uploaded;
}

type YearSourceMeta = {
  sourceProvider?: string;
  sourceRollForward?: boolean;
  yearDataSources?: Partial<Record<TbYear, "csv" | "source">>;
  yearSourceProviders?: Partial<Record<TbYear, string>>;
  priorYearSources?: { py1?: string; py2?: string };
};

/**
 * A year pulls from `provider` when it is set to Source with that provider, or — on a roll forward —
 * when the locked prior year inherited that provider (priorYearSources). Without per-year sources,
 * the first `sourceYearCount` years count as Source.
 */
export function isYearOnProvider(meta: YearSourceMeta, y: TbYear, idx: number, provider: string | null | undefined, sourceYearCount: number): boolean {
  if (!provider) return false;
  const inherited = y !== "cy" && meta.sourceRollForward ? meta.priorYearSources?.[y] : undefined;
  // A saved per-year source is authoritative
  if (meta.yearDataSources) return meta.yearDataSources[y] === "source" && (meta.yearSourceProviders?.[y] ?? inherited ?? meta.sourceProvider) === provider;
  if (inherited !== undefined) return inherited === provider;
  return idx < sourceYearCount;
}

/** Parses "MM/dd/yyyy" or a display date like "Dec 31, 2026" to a local date (time stripped). */
export function parseDateOnly(s: string | undefined | null): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const d = m ? new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])) : new Date(s);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Current Year end is after today (dates only) — the year hasn't finished yet. */
export function isFutureYearEnd(yearEnd: string | undefined | null, today: Date = new Date()): boolean {
  const d = parseDateOnly(yearEnd);
  if (!d) return false;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return d.getTime() > t.getTime();
}

/** Today as MM/dd/yyyy (stored as the "pulled as of" date). */
export function todayMdY(today: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(today.getMonth() + 1)}/${p(today.getDate())}/${today.getFullYear()}`;
}
