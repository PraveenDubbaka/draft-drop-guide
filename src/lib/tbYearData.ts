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
