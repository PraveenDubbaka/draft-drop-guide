import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEngagements } from "@/store/EngagementsContext";
import { EngagementRecord, setEngagementMeta, getEngagementMeta, loadEngagements } from "@/store/engagementsStore";
import { toast } from "sonner";
import intuitQuickbooksLogo from "@/assets/intuit-quickbooks-logo.svg";
import xeroLogo from "@/assets/xero-logo-full.svg";
import { clientsData as appClientsData } from "@/data/clientsData";
import { getClientSourceIntegration, sourceLabel, getClientConnectionOverride, connectClientSource, CLIENT_CONNECTION_EVENT } from "@/lib/clientSource";
import { ArrowLeft, Briefcase, Calendar, Users, ChevronDown, Plus, Pencil, Trash2, Search, ExternalLink, X, Building2, FileText, Settings2, Check, UserPlus, Link2, AlertTriangle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/Layout";
import { Checkbox } from "@/components/ui/checkbox";
import { SourceYearSelection, type YearsChoice } from "@/components/SourceYearSelection";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const CSV_LABEL = "Non-Source Connected (CSV/Excel import required)";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TemplatePickerPanel } from "@/components/TemplatePickerPanel";
import { TEMPLATE_CONFIG } from "@/lib/engagementTemplatesData";

const INDUSTRIES = [
 "Construction & Real Estate", "Financial Services", "Healthcare & Life Sciences",
 "Hospitality & Tourism", "Manufacturing", "Mining & Resources", "Not-for-Profit",
 "Oil & Gas", "Professional Services", "Retail & Consumer", "Technology", "Transportation & Logistics",
];
const SPECIAL_ENGAGEMENT_TYPES = [
 "CAS 800 — Special Purpose Framework Audit",
 "CAS 805 — Single Financial Statement or Specific Element Audit",
 "CAS 810 — Summary Financial Statements Engagement",
 "Compliance / Regulatory Engagement",
 "Contractual Basis Engagement",
 "Other Special Purpose Framework",
];
const SPF_VALUES = [
 "Income Tax Basis",
 "Compliance / Regulatory Basis",
 "Contractual Basis",
 "Other Comprehensive Basis of Accounting (OCBOA)",
];
const ACCOUNTING_FRAMEWORKS = [
 "ASPE — Canadian Accounting Standards for Private Enterprises",
 "IFRS — International Financial Reporting Standards",
 "US GAAP — Generally Accepted Accounting Principles (United States)",
 "Tax Basis",
 "Cash Basis",
 "Modified Cash Basis",
];
const ENTITY_CLASSIFICATIONS = ["Private", "Public", "Manufacturing"];
const AUDIT_ROLES = [
 "Engagement Partner", "Manager", "Senior Auditor", "Staff Auditor / Assistant",
 "EQCR (Quality Reviewer)", "Tax Reviewer", "Subject Matter Expert", "Preparer",
];
type RecommendedRole = { role: string; hourlyRate: string; timeAllocation: string };
const RECOMMENDED_TEAM: Record<string, RecommendedRole[]> = {
 audit: [
 { role: "Engagement Partner", hourlyRate: "400.00", timeAllocation: "15" },
 { role: "Manager", hourlyRate: "275.00", timeAllocation: "25" },
 { role: "Senior Auditor", hourlyRate: "200.00", timeAllocation: "35" },
 { role: "Staff Auditor / Assistant",hourlyRate: "150.00", timeAllocation: "25" },
 ],
 review: [
 { role: "Partner", hourlyRate: "400.00", timeAllocation: "20" },
 { role: "Manager", hourlyRate: "275.00", timeAllocation: "30" },
 { role: "Senior", hourlyRate: "200.00", timeAllocation: "35" },
 { role: "Staff / Assistant", hourlyRate: "150.00", timeAllocation: "15" },
 ],
 compilation: [
 { role: "Partner", hourlyRate: "400.00", timeAllocation: "15" },
 { role: "Senior", hourlyRate: "200.00", timeAllocation: "45" },
 { role: "Preparer", hourlyRate: "125.00", timeAllocation: "40" },
 ],
 tax: [
 { role: "Partner", hourlyRate: "400.00", timeAllocation: "20" },
 { role: "Manager", hourlyRate: "275.00", timeAllocation: "30" },
 { role: "Tax Reviewer", hourlyRate: "300.00", timeAllocation: "35" },
 { role: "Preparer", hourlyRate: "125.00", timeAllocation: "15" },
 ],
};
const AUDIT_DISCLOSURE_OPTIONS = [
 { key: "fullFinancials", label: "Full financial statements" },
 { key: "cashFlow", label: "Cash Flow Statement" },
 { key: "shareholdersEquity", label: "Shareholders' Equity" },
 { key: "notesToFinancials", label: "Notes to financial statements" },
 { key: "schedulesOfExpenses", label: "Schedules of Expenses" },
 { key: "supplementarySchedules", label: "Supplementary schedules" },
 { key: "segmentReporting", label: "Segment Reporting" },
 { key: "interimFinancials", label: "Interim Financials" },
];

let _uid = 0;
const uid = () => String(++_uid);

// Standard input component with label above - matching design system
const LabeledInput = ({ 
 label, 
 value, 
 onChange, 
 required = false,
 type = "text",
 icon,
 readOnly = false,
 disabled = false,
 error = false
}: { 
 label: string; 
 value: string; 
 onChange: (value: string) => void;
 required?: boolean;
 type?: string;
 icon?: React.ReactNode;
 readOnly?: boolean;
 disabled?: boolean;
 error?: boolean;
}) => {
 return (
 <div className="flex flex-col gap-1">
 {label && (
 <label className="text-xs font-medium text-foreground">
 {label}
 {required && <span className="text-destructive ml-0.5">*</span>}
 </label>
 )}
 <div className="relative">
 <input
 type={type}
 value={value}
 onChange={(e) => onChange(e.target.value)}
 readOnly={readOnly}
 disabled={disabled}
 className={`
 input-double-border w-full h-9 px-3 py-2 text-sm text-foreground rounded-[10px] outline-none transition-all duration-200
 ${disabled 
 ? 'bg-muted border border-transparent text-muted-foreground opacity-60 cursor-not-allowed' 
 : error
 ? 'bg-white dark:bg-card border border-destructive'
 : 'bg-white border border-[#C3CBD6] dark:border-[hsl(220_15%_30%)] dark:bg-card hover:border-[hsl(210_25%_75%)] dark:hover:border-[hsl(220_15%_40%)]'
 }
 ${readOnly ? 'cursor-default' : ''}
 ${icon ? 'pr-10' : ''}
 `}
 />
 {icon && (
 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
 {icon}
 </div>
 )}
 </div>
 </div>
 );
};

// Standard select component with label above - matching design system
const LabeledSelect = ({ 
 label, 
 value, 
 onChange, 
 options,
 required = false,
 disabled = false,
 error = false
}: { 
 label: string; 
 value: string; 
 onChange: (value: string) => void;
 options: { value: string; label: string }[];
 required?: boolean;
 disabled?: boolean;
 error?: boolean;
}) => {
 return (
 <div className="flex flex-col gap-1">
 {label && (
 <label className="text-xs font-medium text-foreground">
 {label}
 {required && <span className="text-destructive ml-0.5">*</span>}
 </label>
 )}
 <Select value={value} onValueChange={onChange} disabled={disabled}>
 <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
 <SelectContent>
 {options.map((opt) => (
 <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 );
};

// Section card component
const SectionCard = ({
 icon,
 title,
 children,
 badge,
 headerRight,
}: {
 icon: React.ReactNode;
 title: string;
 children: React.ReactNode;
 badge?: string;
 headerRight?: React.ReactNode;
}) => (
 <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
 <div className="flex items-center gap-2 mb-5">
 <span className="text-primary">{icon}</span>
 <h2 className="text-base font-semibold text-foreground">{title}</h2>
 {badge && (
 <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">{badge}</span>
 )}
 {headerRight && <div className="ml-auto">{headerRight}</div>}
 </div>
 {children}
 </div>
);

const EngagementConfigSidePanel = ({
 showFirstYearOnPlatform,
 firstYearOnPlatform,
 onFirstYearOnPlatformChange,
 showRollForward,
 isRollForward,
 onRollForwardChange,
 showAnnualize,
 annualizeInterim,
 onAnnualizeChange,
 firstTimeAdoption,
}: {
 showFirstYearOnPlatform: boolean;
 firstYearOnPlatform: string;
 onFirstYearOnPlatformChange: (v: string) => void;
 showRollForward: boolean;
 isRollForward: string;
 onRollForwardChange: (v: string) => void;
 showAnnualize: boolean;
 annualizeInterim: boolean;
 onAnnualizeChange: (v: boolean) => void;
 firstTimeAdoption: boolean;
}) => {
 const hasActiveFields = showFirstYearOnPlatform || showRollForward || showAnnualize;

 return (
 <div className="bg-card rounded-lg border border-border shadow-sm p-5">
 <div className="flex items-center gap-2 mb-1">
 <Settings2 className="h-4 w-4 text-primary" />
 <h3 className="text-sm font-semibold text-foreground">Engagement Configuration</h3>
 </div>
 <p className="text-xs text-muted-foreground mb-4">Contextual settings that adapt based on your selections.</p>

 {hasActiveFields ? (
 <div className="flex flex-col gap-4">
 {showFirstYearOnPlatform && (
 <LabeledSelect
 label="First audit on this platform?"
 value={firstYearOnPlatform}
 onChange={onFirstYearOnPlatformChange}
 options={[
 { value: "yes", label: "Yes — no prior files" },
 { value: "no", label: "No — prior files exist" },
 ]}
 />
 )}
 {showRollForward && (
 <LabeledSelect
 label="Is this a roll-forward?"
 value={isRollForward}
 onChange={onRollForwardChange}
 options={[
 { value: "yes", label: "Yes — roll forward" },
 { value: "no", label: "No — new engagement" },
 ]}
 />
 )}
 {showAnnualize && (
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-foreground">Annualize income statement data?</label>
 <div className="flex items-center gap-4 h-9">
 <label className="flex items-center gap-1.5 cursor-pointer text-sm text-foreground">
 <input type="radio" name="annualizeInterim" value="yes" checked={annualizeInterim} onChange={() => onAnnualizeChange(true)} className="accent-primary" />
 Yes
 </label>
 <label className="flex items-center gap-1.5 cursor-pointer text-sm text-foreground">
 <input type="radio" name="annualizeInterim" value="no" checked={!annualizeInterim} onChange={() => onAnnualizeChange(false)} className="accent-primary" />
 No
 </label>
 </div>
 </div>
 )}
 </div>
 ) : (
 <p className="text-xs text-muted-foreground italic">Additional configuration options will appear here based on your selections above.</p>
 )}

 {firstTimeAdoption && (
 <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
 <span className="text-amber-500 text-xs mt-0.5">⚠</span>
 <p className="text-xs text-amber-700 dark:text-amber-400">Opening balance testing procedures will be added to this engagement.</p>
 </div>
 )}
 </div>
 );
};

const ic = "input-double-border w-full h-9 px-3 py-2 text-sm text-foreground rounded-[10px] outline-none transition-all duration-200 bg-white border border-[#C3CBD6] dark:border-[hsl(220_15%_30%)] dark:bg-card hover:border-[hsl(210_25%_75%)] dark:hover:border-[hsl(220_15%_40%)]";
const sc = ic + " appearance-none cursor-pointer";

const InlineRow = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
 <div className="flex items-center gap-4 py-2.5">
 <span className="text-sm text-foreground w-44 shrink-0">
 {label}{required && <span className="text-destructive ml-0.5">*</span>}
 </span>
 <div className="flex-1 min-w-0 max-w-sm">{children}</div>
 </div>
);

const BoolToggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
 <div className="inline-flex rounded-[8px] border border-border overflow-hidden text-xs font-medium shrink-0 select-none">
 <button type="button" onClick={() => onChange(true)}
 className={`px-3.5 py-1.5 transition-colors ${value ? 'bg-[#1C63A6] text-white' : 'text-muted-foreground hover:bg-muted'}`}>
 Yes
 </button>
 <button type="button" onClick={() => onChange(false)}
 className={`px-3.5 py-1.5 transition-colors border-l border-border ${!value ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:bg-muted'}`}>
 No
 </button>
 </div>
);

const StrToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
 <div className="inline-flex rounded-[8px] border border-border overflow-hidden text-xs font-medium shrink-0 select-none">
 <button type="button" onClick={() => onChange('yes')}
 className={`px-3.5 py-1.5 transition-colors ${value === 'yes' ? 'bg-[#1C63A6] text-white' : 'text-muted-foreground hover:bg-muted'}`}>
 Yes
 </button>
 <button type="button" onClick={() => onChange('no')}
 className={`px-3.5 py-1.5 transition-colors border-l border-border ${value === 'no' ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:bg-muted'}`}>
 No
 </button>
 </div>
);

const MultiSelectDropdown = ({
 label,
 options,
 selected,
 onToggle,
 required = false,
}: {
 label: string;
 options: { key: string; label: string }[];
 selected: Set<string>;
 onToggle: (key: string) => void;
 required?: boolean;
}) => {
 const [open, setOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
 };
 document.addEventListener("mousedown", handler);
 return () => document.removeEventListener("mousedown", handler);
 }, []);

 return (
 <div className="flex flex-col gap-1" ref={ref}>
 <label className="text-xs font-medium text-foreground">
 {label}
 {required && <span className="text-destructive ml-0.5">*</span>}
 </label>
 <div className="relative">
 <button
 type="button"
 onClick={() => setOpen(!open)}
 className="input-double-border w-full h-9 px-3 text-sm text-left rounded-[10px] outline-none transition-all bg-white border border-[#C3CBD6] dark:border-[hsl(220_15%_30%)] dark:bg-card hover:border-[hsl(210_25%_75%)] dark:hover:border-[hsl(220_15%_40%)] flex items-center justify-between gap-2"
 >
 <span className="text-muted-foreground truncate">
 {selected.size === 0 ? "Select..." : `${selected.size} selected`}
 </span>
 <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
 </button>
 {open && (
 <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-card border border-border rounded-lg shadow-lg py-1 max-h-52 overflow-y-auto">
 {options.map(({ key, label: optLabel }) => (
 <button
 key={key}
 type="button"
 onClick={() => onToggle(key)}
 className="w-full px-3 py-2 text-sm text-left flex items-center gap-2.5 hover:bg-muted transition-colors"
 >
 <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selected.has(key) ? "bg-primary border-primary" : "border-border"}`}>
 {selected.has(key) && <Check className="h-2.5 w-2.5 text-white" />}
 </div>
 <span className={selected.has(key) ? "text-foreground" : "text-muted-foreground"}>{optLabel}</span>
 </button>
 ))}
 </div>
 )}
 </div>
 {selected.size > 0 && (
 <div className="flex flex-wrap gap-1 mt-1">
 {options.filter(o => selected.has(o.key)).map(({ key, label: chipLabel }) => (
 <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
 {chipLabel}
 <button type="button" onClick={() => onToggle(key)} className="hover:text-destructive transition-colors ml-0.5">
 <X className="h-2.5 w-2.5" />
 </button>
 </span>
 ))}
 </div>
 )}
 </div>
 );
};

interface TeamMember {
 id: string;
 role: string;
 name: string;
 email: string;
 title: string;
 hourlyRate: string;
 timeAllocation: string;
}

type PendingRow =
 | { mode: 'add'; draft: TeamMember }
 | { mode: 'edit'; originalId: string; draft: TeamMember };

function calcBudgetedCost(hourlyRate: string, timeAllocation: string) {
 const rate = parseFloat(hourlyRate) || 0;
 const alloc = parseFloat(timeAllocation) || 0;
 return (rate * (alloc / 100)).toFixed(2);
}

function calcBudgetedHours(timeAllocation: string) {
 return ((parseFloat(timeAllocation) || 0) / 100).toFixed(2);
}

const MOCK_TEAM_MEMBERS = [
 { name: "Kaushal Bhagat", email: "kaushalb@countable.co", title: "Manager", hourlyRate: "100.00" },
 { name: "Atin Gupta", email: "atin@countable.co", title: "Partner", hourlyRate: "200.00" },
 { name: "Michael Torres", email: "michaelt@countable.co", title: "Senior Auditor",hourlyRate: "85.00" },
 { name: "Sarah Chen", email: "sarahc@countable.co", title: "Staff Auditor", hourlyRate: "65.00" },
 { name: "Jane DEF", email: "John_DEF@email.com", title: "Associate", hourlyRate: "25.00" },
];

const TeamMemberViewRow = ({
 member,
 checked,
 onCheck,
 onEdit,
 onDelete,
}: {
 member: TeamMember;
 checked: boolean;
 onCheck: () => void;
 onEdit: () => void;
 onDelete: () => void;
}) => (
 <tr className="hover:bg-muted/40 transition-colors border-b border-border/40">
 <td className="px-4 py-3 w-10">
 <Checkbox checked={checked} onCheckedChange={onCheck} />
 </td>
 <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{member.role}</td>
 <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">{member.name}</td>
 <td className="px-4 py-3 text-sm text-muted-foreground">{member.email}</td>
 <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{member.title}</td>
 <td className="px-4 py-3 text-sm text-right text-foreground">{parseFloat(member.hourlyRate || "0").toFixed(2)}</td>
 <td className="px-4 py-3 text-sm text-right text-foreground">{member.timeAllocation}</td>
 <td className="px-4 py-3 text-sm text-right text-foreground">{calcBudgetedCost(member.hourlyRate, member.timeAllocation)}</td>
 <td className="px-4 py-3 text-sm text-right text-foreground">{calcBudgetedHours(member.timeAllocation)}</td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-0.5">
 <button type="button" onClick={onEdit} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
 <Pencil className="h-4 w-4 text-link" />
 </button>
 <button type="button" onClick={onDelete} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
 <Trash2 className="h-4 w-4 text-destructive" />
 </button>
 </div>
 </td>
 </tr>
);

const TeamMemberEditRow = ({
 draft,
 onChangeDraft,
 onConfirm,
 onCancel,
 roleOptions,
 onAddRole,
}: {
 draft: TeamMember;
 onChangeDraft: (d: TeamMember) => void;
 onConfirm: () => void;
 onCancel: () => void;
 roleOptions: string[];
 onAddRole?: () => void;
}) => {
 const handleMemberSelect = (name: string) => {
 const found = MOCK_TEAM_MEMBERS.find(m => m.name === name);
 onChangeDraft({...draft, name, email: found?.email ?? "", title: found?.title ?? "", hourlyRate: found?.hourlyRate ?? draft.hourlyRate });
 };
 const selectCls = "input-double-border w-full h-9 pl-3 pr-8 text-sm text-foreground rounded-[10px] outline-none transition-all duration-200 appearance-none cursor-pointer bg-white border border-[#C3CBD6] dark:border-[hsl(220_15%_30%)] dark:bg-card hover:border-[hsl(210_25%_75%)] dark:hover:border-[hsl(220_15%_40%)]";
 const numCls = "input-double-border w-full h-9 px-3 text-sm text-right text-foreground rounded-[10px] outline-none transition-all duration-200 bg-white border border-[#C3CBD6] dark:border-[hsl(220_15%_30%)] dark:bg-card hover:border-[hsl(210_25%_75%)] dark:hover:border-[hsl(220_15%_40%)]";
 return (
 <tr className="bg-primary/[0.03] dark:bg-primary/[0.05] border-b border-border/40">
 <td className="px-6 py-2 w-10"><Checkbox /></td>
 <td className="px-6 py-2 min-w-[160px]">
 <Select
 value={draft.role}
 onValueChange={role => {
 if (role === "__add_new_role__") { onAddRole?.(); return; }
 onChangeDraft({...draft, role });
 }}
 >
 <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
 <SelectContent>
 {roleOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
 <SelectItem value="__add_new_role__" className="text-primary font-medium">
 <span className="flex items-center gap-1.5"><UserPlus className="h-3.5 w-3.5" />Add new role</span>
 </SelectItem>
 </SelectContent>
 </Select>
 </td>
 <td className="px-6 py-2 min-w-[200px]">
 <Select value={draft.name} onValueChange={handleMemberSelect}>
 <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select an option" /></SelectTrigger>
 <SelectContent>
 {MOCK_TEAM_MEMBERS.map(m => (
 <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </td>
 <td className="px-6 py-2 text-sm text-muted-foreground max-w-[160px] truncate">{draft.email}</td>
 <td className="px-6 py-2 text-sm text-muted-foreground whitespace-nowrap">{draft.title}</td>
 <td className="px-6 py-2 min-w-[110px]">
 <input type="number" value={draft.hourlyRate} min="0" step="0.01"
 onChange={e => onChangeDraft({...draft, hourlyRate: e.target.value })}
 className={numCls} />
 </td>
 <td className="px-6 py-2 min-w-[110px]">
 <input type="number" value={draft.timeAllocation} min="0" max="100"
 onChange={e => onChangeDraft({...draft, timeAllocation: e.target.value })}
 className={numCls} />
 </td>
 <td className="px-6 py-2 text-sm text-right text-muted-foreground min-w-[110px]">
 {calcBudgetedCost(draft.hourlyRate, draft.timeAllocation)}
 </td>
 <td className="px-6 py-2 text-sm text-right text-muted-foreground min-w-[100px]">
 {calcBudgetedHours(draft.timeAllocation)}
 </td>
 <td className="px-6 py-2">
 <div className="flex items-center gap-0.5">
 <button type="button" onClick={onConfirm} disabled={!draft.name}
 className="p-1.5 hover:bg-muted rounded-lg transition-colors text-green-600 dark:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent">
 <Check className="h-4 w-4" />
 </button>
 <button type="button" onClick={onCancel}
 className="p-1.5 hover:bg-muted rounded-lg transition-colors text-destructive">
 <X className="h-4 w-4" />
 </button>
 </div>
 </td>
 </tr>
 );
};

const CLIENT_DATA: Record<string, {
 entityLegalName: string;
 entityType: string;
 contactPerson: string;
 engagementPartner: string;
 integrations: string[];
 businessPhone: string;
 cellPhone: string;
}> = {
 "Harbor Freight Logistics": {
 entityLegalName: "Harbor Freight Logistics LLC",
 entityType: "Corporation",
 contactPerson: "Michael Torres",
 engagementPartner: "Atin Gupta",
 integrations: ["quickbooks"],
 businessPhone: "+1 (604) 555-0192",
 cellPhone: "-",
 },
 "Shipping Line Inc.": {
 entityLegalName: "Shipping Line Inc.",
 entityType: "Corporation",
 contactPerson: "Sarah Chen",
 engagementPartner: "Atin Gupta",
 integrations: ["quickbooks"],
 businessPhone: "+1 (604) 555-0134",
 cellPhone: "+1 (778) 555-0221",
 },
 "John Doe Inc.": {
 entityLegalName: "John Doe Inc.",
 entityType: "Corporation",
 contactPerson: "John Doe",
 engagementPartner: "Atin Gupta",
 integrations: ["quickbooks"],
 businessPhone: "-",
 cellPhone: "-",
 },
  "Maple Hill Farms": {
    entityLegalName: "Maple Hill Farms",
    entityType: "Corporation",
    contactPerson: "Margaret Hill",
    engagementPartner: "Ayesha Naaz",
    integrations: [],
    businessPhone: "(519) 555-0488",
    cellPhone: "(519) 555-0489",
  },
  "Cedar Point Logistics": {
    entityLegalName: "Cedar Point Logistics Inc.",
    entityType: "Corporation",
    contactPerson: "Daniel Reyes",
    engagementPartner: "Atin Gupta",
    integrations: [],
    businessPhone: "+1 (416) 555-0288",
    cellPhone: "+1 (416) 555-0289",
  },
  "Riverstone Capital": {
    entityLegalName: "Riverstone Capital Group Inc.",
    entityType: "Corporation",
    contactPerson: "Elena Rivas",
    engagementPartner: "Atin Gupta",
    integrations: ["quickbooks"],
    businessPhone: "+1 (647) 555-0173",
    cellPhone: "+1 (647) 555-0174",
  },
  "Northline Precision": {
    entityLegalName: "Northline Precision Manufacturing Inc.",
    entityType: "Corporation",
    contactPerson: "Sarah Mitchell",
    engagementPartner: "Atin Gupta",
    integrations: [],
    businessPhone: "+1 (778) 555-0341",
    cellPhone: "",
  },
};

function shiftYearStr(mmddyyyy: string, delta: number): string {
  const p = mmddyyyy.split("/");
  if (p.length !== 3) return mmddyyyy;
  return `${p[0]}/${p[1]}/${String(parseInt(p[2]) + delta)}`;
}

function addDaysStr(mmddyyyy: string, days: number): string {
  const p = mmddyyyy.split("/");
  if (p.length !== 3) return mmddyyyy;
  const d = new Date(parseInt(p[2]), parseInt(p[0]) - 1, parseInt(p[1]));
  d.setDate(d.getDate() + days);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatYearEnd(dateStr: string): string {
 const parts = dateStr.split("/");
 if (parts.length !== 3) return dateStr;
 const d = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
 if (isNaN(d.getTime())) return dateStr;
 return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateCreated(): string {
 const now = new Date();
 return now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
 " " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function CreateEngagement() {
 const navigate = useNavigate();
 const location = useLocation();
 const { addEngagement, updateEngagement } = useEngagements();
  const { engagementId: routeEngagementId } = useParams();
  const isEditMode = !!routeEngagementId;
  const editingRecord = isEditMode ? loadEngagements().find(e => e.id === routeEngagementId) : undefined;
  const editingMeta = isEditMode ? getEngagementMeta(routeEngagementId!) : undefined;
  const prefill = isEditMode
    ? { clientName: editingRecord?.client, engagementType: editingRecord?.type }
    : ((location.state as { clientName?: string; engagementType?: string } | null) ?? {});

  const findClientKey = (name: string): string => {
    if (CLIENT_DATA[name]) return name;
    const match = Object.entries(CLIENT_DATA).find(([key, c]) =>
      key === name || c.entityLegalName === name || key.includes(name) || name.includes(key)
    );
    return match?.[0] || name;
  };

  // Engagement Details state
  const [clientName, setClientName] = useState(findClientKey(prefill.clientName || ""));
  const appClient = clientName
    ? appClientsData.find(c => {
        const n = clientName.trim().toLowerCase();
        return c.legalEntityName.toLowerCase() === n || c.entityName.toLowerCase() === n
          || c.legalEntityName.toLowerCase().includes(n) || n.includes(c.entityName.toLowerCase());
      })
    : undefined;
  const localClientInfo = CLIENT_DATA[clientName]
     ?? Object.entries(CLIENT_DATA).find(([key, c]) =>
          key === clientName || c.entityLegalName === clientName || key.includes(clientName) || clientName.includes(key)
        )?.[1]
     ?? null;
  const clientInfo = localClientInfo
     ?? (appClient ? {
          entityLegalName: appClient.legalEntityName,
          entityType: appClient.entityType,
          contactPerson: appClient.contactPerson,
          engagementPartner: appClient.engagementPartner,
          integrations: appClient.integration === "xero" || appClient.integration === "quickbooks" ? [appClient.integration] : [],
          businessPhone: appClient.businessPhone || "",
          cellPhone: appClient.cellPhone || "",
        } : null);
 const [engagementType, setEngagementType] = useState(prefill.engagementType || "Review (REV)");
 const prefillIsAudit = (prefill.engagementType || "Review (REV)") === "Audit (AUD)";
 const [engagementId, setEngagementId] = useState(editingRecord?.id ?? (prefillIsAudit ? "AUD-HFL-Mar312024" : "REV-DEF-Nov302023"));
 const [engagementTemplate, setEngagementTemplate] = useState(prefillIsAudit ? "CAS Audit" : "Review Section 2400");
 const [templateId, setTemplateId] = useState(editingMeta?.templateId ?? (prefillIsAudit ? "audit5100" : ""));
 const [showTemplatePicker, setShowTemplatePicker] = useState(false);
 const [budget, setBudget] = useState(editingMeta?.budget ?? "10000.00");
 // For engagements saved before the Data Source field existed, fall back to the
 // client's live connection so Source-based engagements keep showing as Source.
 const inferredEditDataSource: "csv" | "source" =
   isEditMode && getClientSourceIntegration(clientName) !== null ? "source" : "csv";
  const [dataSource, setDataSource] = useState<"csv" | "source">(() => {
    // Restore an in-progress switch after the user went to the Clients page to connect a source
    if (isEditMode) {
      try {
        const draftKey = `edit-draft-${routeEngagementId}`;
        const draft = sessionStorage.getItem(draftKey);
        if (draft) {
          sessionStorage.removeItem(draftKey);
          const parsed = JSON.parse(draft);
          if (parsed?.dataSource === "csv" || parsed?.dataSource === "source") return parsed.dataSource;
        }
      } catch {}
    }
    return editingMeta?.dataSource ?? inferredEditDataSource;
  });
  // Bumped whenever a client connection may have changed (e.g. user connected on the Clients page)
  const [connVersion, setConnVersion] = useState(0);
  useEffect(() => {
    const bump = () => setConnVersion(v => v + 1);
    const onVisible = () => { if (document.visibilityState === "visible") bump(); };
    window.addEventListener("focus", bump);
    window.addEventListener("storage", bump);
    window.addEventListener(CLIENT_CONNECTION_EVENT, bump);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", bump);
      window.removeEventListener("storage", bump);
      window.removeEventListener(CLIENT_CONNECTION_EVENT, bump);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const [sourceConnected, setSourceConnected] = useState(false);
  const originalDataSource = editingMeta?.dataSource ?? inferredEditDataSource;
  // Follow-up questions shown in edit mode when the Engagement Data Type is changed
  const [fuAdjustingEntries, setFuAdjustingEntries] = useState(false);
  const [fuNewAccounts, setFuNewAccounts] = useState(false);
  const [fuDocuments, setFuDocuments] = useState(false);
  // Source-to-source (external provider change): set when the user picks the active connection in the dropdown
  const [hasSelectedActiveConnection, setHasSelectedActiveConnection] = useState(false);
  const initialClientRef = useRef(clientName);

    // Sync data source default when client selection changes based on source connection status
    useEffect(() => {
      {
        const integ = getClientConnectionOverride(clientName, localClientInfo?.entityLegalName) ?? (localClientInfo
          ? (localClientInfo.integrations.includes("xero") ? "xero"
            : localClientInfo.integrations.includes("quickbooks") ? "quickbooks"
            : null)
          : getClientSourceIntegration(clientName));
        setSourceConnected(integ !== null);
        // In edit mode keep the saved data source until the user picks a different client
        if (isEditMode && clientName === initialClientRef.current) return;
        // Default: connected client → Source, not connected → CSV
        setDataSource(integ ? "source" : "csv");
      }
    }, [clientName, clientInfo, localClientInfo, connVersion]);

    // Clear the picked connection when the user switches the data type back
    useEffect(() => {
      if (isEditMode && originalDataSource === "csv" && dataSource === "csv") setHasSelectedActiveConnection(false);
    }, [dataSource]);

    // Reset follow-up togglesto their "No" defaults whenever the data type returns to the original value
    useEffect(() => {
      if (isEditMode && dataSource === originalDataSource) {
        setFuAdjustingEntries(false);
        setFuNewAccounts(false);
        setFuDocuments(false);
      }
    }, [dataSource, originalDataSource, isEditMode]);

 const [accountingStandards, setAccountingStandards] = useState(editingMeta?.accountingStandards ?? (prefillIsAudit ? "ASPE — Canadian Accounting Standards for Private Enterprises" : "Section 2400 Review standards"));
 const [additionalDisclosures, setAdditionalDisclosures] = useState(prefillIsAudit ? "Full financial statements" : "Statement of cash flows");

 // Engagement Period state
 const [periodType, setPeriodType] = useState(editingMeta?.auditPeriodType ?? (prefillIsAudit ? "Full Year" : "Full year"));
 const [currentYearStart, setCurrentYearStart] = useState(editingMeta?.periodStart ?? "12/01/2022");
 const [currentYearEnd, setCurrentYearEnd] = useState(editingMeta?.periodEnd ?? "11/30/2023");
 const [priorYear1Start, setPriorYear1Start] = useState("12/01/2021");
 const [priorYear1End, setPriorYear1End] = useState("11/30/2022");
 const [priorYear2Start, setPriorYear2Start] = useState("12/01/2020");
 const [priorYear2End, setPriorYear2End] = useState("11/30/2021");
 const [priorYear1NoData, setPriorYear1NoData] = useState(false);
 const [priorYear2NoData, setPriorYear2NoData] = useState(false);

 // Audit-specific state
 const isAudit = engagementType === "Audit (AUD)";

 // Sync engagement details when type changes (skip initial render)
 const isFirstMount = useRef(true);
 useEffect(() => {
  if (isFirstMount.current) { isFirstMount.current = false; return; }
  if (isEditMode) return; // never overwrite saved values when editing
 if (isAudit) {
 setEngagementId("AUD-HFL-Mar312024");
 if (!templateId) {
 setEngagementTemplate("CAS Audit");
 setAccountingStandards("ASPE — Canadian Accounting Standards for Private Enterprises");
 }
 setPeriodType("Full Year");
 setAdditionalDisclosures("");
 setAdditionalDisclosuresSet(new Set());
 } else {
 setEngagementId("REV-DEF-Nov302023");
 if (!templateId) {
 setEngagementTemplate("Review Section 2400");
 setAccountingStandards("Section 2400 Review standards");
 }
 setPeriodType("Full year");
 setAdditionalDisclosures("Statement of cash flows");
 setAdditionalDisclosuresSet(new Set());
 setSpecialPurposeFramework("");
 }
 }, [isAudit]); // eslint-disable-line react-hooks/exhaustive-deps
 const [specialPurposeFramework, setSpecialPurposeFramework] = useState("");

 useEffect(() => {
 if (!SPF_VALUES.includes(accountingStandards)) {
 setSpecialPurposeFramework("");
 }
 }, [accountingStandards]);

 const [condensedForms, setCondensedForms] = useState(false);
 const [firstYearAudit, setFirstYearAudit] = useState(false);
 const [firstYearOnPlatform, setFirstYearOnPlatform] = useState("");
 const [isRollForward, setIsRollForward] = useState("");
 
 const [firstYearTemplates, setFirstYearTemplates] = useState<Set<string>>(new Set());
 const [annualizeInterim, setAnnualizeInterim] = useState(true);
 const [firstTimeAdoption, setFirstTimeAdoption] = useState(false);
 const toggleFirstYearTemplate = (key: string) =>
 setFirstYearTemplates(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
 const [additionalDisclosuresSet, setAdditionalDisclosuresSet] = useState<Set<string>>(new Set());
 const toggleAdditionalDisclosure = (key: string) =>
 setAdditionalDisclosuresSet(prev => {
 const next = new Set(prev);
 next.has(key) ? next.delete(key) : next.add(key);
 return next;
 });

 // Team members
 const [teamMembers, setTeamMembers] = useState<TeamMember[]>(editingMeta?.teamMembers ?? []);
 const [recommendedPending, setRecommendedPending] = useState<TeamMember[]>([]);
 const [pendingRow, setPendingRow] = useState<PendingRow | null>(null);
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
 const [teamSearch, setTeamSearch] = useState("");
 const [customRoles, setCustomRoles] = useState<string[]>([]);
 const [showAddRoleModal, setShowAddRoleModal] = useState(false);
 const [newRoleName, setNewRoleName] = useState("");

 const baseRoles = isAudit ? AUDIT_ROLES : ["Partner", "Manager", "Senior", "Staff / Assistant", "Preparer"];
 const roleOptions = [...baseRoles,...customRoles];

 const getRecommendedCategory = () => {
 if (isAudit) return "audit";
 if (accountingStandards.toLowerCase().includes("tax")) return "tax";
 if (engagementType.includes("COM") || engagementType.toLowerCase().includes("compilation")) return "compilation";
 return "review";
 };

 const addRecommendedTeam = () => {
 const recs = RECOMMENDED_TEAM[getRecommendedCategory()] ?? RECOMMENDED_TEAM.review;
 setRecommendedPending(prev => [
...prev,
...recs.map(r => ({ id: uid(), role: r.role, name: "", email: "", title: "", hourlyRate: r.hourlyRate, timeAllocation: r.timeAllocation })),
 ]);
 };

 const confirmRecommendedRow = (id: string) => {
 const row = recommendedPending.find(r => r.id === id);
 if (!row) return;
 setTeamMembers(prev => [...prev, row]);
 setRecommendedPending(prev => prev.filter(r => r.id !== id));
 };

 const cancelRecommendedRow = (id: string) => {
 setRecommendedPending(prev => prev.filter(r => r.id !== id));
 };

 const startAddMember = () => {
 if (pendingRow) return;
 setPendingRow({ mode: 'add', draft: { id: uid(), role: roleOptions[0] ?? "", name: "", email: "", title: "", hourlyRate: "0.00", timeAllocation: "" } });
 };
 const startEditMember = (member: TeamMember) => {
 if (pendingRow) return;
 setPendingRow({ mode: 'edit', originalId: member.id, draft: {...member } });
 };
 const confirmPendingRow = () => {
 if (!pendingRow) return;
 if (pendingRow.mode === 'add') {
 setTeamMembers(prev => [...prev, pendingRow.draft]);
 } else {
 setTeamMembers(prev => prev.map(m => m.id === pendingRow.originalId ? pendingRow.draft : m));
 }
 setPendingRow(null);
 };
 const cancelPendingRow = () => setPendingRow(null);
 const deleteMember = (id: string) => {
 setTeamMembers(prev => prev.filter(m => m.id !== id));
 setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
 };
 const toggleSelect = (id: string) =>
 setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
 const deleteSelected = () => {
 setTeamMembers(prev => prev.filter(m => !selectedIds.has(m.id)));
 setSelectedIds(new Set());
 };

 const filteredMembers = teamMembers.filter(m =>
 !teamSearch || m.name.toLowerCase().includes(teamSearch.toLowerCase()) || m.role.toLowerCase().includes(teamSearch.toLowerCase())
 );
 const totalAlloc = teamMembers.reduce((s, m) => s + (parseFloat(m.timeAllocation) || 0), 0);
 const avgRate = teamMembers.length && totalAlloc > 0
 ? (teamMembers.reduce((s, m) => s + (parseFloat(m.hourlyRate) || 0) * (parseFloat(m.timeAllocation) || 0), 0) / totalAlloc).toFixed(2)
 : "0.00";
 const avgAlloc = totalAlloc.toFixed(0);
 const avgCost = teamMembers.reduce((s, m) => s + parseFloat(calcBudgetedCost(m.hourlyRate, m.timeAllocation)), 0).toFixed(2);
 const avgHours = teamMembers.reduce((s, m) => s + parseFloat(calcBudgetedHours(m.timeAllocation)), 0).toFixed(2);

 const engagementTypeOptions = [
 { value: "Audit (AUD)", label: "Audit (AUD)" },
 { value: "Compilation (COM)", label: "Compilation (COM)" },
 { value: "Review (REV)", label: "Review (REV)" },
 { value: "T2 (Corporations)", label: "T2 (Corporations)" },
 { value: "1120 (US C-Corporation)", label: "1120 (US C-Corporation)" },
 { value: "1120S (US S-Corporation)", label: "1120S (US S-Corporation)" },
 ];

 const accountingStandardsOptions = isAudit
 ? ACCOUNTING_FRAMEWORKS.map(fw => ({ value: fw, label: fw }))
 : [
 { value: "Section 2400 Review standards", label: "Section 2400 Review standards" },
 { value: "CSRE 2400 — Review of Historical Financial Statements", label: "CSRE 2400 — Review of Historical Financial Statements" },
 { value: "ASPE", label: "ASPE" },
 { value: "IFRS", label: "IFRS" },
 { value: "ASNPO — Accounting Standards for Not-for-Profit Organizations", label: "ASNPO — Accounting Standards for Not-for-Profit Organizations" },
 { value: "PSAB — Public Sector Accounting Standards", label: "PSAB — Public Sector Accounting Standards" },
 { value: "Pension Plans Accounting Standards", label: "Pension Plans Accounting Standards" },
 { value: "CSRS 4200 — Compilation Engagements", label: "CSRS 4200 — Compilation Engagements" },
 ];

 const disclosureOptions = [
 { value: "Statement of cash flows", label: "Statement of cash flows" },
 { value: "Notes to financial statements", label: "Notes to financial statements" },
 ];

 const periodTypeOptions = isAudit
 ? [
  { value: "Full Year", label: "Full Year" },
  { value: "Partial Year", label: "Partial Year" },
  { value: "Other", label: "Other" },
  ]
  : [
  { value: "Full year", label: "Full year" },
  { value: "Partial year", label: "Partial year" },
  ];

  const isFullYearPeriod = periodType === "Full Year" || periodType === "Full year";
  const isStubPeriod = periodType === "Partial Year" || periodType === "Partial year";
  const [firstYearOfOperations, setFirstYearOfOperations] = useState<boolean>(!!editingMeta?.firstYearOfOperations);
  // Stub periods allow source only when it's the first year of operations
  const isSourceLockedStub = isStubPeriod && !firstYearOfOperations;
 const clientSourceIntegration = getClientConnectionOverride(clientName, clientInfo?.entityLegalName) ?? (localClientInfo
   ? (localClientInfo.integrations.includes("xero") ? "xero" as const
     : localClientInfo.integrations.includes("quickbooks") ? "quickbooks" as const
     : null)
   : getClientSourceIntegration(clientName));
 const clientHasSourceConnection = clientSourceIntegration !== null;
 // Engagement was disconnected from its source by a CSV import; switching back to Source reconnects it
 const savedDisconnectedFrom = editingMeta?.sourceDisconnectedFrom;
 const isReconnectFlow = isEditMode && clientHasSourceConnection && originalDataSource === "csv" && dataSource === "source" && !!savedDisconnectedFrom;
 // Roll forward: Current Year pulls from source, prior years stay CSV
 const isRollForwardSource = isEditMode && !!editingMeta?.sourceRollForward;
 // Years of data available in the connected source (demo) — drives the dynamic info alert
 const yearsAvailable = editingMeta?.sourceYearsAvailable ?? 3;
  const cyYear = parseInt(currentYearEnd.split("/")[2]) || 0;
   const [sourceYears, setSourceYears] = useState<number>(editingMeta?.sourceYears ?? 1);
   const maxSourceYears = Math.max(1, Math.min(3, yearsAvailable));
   const [yearsChoice, setYearsChoice] = useState<YearsChoice>(() => {
     const saved = editingMeta?.sourceYears;
     if (!saved || saved >= maxSourceYears) return "all";
     return String(saved) as YearsChoice;
   });
   const [ackChecked, setAckChecked] = useState(false);
   // Connecting to source defaults to all available years (user can only reduce)
   useEffect(() => {
     if (isEditMode && originalDataSource === "csv" && dataSource === "source") {
       setYearsChoice("all");
       setSourceYears(maxSourceYears);
     }
     setAckChecked(false);
   }, [dataSource]);
   useEffect(() => { setAckChecked(false); }, [sourceYears, hasSelectedActiveConnection]);

 const applyFullYearPriors = (cyStart: string, cyEnd: string) => {
 setPriorYear1Start(shiftYearStr(cyStart, -1));
 setPriorYear1End(shiftYearStr(cyEnd, -1));
 setPriorYear2Start(shiftYearStr(cyStart, -2));
 setPriorYear2End(shiftYearStr(cyEnd, -2));
 };

 const handlePeriodTypeChange = (val: string) => {
 setPeriodType(val);
 if (val === "Full Year" || val === "Full year") {
 const autoEnd = addDaysStr(shiftYearStr(currentYearStart, 1), -1);
 setCurrentYearEnd(autoEnd);
 applyFullYearPriors(currentYearStart, autoEnd);
 }
 };

 const handleCurrentYearStartChange = (val: string) => {
 setCurrentYearStart(val);
 if (isFullYearPeriod) {
 const autoEnd = addDaysStr(shiftYearStr(val, 1), -1);
 setCurrentYearEnd(autoEnd);
 applyFullYearPriors(val, autoEnd);
 }
 };

 const handleCurrentYearEndChange = (val: string) => {
 setCurrentYearEnd(val);
 if (isFullYearPeriod) {
 const autoStart = addDaysStr(shiftYearStr(val, -1), 1);
 setCurrentYearStart(autoStart);
 applyFullYearPriors(autoStart, val);
 }
 };

 const engagementDetailsValid =
 engagementId.trim() !== "" &&
 engagementTemplate.trim() !== "" &&
 engagementType !== "" &&
 accountingStandards !== "";

 const isFormValid =
 clientName.trim() !== "" &&
 engagementId.trim() !== "" &&
 engagementTemplate.trim() !== "" &&
 engagementType !== "" &&
 budget.trim() !== "" &&
 (isSourceLockedStub || dataSource !== "source" || clientHasSourceConnection || sourceConnected) &&
 accountingStandards !== "" &&
 additionalDisclosures !== "" &&
 currentYearStart.trim() !== "" &&
 currentYearEnd.trim() !== "" &&
 (isEditMode || teamMembers.length > 0) &&
 (!isReconnectFlow || hasSelectedActiveConnection);

  // Edit-mode scenario: engagement was CSV, client has a source connection, user switched to Source
  const isCsvToSourceSwitch = isEditMode && clientHasSourceConnection && originalDataSource === "csv" && dataSource === "source" && sourceConnected && !savedDisconnectedFrom;
   // Edit-mode scenario 2: engagement was Source, user switched to CSV
   const isSourceToCsvSwitch = isEditMode && clientHasSourceConnection && originalDataSource === "source" && dataSource === "csv";
   // Edit-mode scenario 5: the client's source connection changed since the engagement was set up
   const savedSourceProvider = editingMeta?.sourceProvider;
   const isSourceProviderMismatch = isEditMode && clientHasSourceConnection
     && originalDataSource === "source" && dataSource === "source"
     && !!savedSourceProvider && savedSourceProvider !== clientSourceIntegration;
   // The client's connection can't be used by this engagement right now:
   // either the connection isn't active or the engagement is linked to a different source.
   const showConnectionDropdown = isSourceProviderMismatch || isReconnectFlow;
   const dropdownSavedProvider = isReconnectFlow ? savedDisconnectedFrom : savedSourceProvider;
    const isConnectionDisconnected = clientHasSourceConnection&& (!sourceConnected || isSourceProviderMismatch);
    // Roll forward with no client connection → auto CSV, locked
    const isRollForwardNoSource = isRollForwardSource && !clientHasSourceConnection;
    const rollForwardPriorProvider: "xero" | "quickbooks" = savedDisconnectedFrom ?? savedSourceProvider
      ?? (clientSourceIntegration === "quickbooks" ? "xero" : "quickbooks");
    // Year selection (CY locked; PY1/PY2 optional, in order)
    const originalSourceYears = originalDataSource === "source" ? (editingMeta?.sourceYears ?? 1) : 0;
    const isAddingSourceYearsFlow = isEditMode && originalDataSource === "source" && dataSource === "source" && !isSourceProviderMismatch;
    const yearLockedCount = isAddingSourceYearsFlow ? originalSourceYears : 1;
    const isAddingSourceYears = isAddingSourceYearsFlow && sourceYears > originalSourceYears;
     const showYearSelection = isEditMode && !isSourceLockedStub && dataSource === "source" && clientHasSourceConnection
       && (isCsvToSourceSwitch || isAddingSourceYearsFlow || (isSourceProviderMismatch && hasSelectedActiveConnection) || (isReconnectFlow && hasSelectedActiveConnection));
     const isDisconnecting = isEditMode && originalDataSource === "source" && dataSource === "csv";
     const showAck = isEditMode && !isSourceLockedStub && !isRollForwardNoSource && clientHasSourceConnection
       && (((dataSource !== originalDataSource && (!isReconnectFlow || hasSelectedActiveConnection)) || (isSourceProviderMismatch && hasSelectedActiveConnection)) || isAddingSourceYears);

   const performSave = () => {
   // Stub period without first year of operations locks Data Source Type to CSV
   const savedDataSource: "csv" | "source" = isSourceLockedStub || isRollForwardNoSource ? "csv" : dataSource;
 const record: EngagementRecord = {
 id: engagementId,
 client: clientName,
 type: engagementType,
 yearEnd: formatYearEnd(currentYearEnd),
 team: "View Assignees",
 status: editingRecord?.status ?? "New",
 statusVariant: editingRecord?.statusVariant ?? "new",
 hasRF: editingRecord?.hasRF ?? false,
 dateCreated: editingRecord?.dateCreated ?? formatDateCreated(),
 firstYearAudit,
 };
 if (isEditMode && editingRecord) {
 updateEngagement(editingRecord.id, record);
 } else {
 addEngagement(record);
 }
 setEngagementMeta(engagementId, {
 firstYearAudit,
 firstYearOnPlatform: firstYearAudit ? firstYearOnPlatform : undefined,
 isRollForward: firstYearAudit ? isRollForward : undefined,
 firstYearTemplates: firstYearAudit ? [...firstYearTemplates] : undefined,
 templateId: templateId || undefined,
 accountingFramework: isAudit ? accountingStandards : undefined,
 accountingStandards,
 budget,
 periodStart: currentYearStart,
 periodEnd: currentYearEnd,
 dataSource: savedDataSource,
 sourceYears: savedDataSource === "source" ? sourceYears : undefined,
 teamMembers,
 sourceProvider: savedDataSource === "source" ? (clientSourceIntegration ?? undefined) : (editingMeta?.sourceDisconnectedFrom ? editingMeta.sourceProvider : undefined),
 sourceDisconnectedFrom: savedDataSource === "csv" ? editingMeta?.sourceDisconnectedFrom : undefined,
 sourceRollForward: editingMeta?.sourceRollForward,
 sourceYearsAvailable: editingMeta?.sourceYearsAvailable,
  auditPeriodType: periodType,
  firstYearOfOperations: isStubPeriod ? firstYearOfOperations : undefined,
 annualizeInterim: isAudit && periodType === "Interim (6-month)" ? annualizeInterim : undefined,
 firstTimeAdoption: isAudit ? firstTimeAdoption : undefined,
 });
 if (isAudit && teamMembers.length > 0) {
 const roleMap: Record<string, string> = {
 "Engagement Partner": "partner",
 "Manager": "manager",
 "Senior Auditor": "senior",
 "Staff Auditor / Assistant": "assistant",
 "EQCR (Quality Reviewer)": "eqcr",
 "Subject Matter Expert": "specialist",
 "Tax Reviewer": "admin",
 "Preparer": "admin",
 "Other": "other",
 };
 const rateMap: Record<string, string> = {};
 teamMembers.forEach(m => {
 const key = roleMap[m.role];
 if (key && m.hourlyRate && parseFloat(m.hourlyRate) > 0 && !rateMap[key]) {
 rateMap[key] = m.hourlyRate;
 }
 });
 if (Object.keys(rateMap).length > 0) {
 localStorage.setItem(`audit-team-rates-${engagementId}`, JSON.stringify(rateMap));
 }
 }
 if (isEditMode) {
 toast.success("Engagement updated successfully.");
 } else if (isAudit && firstYearAudit) {
 toast.success("Engagement created — IE checklist and predecessor letter added.");
 } else {
 toast.success("Engagement created successfully.");
 }
 navigate("/engagements");
 };

  const handleCreate = () => {
    performSave();
  };

 return (
 <Layout title={isEditMode ? "Edit Engagement" : "Create Engagement"}>
 <div className="flex-1 overflow-y-auto bg-background">
 <div className="p-6">
 {/* Header with back button */}
 <div className="flex items-center gap-3 mb-6">
 <button 
 onClick={() => navigate("/engagements")}
 className="flex items-center gap-1 text-link hover:underline text-sm font-medium"
 >
 <ArrowLeft className="h-4 w-4 icon-arrow" />
 Back
 </button>
 </div>

 <div className="flex flex-col gap-5">
{/* Client Info Banner — full page width */}
 <div className="bg-card rounded-lg shadow-sm px-6 py-5 border border-border">
 <h2 className="text-sm font-semibold text-foreground mb-4">Client Info</h2>
 {!clientInfo ? (
 <p className="text-sm text-muted-foreground">Select a client in Engagement Details to view client information.</p>
 ) : (
 <div className="grid grid-cols-7 gap-4">
 {[
 { label: "Entity legal name", value: clientInfo.entityLegalName },
 { label: "Entity type", value: clientInfo.entityType },
 { label: "Contact person", value: clientInfo.contactPerson },
 { label: "Engagement partner", value: clientInfo.engagementPartner, isLink: true },
 { label: "Integrations", value: clientInfo.integrations },
 { label: "Business phone", value: clientInfo.businessPhone },
 { label: "Cell phone", value: clientInfo.cellPhone },
 ].map((col) => (
 <div key={col.label} className="flex flex-col gap-1">
 <span className="text-xs font-semibold text-primary">{col.label}</span>
              {Array.isArray(col.value) ? (
                <div className="flex items-center gap-1.5">
                  {clientSourceIntegration ? (
                    <img src={clientSourceIntegration === "xero" ? xeroLogo : intuitQuickbooksLogo} alt={sourceLabel(clientSourceIntegration)} className="h-5 object-contain" />
                  ) : (
                    <span className="text-sm text-foreground">—</span>
                  )}
                </div>
              ) : (col as any).isLink ? (
                <span className="text-sm text-link font-medium cursor-pointer hover:underline">{col.value as string}</span>
              ) : (
                <span className="text-sm text-foreground">{(col.value as string) || "—"}</span>
              )}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Two-column grid: forms (left) + audit config panel (right) */}
 <div className="flex flex-col gap-5 w-full">
 {/* Engagement Details — inline labels */}
 <SectionCard icon={<Briefcase className="h-5 w-5" />} title="Engagement Details">
 <InlineRow label="Client" required>
 <Select value={clientName} onValueChange={setClientName} disabled={isEditMode}>
 <SelectTrigger className="h-9 text-sm opacity-70 cursor-not-allowed"><SelectValue placeholder="Select client..." /></SelectTrigger>
 <SelectContent>
 {Array.from(new Set([...Object.keys(CLIENT_DATA), ...appClientsData.map(c => c.entityName), ...(clientName ? [clientName] : [])])).map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
 </SelectContent>
 </Select>
 </InlineRow>
 <InlineRow label="Engagement ID" required>
 <div className="relative">
 <input type="text" value={engagementId} onChange={e => setEngagementId(e.target.value)} className={ic + " pr-10"} />
 <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 </div>
 </InlineRow>
 <InlineRow label="Template" required>
 <div className="relative">
 <input type="text" value={engagementTemplate} onChange={e => setEngagementTemplate(e.target.value)} className={ic + " pr-10"} />
 <button type="button" onClick={() => setShowTemplatePicker(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:text-primary">
 <ExternalLink className="h-4 w-4 text-muted-foreground" />
 </button>
 </div>
 </InlineRow>
 <InlineRow label="Engagement Type" required>
 <Select value={engagementType} onValueChange={setEngagementType} disabled>
 <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
 <SelectContent>
 {engagementTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </InlineRow>
 <InlineRow label="Budget ($)" required>
 <input type="text" value={budget} onChange={e => setBudget(e.target.value)} className={ic} />
 </InlineRow>
 <InlineRow label="Accounting Framework" required>
 <Select value={accountingStandards} onValueChange={setAccountingStandards}>
 <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
 <SelectContent>
 {accountingStandardsOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </InlineRow>
 {isAudit && SPF_VALUES.includes(accountingStandards) && (
 <InlineRow label="Engagement Standard">
 <Select value={specialPurposeFramework} onValueChange={setSpecialPurposeFramework}>
 <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select if applicable..." /></SelectTrigger>
 <SelectContent>
 {SPECIAL_ENGAGEMENT_TYPES.map(fw => <SelectItem key={fw} value={fw}>{fw}</SelectItem>)}
 </SelectContent>
 </Select>
 </InlineRow>
 )}
 {!isAudit && (
 <InlineRow label="Additional Disclosures" required>
 <Select value={additionalDisclosures} onValueChange={setAdditionalDisclosures}>
 <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
 <SelectContent>
 {disclosureOptions.map(o =>
 <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
 )}
 </SelectContent>
 </Select>
 </InlineRow>
 )}
 </SectionCard>

 {/* Audit Configuration (audit only) */}
 {isAudit && (
 <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
 {/* Panel header */}
 <div className="px-5 py-4 border-b border-border bg-muted/30">
 <div className="flex items-center gap-2">
 <Settings2 className="h-4 w-4 text-primary" />
 <h3 className="text-sm font-semibold text-foreground">Audit Configuration</h3>
 </div>
 <p className="text-xs text-muted-foreground mt-0.5">Answer each question to configure your engagement.</p>
 </div>

 {/* Questions — unlocked after engagement details filled */}
 {engagementDetailsValid ? (
 <div>
 {/* FORM PREFERENCES */}
 <div className="px-5 pt-4 pb-3 border-b border-border/30 space-y-3">
 <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Form Preferences</p>
 <div className="flex items-start justify-between gap-3 max-w-sm">
 <div>
 <p className="text-sm text-foreground leading-snug">Condensed audit forms?</p>
 <p className="text-xs text-muted-foreground mt-0.5">Shortened checklists for simpler engagements.</p>
 </div>
 <BoolToggle value={condensedForms} onChange={setCondensedForms} />
 </div>
 <div className="flex items-start justify-between gap-3 max-w-sm">
 <div>
 <p className="text-sm text-foreground leading-snug">First-time adoption of standard?</p>
 <p className="text-xs text-muted-foreground mt-0.5">Adds opening balance testing procedures.</p>
 </div>
 <BoolToggle value={firstTimeAdoption} onChange={setFirstTimeAdoption} />
 </div>
 {firstTimeAdoption && (
 <div className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
 <span className="text-amber-500 text-xs mt-0.5">⚠</span>
 <p className="text-xs text-amber-700 dark:text-amber-400">Opening balance testing will be added to this engagement.</p>
 </div>
 )}
 </div>

 </div>
 ) : (
 <div className="px-5 py-8 text-center">
 <p className="text-xs text-muted-foreground italic">Complete the engagement details to unlock configuration options.</p>
 </div>
 )}
 </div>
 )}

 <SectionCard icon={<Calendar className="h-5 w-5" />} title="Engagement Period">
 {/* Period Type */}
 <div className="flex items-center gap-4 py-2.5">
 <span className="text-sm text-foreground w-44 shrink-0 whitespace-nowrap">Period Type<span className="text-destructive ml-0.5">*</span></span>
 <div className="flex-1 min-w-0 max-w-sm">
 <Select value={periodType} onValueChange={handlePeriodTypeChange}>
 <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
 <SelectContent>
 {periodTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 </div>
 {isStubPeriod && (
 <div className="flex items-center gap-4 pb-2.5">
 <span className="w-44 shrink-0" />
 <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
 <Checkbox checked={firstYearOfOperations} onCheckedChange={v => setFirstYearOfOperations(!!v)} />
 First Year of Operations
 </label>
 </div>
 )}
 {isStubPeriod && (
 <div className="flex items-start gap-4 pb-2.5">
 <span className="w-44 shrink-0" />
 <p className="text-xs text-muted-foreground max-w-lg">
 Partial year selected — enter the exact start and end dates for this shorter period. Dates are not auto-derived and comparatives are not annualized.
 </p>
 </div>
 )}
 {/* Year rows */}
 {[
 { label: "Current Year", required: true, start: currentYearStart, setStart: handleCurrentYearStartChange, end: currentYearEnd, setEnd: handleCurrentYearEndChange },
 { label: "Prior Year 1", required: false, start: priorYear1Start, setStart: setPriorYear1Start, end: priorYear1End, setEnd: setPriorYear1End },
 { label: "Prior Year 2", required: false, start: priorYear2Start, setStart: setPriorYear2Start, end: priorYear2End, setEnd: setPriorYear2End },
 ].map(row => (
 <div key={row.label} className="flex items-start gap-4 py-2.5">
 <span className="text-sm text-foreground w-44 shrink-0 whitespace-nowrap pt-5">
 {row.label}{row.required && <span className="text-destructive ml-0.5">*</span>}
 </span>
 <div className="flex gap-3 flex-1 min-w-0">
 <div className="flex-1 min-w-0 max-w-44"><LabeledInput label="Start Date" value={row.start} onChange={row.setStart} required={row.required} icon={<Calendar className="h-4 w-4" />} /></div>
 <div className="flex-1 min-w-0 max-w-44"><LabeledInput label="End Date" value={row.end} onChange={row.setEnd} required={row.required} icon={<Calendar className="h-4 w-4" />} /></div>
 </div>
 </div>
 ))}
  </SectionCard>

   {/* Engagement Source — full year: editable; stub period: locked to CSV */}
   {(isFullYearPeriod || isStubPeriod) && (
  <SectionCard icon={<Link2 className="h-5 w-5" />} title="Engagement Source">
  <div className="flex items-center gap-4 py-2.5">
  <span className="text-sm text-foreground w-44 shrink-0">Source Connection Status<span className="text-destructive ml-0.5">*</span></span>
  <div className="w-fit max-w-full min-w-0">
  {clientHasSourceConnection ? (
  showConnectionDropdown ? (
  <Select value={hasSelectedActiveConnection? "active" : "saved"} onValueChange={v => { if (v === "active") setHasSelectedActiveConnection(true); }}>
  <SelectTrigger className="h-9 w-fit min-w-max text-sm gap-3">
  <span className="inline-flex items-center gap-2.5 pr-1">
  <img
  src={(hasSelectedActiveConnection ? clientSourceIntegration : dropdownSavedProvider) === "xero" ? xeroLogo : intuitQuickbooksLogo}
  alt={sourceLabel(hasSelectedActiveConnection ? clientSourceIntegration : dropdownSavedProvider ?? null)}
  className="h-5 object-contain shrink-0"
  />
  <span className="whitespace-nowrap shrink-0">{clientInfo?.entityLegalName || clientName}</span>
  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium shrink-0 ${hasSelectedActiveConnection ? "border-[#2E7D52]/30 bg-[#EAF4EE] text-[#2E7D52]" : "border-[#B4720A]/30 bg-[#FEF6E7] text-[#B4720A]"}`}>
  {hasSelectedActiveConnection ? "Connected" : "Disconnected"}
  </span>
  </span>
  </SelectTrigger>
  <SelectContent>
  <SelectItem value="saved" disabled className="text-muted-foreground">
  <span className="inline-flex items-center gap-2.5">
  <img src={dropdownSavedProvider === "xero" ? xeroLogo : intuitQuickbooksLogo} alt={sourceLabel(dropdownSavedProvider ?? null)} className="h-5 object-contain shrink-0" />
  <span className="whitespace-nowrap shrink-0">{clientInfo?.entityLegalName || clientName}</span>
  <span className="inline-flex items-center rounded-full border border-[#B4720A]/30 bg-[#FEF6E7] px-2 py-0.5 text-[11px] font-medium text-[#B4720A] shrink-0">Disconnected</span>
  </span>
  </SelectItem>
  <SelectItem value="active" onPointerUp={() => setHasSelectedActiveConnection(true)} onKeyDown={() => setHasSelectedActiveConnection(true)}>
  <span className="inline-flex items-center gap-2.5">
  <img src={clientSourceIntegration === "xero" ? xeroLogo : intuitQuickbooksLogo} alt={sourceLabel(clientSourceIntegration)} className="h-5 object-contain shrink-0" />
  <span className="whitespace-nowrap shrink-0">{clientInfo?.entityLegalName || clientName}</span>
  <span className="inline-flex items-center rounded-full border border-[#2E7D52]/30 bg-[#EAF4EE] px-2 py-0.5 text-[11px] font-medium text-[#2E7D52] shrink-0">Connected</span>
  </span>
  </SelectItem>
  </SelectContent>
  </Select>
  ) : (() => {
   const content = (
   <span className="inline-flex items-center gap-2.5 pr-1">
   <img src={clientSourceIntegration === "xero" ? xeroLogo : intuitQuickbooksLogo} alt={sourceLabel(clientSourceIntegration)} className="h-5 object-contain shrink-0" />
   <span className="whitespace-nowrap shrink-0">{clientInfo?.entityLegalName || clientName}</span>
   {isConnectionDisconnected ? (
   <span className="inline-flex items-center rounded-full border border-[#B4720A]/30 bg-[#FEF6E7] px-2 py-0.5 text-[11px] font-medium text-[#B4720A] shrink-0">Disconnected</span>
   ) : (
   <span className="inline-flex items-center rounded-full border border-[#2E7D52]/30 bg-[#EAF4EE] px-2 py-0.5 text-[11px] font-medium text-[#2E7D52] shrink-0">Connected</span>
   )}
   </span>
   );
   return (
   <Select value="current">
   <SelectTrigger className={`h-9 w-fit min-w-max text-sm gap-3 ${isConnectionDisconnected ? "border-amber-300" : ""}`}>{content}</SelectTrigger>
   <SelectContent><SelectItem value="current">{content}</SelectItem></SelectContent>
   </Select>
   );
  })()
  ) : (() => {
   const content = (
   <span className="inline-flex items-center gap-2.5 pr-1">
   <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
   <span>Not connected</span>
   </span>
   );
   return (
   <Select value="none">
   <SelectTrigger className="h-9 w-fit min-w-max text-sm gap-3">{content}</SelectTrigger>
   <SelectContent><SelectItem value="none">{content}</SelectItem></SelectContent>
   </Select>
   );
  })()}
  </div>
   </div>
  {isRollForwardSource && clientHasSourceConnection && !isSourceLockedStub && (
  <div className="flex items-center gap-4 py-2.5">
  <span className="text-sm text-foreground w-44 shrink-0">Prior Year (FY{cyYear - 1})</span>
  <div className="inline-flex w-fit max-w-full items-center gap-2.5 rounded-[10px] border border-border bg-muted/40 px-3 py-1.5 opacity-70">
  <img src={rollForwardPriorProvider === "xero" ? xeroLogo : intuitQuickbooksLogo} alt={sourceLabel(rollForwardPriorProvider)} className="h-5 object-contain shrink-0 grayscale" />
  <span className="text-sm text-foreground whitespace-nowrap shrink-0">{clientInfo?.entityLegalName || clientName}</span>
  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground shrink-0">
  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />Disconnected
  </span>
  </div>
  </div>
  )}
  <div className="flex items-start gap-4 py-2.5">
  <span className="text-sm text-foreground w-44 shrink-0 whitespace-nowrap pt-2">Data Source Type</span>
    <div className="flex-1 min-w-0 max-w-lg">
    {isSourceLockedStub || isRollForwardNoSource ? (
    <Select value="csv" disabled>
    <SelectTrigger className="h-9 w-fit min-w-max text-sm opacity-70 cursor-not-allowed gap-3">
    <span>{CSV_LABEL}</span>
    </SelectTrigger>
    </Select>
    ) : isEditMode ? (
    <RadioGroup value={dataSource} onValueChange={v => setDataSource(v as "csv" | "source")} className="gap-3 pt-1.5">
    {(originalDataSource === "csv"
      ? [
          { value: "csv", label: "Keep as CSV", desc: "Trial balance data will be manually imported via CSV or Excel." },
          { value: "source", label: "Connect to Source", desc: "Pull trial balance data directly from your accounting software." },
        ]
      : [
          { value: "source", label: "Keep as is", desc: `Connected to ${sourceLabel(savedSourceProvider ?? clientSourceIntegration)}` },
          { value: "csv", label: "Disconnect", desc: "Remove source connection. All years will revert to CSV." },
        ]
    ).map(o => (
    <label key={o.value} className="flex items-start gap-2.5 cursor-pointer">
    <RadioGroupItem value={o.value} className="mt-0.5" />
    <span className="min-w-0">
    <span className="block text-sm font-medium text-foreground">{o.label}</span>
    <span className="block text-xs text-muted-foreground">{o.desc}</span>
    </span>
    </label>
    ))}
    </RadioGroup>
    ) : (
    <Select value={dataSource} onValueChange={v => setDataSource(v as "csv" | "source")}>
    <SelectTrigger className="h-9 w-fit min-w-72 text-sm gap-3">
    <SelectValue />
    </SelectTrigger>
    <SelectContent>
    <SelectItem value="csv">{CSV_LABEL}</SelectItem>
    <SelectItem value="source">Source</SelectItem>
    </SelectContent>
    </Select>
    )}
    </div>
    </div>
    {isSourceLockedStub && (
    <div className="flex items-start gap-4 pb-2.5">
    <span className="w-44 shrink-0" />
    <div className="flex-1 min-w-0 rounded-[10px] border border-border bg-muted/50 px-3 py-2">
    <p className="text-sm text-muted-foreground">Source connection not available for stub periods</p>
    </div>
    </div>
    )}
    {isStubPeriod && firstYearOfOperations && (
    <div className="flex items-start gap-4 pb-2.5">
    <span className="w-44 shrink-0" />
    <div className="flex-1 min-w-0 flex items-start gap-2 rounded-[10px] border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-3 py-2">
    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
    <span className="text-sm text-blue-900 dark:text-blue-100">First year of operations — short period treated as full year for source connection.</span>
    </div>
    </div>
    )}
     {!isSourceLockedStub && !isRollForwardNoSource && (<>
   {dataSource === "source" && !clientHasSourceConnection && (
  <div className="flex items-start gap-4 pb-2.5">
  <span className="w-44 shrink-0" />
  <div className="flex-1 min-w-0 flex items-start gap-2 rounded-[10px] border border-red-300 bg-red-50 dark:bg-red-950/30 px-3 py-2">
  <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
   <div className="flex flex-col gap-2">
   <span className="text-sm text-red-800 dark:text-red-200">
    No source connection found for this client. Connect your accounting software before switching to source.
    </span>
    <div className="flex flex-wrap items-center gap-4">
    {isEditMode && (
    <button
    type="button"
    className="text-sm font-medium text-[#1C63A6] hover:underline"
    onClick={() => {
    try { sessionStorage.setItem(`edit-draft-${routeEngagementId}`, JSON.stringify({ dataSource: "source" })); } catch {}
    navigate(`/clients?returnTo=${encodeURIComponent(location.pathname)}`);
    }}
    >
    Connect from client page →
    </button>
    )}
    <button
    type="button"
    className="text-sm font-medium text-[#1C63A6] hover:underline"
    onClick={() => {
    connectClientSource(clientInfo?.entityLegalName || clientName, "quickbooks");
    toast.success(`${clientInfo?.entityLegalName || clientName} connected to QuickBooks Online`);
    }}
    >
    Connect here →
    </button>
    </div>
   </div>
  </div>
  </div>
  )}
    {clientHasSourceConnection && dataSource === "csv" && !isSourceToCsvSwitch && (
    <div className="flex items-start gap-4 pb-2.5">
    <span className="w-44 shrink-0" />
    <div className="flex-1 min-w-0 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <span className="text-sm text-amber-800 dark:text-amber-200">
    Your client is connected to {sourceLabel(clientSourceIntegration)}. This engagement will use manually imported CSV data. The source connection will remain active but won't be used for this engagement.
    </span>
    </div>
    </div>
    )}
    {isSourceToCsvSwitch && (
    <div className="flex items-start gap-4 pb-2.5">
    <span className="w-44 shrink-0" />
    <div className="flex-1 min-w-0 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <span className="text-sm text-amber-800 dark:text-amber-200">
    {isRollForwardSource
    ? <>Switching to CSV will disconnect all years from {sourceLabel(clientSourceIntegration)}, including Prior Year 1 and Prior Year 2. You will need to import CSV files for all years.</>
    : <>Switching to CSV means this engagement will no longer pull data from {sourceLabel(clientSourceIntegration)}. The source connection will stay active but won't be used.</>}
    </span>
    </div>
    </div>
    )}
   {clientHasSourceConnection && dataSource === "source" && !sourceConnected && (
  <div className="flex items-center gap-4 pb-2.5">
  <span className="w-44 shrink-0" />
  <div className="flex-1 min-w-0 flex items-center justify-between gap-3 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
  <span className="text-sm text-amber-900 dark:text-amber-200">No source connection found for this client</span>
  <Button size="sm" variant="outline" className="shrink-0" onClick={() => setSourceConnected(true)}>Connect source</Button>
  </div>
  </div>
  )}
  {isRollForwardSource && dataSource === "source" && clientHasSourceConnection && rollForwardPriorProvider !== clientSourceIntegration && (
  <div className="flex items-start gap-4 pb-2.5">
  <span className="w-44 shrink-0" />
  <div className="flex-1 min-w-0 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
  <span className="text-sm text-amber-800 dark:text-amber-200">
  This engagement will connect to {sourceLabel(clientSourceIntegration)} for the current year. Last year was connected to {sourceLabel(rollForwardPriorProvider)}.
  </span>
  </div>
  </div>
  )}
 {isReconnectFlow && hasSelectedActiveConnection && (
 <div className="flex items-start gap-4 pb-2.5">
 <span className="w-44 shrink-0" />
 <div className="flex-1 min-w-0 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
 <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
 <span className="text-sm text-amber-800 dark:text-amber-200">
 Switching back to Source will replace your current CSV trial balance data. Years available from {sourceLabel(clientSourceIntegration)} will be refreshed.
 </span>
 </div>
 </div>
 )}
 {isSourceProviderMismatch && !hasSelectedActiveConnection && (
   <div className="flex items-start gap-4 pb-2.5">
   <span className="w-44 shrink-0" />
   <div className="flex-1 min-w-0 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
   <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
   <span className="text-sm text-amber-800 dark:text-amber-200">
   Your client's source connection has changed. This engagement is still linked to {sourceLabel(savedSourceProvider ?? null)}. Select the new active connection above to continue pulling data.
   </span>
  </div>
  </div>
  )}
   {/* Year selection — system detects available years, user can only reduce */}
   {showYearSelection && (
   <div className="flex items-start gap-4 pb-2.5">
   <span className="w-44 shrink-0" />
   <div className="flex-1 min-w-0 space-y-2">
   <SourceYearSelection
   available={yearsAvailable}
   minYears={yearLockedCount}
   choice={yearsChoice}
   onChange={(c, n) => { setYearsChoice(c); setSourceYears(n); }}
   sourceName={sourceLabel(clientSourceIntegration)}
   cyYear={cyYear}
   />
   </div>
   </div>
   )}
   {/* Edit mode — inline acknowledgment whenever the source setup changes */}
   {showAck && (
   <div className="flex items-start gap-4 py-2.5">
   <span className="w-44 shrink-0" />
   <div className="flex-1 min-w-0 rounded-[10px] border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
   <div className="flex items-start gap-2">
   <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
   <div className="min-w-0 flex-1">
   <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Action required before proceeding</p>
   {isDisconnecting ? (
   <p className="mt-1.5 text-sm text-amber-900 dark:text-amber-100">Disconnecting will remove source data for all years. Import will re-enable. Documents will only move after you upload a CSV file.</p>
   ) : (
   <ul className="mt-1.5 list-disc pl-5 space-y-0.5 text-sm text-amber-900 dark:text-amber-100">
   <li>Adjusting entries will be deleted</li>
   <li>Manually added accounts will be deleted</li>
   <li>Issues, comments and requests will be deleted</li>
   <li>Documents will only move after data is imported from source</li>
   </ul>
   )}
   <label className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
   <Checkbox checked={ackChecked} onCheckedChange={v => setAckChecked(!!v)} />
   I understand and want to proceed
   </label>
   </div>
   </div>
   </div>
   </div>
   )}
    </>)}
    {isRollForwardNoSource && (
    <div className="flex items-start gap-4 pb-2.5">
    <span className="w-44 shrink-0" />
    <div className="flex-1 min-w-0 rounded-[10px] border border-border bg-muted/50 px-3 py-2">
    <p className="text-sm text-foreground">No source connection found for this client. This engagement has been set to CSV. To connect a source, go to the client page and add an integration.</p>
    </div>
    </div>
    )}
   </SectionCard>
  )}
 </div>

 {/* Assigned Team — full page width, gated */}
 {engagementDetailsValid && (
 <SectionCard
 icon={<Users className="h-5 w-5" />}
 title="Assigned team"
 badge={`${teamMembers.length + recommendedPending.length} User`}
 headerRight={
 <div className="flex items-center gap-2">
 <Button variant="outline" onClick={addRecommendedTeam} className="h-9 px-3 gap-1.5 text-sm">
 Add Recommended
 </Button>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input type="text" placeholder="Search" value={teamSearch} onChange={e => setTeamSearch(e.target.value)}
 className="input-double-border pl-9 pr-3 h-9 text-sm bg-card border border-border rounded-[10px] outline-none w-40 text-foreground placeholder:text-muted-foreground" />
 </div>
 <Button variant="outline" onClick={deleteSelected} disabled={selectedIds.size === 0} className="h-9 px-3 gap-1.5 text-sm">
 <Trash2 className="h-4 w-4" />Delete
 </Button>
 </div>
 }
 >
 <div className="overflow-x-auto rounded-lg border border-border">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-muted/60 border-b border-border">
 <th className="text-left px-4 py-3 w-10">
 <Checkbox checked={teamMembers.length > 0 && selectedIds.size === teamMembers.length} onCheckedChange={v => setSelectedIds(v ? new Set(teamMembers.map(m => m.id)) : new Set())} />
 </th>
 <th className="text-left px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">Role<span className="text-destructive ml-0.5">*</span></th>
 <th className="text-left px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">Team Member<span className="text-destructive ml-0.5">*</span></th>
 <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Email</th>
 <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Title</th>
 <th className="text-right px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">Hourly Rate ($)<span className="text-destructive ml-0.5">*</span></th>
 <th className="text-right px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">Time Allocation (%)<span className="text-destructive ml-0.5">*</span></th>
 <th className="text-right px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">Budgeted Cost ($)</th>
 <th className="text-right px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">Budgeted Hours (H)</th>
 <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filteredMembers.map(member =>
 pendingRow?.mode === 'edit' && pendingRow.originalId === member.id ? (
 <TeamMemberEditRow key={member.id} draft={pendingRow.draft} onChangeDraft={d => setPendingRow({ mode: 'edit', originalId: member.id, draft: d })} onConfirm={confirmPendingRow} onCancel={cancelPendingRow} roleOptions={roleOptions} onAddRole={() => { setNewRoleName(""); setShowAddRoleModal(true); }} />
 ) : (
 <TeamMemberViewRow key={member.id} member={member} checked={selectedIds.has(member.id)} onCheck={() => toggleSelect(member.id)} onEdit={() => startEditMember(member)} onDelete={() => deleteMember(member.id)} />
 )
 )}
 {recommendedPending.map(rec => (
 <TeamMemberEditRow
 key={rec.id}
 draft={rec}
 onChangeDraft={d => setRecommendedPending(prev => prev.map(r => r.id === d.id ? d : r))}
 onConfirm={() => confirmRecommendedRow(rec.id)}
 onCancel={() => cancelRecommendedRow(rec.id)}
 roleOptions={roleOptions}
 onAddRole={() => { setNewRoleName(""); setShowAddRoleModal(true); }}
 />
 ))}
 {pendingRow?.mode === 'add' && (
 <TeamMemberEditRow draft={pendingRow.draft} onChangeDraft={d => setPendingRow({ mode: 'add', draft: d })} onConfirm={confirmPendingRow} onCancel={cancelPendingRow} roleOptions={roleOptions} onAddRole={() => { setNewRoleName(""); setShowAddRoleModal(true); }} />
 )}
 </tbody>
 <tfoot>
 <tr className="bg-muted/30 border-t border-border/40">
 <td className="px-4 py-3" /><td className="px-4 py-3" /><td className="px-4 py-3" /><td className="px-4 py-3" />
 <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">Avg Engagement Rate</td>
 <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">{avgRate}</td>
 <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">{avgAlloc}</td>
 <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">{avgCost}</td>
 <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">{avgHours}</td>
 <td />
 </tr>
 </tfoot>
 </table>
 </div>
 <div className="mt-4">
 <button type="button" onClick={startAddMember} disabled={!!pendingRow}
 className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold rounded-[10px] bg-[#1C63A6] text-white hover:bg-[#1a5a9e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
 <Plus className="h-4 w-4" />Add Member
 </button>
 </div>
 </SectionCard>
 )}
 </div>

 <TemplatePickerPanel
 open={showTemplatePicker}
 onClose={() => setShowTemplatePicker(false)}
 suggestedTemplateId={
 isAudit && accountingStandards.includes("ASNPO") ? "audit5101" :
 isAudit && accountingStandards.includes("US GAAP") ? "audit6100" :
 isAudit ? "audit5100" :
 engagementType.includes("Compilation") ? "comp4200" :
 engagementType.includes("Review") ? "rev2400" :
 undefined
 }
 onSelect={(id, name) => {
 setTemplateId(id);
 setEngagementTemplate(name);
 if (id && TEMPLATE_CONFIG[id]) {
 const cfg = TEMPLATE_CONFIG[id];
 setEngagementType(cfg.engagementTypeLabel);
 setAccountingStandards(cfg.defaultFramework);
 }
 }}
 />

 {/* Footer Actions */}
 <div className="flex items-center justify-end gap-3 mt-6 pb-6">
 <Button 
 variant="outline" 
 onClick={() => navigate("/engagements")}
 >
 <X className="h-4 w-4" />
 Cancel
 </Button>
 <Button disabled={!isFormValid || (showAck && !ackChecked)} onClick={handleCreate}>
 {isEditMode ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
 {isEditMode ? "Update Engagement" : "Create Engagement"}
 </Button>
 </div>
 </div>
 </div>
 <Dialog open={showAddRoleModal} onOpenChange={setShowAddRoleModal}>
 <DialogContent className="max-w-sm">
 <DialogHeader>
 <DialogTitle>Add new role</DialogTitle>
 </DialogHeader>
 <div className="py-2">
 <input
 autoFocus
 value={newRoleName}
 onChange={e => setNewRoleName(e.target.value)}
 onKeyDown={e => {
 if (e.key === "Enter" && newRoleName.trim()) {
 const role = newRoleName.trim();
 setCustomRoles(prev => prev.includes(role) ? prev : [...prev, role]);
 setPendingRow(prev => prev ? {...prev, draft: {...prev.draft, role } } : prev);
 setShowAddRoleModal(false);
 }
 }}
 placeholder="e.g. IT Specialist"
 className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
 />
 </div>
 <DialogFooter>
 <Button variant="outline" size="sm" onClick={() => setShowAddRoleModal(false)}>Cancel</Button>
 <Button
 size="sm"
 disabled={!newRoleName.trim()}
 onClick={() => {
 const role = newRoleName.trim();
 setCustomRoles(prev => prev.includes(role) ? prev : [...prev, role]);
 setPendingRow(prev => prev ? {...prev, draft: {...prev.draft, role } } : prev);
 setShowAddRoleModal(false);
 }}
 >
 Add role
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </Layout>
 );
}
