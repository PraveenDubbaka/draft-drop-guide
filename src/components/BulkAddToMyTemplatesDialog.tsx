import { useState, useEffect, useMemo } from 'react';
import { Plus, Folder, FolderPlus, Check } from 'lucide-react';
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
 DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { readJsonFromLocalStorage, writeJsonToLocalStorage } from '@/lib/safeJson';
import { SavedChecklist } from './Sidebar';
import { toast } from 'sonner';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { MyEngagementTemplate, templateViewToMyTemplate, TemplateView } from '@/lib/engagementTemplatesData';

interface Template {
 id: string;
 name: string;
 type: "folder" | "file";
 children?: Template[];
 isExpanded?: boolean;
}

interface SelectedTemplate {
 id: string;
 name: string;
}

interface BulkAddToMyTemplatesDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 selectedTemplates: SelectedTemplate[];
 onSuccess?: () => void;
 getChecklistData: (templateId: string) => any;
 variant?: "checklist" | "engagement";
 getTemplateViewData?: (templateId: string) => TemplateView | null;
}

const initialFolders: Template[] = [
 { id: "1", name: "Before Release V22Comp", type: "folder", children: [] },
 { id: "2", name: "Before Release V22 Revi...", type: "folder", children: [] },
 { id: "3", name: "Carissa_13208", type: "folder", children: [] },
 { id: "4", name: "carisa 37.3", type: "folder", children: [] },
 { id: "5", name: "Compilation Checklists", type: "folder", children: [] },
 { id: "6", name: "release 38 before", type: "folder", children: [] },
 { id: "7", name: "Review Checklists", type: "folder", children: [] },
 { id: "8", name: "Tax Release", type: "folder", children: [] },
];

export function BulkAddToMyTemplatesDialog({
 open,
 onOpenChange,
 selectedTemplates,
 onSuccess,
 getChecklistData,
 variant = "checklist",
 getTemplateViewData,
}: BulkAddToMyTemplatesDialogProps) {
 const [folderOption, setFolderOption] = useState<'existing' | 'new'>('existing');
 const [selectedFolder, setSelectedFolder] = useState<string>('');
 const [folders, setFolders] = useState<Template[]>(initialFolders);
 const [newFolderName, setNewFolderName] = useState('');

 // Get checklist counts per folder
 const folderChecklistCounts = useMemo(() => {
 const savedChecklists = readJsonFromLocalStorage<SavedChecklist[]>('savedChecklists', []);
 const counts: Record<string, number> = {};
 folders.forEach(folder => {
 counts[folder.id] = savedChecklists.filter(c => c.folderId === folder.id).length;
 });
 return counts;
 }, [folders, open]);

 // Reset state when dialog opens
 useEffect(() => {
 if (open) {
 setFolderOption('existing');
 setSelectedFolder('');
 setNewFolderName('');
 }
 }, [open]);

 const handleSave = () => {
 let targetFolder: Template | undefined;
 let targetFolderId: string;
 let targetFolderName: string;

 if (folderOption === 'new') {
 if (!newFolderName.trim()) return;
 targetFolderId = `folder-${Date.now()}`;
 targetFolderName = newFolderName.trim();
 targetFolder = { id: targetFolderId, name: targetFolderName, type: 'folder', children: [] };
 setFolders(prev => [...prev, targetFolder!]);
 } else {
 if (!selectedFolder) return;
 targetFolder = folders.find(f => f.id === selectedFolder);
 if (!targetFolder) return;
 targetFolderId = selectedFolder;
 targetFolderName = targetFolder.name;
 }

 if (variant === "engagement") {
 // Save as MyEngagementTemplate
 const existing = readJsonFromLocalStorage<MyEngagementTemplate[]>('myEngagementTemplates', []);
 const existingNames = new Set(
 existing.filter(t => t.folderId === targetFolderId).map(t => t.name.toLowerCase())
 );
 const duplicates = selectedTemplates.filter(t => {
 const view = getTemplateViewData?.(t.id);
 const name = view?.title || t.name;
 return existingNames.has(name.toLowerCase());
 });
 if (duplicates.length > 0) {
 toast.error('One or more engagement template with the same name already exists in the selected folder.');
 return;
 }

 const newTemplates: MyEngagementTemplate[] = selectedTemplates.map((template, index) => {
 const view = getTemplateViewData?.(template.id);
 if (view) {
 return templateViewToMyTemplate(view, targetFolderId, targetFolderName, `my-eng-${Date.now()}-${index}`);
 }
 // Fallback: empty template
 return {
 id: `my-eng-${Date.now()}-${index}`,
 name: template.name,
 folderId: targetFolderId,
 folderName: targetFolderName,
 sections: [],
 sourceTemplateId: template.id,
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 };
 });

 writeJsonToLocalStorage('myEngagementTemplates', [...existing,...newTemplates]);

 newTemplates.forEach(t => {
 window.dispatchEvent(new CustomEvent('engagementTemplateSaved', { detail: t }));
 });

 onOpenChange(false);
 const count = newTemplates.length;
 toast.success(`Engagement template${count > 1 ? 's' : ''} copied successfully`);
 onSuccess?.();
 return;
 }

 // Checklist variant (original logic)
 const savedChecklists = readJsonFromLocalStorage<SavedChecklist[]>('savedChecklists', []);
 const existingNames = new Set(
 savedChecklists.filter(c => c.folderId === targetFolderId).map(c => c.name.toLowerCase())
 );
 const duplicates = selectedTemplates.filter(t => existingNames.has(t.name.toLowerCase()));
 if (duplicates.length > 0) {
 toast.error('One or more checklist with same name already exist in the selected folder. Please choose another folder or rename the checklists.');
 return;
 }

 const newChecklists: SavedChecklist[] = selectedTemplates.map((template, index) => {
 const checklistData = getChecklistData(template.id);
 return {
 id: `checklist-${Date.now()}-${index}`,
 name: template.name,
 folderId: targetFolderId,
 folderName: targetFolderName,
 data: checklistData ? {
...checklistData,
 id: `checklist-${Date.now()}-${index}`,
 title: template.name,
 createdAt: new Date(),
 updatedAt: new Date(),
 } : undefined,
 };
 });

 const updated = [...savedChecklists,...newChecklists];
 writeJsonToLocalStorage('savedChecklists', updated);
 newChecklists.forEach(checklist => {
 window.dispatchEvent(new CustomEvent('checklistSaved', { detail: checklist }));
 });

 onOpenChange(false);
 const count = selectedTemplates.length;
 toast.success(`${count} ${count === 1 ? 'checklist' : 'checklists'} successfully added to My Templates`);
 onSuccess?.();
 };

 const isAddDisabled = folderOption === 'existing' ? !selectedFolder : !newFolderName.trim();

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-md">
 <DialogHeader className="flex flex-row items-start gap-4 text-left">
 {/* Success icon */}
 <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
 <rect x="4" y="4" width="48" height="48" rx="24" fill="#D1FADF"/>
 <rect x="4" y="4" width="48" height="48" rx="24" stroke="#ECFDF3" strokeWidth="8"/>
 <path d="M23.5 28L26.5 31L32.5 25M38 28C38 33.5228 33.5228 38 28 38C22.4772 38 18 33.5228 18 28C18 22.4772 22.4772 18 28 18C33.5228 18 38 22.4772 38 28Z" stroke="#039855" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>
 <div className="flex flex-col space-y-1.5">
 <DialogTitle className="text-xl">Select a location</DialogTitle>
 <DialogDescription>
 {variant === "engagement"
 ? `Select where you want to add ${selectedTemplates.length === 1 ? 'this engagement template' : `these ${selectedTemplates.length} engagement templates`}`
 : `Select where you want to add ${selectedTemplates.length === 1 ? 'this checklist' : `these ${selectedTemplates.length} checklists`}`}
 </DialogDescription>
 </div>
 </DialogHeader>

 <div className="space-y-4 py-4">
 <RadioGroup
 value={folderOption}
 onValueChange={(val) => setFolderOption(val as 'existing' | 'new')}
 className="space-y-2"
 >
 <div className="flex items-center space-x-2">
 <RadioGroupItem value="existing" id="existing" />
 <Label htmlFor="existing" className="cursor-pointer">Existing folder</Label>
 </div>
 <div className="flex items-center space-x-2">
 <RadioGroupItem value="new" id="new" />
 <Label htmlFor="new" className="cursor-pointer">Create new folder</Label>
 </div>
 </RadioGroup>

 {folderOption === 'existing' ? (
 <div className="space-y-2">
 <Label className="text-muted-foreground text-xs">Existing folder:</Label>
 <Select value={selectedFolder} onValueChange={setSelectedFolder}>
 <SelectTrigger className="w-full">
 <SelectValue placeholder="Select" />
 </SelectTrigger>
 <SelectContent>
 {folders.map((folder) => (
 <SelectItem key={folder.id} value={folder.id}>
 {folder.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 ) : (
 <div className="space-y-2">
 <Label className="text-muted-foreground text-xs">New folder name:</Label>
 <Input
 value={newFolderName}
 onChange={(e) => setNewFolderName(e.target.value)}
 placeholder="Enter folder name"
 autoFocus
 />
 </div>
 )}
 </div>

 <Button
 onClick={handleSave}
 disabled={isAddDisabled}
 className="w-full"
 >
 Add
 </Button>
 </DialogContent>
 </Dialog>
 );
}
