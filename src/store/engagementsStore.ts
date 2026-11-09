export type EngagementRecord = {
 id: string;
 client: string;
 type: string;
 yearEnd: string;
 team: string;
 status: 'New' | 'In Progress';
 statusVariant: 'new' | 'inProgress';
 hasRF: boolean;
 dateCreated: string;
 firstYearAudit: boolean;
};

const ENG_KEY = 'cds_engagements_v2';
const META_KEY = (id: string) => `engagement-meta-${id}`;

export const SEED_ENGAGEMENTS: EngagementRecord[] = [
  { id: "COM-NEW-Dec312024", client: "Cedar Point Logistics", type: "Compilation (COM)", yearEnd: "Dec 31, 2024", team: "View Assignees", status: "New", statusVariant: "new", hasRF: false, dateCreated: "Jan 13, 2026 09:00 AM", firstYearAudit: false },
  { id: "COM-FYO-RF-Dec312025", client: "Harbor Freight Logistics LLC", type: "Compilation (COM)", yearEnd: "Dec 31, 2025", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: true, dateCreated: "Jan 12, 2026 09:00 AM", firstYearAudit: false },
  { id: "COM-QB-Dec312026", client: "Harbor Freight Logistics LLC", type: "Compilation (COM)", yearEnd: "Dec 31, 2026", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Jan 14, 2026 09:00 AM", firstYearAudit: false },
  { id: "COM-MRD-Dec312025", client: "Maple Ridge Dental Corp.", type: "Compilation (COM)", yearEnd: "Dec 31, 2025", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Jan 15, 2026 09:00 AM", firstYearAudit: false },
  { id: "COM-INPROGRESS-Dec312024", client: "Riverstone Capital", type: "Compilation (COM)", yearEnd: "Dec 31, 2024", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: true, dateCreated: "Jan 10, 2026 09:00 AM", firstYearAudit: false },
];

function seedDemoEngagementMeta() {
 const key = 'engagement-meta-AUD-NPM-Dec312025';
 if (!localStorage.getItem(key)) {
   const meta: EngagementMeta = {
     firstYearAudit: true,
     accountingFramework: 'ASPE',
     accountingStandards: 'CAS',
     industry: 'Manufacturing',
     periodStart: 'Jan 1, 2025',
     periodEnd: 'Dec 31, 2025',
     auditPeriodType: 'Full Year',
     firstTimeAdoption: false,
     budget: '138',
   };
   localStorage.setItem(key, JSON.stringify(meta));
 }

  // Deterministic demo data-source seeds — re-applied on every load so the 6 scenarios always show the correct source state.
  const sampleTeam = (): EngagementMeta['teamMembers'] => ([
    { id: 'tm-partner', role: 'Partner', name: 'Atin Gupta', email: 'atin@countable.co', title: 'Partner', hourlyRate: '200.00', timeAllocation: '15' },
    { id: 'tm-manager', role: 'Manager', name: 'Kaushal Bhagat', email: 'kaushalb@countable.co', title: 'Manager', hourlyRate: '100.00', timeAllocation: '35' },
    { id: 'tm-senior', role: 'Senior', name: 'Michael Torres', email: 'michaelt@countable.co', title: 'Senior Auditor', hourlyRate: '85.00', timeAllocation: '30' },
    { id: 'tm-staff', role: 'Staff / Assistant', name: 'Sarah Chen', email: 'sarahc@countable.co', title: 'Staff Auditor', hourlyRate: '65.00', timeAllocation: '20' },
  ]);

  const seeds: Record<string, { dataSource: 'csv' | 'source'; sourceProvider?: 'xero' | 'quickbooks'; sourceYearsAvailable?: number; sourceYears?: number; sourceRollForward?: boolean; periodType?: 'stub' | 'full' | 'fyoChain2' | 'full2026' | 'full2025'; firstYearOfOperations?: boolean; yearDataSources?: EngagementMeta['yearDataSources']; yearSourceProviders?: EngagementMeta['yearSourceProviders']; priorYearSources?: EngagementMeta['priorYearSources']; sourceConnectionId?: string }> = {
    'COM-NEW-Dec312024': { dataSource: 'csv' },
    // Future year end (Dec 31, 2026): CY from QuickBooks Online (pulled as of), PY1 / PY2 CSV with seeded data
    'COM-QB-Dec312026': {
      dataSource: 'source', sourceProvider: 'quickbooks', sourceYearsAvailable: 3, sourceYears: 1, periodType: 'full2026',
      yearDataSources: { cy: 'source', py1: 'csv', py2: 'csv' },
      yearSourceProviders: { cy: 'quickbooks' },
    },
    // Same-source reconnect: CY pulled from the client's original QuickBooks connection; the client has since reconnected QuickBooks
    'COM-MRD-Dec312025': {
      dataSource: 'source', sourceProvider: 'quickbooks', sourceYearsAvailable: 3, sourceYears: 1, periodType: 'full2025',
      yearDataSources: { cy: 'source', py1: 'csv', py2: 'csv' },
      yearSourceProviders: { cy: 'quickbooks' },
      sourceConnectionId: 'quickbooks-initial',
    },
    // First Year of Operations, 1st roll forward (chain 2): CY + PY1 from QuickBooks, PY2 hidden
    'COM-FYO-RF-Dec312025': {
      dataSource: 'source', sourceProvider: 'quickbooks', sourceYearsAvailable: 3, sourceYears: 1, sourceRollForward: true,
      periodType: 'fyoChain2',
      priorYearSources: { py1: 'quickbooks', py2: 'nodata' },
      yearDataSources: { cy: 'source', py1: 'source', py2: 'csv' },
      yearSourceProviders: { cy: 'quickbooks', py1: 'quickbooks' },
    },
    'COM-INPROGRESS-Dec312024': {
      dataSource: 'source', sourceProvider: 'quickbooks', sourceYearsAvailable: 3, sourceYears: 1, sourceRollForward: true,
      priorYearSources: { py1: 'quickbooks', py2: 'csv' },
      yearDataSources: { cy: 'source', py1: 'source', py2: 'csv' },
      yearSourceProviders: { cy: 'quickbooks', py1: 'quickbooks' },
    },
  };
  Object.entries(seeds).forEach(([id, seed]) => {
    try {
      const raw = localStorage.getItem(META_KEY(id));
      const meta: EngagementMeta = raw ? JSON.parse(raw) : { firstYearAudit: false };
      // Respect a user-saved data source (Edit Engagement writes dataSource + yearDataSources);
      // only apply seed defaults when the user has never saved this engagement's data source.
      // Saved via Edit Engagement at least once → keep the user's prior-year sources and period
      const neverSaved = meta.dataSource === undefined;
      if (neverSaved) {
        meta.dataSource = seed.dataSource;
        if (seed.sourceProvider) meta.sourceProvider = seed.sourceProvider; else delete meta.sourceProvider;
        delete meta.sourceDisconnectedFrom;
        if (seed.sourceYears) meta.sourceYears = seed.sourceYears; else delete meta.sourceYears;
        if (seed.sourceRollForward) meta.sourceRollForward = true; else delete meta.sourceRollForward;
        if (seed.yearDataSources) meta.yearDataSources = seed.yearDataSources;
        if (seed.yearSourceProviders) meta.yearSourceProviders = seed.yearSourceProviders;
        if (seed.sourceConnectionId) meta.sourceConnectionId = seed.sourceConnectionId;
      } else if (!meta.yearDataSources && seed.yearDataSources) {
        // Older stored meta without per-year sources (never saved via Edit) — fill in the seeded per-year sources
        meta.yearDataSources = seed.yearDataSources;
        if (seed.yearSourceProviders) meta.yearSourceProviders = seed.yearSourceProviders;
      }
      meta.sourceYearsAvailable = seed.sourceYearsAvailable ?? 3;
      if (seed.priorYearSources && (neverSaved || !meta.priorYearSources)) meta.priorYearSources = seed.priorYearSources;
      delete (meta as EngagementMeta & { priorYearProvider?: unknown }).priorYearProvider;
      if (!neverSaved) {
        // keep the saved period type / dates
      } else if (seed.periodType === 'stub') {
        meta.auditPeriodType = 'Partial year';
        meta.firstYearOfOperations = !!seed.firstYearOfOperations;
        meta.periodStart = '04/01/2024';
        meta.periodEnd = '12/31/2024';
      } else if (seed.periodType === 'fyoChain2') {
        meta.auditPeriodType = 'First Year of Operations';
        meta.firstYearOfOperations = true;
        meta.fyoChainYear = 2;
        meta.periodStart = '01/01/2025';
        meta.periodEnd = '12/31/2025';
      } else if (seed.periodType === 'full2026') {
        meta.auditPeriodType = 'Full year';
        delete meta.firstYearOfOperations;
        meta.periodStart = '01/01/2026';
        meta.periodEnd = '12/31/2026';
      } else if (seed.periodType === 'full2025') {
        meta.auditPeriodType = 'Full year';
        delete meta.firstYearOfOperations;
        meta.periodStart = '01/01/2025';
        meta.periodEnd = '12/31/2025';
      } else if (seed.periodType === 'full') {
        meta.auditPeriodType = 'Full Year';
        delete meta.firstYearOfOperations;
        meta.periodStart = '01/01/2024';
        meta.periodEnd = '12/31/2024';
      }
     if (!meta.teamMembers || meta.teamMembers.length === 0) meta.teamMembers = sampleTeam();
     localStorage.setItem(META_KEY(id), JSON.stringify(meta));
   } catch {}
 });
}


const OLD_IDS = new Set([
  "AUD-NPM-Dec312025", "AUD-US-Dec312024",
  "AUD-SL-Mar312024", "COM-CON-Dec312024",
  "COM-PSP-Dec312023", "COM-QB-Dec312025",
  "COM-QB-Dec312024", "COM-CHE-Dec252024",
  "COM-OTH-Dec312024", "COM-CAS-Dec312024",
  "COM-QB-Jan142026", "COM-SHR-Dec302023",
  "COM-HF-Dec312024", "COM-HFRF-Dec312024",
  "COM-QB-STCSV-Dec312024",
  "COM-STUB-FOO-Dec312024",
  "COM-STUB-NOFOO-Dec312024",
  "COM-HFRF-STCSV-Dec312024",
  "COM-FULL-TO-STUB-Dec312024",
  "COM-STUB-TO-FULL-Dec312024",
  "COM-STUB-SRC-TO-CSV-Dec312024",
]);

export function loadEngagements(): EngagementRecord[] {
 seedDemoEngagementMeta();
 try {
   const raw = localStorage.getItem(ENG_KEY);
   if (raw) {
     const parsed: EngagementRecord[] = JSON.parse(raw);
     const stored = parsed.filter((e) => !OLD_IDS.has(e.id));
     const storedById = new Map(stored.map((engagement) => [engagement.id, engagement]));
     const repaired = SEED_ENGAGEMENTS.map((seed) => storedById.get(seed.id) ?? seed);
     const seedIds = new Set(SEED_ENGAGEMENTS.map((seed) => seed.id));
     const KNOWN_SEED_IDS = seedIds;
     const custom = stored.filter((e) => {
       if (OLD_IDS.has(e.id)) return false;
       if (KNOWN_SEED_IDS.has(e.id)) return false;
       // Only keep user-created engagements from Oct 2026+
       const created = new Date(e.dateCreated);
       return created >= new Date("2026-10-01");
     });
     const next = [...repaired, ...custom]
       .map((e) => (e.id === "COM-INPROGRESS-Dec312024" ? { ...e, hasRF: true } : e));
     localStorage.setItem(ENG_KEY, JSON.stringify(next));
     return next;
   }
 } catch {}
 return SEED_ENGAGEMENTS;
}

export function loadAuditEngagements(): EngagementRecord[] {
 return loadEngagements().filter(e => e.type === 'Audit (AUD)');
}

export function saveEngagements(list: EngagementRecord[]): void {
 try {
 localStorage.setItem(ENG_KEY, JSON.stringify(list));
 } catch {}
}

export type YearSourceKind = "csv" | "xero" | "quickbooks" | "sage";

export type EngagementMeta = {
 firstYearAudit: boolean;
 firstYearOnPlatform?: string;
 isRollForward?: string;
 firstYearTemplates?: string[];
 templateId?: string;
 accountingFramework?: string;
 industry?: string;
 accountingStandards?: string;
 budget?: string;
 periodStart?: string;
 periodEnd?: string;
 auditPeriodType?: string; // "Full Year" | "Interim (6-month)" | "Partial Year" | "Other"
 annualizeInterim?: boolean; // true by default when auditPeriodType === "Interim (6-month)"
 firstYearOfOperations?: boolean; // stub period that is the entity's first year — allows source
 /** First Year of Operations roll-forward chain: 1 = the FOO year, 2 = 1st roll forward (CY + PY1), 3 = 2nd roll forward (all years). */
 fyoChainYear?: 1 | 2 | 3;
 /** Date (MM/dd/yyyy) the Trial Balance last pulled Current Year source data — shown for future year ends. */
 dataPulledAsOf?: string;
 firstTimeAdoption?: boolean; // first-time adoption of accounting standard
 dataSource?: "csv" | "source";
 yearDataSources?: {
   cy: "csv" | "source";
   py1: "csv" | "source";
   py2: "csv" | "source";
 };
 /** Which connected provider each Source year pulls from (multi-source engagements). */
 yearSourceProviders?: { cy?: "xero" | "quickbooks" | "sage"; py1?: "xero" | "quickbooks" | "sage"; py2?: "xero" | "quickbooks" | "sage" };
  /** Edit only: years switched Source to CSV whose existing data the user chose to remove. */
 yearRemoveData?: { cy?: boolean; py1?: boolean; py2?: boolean };
 sourceYears?: number; // 1 = CY only, 2 = CY + PY1, 3 = all years connected to source
 sourceConnectionId?: string; // client connection the source years were pulled from (default `${provider}-initial`)
 sourceDisconnectedFrom?: "xero" | "quickbooks" | "sage"; // set when a CSV import disconnected a source engagement
 sourceRollForward?: boolean; // roll forward: CY from source, prior years stay CSV
 /** Roll forward: where each locked prior year came from (last year's CY → PY1, last year's PY1 → PY2).
  *  py2 is "nodata" when last year was the entity's First Year of Operations (no year before it). */
 priorYearSources?: { py1: YearSourceKind; py2: YearSourceKind | "nodata" };
 sourceYearsAvailable?: number; // years of data available in the source (demo)
 sourceProvider?: "xero" | "quickbooks" | "sage"; // which accounting source the engagement is linked to
 teamMembers?: {
   id: string;
   role: string;
   name: string;
   email: string;
   title: string;
   hourlyRate: string;
   timeAllocation: string;
 }[];
};

export function getEngagementMeta(id: string): EngagementMeta {
 try {
 const raw = localStorage.getItem(META_KEY(id));
 if (raw) return JSON.parse(raw);
 } catch {}
 return { firstYearAudit: false };
}

export function setEngagementMeta(id: string, meta: EngagementMeta): void {
 try {
 localStorage.setItem(META_KEY(id), JSON.stringify(meta));
 } catch {}
}

const LAST_YEAR_RE = /(\d{4})(?!\d)(?!.*\d{4})/;
/** Adds `n` years to the last 4-digit year in a string (IDs, year ends, period dates). */
function bumpLastYear(s: string, n = 1): string {
 return s.replace(LAST_YEAR_RE, (y) => String(Number(y) + n));
}

function toMdY(d: Date): string {
 const pad = (n: number) => String(n).padStart(2, "0");
 return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

function nowDateCreated(): string {
 const now = new Date();
 return now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
  " " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

/**
 * Rolls an engagement forward one year. Saves the new engagement's meta and returns its record
 * (the caller adds the record to the engagement list). Returns null if the source engagement is missing.
 */
export function createRollForward(
 sourceId: string,
 clientConnection: "xero" | "quickbooks" | "sage" | null,
): EngagementRecord | null {
 const list = loadEngagements();
 const src = list.find((e) => e.id === sourceId);
 if (!src) return null;
 const m = getEngagementMeta(sourceId);

 // Last year's source per year
 const lastYear = (y: "cy" | "py1" | "py2"): YearSourceKind =>
  m.yearDataSources?.[y] === "source" ? (m.yearSourceProviders?.[y] ?? m.sourceProvider ?? "csv") : "csv";
 // Last year was First Year of Operations / Partial year → this year is a normal 12-month Full year
 const srcIsFyo = m.auditPeriodType === "First Year of Operations"
  || (!!m.firstYearOfOperations && /^partial year$/i.test(m.auditPeriodType ?? ""));
 const srcIsPartial = !srcIsFyo && /^partial year$/i.test(m.auditPeriodType ?? "");
 const srcChain = srcIsFyo ? (m.fyoChainYear ?? 1) : 0;
 // FOO stays FOO through roll forward until all three years are full years (chain 1 → 2 → 3 → Full year)
 const keepFyo = srcIsFyo && srcChain < 3;
 const py1: YearSourceKind = lastYear("cy");
 // FYO: the business didn't exist two years back → PY2 is a "No data" year (only on the 1st roll forward)
 const py2: YearSourceKind | "nodata" = srcIsFyo && srcChain === 1
  ? "nodata"
  : m.sourceRollForward && m.priorYearSources?.py1 ? m.priorYearSources.py1 : lastYear("py1");
 const cyKind: "csv" | "source" = clientConnection ? "source" : "csv";

 // New ID: bump the last year, de-duplicate with -2, -3, …
 const ids = new Set(list.map((e) => e.id));
 const baseId = bumpLastYear(sourceId);
 let id = baseId;
 for (let n = 2; ids.has(id); n++) id = `${baseId}-${n}`;

 const record: EngagementRecord = {
  ...src,
  id,
  yearEnd: bumpLastYear(src.yearEnd),
  status: "New",
  statusVariant: "new",
  hasRF: true,
  dateCreated: nowDateCreated(),
 };

 const kind = (v: YearSourceKind | "nodata"): "csv" | "source" => (v === "csv" || v === "nodata" ? "csv" : "source");
 const yearSourceProviders: NonNullable<EngagementMeta["yearSourceProviders"]> = {};
 if (cyKind === "source" && clientConnection) yearSourceProviders.cy = clientConnection;
 if (py1 !== "csv") yearSourceProviders.py1 = py1;
 if (py2 !== "csv" && py2 !== "nodata") yearSourceProviders.py2 = py2;

 // Period: FYO / Partial year roll into a Full year = the 12 months ending on the new year-end
 const resetToFullYear = srcIsFyo || srcIsPartial;
 let periodStart = m.periodStart ? bumpLastYear(m.periodStart) : undefined;
 let periodEnd = m.periodEnd ? bumpLastYear(m.periodEnd) : undefined;
 if (resetToFullYear) {
  const end = new Date(periodEnd ?? record.yearEnd);
  if (!isNaN(end.getTime())) {
   const start = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate() + 1);
   periodStart = toMdY(start);
   periodEnd = toMdY(end);
  }
 }

 const meta: EngagementMeta = {
  firstYearAudit: record.firstYearAudit,
  templateId: m.templateId,
  accountingStandards: m.accountingStandards,
  accountingFramework: m.accountingFramework,
  budget: m.budget,
  teamMembers: m.teamMembers ? m.teamMembers.map((t) => ({ ...t })) : undefined,
  auditPeriodType: keepFyo ? "First Year of Operations" : resetToFullYear ? (src.type === "Audit (AUD)" ? "Full Year" : "Full year") : m.auditPeriodType,
  ...(keepFyo ? { firstYearOfOperations: true, fyoChainYear: (srcChain + 1) as 2 | 3 } : {}),
  periodStart,
  periodEnd,
  sourceRollForward: true,
  dataSource: cyKind,
  sourceProvider: clientConnection ?? undefined,
  sourceYears: cyKind === "source" ? 1 : undefined,
  priorYearSources: { py1, py2 },
  yearDataSources: { cy: cyKind, py1: kind(py1), py2: kind(py2) },
  yearSourceProviders,
  sourceYearsAvailable: m.sourceYearsAvailable ?? 3,
 };
 setEngagementMeta(id, meta);
 return record;
}
