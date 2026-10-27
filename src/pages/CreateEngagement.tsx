import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEngagements } from "@/store/EngagementsContext";
import { type EngagementMeta, EngagementRecord, setEngagementMeta, getEngagementMeta, loadEngagements } from "@/store/engagementsStore";
import { toast } from "sonner";
import intuitQuickbooksLogo from "@/assets/intuit-quickbooks-logo.svg";
import xeroLogo from "@/assets/xero-logo-full.svg";
import { clientsData as appClientsData } from "@/data/clientsData";
import { getClientSourceIntegration, sourceLabel, getClientConnectionState, CLIENT_CONNECTION_EVENT, type AccountingProvider } from "@/lib/clientSource";
import { accountingProviders } from "@/lib/accountingProviders";
import { SourceConnectionModal } from "@/components/SourceConnectionModal";
import { ArrowLeft, Briefcase, Calendar, Users, ChevronDown, Plus, Pencil, Trash2, Search, ExternalLink, X, Building2, FileText, Settings2, Check, UserPlus, Link2, AlertTriangle, XCircle, Info, FilePen, FolderPlus, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/Layout";
import { Checkbox } from "@/components/ui/checkbox";
import { SourceYearSelection, type YearsChoice } from "@/components/SourceYearSelection";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { format as formatDateFns } from "date-fns";

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

// Calendar date field styled to match the global form inputs (h-9, 10px radius, double-border focus)
const DateField = ({
 label,
 value,
 onChange,
 required = false,
 disabled = false,
}: {
 label?: string;
 value: string; // MM/dd/yyyy
 onChange: (value: string) => void;
 required?: boolean;
 disabled?: boolean;
}) => {
 const m = value ? value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/) : null;
 const parsed = m ? new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])) : undefined;
 const selected = parsed && !isNaN(parsed.getTime()) ? parsed : undefined;
 return (
 <div className="flex flex-col gap-1">
 {label && (
 <label className="text-xs font-medium text-foreground">
 {label}
 {required && <span className="text-destructive ml-0.5">*</span>}
 </label>
 )}
 <Popover>
 <PopoverTrigger asChild disabled={disabled}>
 <button
 type="button"
 disabled={disabled}
 className={`
 input-double-border w-full h-9 px-3 py-2 text-sm rounded-[10px] outline-none transition-all duration-200 flex items-center text-left
 ${disabled
 ? 'bg-muted border border-transparent text-muted-foreground opacity-60 cursor-not-allowed'
 : 'bg-white border border-[#C3CBD6] dark:border-[hsl(220_15%_30%)] dark:bg-card hover:border-[hsl(210_25%_75%)] dark:hover:border-[hsl(220_15%_40%)]'
 }
 ${selected ? 'text-foreground' : 'text-muted-foreground'}
 `}
 >
 <span className="flex-1 truncate">{selected ? formatDateFns(selected, "MM/dd/yyyy") : "MM/DD/YYYY"}</span>
 <Calendar className="h-4 w-4 ml-auto shrink-0 text-muted-foreground" />
 </button>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0" align="start">
 <DatePickerCalendar
 mode="single"
 selected={selected}
 onSelect={(d) => onChange(d ? formatDateFns(d, "MM/dd/yyyy") : "")}
 initialFocus
 className="p-3 pointer-events-auto"
 />
 </PopoverContent>
 </Popover>
 </div>
 );
};

// Month/Day-only date picker (no year) — same form styling as DateField
const MMDDDateField = ({
 label,
 value,
 onChange,
 required = false,
}: {
 label?: string;
 value: string; // MM/dd
 onChange: (value: string) => void;
 required?: boolean;
}) => {
 const m = value ? value.match(/^(\d{1,2})\/(\d{1,2})$/) : null;
 const selected = m ? new Date(2024, Number(m[1]) - 1, Number(m[2])) : undefined;
 return (
 <div className="flex flex-col gap-1">
 {label && (
 <label className="text-xs font-medium text-foreground">
 {label}
 {required && <span className="text-destructive ml-0.5">*</span>}
 </label>
 )}
 <Popover>
 <PopoverTrigger asChild>
 <button
 type="button"
 className={`
 input-double-border w-full h-9 px-3 py-2 text-sm rounded-[10px] outline-none transition-all duration-200 flex items-center text-left
 bg-white border border-[#C3CBD6] dark:border-[hsl(220_15%_30%)] dark:bg-card hover:border-[hsl(210_25%_75%)] dark:hover:border-[hsl(220_15%_40%)]
 ${selected ? 'text-foreground' : 'text-muted-foreground'}
 `}
 >
 <span className="flex-1 truncate">{selected ? formatDateFns(selected, "MM/dd") : "MM/DD"}</span>
 <Calendar className="h-4 w-4 ml-auto shrink-0 text-muted-foreground" />
 </button>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0" align="start">
 <DatePickerCalendar
 mode="single"
 defaultMonth={selected ?? new Date(2024, 0, 1)}
 selected={selected}
 onSelect={(d) => onChange(d ? formatDateFns(d, "MM/dd") : "")}
 formatters={{ formatCaption: (month) => formatDateFns(month, "MMMM") }}
 initialFocus
 className="p-3 pointer-events-auto"
 />
 </PopoverContent>
 </Popover>
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
const SourceGroupDivider = () => <div className="mt-6 border-t border-border opacity-50" />;

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
    entityLegalName: "Cedar Point Logistics",
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
    integrations: [],
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

/** Normalize saved dates ("01/01/2024" or "Jan 1, 2025") to MM/DD/YYYY. */
function toMmDdYyyy(v?: string): string | null {
 if (!v) return null;
 if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
 const d = new Date(v);
 if (isNaN(d.getTime())) return null;
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

type TypeDefaults = { prefix: string; template: string; templateId: string; standards: string };

/** Defaults applied on Create Engagement for each engagement type. */
const TYPE_DEFAULTS: Record<string, TypeDefaults> = {
 "Audit (AUD)": { prefix: "AUD", template: "CAS Audit", templateId: "audit5100", standards: "ASPE — Canadian Accounting Standards for Private Enterprises" },
 "Review (REV)": { prefix: "REV", template: "Review Section 2400", templateId: "rev2400", standards: "Section 2400 Review standards" },
 "Compilation (COM)": { prefix: "COM", template: "Compilation CSRS 4200", templateId: "comp4200", standards: "CSRS 4200 — Compilation Engagements" },
 "T2 (Corporations)": { prefix: "T2", template: "T2 (Corporations)", templateId: "tax-t2", standards: "ASPE" },
 "1120 (US C-Corporation)": { prefix: "1120", template: "1120 (US C-Corporation)", templateId: "", standards: "" },
 "1120S (US S-Corporation)": { prefix: "1120S", template: "1120S (US S-Corporation)", templateId: "", standards: "" },
};

const typeDefaults = (type: string | undefined): TypeDefaults =>
 (type && TYPE_DEFAULTS[type]) || TYPE_DEFAULTS["Review (REV)"];

/** Template label shown in edit mode for a saved template id. */
const TEMPLATE_LABELS: Record<string, string> = {
 audit5100: "CAS Audit",
 rev2400: "Review Section 2400",
 comp4200: "Compilation CSRS 4200",
 "tax-t2": "T2 (Corporations)",
};

const IGNORED_NAME_WORDS = new Set(["inc", "llc", "ltd", "corp", "co", "group"]);

/** Client initials: first letter of each word (max 3), ignoring company suffixes; one word → first 3 letters. */
export function clientInitials(name: string): string {
 const words = (name || "")
  .split(/[^A-Za-z0-9]+/)
  .filter(w => w && !IGNORED_NAME_WORDS.has(w.toLowerCase()));
 if (words.length === 0) return "";
 if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
 return words.map(w => w[0]).join("").slice(0, 3).toUpperCase();
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Build PREFIX-INITIALS-MonDDYYYY, adding -2, -3… when the ID is already taken. */
export function generateEngagementId(type: string, clientName: string, cyEnd: string, existingIds: string[]): string {
 const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((cyEnd || "").trim());
 const datePart = m && MONTHS_SHORT[Number(m[1]) - 1]
  ? `${MONTHS_SHORT[Number(m[1]) - 1]}${m[2].padStart(2, "0")}${m[3]}`
  : "";
 const base = [typeDefaults(type).prefix, clientInitials(clientName), datePart].filter(Boolean).join("-");
 const taken = new Set(existingIds);
 if (!taken.has(base)) return base;
 let n = 2;
 while (taken.has(`${base}-${n}`)) n++;
 return `${base}-${n}`;
}

export default function CreateEngagement() {
 const navigate = useNavigate();
 const location = useLocation();
 const { addEngagement, updateEngagement } = useEngagements();
  const { engagementId: routeEngagementId } = useParams();
  const isEditMode = !!routeEngagementId;
  const editingRecord = isEditMode ? loadEngagements().find(e => e.id === routeEngagementId) : undefined;
   const editingMeta = routeEngagementId ? getEngagementMeta(routeEngagementId) : undefined;
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
 const initialTypeDefaults = typeDefaults(prefill.engagementType || "Review (REV)");
 // Create: the ID is generated from type, client and CY end date (see effect below)
 const [engagementId, setEngagementId] = useState(editingRecord?.id ?? "");
 // Set once the user types in the Engagement ID field so it stops auto-generating
 const idTouched = useRef(false);
 const [engagementTemplate, setEngagementTemplate] = useState(() => {
  if (!isEditMode) return initialTypeDefaults.template;
  const savedId = editingMeta?.templateId;
  return (savedId && TEMPLATE_LABELS[savedId]) || initialTypeDefaults.template;
 });
 const [templateId, setTemplateId] = useState(
  editingMeta?.templateId ?? (isEditMode ? (prefillIsAudit ? "audit5100" : "") : initialTypeDefaults.templateId)
 );
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
    return editingMeta?.dataSource ?? "csv";
  });
  // Bumped whenever a client connection may have changed (e.g. user connected on the Clients page)
  const [connVersion, setConnVersion] = useState(0);
   const [showSourceConnection, setShowSourceConnection] = useState(false);
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
  const [sourceConnected, setSourceConnected] = useState(() => {
    if (isEditMode && editingMeta?.dataSource === "source") return true;
    return false;
  });
  const originalDataSource = editingMeta?.dataSource ?? inferredEditDataSource;
  // Follow-up questions shown in edit mode when the Engagement Data Type is changed
  const [fuAdjustingEntries, setFuAdjustingEntries] = useState(false);
  const [fuNewAccounts, setFuNewAccounts] = useState(false);
  const [fuDocuments, setFuDocuments] = useState(false);
  // Source-to-source (external provider change): set when the user picks the active connection in the dropdown
  const [hasSelectedActiveConnection, setHasSelectedActiveConnection] = useState(false);
  const initialClientRef = useRef(clientName);

    /** Client-level connection: saved connect/disconnect first, then demo client data, then app client data. */
    const resolveClientConnection = (): AccountingProvider | null => {
      const state = getClientConnectionState(clientName, localClientInfo?.entityLegalName, clientInfo?.entityLegalName);
      if (state !== undefined) return state;
      if (localClientInfo?.integrations.includes("xero")) return "xero";
      if (localClientInfo?.integrations.includes("quickbooks")) return "quickbooks";
      return getClientSourceIntegration(clientName);
    };
    // Sync data source default when client selection changes based on source connection status
    useEffect(() => {
      {
        const integ = resolveClientConnection();
        setSourceConnected(integ !== null);
        // Keep the initial data source until the user picks a different client
        // Never change the data type on a live connection change while editing
        if (isEditMode || clientName === initialClientRef.current) return;
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

 const [accountingStandards, setAccountingStandards] = useState(editingMeta?.accountingStandards ?? initialTypeDefaults.standards);
 const [additionalDisclosures, setAdditionalDisclosures] = useState(prefillIsAudit ? "Full financial statements" : "Statement of cash flows");

 // Engagement Period state
 const [periodType, setPeriodType] = useState(
  // Legacy: Partial year saved with the old First Year of Operations checkbox opens as the new period type
  editingMeta?.firstYearOfOperations && /^partial year$/i.test(editingMeta?.auditPeriodType ?? "")
   ? "First Year of Operations"
   : editingMeta?.auditPeriodType ?? (prefillIsAudit ? "Full Year" : "Full year"));
 // Edit: when no period dates were saved, derive a 12-month period from the engagement's Year End
 const recordYearEnd = (() => {
  const d = editingRecord?.yearEnd ? new Date(editingRecord.yearEnd) : null;
  return d && !isNaN(d.getTime())
   ? `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`
   : null;
 })();
 const initialCyEnd = toMmDdYyyy(editingMeta?.periodEnd) ?? recordYearEnd ?? "11/30/2023";
 const initialCyStart = toMmDdYyyy(editingMeta?.periodStart) ?? (recordYearEnd ? addDaysStr(shiftYearStr(recordYearEnd, -1), 1) : "12/01/2022");
 const [currentYearStart, setCurrentYearStart] = useState(initialCyStart);
 const [currentYearEnd, setCurrentYearEnd] = useState(initialCyEnd);
 const [priorYear1Start, setPriorYear1Start] = useState(shiftYearStr(initialCyStart, -1));
 const [priorYear1End, setPriorYear1End] = useState(shiftYearStr(initialCyEnd, -1));
 const [priorYear2Start, setPriorYear2Start] = useState(shiftYearStr(initialCyStart, -2));
 const [priorYear2End, setPriorYear2End] = useState(shiftYearStr(initialCyEnd, -2));
 const [priorYear1NoData, setPriorYear1NoData] = useState(false);
 const [priorYear2NoData, setPriorYear2NoData] = useState(false);

 // Audit-specific state
 const isAudit = engagementType === "Audit (AUD)";

 // Sync engagement details when type changes (skip initial render)
 const isFirstMount = useRef(true);
 useEffect(() => {
  if (isFirstMount.current) { isFirstMount.current = false; return; }
  if (isEditMode) return; // never overwrite saved values when editing
  const defaults = typeDefaults(engagementType);
  let nextTemplateId = templateId;
  if (TEMPLATE_CONFIG[templateId]?.engagementTypeLabel !== engagementType) {
   nextTemplateId = defaults.templateId;
   setTemplateId(defaults.templateId);
   setEngagementTemplate(defaults.template);
  }
  setAccountingStandards(
   isAudit ? (TEMPLATE_CONFIG[nextTemplateId]?.defaultFramework ?? defaults.standards) : defaults.standards
  );
 if (isAudit) {
 setPeriodType("Full Year");
 setAdditionalDisclosures("");
 setAdditionalDisclosuresSet(new Set());
 } else {
 setPeriodType("Full year");
 setAdditionalDisclosures("Statement of cash flows");
 setAdditionalDisclosuresSet(new Set());
 setSpecialPurposeFramework("");
 }
 }, [engagementType]); // eslint-disable-line react-hooks/exhaustive-deps

 // Create: generate PREFIX-INITIALS-MonDDYYYY until the user edits the ID; never in edit mode
 useEffect(() => {
  if (isEditMode || idTouched.current) return;
  setEngagementId(generateEngagementId(engagementType, clientName, currentYearEnd, loadEngagements().map(e => e.id)));
 }, [engagementType, clientName, currentYearEnd, isEditMode]);
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
  { value: "First Year of Operations", label: "First Year of Operations" },
  { value: "Other", label: "Other" },
  ]
  : [
  { value: "Full year", label: "Full year" },
  { value: "Partial year", label: "Partial year" },
  { value: "First Year of Operations", label: "First Year of Operations" },
  ];

  const isFullYearPeriod = periodType === "Full Year" || periodType === "Full year";
  const isStubPeriod = periodType === "Partial Year" || periodType === "Partial year";
  const isFooPeriod = periodType === "First Year of Operations";
  // Partial year periods are locked to CSV; First Year of Operations allows source
  const isSourceLockedStub = isStubPeriod;
 const clientSourceIntegration = resolveClientConnection();
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
      const [unconnectedYearsAction, setUnconnectedYearsAction] = useState<"keep" | "reset">("keep");
const [ackText, setAckText] = useState("");
    const ackChecked = ackText.trim() === "DELETE";
    const setAckChecked = (_v: boolean) => setAckText("");
   // Connecting to source defaults to all available years (user can only reduce)
   useEffect(() => {
     if (isEditMode && originalDataSource === "csv" && dataSource === "source") {
       setYearsChoice("all");
       setSourceYears(maxSourceYears);
     }
     setAckChecked(false);
   }, [dataSource]);
   useEffect(() => { setAckChecked(false); }, [sourceYears, hasSelectedActiveConnection]);
   // Per-year data source (V2): "csv" | "source:<provider>" | "locked"
   // Single source connection per client
   const activeProvider: AccountingProvider | null = clientSourceIntegration;
   const [cyDataSource, setCyDataSource] = useState<"csv" | "source">(() =>
     editingMeta?.yearDataSources?.cy ?? (editingMeta?.dataSource === "source" ? "source" : "csv")
   );
   const [py1DataSource, setPy1DataSource] = useState<"csv" | "source">(() => editingMeta?.yearDataSources?.py1 ?? "csv");
   const [py2DataSource, setPy2DataSource] = useState<"csv" | "source">(() => editingMeta?.yearDataSources?.py2 ?? "csv");
   const initYearSources = (): string[] => {
     const p = clientSourceIntegration;
     if (isRollForwardSource) {
       const cyProv = editingMeta?.yearSourceProviders?.cy ?? editingMeta?.sourceProvider ?? p;
       const cy = editingMeta?.yearDataSources?.cy === "csv" ? "csv" : cyProv ? `source:${cyProv}` : "csv";
       return [cy, "locked", "locked"];
     }
     if (isEditMode) {
       const savedProvider = editingMeta?.sourceProvider ?? p;
       const yds = editingMeta?.yearDataSources;
       if (yds) {
         const ysp = editingMeta?.yearSourceProviders;
         return [yds.cy, yds.py1, yds.py2].map((v, i) => {
           const yp = ysp?.[(["cy", "py1", "py2"] as const)[i]] ?? savedProvider;
           return v === "source" ? (yp ? `source:${yp}` : "source:none") : "csv";
         });
       }
       const n = editingMeta?.dataSource === "source" && savedProvider ? (editingMeta?.sourceYears ?? 1) : 0;
       return [0, 1, 2].map(i => (i < n ? `source:${savedProvider}` : "csv"));
     }
     return [p ? `source:${p}` : "csv", "csv", "csv"];
   };
   const [yearSources, setYearSources] = useState<string[]>(initYearSources);
   const [originalCySource] = useState<string>(() => initYearSources()[0]);
   const originalCyProvider = (originalCySource.startsWith("source:") ? originalCySource.slice(7) : null) as AccountingProvider | null;
   const [yearErrors, setYearErrors] = useState<boolean[]>([false, false, false]);
   useEffect(() => { if (!isEditMode) setYearSources(initYearSources()); }, [clientSourceIntegration]); // eslint-disable-line react-hooks/exhaustive-deps
   useEffect(() => {
     setDataSource(yearSources.some(s => s?.startsWith("source:")) ? "source" : "csv");
     let n = 0; for (const s of yearSources) { if (s.startsWith("source:")) n++; else break; }
     if (n) setSourceYears(n);
   }, [yearSources]);
   // Keep the per-year persistence states in sync with the year rows (locked/nodata rows map to csv)
   useEffect(() => {
     const toKind = (v?: string) => (v && v.startsWith("source:") ? "source" : "csv") as "csv" | "source";
     setCyDataSource(toKind(yearSources[0]));
     setPy1DataSource(toKind(yearSources[1]));
     setPy2DataSource(toKind(yearSources[2]));
   }, [yearSources]);
   const setYearSource = (i: number, v: string) => {
     setAckText("");
     const err = v === "source:none";
     setYearErrors(e => e.map((x, j) => (j === i ? err : x)));
     setYearSources(s => s.map((x, j) => {
       if (j === i) return err ? "csv" : v;
       // Full year: source years run in order from CY; roll-forward locked rows never change
       if (!isFullYearPeriod || err || x === "locked") return x;
       if (v.startsWith("source:") && j < i) return v;
       if (v === "csv" && j > i) return "csv";
       return x;
     }));
   };
   const YEAR_LABELS = ["Current Year", "Prior Year 1", "Prior Year 2"];
   const [originalYearSources] = useState<string[]>(initYearSources);
   const yearChangeKind = (i: number): "toCsv" | "toSource" | "toOtherSource" | null => {
     if (!isEditMode) return null;
     const o = originalYearSources[i];
     // Partial year locks every non-locked row to CSV, so a Source row becomes a switch to CSV
     const c = isSourceLockedStub && yearSources[i] !== "locked" ? "csv" : yearSources[i];
     if (!o || !c || o === c || o === "locked" || c === "locked") return null;
     if (o.startsWith("source:") && c === "csv") return "toCsv";
     if (o === "csv" && c.startsWith("source:") && c !== "source:none") return "toSource";
     // Switching off a provider that was disconnected externally (per-row switch prompt)
     if (o.startsWith("source:") && c.startsWith("source:") && c !== "source:none" && o.slice(7) !== activeProvider) return "toOtherSource";
     return null;
   };
   /** Edit only: the year's saved provider (regardless of current selection) is no longer an active connection. */
   const origDisconnectedProvider = (i: number): AccountingProvider | null => {
     if (!isEditMode) return null;
     const o = originalYearSources[i];
     if (!o?.startsWith("source:") || o === "source:none") return null;
     const p = o.slice(7) as AccountingProvider;
     return p === activeProvider ? null : p;
   };
   const [yearKeepReset, setYearKeepReset] = useState<Record<number, "keep" | "reset">>({});
   /** Edit only: the year's saved provider is no longer among the client's active connections (and the row is unchanged). */
   const yearDisconnectedProvider = (i: number): AccountingProvider | null => {
     if (!isEditMode) return null;
     const o = originalYearSources[i];
     if (!o?.startsWith("source:") || o === "source:none" || yearSources[i] !== o) return null;
     const p = o.slice(7) as AccountingProvider;
     return p === activeProvider ? null : p;
   };
   const isCyToCsv = [0, 1, 2].some(i => yearChangeKind(i) !== null) || (isEditMode && hasSelectedActiveConnection && !!editingMeta?.sourceProvider && editingMeta.sourceProvider !== clientSourceIntegration);

 const applyFullYearPriors = (cyStart: string, cyEnd: string) => {
 setPriorYear1Start(shiftYearStr(cyStart, -1));
 setPriorYear1End(shiftYearStr(cyEnd, -1));
 setPriorYear2Start(shiftYearStr(cyStart, -2));
 setPriorYear2End(shiftYearStr(cyEnd, -2));
 };

  const handlePeriodTypeChange = (val: string) => {
  setPeriodType(val);
  if (isEditMode && val !== periodType) {
  toast.info("Period type updated. Please review your engagement dates.", {
  duration: 3000,
  classNames: { toast: "toast-progress-3s" },
  });
  }
  const isNowFull = val === "Full Year" || val === "Full year";
  const isNowStub = val === "Partial Year" || val === "Partial year";
  if (isNowFull) {
  const autoEnd = addDaysStr(shiftYearStr(currentYearStart, 1), -1);
  setCurrentYearEnd(autoEnd);
  applyFullYearPriors(currentYearStart, autoEnd);
  }
  if (isNowStub && dataSource === "source") {
  setDataSource("csv");
  }
  if (isNowFull && isEditMode && originalDataSource === "source") {
  setDataSource("source");
  }
  };

  const [fooYearEnd, setFooYearEnd] = useState<string>(""); // MM/dd
  const fooDerived = isFooPeriod;
  // First Year of Operations: Current Year dates derive from the Year-End Date only (12 months ending on it)
  useEffect(() => {
    return; // FOO: dates entered manually
    const mm = fooYearEnd.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!mm) return;
    const m = Number(mm[1]) - 1, d = Number(mm[2]);
    const prevEnd = new Date(currentYearEnd);
    const year = isNaN(prevEnd.getTime()) ? new Date().getFullYear() : prevEnd.getFullYear();
    const end = new Date(year, m, d);
    const start = new Date(year - 1, m, d + 1);
    const fmt = (x: Date) => formatDateFns(x, "MM/dd/yyyy");
    setCurrentYearStart(fmt(start));
    setCurrentYearEnd(fmt(end));
  }, [fooDerived, fooYearEnd]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const isCsvToSourceSwitch = isEditMode && clientHasSourceConnection && originalDataSource === "csv" && dataSource === "source" && sourceConnected && !savedDisconnectedFrom && !(isFooPeriod);
   // Edit-mode scenario 2: engagement was Source, user switched to CSV
   const isSourceToCsvSwitch = isEditMode && clientHasSourceConnection && originalDataSource === "source" && dataSource === "csv";
   // Per-year mix of CSV vs Source (locked prior years count as Source; "No data" rows are skipped)
   const yearSourceMix = (() => {
     let csv = 0, src = 0;
     for (let i = 0; i < 3; i++) {
       if (isRollForwardSource && i > 0) { src++; continue; }
       if (fooDerived && i > 0) continue;
       const v = yearSources[i] ?? "csv";
       if (v === "locked" || (v.startsWith("source:") && v !== "source:none")) src++;
       else csv++;
     }
     return { csv, src };
   })();
   // Edit-mode scenario 5: the client's source connection changed since the engagement was set up
   const savedSourceProvider = editingMeta?.sourceProvider;
   const isSourceProviderMismatch = isEditMode && !isRollForwardSource && clientHasSourceConnection
     && originalDataSource === "source" && dataSource === "source"
     && !!savedSourceProvider && savedSourceProvider !== clientSourceIntegration;
   // The client's connection can't be used by this engagement right now:
   // either the connection isn't active or the engagement is linked to a different source.
   const showConnectionDropdown = isSourceProviderMismatch || isReconnectFlow;
   const dropdownSavedProvider = isReconnectFlow ? savedDisconnectedFrom : savedSourceProvider;
    const isExternallyDisconnected = isEditMode && !clientHasSourceConnection && originalDataSource === "source" && dataSource === "source" && !isSourceLockedStub;
    // Mismatch warning only while at least one year row still points to the old provider
    const showMismatchWarning = isSourceProviderMismatch && [0, 1, 2].some(i => yearDisconnectedProvider(i) !== null);
     const isConnectionDisconnected = clientHasSourceConnection&& (!sourceConnected || isSourceProviderMismatch);
    // Roll forward with no client connection → auto CSV, locked
    const isRollForwardNoSource = isRollForwardSource && !clientHasSourceConnection;
    const rollForwardPriorProvider: AccountingProvider = savedDisconnectedFrom ?? savedSourceProvider
      ?? (clientSourceIntegration === "quickbooks" ? "xero" : "quickbooks");
    // Roll forward: where a locked prior year came from (priorYearSources, else its saved per-year source)
    const lockedYearSource = (k: "py1" | "py2"): "csv" | AccountingProvider => {
      const pys = editingMeta?.priorYearSources?.[k];
      if (pys) return pys;
      return editingMeta?.yearDataSources?.[k] === "source"
        ? (editingMeta?.yearSourceProviders?.[k] ?? editingMeta?.sourceProvider ?? "csv")
        : "csv";
    };
    const lockedYearLabel = (k: "py1" | "py2") => {
      const v = lockedYearSource(k);
      return v === "csv" ? "CSV / Excel / PDF · Prior year" : `${sourceLabel(v)} · Prior year`;
    };
    // Year selection (CY locked; PY1/PY2 optional, in order)
    const originalSourceYears = originalDataSource === "source" ? (editingMeta?.sourceYears ?? 1) : 0;
    const isAddingSourceYearsFlow = isEditMode && originalDataSource === "source" && dataSource === "source" && !isSourceProviderMismatch;
    const yearLockedCount = isAddingSourceYearsFlow ? originalSourceYears : 1;
    const isAddingSourceYears = isAddingSourceYearsFlow && sourceYears > originalSourceYears;
     const showYearSelection = !isSourceLockedStub && dataSource === "source" && clientHasSourceConnection && sourceConnected
       && (!isEditMode || isCsvToSourceSwitch || isAddingSourceYearsFlow || (isSourceProviderMismatch && hasSelectedActiveConnection) || (isReconnectFlow && hasSelectedActiveConnection));
     const isDisconnecting = isEditMode && originalDataSource === "source" && dataSource === "csv";
     const showAck = isEditMode && !isSourceLockedStub && !isRollForwardNoSource && clientHasSourceConnection
       && (((dataSource !== originalDataSource && (!isReconnectFlow || hasSelectedActiveConnection)) || (isSourceProviderMismatch && hasSelectedActiveConnection)) || isAddingSourceYears);

       const showSourceSectionSeparator = isSourceLockedStub
      || (isFooPeriod)
      || (!isSourceLockedStub && !isRollForwardNoSource && (
        (dataSource === "source" && !clientHasSourceConnection)
        || (clientHasSourceConnection && dataSource === "csv" && !isSourceToCsvSwitch)
        || isSourceToCsvSwitch
        || (clientHasSourceConnection && dataSource === "source" && !sourceConnected)
        || (isRollForwardSource && dataSource === "source" && clientHasSourceConnection && rollForwardPriorProvider !== clientSourceIntegration)
        || (isReconnectFlow && hasSelectedActiveConnection)
        || showMismatchWarning
        || showYearSelection
        || showAck
      ))
      || isRollForwardNoSource;
const performSave = () => {
   const savedDataSource: "csv" | "source" = isSourceLockedStub || isRollForwardNoSource ? "csv" : dataSource;
   // Save what each row actually uses: Partial year forces every non-locked row to CSV
   const effectiveYearSources = isSourceLockedStub ? yearSources.map(v => (v === "locked" ? v : "csv")) : yearSources;
   const isSourceRow = (v?: string) => !!v && v.startsWith("source:") && v !== "source:none";
   const YEAR_KEYS = ["cy", "py1", "py2"] as const;
   // Locked roll-forward rows keep the source they inherited from last year
   const lockedKind = (i: number) => lockedYearSource(YEAR_KEYS[i] as "py1" | "py2");
   const rowKind = (v: string | undefined, i: number): "csv" | "source" =>
     v === "locked" ? (lockedKind(i) === "csv" ? "csv" : "source") : (v && v.startsWith("source:") ? "source" : "csv");
   const rowProvider = (v: string | undefined, i: number): AccountingProvider | undefined => {
     if (v === "locked") { const k = lockedKind(i); return k === "csv" ? undefined : k; }
     return isSourceRow(v) ? (v!.slice(7) as AccountingProvider) : undefined;
   };
   const firstSourceRow = effectiveYearSources.find(isSourceRow);
   const firstSourceProvider = firstSourceRow ? (firstSourceRow.slice(7) as AccountingProvider) : undefined;
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
yearDataSources: { cy: rowKind(effectiveYearSources[0], 0), py1: rowKind(effectiveYearSources[1], 1), py2: rowKind(effectiveYearSources[2], 2) },
yearSourceProviders: Object.fromEntries(YEAR_KEYS.map((k, i) => [k, rowProvider(effectiveYearSources[i], i)]).filter(([, v]) => v)) as EngagementMeta["yearSourceProviders"],
 sourceYears: savedDataSource === "source" ? Math.max(1, effectiveYearSources.filter(isSourceRow).length) : undefined,
 teamMembers,
 sourceProvider: savedDataSource === "source" ? (firstSourceProvider ?? clientSourceIntegration ?? undefined) : (editingMeta?.sourceDisconnectedFrom ? editingMeta.sourceProvider : undefined),
 priorYearSources: editingMeta?.priorYearSources,
 sourceDisconnectedFrom: savedDataSource === "csv" ? editingMeta?.sourceDisconnectedFrom : undefined,
 sourceRollForward: editingMeta?.sourceRollForward,
 sourceYearsAvailable: editingMeta?.sourceYearsAvailable,
  auditPeriodType: periodType,
  firstYearOfOperations: isFooPeriod ? true : undefined,
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
                    <img src={accountingProviders[clientSourceIntegration].badgeLogo} alt={sourceLabel(clientSourceIntegration)} className="h-5 object-contain" />
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
 <input type="text" value={engagementId} onChange={e => { idTouched.current = true; setEngagementId(e.target.value); }} className={ic + " pr-10"} />
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
 <Select value={engagementType} onValueChange={setEngagementType} disabled={isEditMode}>
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
 {/* Source Data status */}
 <div className="mt-3 pb-4 mb-2 border-b border-border/50 flex items-center gap-4">
  <span className="text-sm text-foreground w-[160px] shrink-0">Source Data</span>
  <div className="flex flex-wrap items-center gap-3">
   {!activeProvider ? (<>
    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground">Not Connected</span>
    <button type="button" onClick={() => setShowSourceConnection(true)} className="text-sm text-primary underline underline-offset-2 hover:text-primary/80">Connect Source</button>
   </>) : (
    <span className="inline-flex items-center gap-2">
     <span onClick={() => setShowSourceConnection(true)} className="inline-flex items-center rounded-[10px] border border-border px-2 py-1 cursor-pointer"><img src={accountingProviders[activeProvider].badgeLogo} alt={sourceLabel(activeProvider)} className="h-4 object-contain" /></span>
     <span className="inline-flex items-center rounded-full border border-connection-success/30 bg-connection-success-surface px-2.5 py-0.5 text-[11px] font-medium text-connection-success">Connected</span>
    </span>
   )}
  </div>
 </div>
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
 {/* Year rows */}
 {[
 { label: "Current Year", required: true, start: currentYearStart, setStart: handleCurrentYearStartChange, end: currentYearEnd, setEnd: handleCurrentYearEndChange, disabled: false, note: "" },
 { label: "Prior Year 1", required: false, start: fooDerived ? "" : priorYear1Start, setStart: setPriorYear1Start, end: fooDerived ? "" : priorYear1End, setEnd: setPriorYear1End, disabled: isFullYearPeriod || fooDerived, note: fooDerived ? "No data for this period" : isFullYearPeriod ? "Auto-derived from Current Year dates" : "" },
 { label: "Prior Year 2", required: false, start: fooDerived ? "" : priorYear2Start, setStart: setPriorYear2Start, end: fooDerived ? "" : priorYear2End, setEnd: setPriorYear2End, disabled: isFullYearPeriod || fooDerived, note: fooDerived ? "No data for this period" : isFullYearPeriod ? "Auto-derived from Current Year dates" : "" },
 ].filter((_, i) => !(fooDerived && i > 0)).map((row, i) => {
  const locked = isRollForwardSource && i > 0;
  const noData = fooDerived && i > 0;
  const stubLocked = isSourceLockedStub;
  const val = yearSources[i] ?? "csv";
  const disconnectedP = yearDisconnectedProvider(i);
  return (
  <div key={row.label} className="py-2">
   <div className={`grid grid-cols-[176px_minmax(0,176px)_minmax(0,176px)_minmax(200px,320px)] gap-4 items-start ${i === 0 ? "mt-4" : ""}`}>
    <div className="flex flex-col gap-1">
     <span className="text-xs font-medium text-foreground opacity-0" aria-hidden="true">Period</span>
     <span className="flex h-9 items-center text-sm text-foreground whitespace-nowrap">{row.label}{row.required && <span className="text-destructive ml-0.5">*</span>}</span>
    </div>
    <div className={row.disabled ? "opacity-60" : ""}>
     <DateField label="Start Date" value={row.start} onChange={row.setStart} disabled={row.disabled} />
    </div>
    <div className={row.disabled ? "opacity-60" : ""}>
     <DateField label="End Date" value={row.end} onChange={row.setEnd} disabled={row.disabled} />
    </div>
    <div className="flex flex-col gap-1">
     <span className="text-xs font-medium text-foreground">Data Source</span>
     {locked ? (
      <Select value="locked" disabled><SelectTrigger className="h-9 text-sm" title={lockedYearLabel(i === 1 ? "py1" : "py2")}><SelectValue /></SelectTrigger>
       <SelectContent><SelectItem value="locked">{lockedYearLabel(i === 1 ? "py1" : "py2")}</SelectItem></SelectContent></Select>
     ) : noData ? (
      <Select value="nodata" disabled><SelectTrigger className="h-9 text-sm" title="No data"><SelectValue /></SelectTrigger>
       <SelectContent><SelectItem value="nodata">No data</SelectItem></SelectContent></Select>
     ) : (!stubLocked && disconnectedP) ? (
      <Select value="disconnected" onValueChange={v => setYearSource(i, v)}>
       <SelectTrigger className="h-9 text-sm border-amber-300 text-amber-700" title={`${sourceLabel(disconnectedP)} · ${clientInfo?.entityLegalName || clientName} · Disconnected`}>
        <SelectValue>Source — {sourceLabel(disconnectedP)} (Disconnected)</SelectValue>
       </SelectTrigger>
       <SelectContent>
        {activeProvider && activeProvider !== disconnectedP && (
         <SelectItem value={`source:${activeProvider}`}>Source — {sourceLabel(activeProvider)}</SelectItem>
        )}
        <SelectItem value="csv">CSV / Excel / PDF</SelectItem>
       </SelectContent>
      </Select>
     ) : (
      <Select value={stubLocked ? "csv" : (val.startsWith("source:") ? val : "csv")} disabled={stubLocked} onValueChange={v => setYearSource(i, v)}>
       <SelectTrigger className="h-9 text-sm" title={stubLocked || !val.startsWith("source:") ? "CSV / Excel / PDF" : val === "source:none" ? "Accounting software · Not connected" : sourceLabel(val.slice(7) as AccountingProvider)}><SelectValue /></SelectTrigger>
       <SelectContent>
        {(() => {
         // Exactly one source option: the year's saved provider, else the client's single active connection
         const cur = val.startsWith("source:") && val !== "source:none" ? (val.slice(7) as AccountingProvider) : null;
         const p = cur ?? activeProvider;
         return p
          ? <SelectItem value={`source:${p}`}>Source — {sourceLabel(p)}</SelectItem>
          : <SelectItem value="source:none">Source — Accounting software</SelectItem>;
        })()}
        <SelectItem value="csv">CSV / Excel / PDF</SelectItem>
       </SelectContent>
      </Select>
     )}
    </div>
   </div>
   {row.note && (
    <div className="grid grid-cols-[176px_minmax(0,176px)_minmax(0,176px)_minmax(200px,320px)] gap-4 mt-1">
     <span />
     <span className="col-span-2 text-xs text-muted-foreground">{row.note}</span>
    </div>
   )}
   {!showMismatchWarning && !isExternallyDisconnected && !locked && !noData && !stubLocked && disconnectedP && (
    <div className="grid grid-cols-[176px_minmax(0,1fr)] gap-4 mt-2">
     <span />
     <div className="flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800" role="status">
      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-sm">{sourceLabel(disconnectedP)} is disconnected for this year. Select a new data source from the Data Source dropdown.</p>
     </div>
    </div>
   )}
   {!locked && !noData && !stubLocked && origDisconnectedProvider(i) && val === "csv" && (
    <div className="grid grid-cols-[176px_minmax(0,1fr)] gap-4 mt-2">
     <span />
     <div>
      <p className="text-sm font-medium text-foreground mb-2">What would you like to do with existing {row.label} data?</p>
      <RadioGroup value={yearKeepReset[i] ?? "keep"} onValueChange={v => setYearKeepReset(k => ({ ...k, [i]: v as "keep" | "reset" }))} className="flex flex-col gap-2">
       <label className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="keep" />Keep existing data</label>
       <label className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="reset" />Reset data</label>
      </RadioGroup>
     </div>
    </div>
   )}
  </div>
  );
 })}
{/* Contextual messages below year rows */}
{isSourceLockedStub ? (
 <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-border bg-muted/50 px-3 py-2">
  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
  <span className="text-sm text-muted-foreground">Source connection not available for stub periods</span>
 </div>
) : (
 <>
  {((dataSource === "source" && !clientHasSourceConnection && !isExternallyDisconnected && !isSourceLockedStub) || (!clientHasSourceConnection && !isExternallyDisconnected && !isSourceLockedStub && yearErrors.some(Boolean))) && (
   <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-red-300 bg-red-50 dark:bg-red-950/30 px-3 py-2">
    <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
    <span className="text-sm text-red-800 dark:text-red-200">
     No source connection found for this client. Please go to the Clients page, click Connect under Integrations, and connect your accounting software. Then return here to continue.{" "}
     <Button variant="link" onClick={() => setShowSourceConnection(true)} className="h-auto p-0 text-sm underline underline-offset-2">Connect Source</Button>{" "}
     <Button variant="link" onClick={() => navigate("/clients")} className="h-auto p-0 text-sm underline underline-offset-2">Go to Clients →</Button>
    </span>
   </div>
  )}
  {!showMismatchWarning && clientHasSourceConnection && !isSourceToCsvSwitch && yearSourceMix.csv > 0 && !isSourceLockedStub && (
   <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <span className="text-sm text-amber-800 dark:text-amber-200">
     {yearSourceMix.src === 0
      ? "All years are set to CSV. The source connection will remain active but won't be used for this engagement."
      : "Years set to Source will pull data from the connected source. Years set to CSV will use manually imported data."}
    </span>
   </div>
  )}
  {!showMismatchWarning && isSourceToCsvSwitch && originalCyProvider && !isSourceLockedStub && (
   <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <span className="text-sm text-amber-800 dark:text-amber-200">
     {isRollForwardSource
      ? `Switching Current Year to CSV means it will no longer pull data from ${sourceLabel(originalCyProvider)}. Prior years stay locked to their original source.`
      : `Switching to CSV means this engagement will no longer pull data from ${sourceLabel(originalCyProvider)}. The source connection will stay active but won't be used.`}
    </span>
   </div>
  )}
  {!showMismatchWarning && isReconnectFlow && hasSelectedActiveConnection && !isSourceLockedStub && (
   <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <span className="text-sm text-amber-800 dark:text-amber-200">Switching back to Source will replace your current CSV trial balance data. Years available from {sourceLabel(clientSourceIntegration)} will be refreshed.</span>
   </div>
  )}
  {!showMismatchWarning && isExternallyDisconnected && originalCyProvider && !isSourceLockedStub && (
   <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <span className="text-sm text-amber-800 dark:text-amber-200">
     Your client has no active source connection. Connect a source, or set the affected years to CSV / Excel / PDF.{" "}
     <Button variant="link" onClick={() => setShowSourceConnection(true)} className="h-auto p-0 text-sm underline underline-offset-2">Connect Source</Button>
    </span>
   </div>
  )}
  {showMismatchWarning && originalCyProvider && !isSourceLockedStub && (
   <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <div className="flex flex-col items-start gap-2">
     <span className="text-sm text-amber-800 dark:text-amber-200">Your client's source connection has changed. Click Switch Connection to update this engagement to the new source.</span>
     <Button variant="outline" size="sm" className="h-8 text-sm" onClick={() => {
      setHasSelectedActiveConnection(true);
      setAckText("");
      // Move every row still on the old provider to the client's active connection
      if (activeProvider) setYearSources(s => s.map(v => (v.startsWith("source:") && v !== "source:none" && v.slice(7) !== activeProvider ? `source:${activeProvider}` : v)));
     }}>Switch Connection</Button>
    </div>
   </div>
  )}
  {!showMismatchWarning && isEditMode && clientHasSourceConnection && !isSourceLockedStub && [0, 1, 2].some(i => yearChangeKind(i) === "toSource") && (
   <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <span className="text-sm text-amber-800 dark:text-amber-200">Switching to Source will replace your existing CSV trial balance data. Years selected for source will be refreshed.</span>
   </div>
  )}
 </>
)}
 </SectionCard>
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
 {isCyToCsv && (
 <div className="mt-5 rounded-[10px] border border-red-200 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2.5">
  <div className="flex items-start gap-2">
   <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
   <div className="min-w-0 flex-1">
    <p className="text-lg font-bold leading-snug text-red-700 dark:text-red-300">Please read carefully — THIS ACTION CANNOT BE UNDONE</p>
    <ul className="mt-2 space-y-1.5">
     <li className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200"><FilePen className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /><span>Adjusting entries will be deleted</span></li>
     <li className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200"><FolderPlus className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /><span>Manually added accounts will be deleted</span></li>
     <li className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200"><MessageSquareText className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /><span>Issues, comments and requests will be deleted</span></li>
     <li className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200"><FileText className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /><span>Documents will only move after data is imported</span></li>
    </ul>
    <label className="mt-3 flex items-center gap-1 text-sm font-semibold text-red-800 dark:text-red-200">Type DELETE to confirm<span className="text-destructive">*</span></label>
    <input type="text" value={ackText} onChange={e => setAckText(e.target.value)} placeholder="DELETE" required aria-required="true"
     className="input-double-border mt-1 h-9 w-64 rounded-[10px] border border-border bg-card px-3 text-sm text-foreground outline-none" />
    {ackChecked && <p className="mt-1 text-xs font-medium text-[#2E7D52]">Confirmed</p>}
   </div>
  </div>
 </div>
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
 setAccountingStandards(cfg.engagementTypeLabel === "Audit (AUD)" ? cfg.defaultFramework : typeDefaults(cfg.engagementTypeLabel).standards);
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
 <Button disabled={!isFormValid || (isCyToCsv && !ackChecked)} onClick={handleCreate}>
 {isEditMode ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
 {isEditMode ? "Update Engagement" : "Create Engagement"}
 </Button>
 </div>
 </div>
 </div>
  <SourceConnectionModal open={showSourceConnection} onOpenChange={setShowSourceConnection} clientName={clientName} connectionName={clientInfo?.entityLegalName || clientName} engagementId={routeEngagementId} onComplete={() => setConnVersion(v => v + 1)} initialStep={clientHasSourceConnection ? "connected" : "select"} initialProvider={clientSourceIntegration} />
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
