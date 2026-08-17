import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ChevronDown, Plus, LayoutGrid, FileText, ClipboardList, Trash2, GripVertical, X, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Layout } from "@/components/Layout";
import {
 allTemplateViews,
 categoryConfig,
 type TemplateSection,
 type CategoryType,
 type MyEngagementTemplate,
 type EditableTemplateRow,
 type EditableTemplateSection,
} from "@/lib/engagementTemplatesData";
import { ChecklistIcon } from "@/components/icons/ChecklistIcon";
import { LetterIcon } from "@/components/icons/LetterIcon";
import { FolderSolidIcon } from "@/components/icons/FolderIcons";
import { SmartLayoutIcon } from "@/components/icons/SmartLayoutIcon";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { readJsonFromLocalStorage, writeJsonToLocalStorage } from "@/lib/safeJson";
import { toast } from "sonner";

const categoryIcons: Record<CategoryType, React.ReactNode> = {
 checklist: <ChecklistIcon className="w-3.5 h-3.5 [&_path]:stroke-current" />,
 worksheet: <SmartLayoutIcon className="w-3.5 h-3.5" />,
 letter: <LetterIcon className="w-3.5 h-3.5 [&_path]:stroke-current" />,
 folder: <FolderSolidIcon className="w-3.5 h-3.5" />,
 module: <LayoutGrid className="w-3.5 h-3.5" />,
 "financial-statement": <FileText className="w-3.5 h-3.5" />,
 report: <ClipboardList className="w-3.5 h-3.5" />,
};

// ── Category Badge ──
function CategoryBadge({ category }: { category: string }) {
 const cfg = categoryConfig[category as keyof typeof categoryConfig];
 if (!cfg) return null;
 const icon = categoryIcons[category as CategoryType];
 return (
 <span className={cn("inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] whitespace-nowrap", cfg.className)}>
 {icon} {cfg.label}
 </span>
 );
}

// ── Section Block (read-only, for Global Templates) ──
function SectionBlock({ section }: { section: TemplateSection }) {
 const [open, setOpen] = useState(true);
 return (
 <div className="border border-border rounded-xl overflow-hidden">
 <button
 className="flex items-center justify-between w-full px-6 py-3.5 hover:bg-muted/30 cursor-pointer select-none"
 onClick={() => setOpen(!open)}
 >
 <span className="text-[15px] font-bold text-foreground">{section.name}</span>
 <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open ? "rotate-0" : "-rotate-90")} />
 </button>
 {open && (
 <div className="overflow-hidden">
 <table className="w-full border-collapse table-fixed">
 <colgroup>
 <col style={{ width: '35%' }} />
 <col style={{ width: '22%' }} />
 <col style={{ width: '43%' }} />
 </colgroup>
 <thead>
 <tr className="border-t border-border">
 <th className="px-6 py-2.5 text-sm font-semibold text-foreground bg-muted/30 border-b border-border text-left">Section</th>
 <th className="px-6 py-2.5 text-sm font-semibold text-foreground bg-muted/30 border-b border-border text-left">Category</th>
 <th className="px-6 py-2.5 text-sm font-semibold text-foreground bg-muted/30 border-b border-border text-left">Mapped template</th>
 </tr>
 </thead>
 <tbody>
 {section.rows.map((row, i) => (
 <tr key={i} className="hover:bg-muted/20">
 <td className="px-6 py-3.5 border-b border-border/40 text-sm text-foreground">{row.section}</td>
 <td className="px-6 py-3 border-b border-border/40">
 <CategoryBadge category={row.category} />
 </td>
 <td className="px-6 py-3.5 border-b border-border/40 text-sm text-foreground">{row.mappedTemplate}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 );
}

// ── Standards Banner ──
function StandardsBanner({ banner }: { banner: NonNullable<(typeof allTemplateViews)[string]["standardsBanner"]> }) {
 const colorMap = {
 blue: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300",
 green: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300",
 red: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300",
 };
 const badgeMap = {
 blue: "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300",
 green: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300",
 red: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300",
 };
 return (
 <div className={cn("border-b px-7 py-2.5 flex items-center gap-2.5 flex-shrink-0 text-xs", colorMap[banner.color])}>
 <span className="font-semibold">{banner.label}</span>
 <span>{banner.standards}</span>
 <span className={cn("ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full", badgeMap[banner.color])}>
 {banner.badge}
 </span>
 </div>
 );
}

// ── Editable Section Block (for My Templates) ──
const EDITABLE_CATEGORIES: CategoryType[] = ["checklist", "letter", "worksheet", "folder", "financial-statement", "report", "module"];

interface EditableSectionBlockProps {
 section: EditableTemplateSection;
 onUpdateRow: (rowId: string, field: keyof EditableTemplateRow, value: string) => void;
 onDeleteRow: (rowId: string) => void;
 onAddRow: () => void;
 onOpenMapPanel: (rowId: string) => void;
}

function EditableSectionBlock({ section, onUpdateRow, onDeleteRow, onAddRow, onOpenMapPanel }: EditableSectionBlockProps) {
 const [open, setOpen] = useState(true);

 return (
 <div className="border border-border rounded-xl overflow-hidden">
 <button
 className="flex items-center justify-between w-full px-6 py-3.5 hover:bg-muted/30 cursor-pointer select-none"
 onClick={() => setOpen(!open)}
 >
 <span className="text-[15px] font-bold text-foreground">{section.name}</span>
 <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open ? "rotate-0" : "-rotate-90")} />
 </button>
 {open && (
 <div className="overflow-hidden">
 <table className="w-full border-collapse table-fixed">
 <colgroup>
 <col style={{ width: '4%' }} />
 <col style={{ width: '33%' }} />
 <col style={{ width: '22%' }} />
 <col style={{ width: '37%' }} />
 <col style={{ width: '4%' }} />
 </colgroup>
 <thead>
 <tr className="border-t border-border">
 <th className="px-2 py-2.5 bg-muted/30 border-b border-border" />
 <th className="px-4 py-2.5 text-sm font-semibold text-foreground bg-muted/30 border-b border-border text-left">Section</th>
 <th className="px-4 py-2.5 text-sm font-semibold text-foreground bg-muted/30 border-b border-border text-left">Category</th>
 <th className="px-4 py-2.5 text-sm font-semibold text-foreground bg-muted/30 border-b border-border text-left">Mapped template</th>
 <th className="px-2 py-2.5 bg-muted/30 border-b border-border" />
 </tr>
 </thead>
 <tbody>
 {section.rows.map((row) => (
 <EditableRow
 key={row.id}
 row={row}
 onUpdate={(field, value) => onUpdateRow(row.id, field, value)}
 onDelete={() => onDeleteRow(row.id)}
 onOpenMapPanel={() => onOpenMapPanel(row.id)}
 />
 ))}
 </tbody>
 </table>
 <div className="px-4 py-3 border-t border-border/40">
 <Button
 size="sm"
 onClick={onAddRow}
 className="h-8 text-xs bg-[#1C63A6] hover:bg-[#1a5a9e] text-white"
 >
 <Plus className="h-3.5 w-3.5 mr-1" /> Add Section
 </Button>
 </div>
 </div>
 )}
 </div>
 );
}

// ── Editable Row ──
function EditableRow({
 row,
 onUpdate,
 onDelete,
 onOpenMapPanel,
}: {
 row: EditableTemplateRow;
 onUpdate: (field: keyof EditableTemplateRow, value: string) => void;
 onDelete: () => void;
 onOpenMapPanel: () => void;
}) {
 const isPending = row.isPending;
 const isIncomplete = isPending && (!row.section.trim() || !row.mappedTemplate);

 return (
 <tr className="group hover:bg-muted/20 relative">
 <td className="px-2 py-2 border-b border-border/40">
 <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab" />
 </td>
 <td className="px-4 py-2 border-b border-border/40">
 {isPending ? (
 <div>
 <Input
 value={row.section}
 onChange={e => onUpdate("section", e.target.value)}
 placeholder="Enter Name"
 className="h-7 text-sm border-border/60 focus:border-primary"
 autoFocus
 />
 {isIncomplete && (
 <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
 <AlertTriangle className="h-3 w-3" />
 All fields are mandatory to save this record
 </p>
 )}
 </div>
 ) : (
 <span
 className="text-sm text-foreground cursor-text hover:bg-muted/40 px-1 py-0.5 rounded block"
 onClick={() => onUpdate("section", row.section)}
 onBlur={(e) => onUpdate("section", (e.target as HTMLElement).textContent || row.section)}
 contentEditable
 suppressContentEditableWarning
 >
 {row.section}
 </span>
 )}
 </td>
 <td className="px-4 py-2 border-b border-border/40">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="inline-flex items-center gap-1.5 hover:opacity-80">
 <CategoryBadge category={row.category} />
 {isPending && <ChevronDown className="h-3 w-3 text-muted-foreground" />}
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className="w-44">
 {EDITABLE_CATEGORIES.map(cat => (
 <DropdownMenuItem
 key={cat}
 onClick={() => onUpdate("category", cat)}
 className="gap-2 cursor-pointer"
 >
 {categoryIcons[cat]}
 <span className="text-sm">{categoryConfig[cat].label}</span>
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>
 </td>
 <td className="px-4 py-2 border-b border-border/40">
 {row.mappedTemplate ? (
 <div className="flex items-center gap-1.5">
 <span className="text-sm text-foreground truncate">{row.mappedTemplate}</span>
 <button
 onClick={() => onUpdate("mappedTemplate", "")}
 className="h-4 w-4 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 flex-shrink-0"
 >
 <X className="h-2.5 w-2.5" />
 </button>
 </div>
 ) : (
 <button
 onClick={onOpenMapPanel}
 className="text-sm text-primary hover:underline flex items-center gap-1"
 >
 <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><path d="M8 1v6M1 8h6M15 8h-6M8 15V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
 Map Template
 </button>
 )}
 </td>
 <td className="px-2 py-2 border-b border-border/40">
 <button
 onClick={onDelete}
 className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
 >
 <Trash2 className="h-4 w-4 text-destructive" />
 </button>
 </td>
 </tr>
 );
}

// ── Map Template Panel ──
function MapTemplatePanel({
 open,
 onClose,
 onSelect,
}: {
 open: boolean;
 onClose: () => void;
 onSelect: (name: string) => void;
}) {
 const [mapTab, setMapTab] = useState<"my" | "global">("my");
 const [search, setSearch] = useState("");
 const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

 const savedChecklists = readJsonFromLocalStorage<{ id: string; name: string; folderId: string; folderName: string }[]>("savedChecklists", []);

 // Group by folder
 const myFolders: Record<string, { id: string; name: string; items: string[] }> = {};
 savedChecklists.forEach(c => {
 if (!myFolders[c.folderId]) myFolders[c.folderId] = { id: c.folderId, name: c.folderName, items: [] };
 myFolders[c.folderId].items.push(c.name);
 });

 const globalFolders = [
 { id: "comp", name: "Compilation", items: ["Client Acceptance and Continuance", "Independence", "Knowledge of the Business", "Planning", "Withdrawal", "Completion"] },
 { id: "rev", name: "Review", items: ["New engagement acceptance", "Existing engagement continuance", "Understanding the entity - Basics", "Engagement Planning", "Completion", "Subsequent events"] },
 { id: "tax", name: "Tax", items: ["Completion"] },
 ];

 const folders = mapTab === "my" ? Object.values(myFolders) : globalFolders;
 const filtered = search
 ? folders.map(f => ({...f, items: f.items.filter(i => i.toLowerCase().includes(search.toLowerCase())) })).filter(f => f.items.length > 0)
 : folders;

 if (!open) return null;

 return (
 <div className="fixed inset-y-0 right-0 w-80 bg-background border-l border-border shadow-xl z-50 flex flex-col">
 <div className="flex items-center justify-between px-4 py-3 border-b border-border">
 <span className="font-semibold text-foreground">Map Template</span>
 <button onClick={onClose} className="p-1 hover:bg-muted rounded">
 <X className="h-4 w-4" />
 </button>
 </div>
 <div className="flex border-b border-border">
 {(["my", "global"] as const).map(tab => (
 <button
 key={tab}
 onClick={() => setMapTab(tab)}
 className={cn(
 "flex-1 py-2 text-sm font-medium transition-all border-b-2",
 mapTab === tab ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
 )}
 >
 {tab === "my" ? "My Templates" : "Global Templates"}
 </button>
 ))}
 </div>
 <div className="px-3 py-2 border-b border-border/40">
 <div className="relative">
 <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
 <Input
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Search"
 className="pl-8 h-7 text-sm"
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-2">
 {filtered.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center py-8">No templates found</p>
 ) : filtered.map(folder => (
 <div key={folder.id}>
 <div
 className="flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted/50 text-sm font-semibold select-none"
 onClick={() => setExpandedFolders(prev => {
 const next = new Set(prev);
 next.has(folder.id) ? next.delete(folder.id) : next.add(folder.id);
 return next;
 })}
 >
 <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expandedFolders.has(folder.id) ? "rotate-0" : "-rotate-90")} />
 <FolderSolidIcon className="h-4 w-4 text-primary" />
 <span className="truncate flex-1">{folder.name}</span>
 </div>
 {expandedFolders.has(folder.id) && folder.items.map(item => (
 <div
 key={item}
 className="flex items-center gap-2 py-1.5 pl-8 pr-2 rounded-md cursor-pointer hover:bg-primary/10 text-sm select-none"
 onClick={() => { onSelect(item); onClose(); }}
 >
 <ChecklistIcon className="h-3.5 w-3.5 flex-shrink-0" />
 <span className="truncate">{item}</span>
 </div>
 ))}
 </div>
 ))}
 </div>
 </div>
 );
}

// ── My Template Editor ──
function MyTemplateEditor({
 template,
 onSaved,
 onDeleted,
}: {
 template: MyEngagementTemplate;
 onSaved: (updated: MyEngagementTemplate) => void;
 onDeleted: () => void;
}) {
 const [data, setData] = useState<MyEngagementTemplate>(template);
 const [isDirty, setIsDirty] = useState(false);
 const [editingTitle, setEditingTitle] = useState(false);
 const [titleDraft, setTitleDraft] = useState(template.name);
 const [mapPanelOpen, setMapPanelOpen] = useState(false);
 const [mapTarget, setMapTarget] = useState<{ sectionId: string; rowId: string } | null>(null);
 const titleInputRef = useRef<HTMLInputElement>(null);

 // Reset when template changes
 useEffect(() => {
 setData(template);
 setTitleDraft(template.name);
 setIsDirty(false);
 }, [template.id]);

 const mutate = (fn: (d: MyEngagementTemplate) => MyEngagementTemplate) => {
 setData(prev => fn(prev));
 setIsDirty(true);
 };

 const handleUpdateRow = (sectionId: string, rowId: string, field: keyof EditableTemplateRow, value: string) => {
 mutate(d => ({
...d,
 sections: d.sections.map(s =>
 s.id === sectionId
 ? {...s, rows: s.rows.map(r => r.id === rowId ? {...r, [field]: value, isPending: field === "section" ? false : r.isPending } : r) }
 : s
 ),
 }));
 };

 const handleDeleteRow = (sectionId: string, rowId: string) => {
 mutate(d => ({
...d,
 sections: d.sections.map(s =>
 s.id === sectionId ? {...s, rows: s.rows.filter(r => r.id !== rowId) } : s
 ),
 }));
 toast.success("The section has been successfully removed. To apply, please save changes");
 };

 const handleAddRow = (sectionId: string) => {
 const newRow: EditableTemplateRow = {
 id: `row-new-${Date.now()}`,
 section: "",
 category: "checklist",
 mappedTemplate: "",
 isPending: true,
 };
 mutate(d => ({
...d,
 sections: d.sections.map(s =>
 s.id === sectionId ? {...s, rows: [...s.rows, newRow] } : s
 ),
 }));
 };

 const handleSave = () => {
 const updated: MyEngagementTemplate = {
...data,
 name: titleDraft.trim() || data.name,
 updatedAt: new Date().toISOString(),
 sections: data.sections.map(s => ({
...s,
 rows: s.rows.map(r => ({...r, isPending: false })),
 })),
 };
 const all = readJsonFromLocalStorage<MyEngagementTemplate[]>("myEngagementTemplates", []);
 const saved = all.map(t => t.id === updated.id ? updated : t);
 writeJsonToLocalStorage("myEngagementTemplates", saved);
 setData(updated);
 setIsDirty(false);
 toast.success("Changes saved successfully");
 onSaved(updated);
 };

 const handleDuplicate = () => {
 const copy: MyEngagementTemplate = {
...data,
 id: `my-eng-${Date.now()}`,
 name: `${data.name} (Copy)`,
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 };
 const all = readJsonFromLocalStorage<MyEngagementTemplate[]>("myEngagementTemplates", []);
 writeJsonToLocalStorage("myEngagementTemplates", [...all, copy]);
 window.dispatchEvent(new CustomEvent("engagementTemplateSaved", { detail: copy }));
 toast.success("Template duplicated successfully");
 };

 const handleDelete = () => {
 const all = readJsonFromLocalStorage<MyEngagementTemplate[]>("myEngagementTemplates", []);
 writeJsonToLocalStorage("myEngagementTemplates", all.filter(t => t.id !== data.id));
 toast.success("Template deleted");
 onDeleted();
 };

 const handleTitleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === "Enter") {
 setEditingTitle(false);
 mutate(d => ({...d, name: titleDraft.trim() || d.name }));
 }
 if (e.key === "Escape") {
 setTitleDraft(data.name);
 setEditingTitle(false);
 }
 };

 return (
 <>
 <div className="flex-1 bg-background flex flex-col overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between px-7 pt-4 pb-3.5 border-b border-border flex-shrink-0">
 <div>
 {editingTitle ? (
 <Input
 ref={titleInputRef}
 value={titleDraft}
 onChange={e => { setTitleDraft(e.target.value); setIsDirty(true); }}
 onBlur={() => { setEditingTitle(false); mutate(d => ({...d, name: titleDraft.trim() || d.name })); }}
 onKeyDown={handleTitleKeyDown}
 className="text-xl font-bold text-foreground border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent w-80"
 autoFocus
 />
 ) : (
 <h1
 className="text-xl font-bold text-foreground cursor-text hover:bg-muted/30 px-1 rounded"
 onClick={() => { setEditingTitle(true); setTimeout(() => titleInputRef.current?.select(), 0); }}
 >
 {data.name}
 </h1>
 )}
 </div>
 <div className="flex items-center gap-2">
 {isDirty && (
 <Button
 size="sm"
 onClick={handleSave}
 className="bg-[#1C63A6] hover:bg-[#1a5a9e] text-white text-[13px] font-semibold"
 >
 Save changes
 </Button>
 )}
 <Button
 size="sm"
 variant="outline"
 onClick={handleDuplicate}
 className="text-[13px] font-semibold gap-1.5"
 >
 <Copy className="h-3.5 w-3.5" /> Duplicate
 </Button>
 <Button
 size="sm"
 variant="outline"
 onClick={handleDelete}
 className="text-[13px] font-semibold gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
 >
 <Trash2 className="h-3.5 w-3.5" /> Delete
 </Button>
 </div>
 </div>

 {/* Sections */}
 <div className="flex-1 overflow-y-auto p-6 space-y-5">
 {data.sections.map(section => (
 <EditableSectionBlock
 key={section.id}
 section={section}
 onUpdateRow={(rowId, field, value) => handleUpdateRow(section.id, rowId, field, value)}
 onDeleteRow={(rowId) => handleDeleteRow(section.id, rowId)}
 onAddRow={() => handleAddRow(section.id)}
 onOpenMapPanel={(rowId) => {
 setMapTarget({ sectionId: section.id, rowId });
 setMapPanelOpen(true);
 }}
 />
 ))}
 </div>
 </div>

 {/* Map Template Panel */}
 <MapTemplatePanel
 open={mapPanelOpen}
 onClose={() => { setMapPanelOpen(false); setMapTarget(null); }}
 onSelect={(name) => {
 if (mapTarget) {
 handleUpdateRow(mapTarget.sectionId, mapTarget.rowId, "mappedTemplate", name);
 }
 setMapPanelOpen(false);
 setMapTarget(null);
 }}
 />

 {/* Overlay when panel open */}
 {mapPanelOpen && (
 <div className="fixed inset-0 z-40 bg-black/10" onClick={() => { setMapPanelOpen(false); setMapTarget(null); }} />
 )}
 </>
 );
}

// ── Main Page ──
export default function EngagementTemplates() {
 const [searchParams, setSearchParams] = useSearchParams();
 const navigate = useNavigate();
 const selectedId = searchParams.get("template") || "comp4200";
 const myTemplateId = searchParams.get("myTemplate");

 const activeView = allTemplateViews[selectedId];

 // Load my template from localStorage
 const [myTemplate, setMyTemplate] = useState<MyEngagementTemplate | null>(null);

 useEffect(() => {
 if (myTemplateId) {
 const all = readJsonFromLocalStorage<MyEngagementTemplate[]>("myEngagementTemplates", []);
 const found = all.find(t => t.id === myTemplateId) || null;
 setMyTemplate(found);
 } else {
 setMyTemplate(null);
 }
 }, [myTemplateId]);

 const handleTemplateSaved = (updated: MyEngagementTemplate) => {
 setMyTemplate(updated);
 window.dispatchEvent(new CustomEvent("engagementTemplateSaved", { detail: updated }));
 };

 const handleTemplateDeleted = () => {
 navigate("/engagement-templates");
 setSearchParams({});
 };

 return (
 <Layout title="Templates">
 <div className="flex h-full overflow-hidden bg-background">
 {/* Right Panel */}
 <div className="flex-1 bg-background flex flex-col overflow-hidden">
 {myTemplateId && myTemplate ? (
 <MyTemplateEditor
 template={myTemplate}
 onSaved={handleTemplateSaved}
 onDeleted={handleTemplateDeleted}
 />
 ) : myTemplateId && !myTemplate ? (
 <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
 <span className="text-5xl opacity-40">📄</span>
 <span className="text-[15px]">Template not found</span>
 </div>
 ) : activeView ? (
 <>
 {/* Header */}
 <div className="flex items-center justify-between px-7 pt-4 pb-3.5 border-b border-border flex-shrink-0">
 <div>
 <h1 className="text-xl font-bold text-foreground">{activeView.title}</h1>
 </div>
 <Button size="sm" className="bg-[#1C63A6] hover:bg-[#1a5a9e] text-primary-foreground text-[13px] font-semibold">
 <Plus className="h-4 w-4 mr-1" /> My Templates
 </Button>
 </div>



 {/* Sections */}
 <div className="flex-1 overflow-y-auto p-6 space-y-5">
 {activeView.sections.map((section, i) => (
 <SectionBlock key={i} section={section} />
 ))}
 </div>
 </>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
 <span className="text-5xl opacity-40">📄</span>
 <span className="text-[15px]">Select a template to view its structure</span>
 </div>
 )}
 </div>
 </div>
 </Layout>
 );
}
