import { useState, useEffect, type ReactNode } from "react";
import { ArrowLeft, X, User, FileText, Zap, Bell, Users, Shield, Download, ChevronDown, ChevronUp, Sparkles, CheckSquare, Database, CircleHelp, MessageSquare, FileOutput, RotateCcw, Check, Info, Clock, Pencil, Trash2 } from "lucide-react";
import { getEnabled, setEnabled, subscribeEnabled } from "@/lib/timeTrackerStore";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
interface SettingsPanelProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
}

const settingsNavItems = [
 { id: "my-account", label: "My Account", icon: User },
 { id: "letterhead", label: "Letterhead & Signature", icon: FileText },
 { id: "luka", label: "Luka", icon: Zap },
 { id: "notifications", label: "Notifications", icon: Bell },
 { id: "user-access", label: "User & Access", icon: Users },
 { id: "privacy", label: "Privacy & Security", icon: Shield },
 { id: "export", label: "Export Data", icon: Download },
 { id: "time-tracking", label: "Time Tracking", icon: Clock },
];

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
 const [activeSection, setActiveSection] = useState("my-account");

 return (
 <Sheet open={open} onOpenChange={onOpenChange}>
 <SheetContent 
 side="right" 
 className="!w-[80%] !max-w-[80%] p-0 flex gap-0 [&>button]:hidden sm:rounded-l-2xl"
 >
 {/* Left Navigation */}
 <div className="w-64 border-r border-border bg-muted/30 flex flex-col">
 <div className="p-4 flex items-center gap-3 border-b border-border">
 <Button 
 variant="ghost" 
 size="icon" 
 className="h-9 w-9"
 onClick={() => onOpenChange(false)}
 >
 <ArrowLeft className="h-4 w-4" />
 </Button>
 <span className="font-semibold text-lg">Settings</span>
 </div>
 
 <nav className="flex-1 p-2">
 {settingsNavItems.map((item) => (
 <button
 key={item.id}
 onClick={() => setActiveSection(item.id)}
 className={cn(
 "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
 activeSection === item.id
 ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/25"
 : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
 )}
 >
 <item.icon className="h-4 w-4" />
 <span>{item.label}</span>
 </button>
 ))}
 </nav>
 </div>

 {/* Main Content */}
 <div className="flex-1 flex flex-col overflow-hidden">
 <div className="p-6 border-b border-border flex items-center justify-between">
 <h2 className="text-xl font-semibold text-primary">
 {settingsNavItems.find(item => item.id === activeSection)?.label}
 </h2>
 <Button 
 variant="ghost" 
 size="icon" 
 className="h-9 w-9"
 onClick={() => onOpenChange(false)}
 >
 <X className="h-4 w-4" />
 </Button>
 </div>

 <div className="flex-1 overflow-auto p-6">
 {activeSection === "my-account" && <MyAccountContent />}
 {activeSection === "letterhead" && <PlaceholderContent title="Letterhead & Signature" />}
 {activeSection === "luka" && <LukaContent />}
 {activeSection === "notifications" && <NotificationsContent />}
 {activeSection === "user-access" && <UserAccessContent />}
 {activeSection === "privacy" && <PlaceholderContent title="Privacy & Security" />}
 {activeSection === "export" && <PlaceholderContent title="Export Data" />}
 {activeSection === "time-tracking" && <TimeTrackingContent />}
 </div>
 </div>
 </SheetContent>
 </Sheet>
 );
}

function LukaContent() {
 const [showAutomatesPanel, setShowAutomatesPanel] = useState(true);
 const [openSections, setOpenSections] = useState<string[]>(["autopilot-scope"]);
 const [autopilotScope, setAutopilotScope] = useState("recommended");

 const toggleSection = (id: string) => {
 setOpenSections(prev => 
 prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
 );
 };

 const expandAll = () => {
 setOpenSections(lukaSettingsSections.map(s => s.id));
 };

 const collapseAll = () => {
 setOpenSections([]);
 };

 const lukaSettingsSections = [
 { id: "autopilot-scope", label: "Autopilot Scope", icon: Zap, badge: null },
 { id: "checklist-coverage", label: "Checklist Coverage", icon: CheckSquare, badge: "4 of 4 selected" },
 { id: "source-data-trust", label: "Source & Data Trust", icon: Database, badge: null },
 { id: "confidence-threshold", label: "Confidence Threshold", icon: CircleHelp, badge: null },
 { id: "client-interaction", label: "Client Interaction Controls", icon: MessageSquare, badge: "All off" },
 { id: "output-review", label: "Output & Review Preferences", icon: FileOutput, badge: null },
 { id: "notifications", label: "Notifications", icon: Bell, badge: null },
 ];

 const autopilotOptions = [
 {
 id: "recommended",
 label: "Recommended",
 isDefault: true,
 features: [
 { text: "Auto-fill checklists", included: true },
 { text: "Draft responses & explanations", included: true },
 { text: "No client communication", included: false },
 ],
 },
 {
 id: "assisted",
 label: "Assisted Mode",
 isDefault: false,
 features: [
 { text: "Auto-fill where confident", included: true },
 { text: "Pause for review on low confidence", included: true },
 ],
 },
 {
 id: "manual",
 label: "Manual Review First",
 isDefault: false,
 features: [
 { text: "Preview only", included: true },
 { text: "No auto-save", included: false },
 ],
 },
 ];

 return (
 <div className="flex flex-col h-full">
 <Tabs defaultValue="automation" className="w-full flex-1 flex flex-col">
 <TabsList>
 <TabsTrigger value="automation" className="gap-2">
 <Zap className="h-4 w-4" />
 Automation
 </TabsTrigger>
 <TabsTrigger value="feedback">Feedback</TabsTrigger>
 <TabsTrigger value="terms">Terms of use</TabsTrigger>
 <TabsTrigger value="privacy">Privacy policy</TabsTrigger>
 </TabsList>

 <TabsContent value="automation" className="mt-6 flex-1 flex flex-col">
 {/* Header */}
 <div className="flex items-start justify-between mb-6">
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
 <Zap className="h-5 w-5 text-primary" />
 </div>
 <div>
 <h3 className="font-semibold text-lg">Luka Autopilot Settings</h3>
 <p className="text-sm text-muted-foreground">Defaults are optimized. Change only if needed.</p>
 </div>
 </div>
 <div className="flex items-center gap-4 text-sm">
 <button 
 onClick={expandAll}
 className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
 >
 <ChevronDown className="h-4 w-4" />
 Expand All
 </button>
 <button 
 onClick={collapseAll}
 className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
 >
 <ChevronUp className="h-4 w-4" />
 Collapse All
 </button>
 </div>
 </div>

 {/* Show Automates Panel Toggle */}
 <div className="p-4 border border-border rounded-xl mb-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
 <Sparkles className="h-5 w-5 text-primary" />
 </div>
 <div>
 <p className="font-medium">Show "How Luka Automates" Panel</p>
 <p className="text-sm text-muted-foreground">Display the automation visualization panel on your dashboard</p>
 </div>
 </div>
 <Switch checked={showAutomatesPanel} onCheckedChange={setShowAutomatesPanel} />
 </div>

 {/* Collapsible Sections */}
 <div className="space-y-3 flex-1">
 {lukaSettingsSections.map((section) => (
 <Collapsible 
 key={section.id}
 open={openSections.includes(section.id)}
 onOpenChange={() => toggleSection(section.id)}
 >
 <CollapsibleTrigger className="w-full">
 <div className={cn(
 "p-4 border flex items-center justify-between transition-colors hover:bg-muted/50",
 openSections.includes(section.id) 
 ? "border-border rounded-t-xl border-b-0" 
 : "border-border rounded-xl"
 )}>
 <div className="flex items-center gap-3">
 <section.icon className="h-5 w-5 text-muted-foreground" />
 <span className="font-medium">{section.label}</span>
 {section.badge && (
 <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
 {section.badge}
 </span>
 )}
 </div>
 <ChevronDown className={cn(
 "h-5 w-5 text-muted-foreground transition-transform",
 openSections.includes(section.id) && "rotate-180"
 )} />
 </div>
 </CollapsibleTrigger>
 <CollapsibleContent>
 <div className="p-4 border border-border rounded-b-xl">
 {section.id === "autopilot-scope" ? (
 <div className="space-y-4">
 <p className="text-sm text-muted-foreground">
 Define how far Luka can proceed without stopping for your input.
 </p>
 
 <RadioGroup value={autopilotScope} onValueChange={setAutopilotScope} className="space-y-3">
 {autopilotOptions.map((option) => (
 <label
 key={option.id}
 htmlFor={option.id}
 className={cn(
 "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors",
 autopilotScope === option.id
 ? "border-primary bg-primary/5"
 : "border-border hover:border-muted-foreground/30"
 )}
 >
 <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <span className="font-medium">{option.label}</span>
 {option.isDefault && (
 <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
 Default
 </span>
 )}
 </div>
 <div className="space-y-1">
 {option.features.map((feature, idx) => (
 <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
 {feature.included ? (
 <Check className="h-4 w-4 text-muted-foreground" />
 ) : (
 <X className="h-4 w-4 text-muted-foreground" />
 )}
 <span>{feature.text}</span>
 </div>
 ))}
 </div>
 </div>
 </label>
 ))}
 </RadioGroup>

 <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
 <Info className="h-4 w-4" />
 <span>You can change this anytime.</span>
 </div>
 </div>
 ) : (
 <p className="text-sm text-muted-foreground">{section.label} settings content coming soon...</p>
 )}
 </div>
 </CollapsibleContent>
 </Collapsible>
 ))}
 </div>
 </TabsContent>

 <TabsContent value="feedback" className="mt-6">
 <PlaceholderContent title="Feedback" />
 </TabsContent>

 <TabsContent value="terms" className="mt-6">
 <PlaceholderContent title="Terms of Use" />
 </TabsContent>

 <TabsContent value="privacy" className="mt-6">
 <PlaceholderContent title="Privacy Policy" />
 </TabsContent>
 </Tabs>

 {/* Footer */}
 <div className="border-t border-border pt-4 mt-6 flex items-center justify-between">
 <Button variant="outline" className="gap-2">
 <RotateCcw className="h-4 w-4" />
 Reset to Defaults
 </Button>
 <Button className="gap-2 bg-gradient-to-r from-[#1C63A6] to-[#7A31D8] hover:from-[#1a5a96] hover:to-[#6a2bc2]">
 <Zap className="h-4 w-4" />
 Review Settings
 </Button>
 </div>
 </div>
 );
}

function MyAccountContent() {
 return (
 <div className="space-y-6">
 <Tabs defaultValue="profile" className="w-full">
 <TabsList>
 <TabsTrigger value="profile">Profile</TabsTrigger>
 <TabsTrigger value="firm-info">Firm Info</TabsTrigger>
 <TabsTrigger value="timezone">Time Zone</TabsTrigger>
 </TabsList>

 <TabsContent value="profile" className="mt-6 space-y-8">
 {/* Profile Picture Section */}
 <div className="space-y-4">
 <h3 className="text-sm font-semibold text-primary">Profile Picture</h3>
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
 JD
 </div>
 <Button variant="default" size="sm">Remove Image</Button>
 <Button variant="outline" size="sm">Change Color</Button>
 </div>
 </div>

 {/* Personal Information Section */}
 <div className="space-y-4">
 <h3 className="text-sm font-semibold text-primary">Personal Information</h3>
 
 <div className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="memberId">Member ID</Label>
 <Input id="memberId" defaultValue="2541" className="max-w-md" />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="firstName">First Name<span className="text-destructive">*</span></Label>
 <Input id="firstName" defaultValue="John" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="lastName">Last Name<span className="text-destructive">*</span></Label>
 <Input id="lastName" defaultValue="Doe" />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="email">Email<span className="text-destructive">*</span></Label>
 <Input id="email" type="email" defaultValue="johndoe@email.com" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="title">Title<span className="text-destructive">*</span></Label>
 <Input id="title" defaultValue="Manager" />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="businessPhone">Business Phone</Label>
 <Input id="businessPhone" defaultValue="(555) 123-4567" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="cellPhone">Cell Phone</Label>
 <Input id="cellPhone" defaultValue="(555) 987-6543" />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="hourlyRate">Hourly Rate</Label>
 <Input id="hourlyRate" defaultValue="75" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="licenseNumber">License Number</Label>
 <Input id="licenseNumber" />
 </div>
 </div>
 </div>
 </div>

 <Button className="mt-6">Save Changes</Button>
 </TabsContent>

 <TabsContent value="firm-info" className="mt-6">
 <PlaceholderContent title="Firm Information" />
 </TabsContent>

 <TabsContent value="timezone" className="mt-6">
 <PlaceholderContent title="Time Zone Settings" />
 </TabsContent>
 </Tabs>
 </div>
 );
}

function NotificationsContent() {
 const [ttEnabled, setTtEnabled] = useState(() => getEnabled());
 useEffect(() => subscribeEnabled(setTtEnabled), []);

 const [notifs, setNotifs] = useState({
  pbcRequest: true,
  reviewRequest: true,
  mention: true,
  engagementUpdate: false,
  ttStarted: true,
  ttStopped: true,
  ttDailySummary: true,
  ttAutoLog: true,
  ttIdleAlert: true,
 });

 const toggle = (key: keyof typeof notifs) =>
  setNotifs(prev => ({ ...prev, [key]: !prev[key] }));

 return (
  <div className="space-y-6">
   <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
     <Bell className="h-5 w-5 text-primary" />
    </div>
    <div>
     <h3 className="font-semibold text-lg">Notifications</h3>
     <p className="text-sm text-muted-foreground">Control which updates you receive.</p>
    </div>
   </div>

   <div className="space-y-1">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">General</p>
    {([
     { key: 'pbcRequest', label: 'PBC request responses', desc: 'When a client responds to a PBC request' },
     { key: 'reviewRequest', label: 'Review requests', desc: 'When someone requests your review' },
     { key: 'mention', label: 'Mentions', desc: 'When you are @mentioned in a comment' },
     { key: 'engagementUpdate', label: 'Engagement updates', desc: 'Status changes and team updates' },
    ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(item => (
     <div key={item.key} className="flex items-start justify-between gap-4 py-3 border-b border-border/50">
      <div>
       <p className="text-sm font-medium">{item.label}</p>
       <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
      </div>
      <Switch checked={notifs[item.key]} onCheckedChange={() => toggle(item.key)} className="shrink-0 mt-0.5" />
     </div>
    ))}
   </div>

   {ttEnabled && (
    <div className="space-y-1">
     <div className="flex items-center gap-2 mb-3">
      <Clock className="h-3.5 w-3.5 text-primary" />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Time Tracking</p>
     </div>
     {([
      { key: 'ttStarted', label: 'Tracking started', desc: 'When time tracking begins for an engagement' },
      { key: 'ttStopped', label: 'Tracking stopped', desc: 'When time tracking is paused or stopped' },
      { key: 'ttDailySummary', label: 'Daily time summary', desc: 'End-of-day summary of all tracked time' },
      { key: 'ttAutoLog', label: 'Auto-log reminder', desc: 'Before accumulated time is logged at 11:59 PM' },
      { key: 'ttIdleAlert', label: 'Idle time alert', desc: 'When your session transitions from active to idle' },
     ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(item => (
      <div key={item.key} className="flex items-start justify-between gap-4 py-3 border-b border-border/50">
       <div>
        <p className="text-sm font-medium">{item.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
       </div>
       <Switch checked={notifs[item.key]} onCheckedChange={() => toggle(item.key)} className="shrink-0 mt-0.5" />
      </div>
     ))}
    </div>
   )}
  </div>
 );
}

function UserAccessContent() {
 const [ttEnabled, setTtEnabled] = useState(() => getEnabled());
 useEffect(() => subscribeEnabled(setTtEnabled), []);

 type UAView = 'list' | 'permissions' | 'engagement-access';
 type Perms = {
  addTeam: boolean; modifyTeam: boolean; deleteTeam: boolean;
  addClient: boolean; viewClients: boolean; modifyClients: boolean; deleteClient: boolean;
  viewEngagements: boolean; createEngagement: boolean; modifyEngagement: boolean;
  deleteEngagement: boolean; archiveEngagement: boolean; reopenEngagement: boolean;
  editTimeSummary: boolean; exportTimeSummary: boolean; toggleTracking: boolean;
 };
 type Member = { id: string; title: string; name: string; email: string; accessType: string; lastLoggedIn: string; };

 const MEMBERS: Member[] = [
  { id: '1', title: 'Partner',        name: 'Michael Thornton',  email: 'm.thornton@harrisoncpa.com',   accessType: 'Admin',   lastLoggedIn: 'Jul 28, 2026' },
  { id: '2', title: 'Senior Manager', name: 'Priya Patel',       email: 'p.patel@harrisoncpa.com',      accessType: 'Admin',   lastLoggedIn: 'Aug 01, 2026' },
  { id: '3', title: 'Manager',        name: 'James Kowalski',    email: 'j.kowalski@harrisoncpa.com',   accessType: 'General', lastLoggedIn: 'Aug 03, 2026' },
  { id: '4', title: 'Manager',        name: 'Sarah Lindqvist',   email: 's.lindqvist@harrisoncpa.com',  accessType: 'General', lastLoggedIn: 'Jul 30, 2026' },
  { id: '5', title: 'Senior',         name: 'David Okonkwo',     email: 'd.okonkwo@harrisoncpa.com',    accessType: 'General', lastLoggedIn: 'Aug 02, 2026' },
  { id: '6', title: 'Senior',         name: 'Emily Marchetti',   email: 'e.marchetti@harrisoncpa.com',  accessType: 'General', lastLoggedIn: 'Aug 01, 2026' },
  { id: '7', title: 'Staff',          name: 'Ryan Beaumont',     email: 'r.beaumont@harrisoncpa.com',   accessType: 'General', lastLoggedIn: 'Jul 29, 2026' },
  { id: '8', title: 'Staff',          name: 'Anika Sharma',      email: 'a.sharma@harrisoncpa.com',     accessType: 'General', lastLoggedIn: 'Aug 04, 2026' },
 ];

 const ENGAGEMENTS = [
  { id: 'NTR-NEW-Sep302020',   client: 'Penguin Inc',  yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-NEW-Dec312019',   client: 'Penguin Inc',  yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-NEW-Sep302020-B', client: 'Penguin Inc',  yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-PEO-Aug172020',   client: 'Penguin Inc',  yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-NEW-Sep302020-C', client: 'ABC LTD.',     yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-NEW-Dec312019-C', client: 'ABC LTD.',     yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-NEW-Sep302020-D', client: 'ABC LTD.',     yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-PEO-Aug172020-D', client: 'ABC LTD.',     yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-NEW-Sep302020-E', client: 'Udemy group',  yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-NEW-Dec312019-E', client: 'Udemy group',  yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-NEW-Sep302020-F', client: 'Udemy group',  yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
  { id: 'NTR-PEO-Aug172020-F', client: 'Udemy group',  yearEnd: 'Dec 31, 2022', dateCreated: 'Jan 28, 2021' },
 ];

 const DEFAULT_PERMS: Perms = {
  addTeam: false, modifyTeam: false, deleteTeam: false,
  addClient: false, viewClients: true, modifyClients: true, deleteClient: false,
  viewEngagements: true, createEngagement: false, modifyEngagement: true,
  deleteEngagement: false, archiveEngagement: false, reopenEngagement: false,
  editTimeSummary: false, exportTimeSummary: false, toggleTracking: true,
 };

 const [view, setView] = useState<UAView>('list');
 const [selected, setSelected] = useState<Member | null>(null);
 const [allPerms, setAllPerms] = useState<Record<string, Perms>>({});
 const [engAccess, setEngAccess] = useState<Record<string, { access: boolean; tt: boolean }>>(
  Object.fromEntries(ENGAGEMENTS.map((e, i) => [e.id, { access: [0, 2, 4, 5, 8].includes(i), tt: false }]))
 );

 const getPerms = (id: string): Perms => allPerms[id] ?? DEFAULT_PERMS;
 const togglePerm = (id: string, key: keyof Perms) =>
  setAllPerms(prev => ({ ...prev, [id]: { ...getPerms(id), [key]: !getPerms(id)[key] } }));

 const SectionHeader = ({ title, icon }: { title: string; icon?: ReactNode }) => (
  <div className="px-4 py-2 bg-muted/40 flex items-center justify-between">
   <div className="flex items-center gap-1.5">{icon}<span className="text-sm font-semibold">{title}</span></div>
   <span className="text-primary font-bold text-base leading-none select-none">−</span>
  </div>
 );

 const PRow = ({ id, k, label, disabled = false, extra }: { id: string; k: keyof Perms; label: string; disabled?: boolean; extra?: ReactNode }) => {
  const p = getPerms(id);
  return (
   <div className={cn("flex items-center justify-between px-4 py-2.5 border-b border-border/40 last:border-b-0", disabled && "opacity-40")}>
    <div className="flex items-center gap-2 flex-1 min-w-0">
     <span className="text-sm">{label}</span>
     {extra}
    </div>
    <input
     type="checkbox"
     checked={p[k]}
     disabled={disabled}
     onChange={() => !disabled && togglePerm(id, k)}
     className="h-4 w-4 accent-primary cursor-pointer disabled:cursor-not-allowed shrink-0 ml-3"
    />
   </div>
  );
 };

 // ── Modify Engagement Access view ─────────────────────────────────────────
 if (view === 'engagement-access') {
  return (
   <div className="space-y-4">
    <button onClick={() => setView('permissions')} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
     <ArrowLeft className="h-4 w-4" />
     Modify Engagement Access
    </button>
    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
     Once engagement access is provided, time tracking can be enabled for that engagement.
     {ttEnabled && ' When the TIME TRACKING column is active, only engagements where Access is checked can have time tracking turned on.'}
    </div>
    <div className="border border-border rounded-xl overflow-x-auto">
     <table className="w-full text-xs">
      <thead className="bg-muted/30">
       <tr>
        <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Engagement ID</th>
        <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide">Client Name</th>
        <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Period / Year End</th>
        <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Date Created</th>
        <th className="px-3 py-2.5 text-center">
         <div className="flex flex-col items-center gap-0.5">
          <input type="checkbox" className="h-3.5 w-3.5 accent-primary cursor-pointer" onChange={e => {
           const checked = e.target.checked;
           setEngAccess(prev => Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, access: checked, tt: checked ? v.tt : false }])));
          }} />
          <span className="font-semibold text-muted-foreground uppercase tracking-wide">Access</span>
         </div>
        </th>
        {ttEnabled && (
         <th className="px-3 py-2.5 text-center">
          <div className="flex flex-col items-center gap-0.5">
           <input type="checkbox" className="h-3.5 w-3.5 accent-primary opacity-30 cursor-not-allowed" disabled />
           <span className="font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Time Tracking</span>
          </div>
         </th>
        )}
       </tr>
      </thead>
      <tbody>
       {ENGAGEMENTS.map(eng => {
        const ea = engAccess[eng.id] ?? { access: false, tt: false };
        return (
         <tr key={eng.id} className="border-t border-border hover:bg-muted/10 transition-colors">
          <td className="px-3 py-2.5 font-mono text-[11px]">{eng.id}</td>
          <td className="px-3 py-2.5">{eng.client}</td>
          <td className="px-3 py-2.5 whitespace-nowrap">{eng.yearEnd}</td>
          <td className="px-3 py-2.5 whitespace-nowrap">{eng.dateCreated}</td>
          <td className="px-3 py-2.5 text-center">
           <input
            type="checkbox"
            checked={ea.access}
            onChange={() => setEngAccess(prev => ({ ...prev, [eng.id]: { access: !ea.access, tt: ea.access ? false : ea.tt } }))}
            className="h-3.5 w-3.5 accent-primary cursor-pointer"
           />
          </td>
          {ttEnabled && (
           <td className="px-3 py-2.5 text-center">
            <input
             type="checkbox"
             checked={ea.tt}
             disabled={!ea.access}
             onChange={() => setEngAccess(prev => ({ ...prev, [eng.id]: { ...ea, tt: !ea.tt } }))}
             className="h-3.5 w-3.5 accent-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            />
           </td>
          )}
         </tr>
        );
       })}
      </tbody>
     </table>
    </div>
   </div>
  );
 }

 // ── User permissions view ─────────────────────────────────────────────────
 if (view === 'permissions' && selected) {
  const p = getPerms(selected.id);
  const initials = selected.name.split(' ').map((n: string) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  return (
   <div className="space-y-4">
    <button onClick={() => setView('list')} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
     <ArrowLeft className="h-4 w-4" />
     Back to Users
    </button>
    <div className="flex items-center gap-3 pb-3 border-b border-border">
     <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{initials}</div>
     <div>
      <p className="font-semibold text-sm">{selected.name}</p>
      <p className="text-xs text-muted-foreground">{selected.email} · {selected.accessType}</p>
     </div>
    </div>
    <div className="border border-border rounded-xl overflow-hidden">
     <SectionHeader title="Team Members" />
     <PRow id={selected.id} k="addTeam"    label="Add Team member" />
     <PRow id={selected.id} k="modifyTeam" label="Modify other team members" />
     <PRow id={selected.id} k="deleteTeam" label="Delete Team member" />

     <SectionHeader title="Clients" />
     <PRow id={selected.id} k="addClient"    label="Add Client" />
     <PRow id={selected.id} k="viewClients"  label="View Clients" extra={p.viewClients ? (
      <button className="text-xs text-primary hover:underline ml-1 shrink-0">Modify Client Access</button>
     ) : undefined} />
     <PRow id={selected.id} k="modifyClients" label="Modify Clients"  disabled={!p.viewClients} />
     <PRow id={selected.id} k="deleteClient"  label="Delete Client"   disabled={!p.viewClients} />

     <SectionHeader title="Engagements" />
     <PRow id={selected.id} k="viewEngagements"   label="View engagements" extra={p.viewEngagements ? (
      <button className="text-xs text-primary hover:underline ml-1 shrink-0" onClick={() => setView('engagement-access')}>
       Modify Engagement Access
      </button>
     ) : undefined} />
     <PRow id={selected.id} k="createEngagement"  label="Create engagement"  disabled={!p.viewEngagements} />
     <PRow id={selected.id} k="modifyEngagement"  label="Modify engagement"  disabled={!p.viewEngagements} />
     <PRow id={selected.id} k="deleteEngagement"  label="Delete engagement"  disabled={!p.viewEngagements} />
     <PRow id={selected.id} k="archiveEngagement" label="Archive engagement" disabled={!p.viewEngagements} />
     <PRow id={selected.id} k="reopenEngagement"  label="Reopen engagement"  disabled={!p.viewEngagements} />

     {ttEnabled && (
      <>
       <SectionHeader title="Time Tracking" icon={<Clock className="h-3.5 w-3.5 text-primary" />} />
       <PRow id={selected.id} k="editTimeSummary"   label="Edit time summary for assigned engagements" />
       <PRow id={selected.id} k="exportTimeSummary" label="Export time summary for assigned engagements" />
       <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 last:border-b-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
         <span className="text-sm">Can turn time-tracking on/off for future engagements</span>
         <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
         <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-700 shrink-0">
          Manager+
         </span>
        </div>
        <input
         type="checkbox"
         checked={p.toggleTracking}
         onChange={() => togglePerm(selected.id, 'toggleTracking')}
         className="h-4 w-4 accent-primary cursor-pointer shrink-0 ml-3"
        />
       </div>
      </>
     )}
    </div>
   </div>
  );
 }

 // ── Main member list ───────────────────────────────────────────────────────
 return (
  <div className="space-y-4">
   <div className="flex items-start justify-between gap-3">
    <div className="flex items-start gap-3">
     <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Users className="h-5 w-5 text-primary" />
     </div>
     <div>
      <h3 className="font-semibold text-lg">User & Access</h3>
      <p className="text-sm text-muted-foreground">Manage team member access and permissions.</p>
     </div>
    </div>
    <Button size="sm" className="shrink-0 flex items-center gap-1">
     Add User <ChevronDown className="h-3.5 w-3.5" />
    </Button>
   </div>

   <div className="grid grid-cols-4 gap-3">
    {[{ v: 16, l: 'Active Firm Member(s)' }, { v: 31, l: 'Client(s)' }, { v: 31, l: 'Client(s)' }, { v: 47, l: 'Total' }].map((s, i) => (
     <div key={i} className="border border-border rounded-xl p-3 flex items-center gap-2.5">
      <Database className="h-4 w-4 text-muted-foreground shrink-0" />
      <div>
       <p className="text-base font-bold leading-tight">{s.v}</p>
       <p className="text-[11px] text-muted-foreground leading-tight">{s.l}</p>
      </div>
     </div>
    ))}
   </div>

   <div className="flex gap-2">
    <Button variant="default" size="sm" className="rounded-full px-5">Firm</Button>
    <Button variant="outline" size="sm" className="rounded-full px-5">Client</Button>
   </div>

   <div className="border border-border rounded-xl overflow-hidden">
    <table className="w-full text-sm">
     <thead className="bg-muted/30">
      <tr>
       {['Title', 'Name', 'Email', 'Access Type', 'Last Logged In', 'Status', 'Actions'].map(h => (
        <th key={h} className="text-left px-3 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
       ))}
      </tr>
     </thead>
     <tbody>
      {MEMBERS.map(m => (
       <tr key={m.id} className="border-t border-border hover:bg-muted/10 transition-colors">
        <td className="px-3 py-2.5 text-xs text-muted-foreground">{m.title}</td>
        <td className="px-3 py-2.5 font-medium">{m.name}</td>
        <td className="px-3 py-2.5 text-xs text-primary">{m.email}</td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground">{m.accessType}</td>
        <td className="px-3 py-2.5 text-xs text-muted-foreground">{m.lastLoggedIn}</td>
        <td className="px-3 py-2.5">
         <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
          Active
         </span>
        </td>
        <td className="px-3 py-2.5">
         <div className="flex items-center gap-2.5">
          <button className="text-muted-foreground hover:text-foreground transition-colors" title="Invite user"><User className="h-3.5 w-3.5" /></button>
          <button
           onClick={() => { setSelected(m); setView('permissions'); }}
           className="text-muted-foreground hover:text-foreground transition-colors"
           title="Edit permissions"
          ><Pencil className="h-3.5 w-3.5" /></button>
          <button className="text-destructive/60 hover:text-destructive transition-colors" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
         </div>
        </td>
       </tr>
      ))}
     </tbody>
    </table>
   </div>
  </div>
 );
}

function PlaceholderContent({ title }: { title: string }) {
 return (
 <div className="flex items-center justify-center h-64 text-muted-foreground">
 <p>{title} content coming soon...</p>
 </div>
 );
}

function TimeTrackingContent() {
 const [enabled, setEnabledState] = useState(() => getEnabled());

 useEffect(() => subscribeEnabled(setEnabledState), []);

 const handleToggle = (val: boolean) => {
 setEnabled(val);
 toast.success(val ? 'Time tracking is now ON' : 'Time tracking is now OFF');
 };

 return (
 <div className="space-y-6">
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
 <Clock className="h-5 w-5 text-primary" />
 </div>
 <div>
 <h3 className="font-semibold text-lg">Time Tracking</h3>
 <p className="text-sm text-muted-foreground">Manage automatic time tracking for engagements.</p>
 </div>
 </div>

 <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
 <div className="flex-1">
 <p className="text-sm font-medium text-foreground">Enable Auto Time Tracker</p>
 <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
 The automatic time tracker records and reports the time you spend working on engagements,
 by tracking individual active time and idle time. Active time is when you are actively working
 and idle time is when you are away from the engagement for longer than 15 minutes.
 </p>
 </div>
 <Switch
 checked={enabled}
 onCheckedChange={handleToggle}
 className="mt-0.5 shrink-0"
 />
 </div>

 {enabled && (
 <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
 <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
 <p className="text-sm text-emerald-700 dark:text-emerald-300">
 Time tracking is active. A timer icon will appear in the top navigation bar.
 </p>
 </div>
 )}

 <div className="space-y-3">
 <p className="text-sm font-medium text-foreground">How it works</p>
 {[
 'Timer starts automatically when you open an engagement',
 'After 15 minutes of inactivity, time moves from Active to Idle',
 'Click the timer icon in the top bar to view all tracked time',
 'Log your time directly from the header panel',
 'All outstanding time is automatically logged at 11:59 PM',
 ].map((item, i) => (
 <div key={i} className="flex items-start gap-2.5">
 <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
 <span className="text-[10px] font-bold text-primary">{i + 1}</span>
 </div>
 <p className="text-sm text-muted-foreground">{item}</p>
 </div>
 ))}
 </div>
 </div>
 );
}
