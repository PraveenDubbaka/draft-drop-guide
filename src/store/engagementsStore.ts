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

const ENG_KEY = 'cds_engagements_v1';
const META_KEY = (id: string) => `engagement-meta-${id}`;

export const SEED_ENGAGEMENTS: EngagementRecord[] = [
 { id: "AUD-NPM-Dec312025", client: "Northline Precision Manufacturing Inc.", type: "Audit (AUD)", yearEnd: "Dec 31, 2025", team: "R. Chandra · S. Whitfield · D. Okonkwo", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Jul 27, 2026 09:00 AM", firstYearAudit: true },
 { id: "AUD-US-Dec312024", client: "Harbor Freight Logistics LLC", type: "Audit (AUD)", yearEnd: "Dec 31, 2024", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Jan 22, 2026 08:00 AM", firstYearAudit: false },
 { id: "AUD-SL-Mar312024", client: "Shipping Line Inc.", type: "Audit (AUD)", yearEnd: "Mar 31, 2024", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Jan 21, 2026 10:00 AM", firstYearAudit: false },
 { id: "COM-CON-Dec312024", client: "Shipping Line Inc.", type: "Compilation (COM)", yearEnd: "Dec 31, 2024", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Jan 21, 2026 09:00 AM", firstYearAudit: false },
 { id: "COM-PSP-Dec312023", client: "Source 40", type: "Compilation (COM)", yearEnd: "Dec 31, 2023", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Dec 30, 2025 06:26 AM", firstYearAudit: false },
 { id: "COM-QB-Dec312025", client: "Riverstone Capital", type: "Compilation (COM)", yearEnd: "Dec 31, 2025", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: true, dateCreated: "Jan 16, 2026 01:15 PM", firstYearAudit: false },
 { id: "COM-QB-Dec312024", client: "Riverstone Capital", type: "Compilation (COM)", yearEnd: "Dec 31, 2024", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Jan 13, 2026 01:36 AM", firstYearAudit: false },
 { id: "COM-CHE-Dec252024", client: "Cedar Point Logistics", type: "Compilation (COM)", yearEnd: "Dec 25, 2024", team: "View Assignees", status: "New", statusVariant: "new", hasRF: false, dateCreated: "Jan 16, 2026 08:20 AM", firstYearAudit: false },
 { id: "COM-OTH-Dec312024", client: "Other Revenue", type: "Compilation (COM)", yearEnd: "Dec 31, 2024", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Jan 16, 2026 02:38 AM", firstYearAudit: false },
 { id: "T2-AUT-Dec312023", client: "Shipping Line Inc.", type: "T2 (Corporations)", yearEnd: "Dec 31, 2023", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Dec 30, 2025 08:48 AM", firstYearAudit: false },
 { id: "COM-CAS-Dec312024", client: "cash flow ls", type: "Compilation (COM)", yearEnd: "Dec 31, 2024", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Jan 13, 2026 09:21 AM", firstYearAudit: false },
 { id: "COM-QB-Jan142026", client: "Riverstone Capital", type: "Compilation (COM)", yearEnd: "Jan 14, 2026", team: "View Assignees", status: "New", statusVariant: "new", hasRF: false, dateCreated: "Jan 13, 2026 04:36 AM", firstYearAudit: false },
 { id: "COM-SHR-Dec302023", client: "ShRoll Forward", type: "Compilation (COM)", yearEnd: "Dec 30, 2023", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: true, dateCreated: "Jan 13, 2026 03:51 AM", firstYearAudit: false },
 { id: "COM-HF-Dec312024", client: "Harbor Freight Logistics LLC", type: "Compilation (COM)", yearEnd: "Dec 31, 2024", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: false, dateCreated: "Jan 22, 2026 08:00 AM", firstYearAudit: false },
 { id: "COM-HFRF-Dec312024", client: "Harbor Freight Logistics LLC", type: "Compilation (COM)", yearEnd: "Dec 31, 2024", team: "View Assignees", status: "In Progress", statusVariant: "inProgress", hasRF: true, dateCreated: "Jan 23, 2026 09:00 AM", firstYearAudit: false },
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

 const seeds: Record<string, { dataSource: 'csv' | 'source'; sourceProvider?: 'xero' | 'quickbooks'; sourceYearsAvailable?: number; sourceYears?: number; sourceRollForward?: boolean }> = {
   'COM-QB-Jan142026': { dataSource: 'source', sourceProvider: 'quickbooks', sourceYearsAvailable: 3, sourceYears: 1 },
   'COM-QB-Dec312024': { dataSource: 'csv', sourceYearsAvailable: 1 },
   'COM-QB-Dec312025': { dataSource: 'source', sourceProvider: 'quickbooks', sourceYearsAvailable: 3, sourceYears: 3 },
   'COM-CHE-Dec252024': { dataSource: 'csv' },
   'COM-HF-Dec312024': { dataSource: 'source', sourceProvider: 'xero', sourceYearsAvailable: 3, sourceYears: 2 },
   'COM-HFRF-Dec312024': { dataSource: 'source', sourceProvider: 'quickbooks', sourceRollForward: true, sourceYearsAvailable: 3, sourceYears: 1 },
 };
 Object.entries(seeds).forEach(([id, seed]) => {
   try {
     const raw = localStorage.getItem(META_KEY(id));
     const meta: EngagementMeta = raw ? JSON.parse(raw) : { firstYearAudit: false };
     meta.dataSource = seed.dataSource;
     if (seed.sourceProvider) meta.sourceProvider = seed.sourceProvider; else delete meta.sourceProvider;
     delete meta.sourceDisconnectedFrom;
     meta.sourceYearsAvailable = seed.sourceYearsAvailable ?? 3;
     if (seed.sourceYears) meta.sourceYears = seed.sourceYears; else delete meta.sourceYears;
     if (seed.sourceRollForward) meta.sourceRollForward = true; else delete meta.sourceRollForward;
     if (!meta.teamMembers || meta.teamMembers.length === 0) meta.teamMembers = sampleTeam();
     localStorage.setItem(META_KEY(id), JSON.stringify(meta));
   } catch {}
 });
}


export function loadEngagements(): EngagementRecord[] {
 seedDemoEngagementMeta();
 try {
   const raw = localStorage.getItem(ENG_KEY);
   if (raw) {
     const stored: EngagementRecord[] = JSON.parse(raw);
     const storedById = new Map(stored.map((engagement) => [engagement.id, engagement]));
     const repaired = SEED_ENGAGEMENTS.map((seed) => storedById.get(seed.id) ?? seed);
     const seedIds = new Set(SEED_ENGAGEMENTS.map((seed) => seed.id));
     const custom = stored.filter((engagement) => !seedIds.has(engagement.id));
     const next = [...repaired, ...custom];
     if (next.length !== stored.length) localStorage.setItem(ENG_KEY, JSON.stringify(next));
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
 firstTimeAdoption?: boolean; // first-time adoption of accounting standard
 dataSource?: "csv" | "source";
 sourceYears?: number; // 1 = CY only, 2 = CY + PY1, 3 = all years connected to source
 sourceDisconnectedFrom?: "xero" | "quickbooks"; // set when a CSV import disconnected a source engagement
 sourceRollForward?: boolean; // roll forward: CY from source, prior years stay CSV
 sourceYearsAvailable?: number; // years of data available in the source (demo)
 sourceProvider?: "xero" | "quickbooks"; // which accounting source the engagement is linked to
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
