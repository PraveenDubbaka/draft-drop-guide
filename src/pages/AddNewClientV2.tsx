import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, User, FileText, ChevronLeft, CalendarDays, UserPlus, RefreshCw, CheckCircle2, X } from "lucide-react";
import intuitQuickbooksLogo from "@/assets/intuit-quickbooks-logo.svg";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StyledCard } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

// Shared primitives mirrored from AddNewClient.tsx — keep in sync

const InlineField = ({
  label, required, hint, children, className,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode; className?: string;
}) => (
  <div className={`flex items-start gap-4 ${className ?? ""}`}>
    <span className="text-sm font-medium text-foreground shrink-0 w-52 pt-2 leading-snug">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </span>
    <div className="flex-1">
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  </div>
);

const PhoneInput = ({ placeholder = "(555) 000-0000" }: { placeholder?: string }) => {
  const [dialCode, setDialCode] = React.useState("ca");
  const sel = DIAL_CODES.find(d => d.value === dialCode) ?? DIAL_CODES[31];
  return (
    <div className="flex gap-2">
      <Select value={dialCode} onValueChange={setDialCode}>
        <SelectTrigger className="w-24 shrink-0 [&>span]:shrink-0">
          <span className="flex items-center gap-1 text-sm">{sel.flag} {sel.code}</span>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {DIAL_CODES.map(d => (
            <SelectItem key={d.value} value={d.value}>
              {d.flag} {d.code} · {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input className="flex-1" placeholder={placeholder} />
    </div>
  );
};

const SectionCard = ({
  icon: Icon, title, subtitle, children, className,
}: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) => (
  <StyledCard className={`p-6 ${className ?? ""}`}>
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    {children}
  </StyledCard>
);

// ── Entity type config ───────────────────────────────────────────────────────

type EntityConfig = {
  hasIncorporation: boolean;
  hasYearEnd: boolean;
  hasCorporateTax: boolean;
  hasPayroll: boolean;
  hasTaxId: boolean;
  dbaLabel: string;
  dbaHint: string;
};

const ENTITY_CONFIG: Record<string, EntityConfig> = {
  corporation: {
    hasIncorporation: true, hasYearEnd: true, hasCorporateTax: true, hasPayroll: true, hasTaxId: true,
    dbaLabel: "Operating Name / DBA",
    dbaHint: "The branded name used in public-facing materials, if different from the registered legal name.",
  },
  partnership: {
    hasIncorporation: true, hasYearEnd: true, hasCorporateTax: false, hasPayroll: false, hasTaxId: true,
    dbaLabel: "Partnership Trading Name",
    dbaHint: "The name the partnership uses commercially, if distinct from the partners' combined legal names.",
  },
  "sole-proprietor": {
    hasIncorporation: false, hasYearEnd: true, hasCorporateTax: false, hasPayroll: false, hasTaxId: true,
    dbaLabel: "Business / Trading Name",
    dbaHint: "The name under which the proprietor conducts business.",
  },
  trust: {
    hasIncorporation: true, hasYearEnd: true, hasCorporateTax: false, hasPayroll: false, hasTaxId: false,
    dbaLabel: "Trust Operating Name",
    dbaHint: "An informal or shortened name used to refer to this trust, if applicable.",
  },
};

// ── Country-specific tax & field config ─────────────────────────────────────

type CountryTaxConfig = {
  businessNumberLabel: string;
  businessNumberHint: string;
  businessNumberPlaceholder: string;
  corporateTaxLabel: string;
  corporateTaxPlaceholder: string;
  payrollLabel: string;
  payrollPlaceholder: string;
  taxIdLabel: string;
  taxIdPlaceholder: string;
  taxIdSoleProprietorLabel: string;
  taxIdSoleProprietorPlaceholder: string;
  salesTaxLabel: string;
  salesTaxNumberLabel: string;
  salesTaxNumberPlaceholder: string;
  regionLabel: string;
  postalLabel: string;
  postalPlaceholder: string;
};

const COUNTRY_TAX_CONFIG: Record<string, CountryTaxConfig> = {
  ca: {
    businessNumberLabel: "Business Number (BN)",
    businessNumberHint: "CRA-issued 9-digit Business Number.",
    businessNumberPlaceholder: "e.g., 123456789",
    corporateTaxLabel: "Corporate Tax Account",
    corporateTaxPlaceholder: "e.g., 123456789 T0001",
    payrollLabel: "Payroll Account (RP)",
    payrollPlaceholder: "e.g., 123456789 RP0001",
    taxIdLabel: "Tax ID",
    taxIdPlaceholder: "Tax ID",
    taxIdSoleProprietorLabel: "SIN",
    taxIdSoleProprietorPlaceholder: "Social Insurance Number",
    salesTaxLabel: "GST / HST Registered",
    salesTaxNumberLabel: "GST / HST Number",
    salesTaxNumberPlaceholder: "e.g., 123456789 RT0001",
    regionLabel: "Province",
    postalLabel: "Postal Code",
    postalPlaceholder: "e.g., M5V 3A8",
  },
  us: {
    businessNumberLabel: "EIN",
    businessNumberHint: "Employer Identification Number (format XX-XXXXXXX).",
    businessNumberPlaceholder: "e.g., 12-3456789",
    corporateTaxLabel: "State Tax ID",
    corporateTaxPlaceholder: "State Tax ID",
    payrollLabel: "FEIN / Payroll Reference",
    payrollPlaceholder: "e.g., 12-3456789",
    taxIdLabel: "Tax ID",
    taxIdPlaceholder: "Tax ID",
    taxIdSoleProprietorLabel: "SSN / ITIN",
    taxIdSoleProprietorPlaceholder: "e.g., XXX-XX-XXXX",
    salesTaxLabel: "Sales Tax Registered",
    salesTaxNumberLabel: "Sales Tax Registration No.",
    salesTaxNumberPlaceholder: "State Sales Tax Number",
    regionLabel: "State",
    postalLabel: "ZIP Code",
    postalPlaceholder: "e.g., 10001",
  },
};

// ── Region options per country ───────────────────────────────────────────────

const REGION_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  ca: [
    { value: "on", label: "Ontario" }, { value: "qc", label: "Quebec" },
    { value: "bc", label: "British Columbia" }, { value: "ab", label: "Alberta" },
    { value: "mb", label: "Manitoba" }, { value: "sk", label: "Saskatchewan" },
    { value: "ns", label: "Nova Scotia" }, { value: "nb", label: "New Brunswick" },
    { value: "pe", label: "Prince Edward Island" }, { value: "nl", label: "Newfoundland" },
    { value: "nt", label: "Northwest Territories" }, { value: "nu", label: "Nunavut" },
    { value: "yt", label: "Yukon" },
  ],
  us: [
    { value: "al", label: "Alabama" }, { value: "ak", label: "Alaska" },
    { value: "az", label: "Arizona" }, { value: "ar", label: "Arkansas" },
    { value: "ca", label: "California" }, { value: "co", label: "Colorado" },
    { value: "ct", label: "Connecticut" }, { value: "de", label: "Delaware" },
    { value: "fl", label: "Florida" }, { value: "ga", label: "Georgia" },
    { value: "hi", label: "Hawaii" }, { value: "id", label: "Idaho" },
    { value: "il", label: "Illinois" }, { value: "in", label: "Indiana" },
    { value: "ia", label: "Iowa" }, { value: "ks", label: "Kansas" },
    { value: "ky", label: "Kentucky" }, { value: "la", label: "Louisiana" },
    { value: "me", label: "Maine" }, { value: "md", label: "Maryland" },
    { value: "ma", label: "Massachusetts" }, { value: "mi", label: "Michigan" },
    { value: "mn", label: "Minnesota" }, { value: "ms", label: "Mississippi" },
    { value: "mo", label: "Missouri" }, { value: "mt", label: "Montana" },
    { value: "ne", label: "Nebraska" }, { value: "nv", label: "Nevada" },
    { value: "nh", label: "New Hampshire" }, { value: "nj", label: "New Jersey" },
    { value: "nm", label: "New Mexico" }, { value: "ny", label: "New York" },
    { value: "nc", label: "North Carolina" }, { value: "nd", label: "North Dakota" },
    { value: "oh", label: "Ohio" }, { value: "ok", label: "Oklahoma" },
    { value: "or", label: "Oregon" }, { value: "pa", label: "Pennsylvania" },
    { value: "ri", label: "Rhode Island" }, { value: "sc", label: "South Carolina" },
    { value: "sd", label: "South Dakota" }, { value: "tn", label: "Tennessee" },
    { value: "tx", label: "Texas" }, { value: "ut", label: "Utah" },
    { value: "vt", label: "Vermont" }, { value: "va", label: "Virginia" },
    { value: "wa", label: "Washington" }, { value: "wv", label: "West Virginia" },
    { value: "wi", label: "Wisconsin" }, { value: "wy", label: "Wyoming" },
  ],
};

// ── Phone dial codes (all countries) ────────────────────────────────────────

const DIAL_CODES = [
  { value: "af", flag: "🇦🇫", label: "Afghanistan", code: "+93" },
  { value: "al", flag: "🇦🇱", label: "Albania", code: "+355" },
  { value: "dz", flag: "🇩🇿", label: "Algeria", code: "+213" },
  { value: "ad", flag: "🇦🇩", label: "Andorra", code: "+376" },
  { value: "ao", flag: "🇦🇴", label: "Angola", code: "+244" },
  { value: "ag", flag: "🇦🇬", label: "Antigua & Barbuda", code: "+1-268" },
  { value: "ar", flag: "🇦🇷", label: "Argentina", code: "+54" },
  { value: "am", flag: "🇦🇲", label: "Armenia", code: "+374" },
  { value: "au", flag: "🇦🇺", label: "Australia", code: "+61" },
  { value: "at", flag: "🇦🇹", label: "Austria", code: "+43" },
  { value: "az", flag: "🇦🇿", label: "Azerbaijan", code: "+994" },
  { value: "bs", flag: "🇧🇸", label: "Bahamas", code: "+1-242" },
  { value: "bh", flag: "🇧🇭", label: "Bahrain", code: "+973" },
  { value: "bd", flag: "🇧🇩", label: "Bangladesh", code: "+880" },
  { value: "bb", flag: "🇧🇧", label: "Barbados", code: "+1-246" },
  { value: "by", flag: "🇧🇾", label: "Belarus", code: "+375" },
  { value: "be", flag: "🇧🇪", label: "Belgium", code: "+32" },
  { value: "bz", flag: "🇧🇿", label: "Belize", code: "+501" },
  { value: "bj", flag: "🇧🇯", label: "Benin", code: "+229" },
  { value: "bt", flag: "🇧🇹", label: "Bhutan", code: "+975" },
  { value: "bo", flag: "🇧🇴", label: "Bolivia", code: "+591" },
  { value: "ba", flag: "🇧🇦", label: "Bosnia & Herzegovina", code: "+387" },
  { value: "bw", flag: "🇧🇼", label: "Botswana", code: "+267" },
  { value: "br", flag: "🇧🇷", label: "Brazil", code: "+55" },
  { value: "bn", flag: "🇧🇳", label: "Brunei", code: "+673" },
  { value: "bg", flag: "🇧🇬", label: "Bulgaria", code: "+359" },
  { value: "bf", flag: "🇧🇫", label: "Burkina Faso", code: "+226" },
  { value: "bi", flag: "🇧🇮", label: "Burundi", code: "+257" },
  { value: "kh", flag: "🇰🇭", label: "Cambodia", code: "+855" },
  { value: "cm", flag: "🇨🇲", label: "Cameroon", code: "+237" },
  { value: "ca", flag: "🇨🇦", label: "Canada", code: "+1" },
  { value: "cv", flag: "🇨🇻", label: "Cape Verde", code: "+238" },
  { value: "cf", flag: "🇨🇫", label: "Central African Rep.", code: "+236" },
  { value: "td", flag: "🇹🇩", label: "Chad", code: "+235" },
  { value: "cl", flag: "🇨🇱", label: "Chile", code: "+56" },
  { value: "cn", flag: "🇨🇳", label: "China", code: "+86" },
  { value: "co", flag: "🇨🇴", label: "Colombia", code: "+57" },
  { value: "km", flag: "🇰🇲", label: "Comoros", code: "+269" },
  { value: "cg", flag: "🇨🇬", label: "Congo", code: "+242" },
  { value: "cr", flag: "🇨🇷", label: "Costa Rica", code: "+506" },
  { value: "hr", flag: "🇭🇷", label: "Croatia", code: "+385" },
  { value: "cu", flag: "🇨🇺", label: "Cuba", code: "+53" },
  { value: "cy", flag: "🇨🇾", label: "Cyprus", code: "+357" },
  { value: "cz", flag: "🇨🇿", label: "Czech Republic", code: "+420" },
  { value: "dk", flag: "🇩🇰", label: "Denmark", code: "+45" },
  { value: "dj", flag: "🇩🇯", label: "Djibouti", code: "+253" },
  { value: "dm", flag: "🇩🇲", label: "Dominica", code: "+1-767" },
  { value: "do", flag: "🇩🇴", label: "Dominican Republic", code: "+1-809" },
  { value: "ec", flag: "🇪🇨", label: "Ecuador", code: "+593" },
  { value: "eg", flag: "🇪🇬", label: "Egypt", code: "+20" },
  { value: "sv", flag: "🇸🇻", label: "El Salvador", code: "+503" },
  { value: "gq", flag: "🇬🇶", label: "Equatorial Guinea", code: "+240" },
  { value: "er", flag: "🇪🇷", label: "Eritrea", code: "+291" },
  { value: "ee", flag: "🇪🇪", label: "Estonia", code: "+372" },
  { value: "sz", flag: "🇸🇿", label: "Eswatini", code: "+268" },
  { value: "et", flag: "🇪🇹", label: "Ethiopia", code: "+251" },
  { value: "fj", flag: "🇫🇯", label: "Fiji", code: "+679" },
  { value: "fi", flag: "🇫🇮", label: "Finland", code: "+358" },
  { value: "fr", flag: "🇫🇷", label: "France", code: "+33" },
  { value: "ga", flag: "🇬🇦", label: "Gabon", code: "+241" },
  { value: "gm", flag: "🇬🇲", label: "Gambia", code: "+220" },
  { value: "ge", flag: "🇬🇪", label: "Georgia", code: "+995" },
  { value: "de", flag: "🇩🇪", label: "Germany", code: "+49" },
  { value: "gh", flag: "🇬🇭", label: "Ghana", code: "+233" },
  { value: "gr", flag: "🇬🇷", label: "Greece", code: "+30" },
  { value: "gd", flag: "🇬🇩", label: "Grenada", code: "+1-473" },
  { value: "gt", flag: "🇬🇹", label: "Guatemala", code: "+502" },
  { value: "gn", flag: "🇬🇳", label: "Guinea", code: "+224" },
  { value: "gw", flag: "🇬🇼", label: "Guinea-Bissau", code: "+245" },
  { value: "gy", flag: "🇬🇾", label: "Guyana", code: "+592" },
  { value: "ht", flag: "🇭🇹", label: "Haiti", code: "+509" },
  { value: "hn", flag: "🇭🇳", label: "Honduras", code: "+504" },
  { value: "hu", flag: "🇭🇺", label: "Hungary", code: "+36" },
  { value: "is", flag: "🇮🇸", label: "Iceland", code: "+354" },
  { value: "in", flag: "🇮🇳", label: "India", code: "+91" },
  { value: "id", flag: "🇮🇩", label: "Indonesia", code: "+62" },
  { value: "ir", flag: "🇮🇷", label: "Iran", code: "+98" },
  { value: "iq", flag: "🇮🇶", label: "Iraq", code: "+964" },
  { value: "ie", flag: "🇮🇪", label: "Ireland", code: "+353" },
  { value: "il", flag: "🇮🇱", label: "Israel", code: "+972" },
  { value: "it", flag: "🇮🇹", label: "Italy", code: "+39" },
  { value: "jm", flag: "🇯🇲", label: "Jamaica", code: "+1-876" },
  { value: "jp", flag: "🇯🇵", label: "Japan", code: "+81" },
  { value: "jo", flag: "🇯🇴", label: "Jordan", code: "+962" },
  { value: "kz", flag: "🇰🇿", label: "Kazakhstan", code: "+7" },
  { value: "ke", flag: "🇰🇪", label: "Kenya", code: "+254" },
  { value: "ki", flag: "🇰🇮", label: "Kiribati", code: "+686" },
  { value: "kw", flag: "🇰🇼", label: "Kuwait", code: "+965" },
  { value: "kg", flag: "🇰🇬", label: "Kyrgyzstan", code: "+996" },
  { value: "la", flag: "🇱🇦", label: "Laos", code: "+856" },
  { value: "lv", flag: "🇱🇻", label: "Latvia", code: "+371" },
  { value: "lb", flag: "🇱🇧", label: "Lebanon", code: "+961" },
  { value: "ls", flag: "🇱🇸", label: "Lesotho", code: "+266" },
  { value: "lr", flag: "🇱🇷", label: "Liberia", code: "+231" },
  { value: "ly", flag: "🇱🇾", label: "Libya", code: "+218" },
  { value: "li", flag: "🇱🇮", label: "Liechtenstein", code: "+423" },
  { value: "lt", flag: "🇱🇹", label: "Lithuania", code: "+370" },
  { value: "lu", flag: "🇱🇺", label: "Luxembourg", code: "+352" },
  { value: "mg", flag: "🇲🇬", label: "Madagascar", code: "+261" },
  { value: "mw", flag: "🇲🇼", label: "Malawi", code: "+265" },
  { value: "my", flag: "🇲🇾", label: "Malaysia", code: "+60" },
  { value: "mv", flag: "🇲🇻", label: "Maldives", code: "+960" },
  { value: "ml", flag: "🇲🇱", label: "Mali", code: "+223" },
  { value: "mt", flag: "🇲🇹", label: "Malta", code: "+356" },
  { value: "mh", flag: "🇲🇭", label: "Marshall Islands", code: "+692" },
  { value: "mr", flag: "🇲🇷", label: "Mauritania", code: "+222" },
  { value: "mu", flag: "🇲🇺", label: "Mauritius", code: "+230" },
  { value: "mx", flag: "🇲🇽", label: "Mexico", code: "+52" },
  { value: "fm", flag: "🇫🇲", label: "Micronesia", code: "+691" },
  { value: "md", flag: "🇲🇩", label: "Moldova", code: "+373" },
  { value: "mc", flag: "🇲🇨", label: "Monaco", code: "+377" },
  { value: "mn", flag: "🇲🇳", label: "Mongolia", code: "+976" },
  { value: "me", flag: "🇲🇪", label: "Montenegro", code: "+382" },
  { value: "ma", flag: "🇲🇦", label: "Morocco", code: "+212" },
  { value: "mz", flag: "🇲🇿", label: "Mozambique", code: "+258" },
  { value: "mm", flag: "🇲🇲", label: "Myanmar", code: "+95" },
  { value: "na", flag: "🇳🇦", label: "Namibia", code: "+264" },
  { value: "nr", flag: "🇳🇷", label: "Nauru", code: "+674" },
  { value: "np", flag: "🇳🇵", label: "Nepal", code: "+977" },
  { value: "nl", flag: "🇳🇱", label: "Netherlands", code: "+31" },
  { value: "nz", flag: "🇳🇿", label: "New Zealand", code: "+64" },
  { value: "ni", flag: "🇳🇮", label: "Nicaragua", code: "+505" },
  { value: "ne", flag: "🇳🇪", label: "Niger", code: "+227" },
  { value: "ng", flag: "🇳🇬", label: "Nigeria", code: "+234" },
  { value: "mk", flag: "🇲🇰", label: "North Macedonia", code: "+389" },
  { value: "no", flag: "🇳🇴", label: "Norway", code: "+47" },
  { value: "om", flag: "🇴🇲", label: "Oman", code: "+968" },
  { value: "pk", flag: "🇵🇰", label: "Pakistan", code: "+92" },
  { value: "pw", flag: "🇵🇼", label: "Palau", code: "+680" },
  { value: "pa", flag: "🇵🇦", label: "Panama", code: "+507" },
  { value: "pg", flag: "🇵🇬", label: "Papua New Guinea", code: "+675" },
  { value: "py", flag: "🇵🇾", label: "Paraguay", code: "+595" },
  { value: "pe", flag: "🇵🇪", label: "Peru", code: "+51" },
  { value: "ph", flag: "🇵🇭", label: "Philippines", code: "+63" },
  { value: "pl", flag: "🇵🇱", label: "Poland", code: "+48" },
  { value: "pt", flag: "🇵🇹", label: "Portugal", code: "+351" },
  { value: "qa", flag: "🇶🇦", label: "Qatar", code: "+974" },
  { value: "ro", flag: "🇷🇴", label: "Romania", code: "+40" },
  { value: "ru", flag: "🇷🇺", label: "Russia", code: "+7" },
  { value: "rw", flag: "🇷🇼", label: "Rwanda", code: "+250" },
  { value: "kn", flag: "🇰🇳", label: "Saint Kitts & Nevis", code: "+1-869" },
  { value: "lc", flag: "🇱🇨", label: "Saint Lucia", code: "+1-758" },
  { value: "vc", flag: "🇻🇨", label: "Saint Vincent", code: "+1-784" },
  { value: "ws", flag: "🇼🇸", label: "Samoa", code: "+685" },
  { value: "sm", flag: "🇸🇲", label: "San Marino", code: "+378" },
  { value: "st", flag: "🇸🇹", label: "São Tomé & Príncipe", code: "+239" },
  { value: "sa", flag: "🇸🇦", label: "Saudi Arabia", code: "+966" },
  { value: "sn", flag: "🇸🇳", label: "Senegal", code: "+221" },
  { value: "rs", flag: "🇷🇸", label: "Serbia", code: "+381" },
  { value: "sc", flag: "🇸🇨", label: "Seychelles", code: "+248" },
  { value: "sl", flag: "🇸🇱", label: "Sierra Leone", code: "+232" },
  { value: "sg", flag: "🇸🇬", label: "Singapore", code: "+65" },
  { value: "sk", flag: "🇸🇰", label: "Slovakia", code: "+421" },
  { value: "si", flag: "🇸🇮", label: "Slovenia", code: "+386" },
  { value: "sb", flag: "🇸🇧", label: "Solomon Islands", code: "+677" },
  { value: "so", flag: "🇸🇴", label: "Somalia", code: "+252" },
  { value: "za", flag: "🇿🇦", label: "South Africa", code: "+27" },
  { value: "ss", flag: "🇸🇸", label: "South Sudan", code: "+211" },
  { value: "es", flag: "🇪🇸", label: "Spain", code: "+34" },
  { value: "lk", flag: "🇱🇰", label: "Sri Lanka", code: "+94" },
  { value: "sd", flag: "🇸🇩", label: "Sudan", code: "+249" },
  { value: "sr", flag: "🇸🇷", label: "Suriname", code: "+597" },
  { value: "se", flag: "🇸🇪", label: "Sweden", code: "+46" },
  { value: "ch", flag: "🇨🇭", label: "Switzerland", code: "+41" },
  { value: "sy", flag: "🇸🇾", label: "Syria", code: "+963" },
  { value: "tw", flag: "🇹🇼", label: "Taiwan", code: "+886" },
  { value: "tj", flag: "🇹🇯", label: "Tajikistan", code: "+992" },
  { value: "tz", flag: "🇹🇿", label: "Tanzania", code: "+255" },
  { value: "th", flag: "🇹🇭", label: "Thailand", code: "+66" },
  { value: "tl", flag: "🇹🇱", label: "Timor-Leste", code: "+670" },
  { value: "tg", flag: "🇹🇬", label: "Togo", code: "+228" },
  { value: "to", flag: "🇹🇴", label: "Tonga", code: "+676" },
  { value: "tt", flag: "🇹🇹", label: "Trinidad & Tobago", code: "+1-868" },
  { value: "tn", flag: "🇹🇳", label: "Tunisia", code: "+216" },
  { value: "tr", flag: "🇹🇷", label: "Turkey", code: "+90" },
  { value: "tm", flag: "🇹🇲", label: "Turkmenistan", code: "+993" },
  { value: "tv", flag: "🇹🇻", label: "Tuvalu", code: "+688" },
  { value: "ug", flag: "🇺🇬", label: "Uganda", code: "+256" },
  { value: "ua", flag: "🇺🇦", label: "Ukraine", code: "+380" },
  { value: "ae", flag: "🇦🇪", label: "United Arab Emirates", code: "+971" },
  { value: "gb", flag: "🇬🇧", label: "United Kingdom", code: "+44" },
  { value: "us", flag: "🇺🇸", label: "United States", code: "+1" },
  { value: "uy", flag: "🇺🇾", label: "Uruguay", code: "+598" },
  { value: "uz", flag: "🇺🇿", label: "Uzbekistan", code: "+998" },
  { value: "vu", flag: "🇻🇺", label: "Vanuatu", code: "+678" },
  { value: "ve", flag: "🇻🇪", label: "Venezuela", code: "+58" },
  { value: "vn", flag: "🇻🇳", label: "Vietnam", code: "+84" },
  { value: "ye", flag: "🇾🇪", label: "Yemen", code: "+967" },
  { value: "zm", flag: "🇿🇲", label: "Zambia", code: "+260" },
  { value: "zw", flag: "🇿🇼", label: "Zimbabwe", code: "+263" },
];

// ── Entity sub-type options (country × entity-type) ─────────────────────────

type SubTypeOption = { value: string; label: string };
type SubTypeConfig = { label: string; hint: string; options: SubTypeOption[] };

const SUB_TYPE_CONFIG: Record<string, SubTypeConfig> = {
  "ca-corporation": {
    label: "Corporation Type",
    hint: "Determines applicable tax rules under the Income Tax Act.",
    options: [
      { value: "ccpc", label: "CCPC — Canadian-Controlled Private Corporation" },
      { value: "non-ccpc", label: "Non-CCPC / Public Corporation" },
      { value: "professional-corp", label: "Professional Corporation" },
    ],
  },
  "us-corporation": {
    label: "Corporation Type",
    hint: "C-Corp is taxed as a separate entity; S-Corp income passes through to shareholders.",
    options: [
      { value: "c-corp", label: "C-Corp (C Corporation)" },
      { value: "s-corp", label: "S-Corp (S Corporation)" },
    ],
  },
  "ca-partnership": {
    label: "Partnership Type",
    hint: "Determines liability exposure and T5013 filing requirements.",
    options: [
      { value: "gp", label: "General Partnership (GP)" },
      { value: "lp", label: "Limited Partnership (LP)" },
      { value: "llp", label: "Limited Liability Partnership (LLP)" },
    ],
  },
  "us-partnership": {
    label: "Partnership Type",
    hint: "Determines liability exposure and filing requirements.",
    options: [
      { value: "gp", label: "General Partnership (GP)" },
      { value: "lp", label: "Limited Partnership (LP)" },
      { value: "llp", label: "Limited Liability Partnership (LLP)" },
      { value: "llc", label: "Limited Liability Company (LLC)" },
    ],
  },
  "ca-trust": {
    label: "Trust Type",
    hint: "Determines trust taxation rules and T3 filing obligations.",
    options: [
      { value: "family", label: "Family / Discretionary Trust" },
      { value: "alter-ego", label: "Alter Ego Trust" },
      { value: "spousal", label: "Spousal / Joint Spousal Trust" },
      { value: "testamentary", label: "Testamentary Trust / Estate" },
    ],
  },
  "us-trust": {
    label: "Trust Type",
    hint: "Determines revocability, filing, and tax treatment.",
    options: [
      { value: "revocable", label: "Revocable Living Trust" },
      { value: "irrevocable", label: "Irrevocable Trust" },
      { value: "testamentary", label: "Testamentary Trust" },
      { value: "special-needs", label: "Special Needs Trust" },
    ],
  },
  "ca-sole-proprietor": {
    label: "Structure",
    hint: "Determines applicable deductions and T1 reporting schedule.",
    options: [
      { value: "individual", label: "Individual / Sole Proprietor" },
      { value: "professional", label: "Professional Practice" },
    ],
  },
  "us-sole-proprietor": {
    label: "Structure",
    hint: "Determines Schedule C filing and self-employment tax treatment.",
    options: [
      { value: "individual", label: "Individual / Sole Proprietor" },
      { value: "smllc", label: "Single-Member LLC (SMLLC)" },
    ],
  },
};

// ── Source connection labels ─────────────────────────────────────────────────

const SOURCE_CONNECTIONS: Array<{ value: string; label: string }> = [
  { value: "qbo", label: "QuickBooks Online" },
  { value: "xero", label: "Xero" },
  { value: "sage", label: "Sage" },
];

// ── Month/Day picker ─────────────────────────────────────────────────────────

const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_DAYS  = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const MonthDayPicker = ({
  value,
  onChange,
  placeholder = "e.g., Dec 31",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"month" | "day">("month");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setStep("month");
  };

  const handleMonthClick = (m: number) => {
    setSelectedMonth(m);
    setStep("day");
  };

  const handleDayClick = (d: number) => {
    if (selectedMonth === null) return;
    onChange(`${MONTHS_ABBR[selectedMonth]} ${d}`);
    setOpen(false);
    setStep("month");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`input-double-border flex items-center gap-2 h-9 px-3 w-full rounded-[10px] border text-sm text-left transition-all duration-200 bg-white dark:bg-card border-[#C3CBD6] dark:border-[hsl(220_15%_30%)] hover:border-[hsl(210_25%_75%)] dark:hover:border-[hsl(220_15%_40%)] ${value ? "text-foreground" : "text-muted-foreground/70"}`}
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{value || placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        {step === "month" ? (
          <>
            <p className="text-xs font-medium text-muted-foreground mb-2 text-center">Select Month</p>
            <div className="grid grid-cols-3 gap-1">
              {MONTHS_ABBR.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthClick(i)}
                  className={`py-1.5 text-sm rounded-md transition-colors font-medium text-center ${
                    selectedMonth === i
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 mb-2">
              <button
                type="button"
                onClick={() => setStep("month")}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <p className="text-xs font-medium flex-1 text-center">
                {selectedMonth !== null ? MONTHS_ABBR[selectedMonth] : ""} — Select Day
              </p>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from(
                { length: selectedMonth !== null ? MONTH_DAYS[selectedMonth] : 31 },
                (_, i) => i + 1
              ).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDayClick(d)}
                  className="h-7 w-7 text-xs rounded-md transition-colors hover:bg-primary hover:text-primary-foreground text-foreground font-medium text-center"
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

// ── Component ────────────────────────────────────────────────────────────────

type EntryMode = "choose" | "manual" | "source-select" | "source-connecting" | "source-connected";

const SOURCE_CARDS = [
  {
    value: "qbo",
    label: "QuickBooks Online",
    logo: <img src={intuitQuickbooksLogo} alt="QuickBooks Online" className="h-8 object-contain" />,
  },
  {
    value: "xero",
    label: "Xero",
    logo: <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white font-bold text-sm">X</div>,
  },
  {
    value: "sage",
    label: "Sage",
    logo: <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">S</div>,
  },
];

export default function AddNewClientV2() {
  const navigate = useNavigate();

  // ── Flow state ──────────────────────────────────────────────────────────────
  const [entryMode, setEntryMode] = useState<EntryMode>("choose");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [showPrefillBanner, setShowPrefillBanner] = useState(false);

  // ── Entity Foundation ───────────────────────────────────────────────────────
  const [country, setCountry] = useState<string>("ca");
  const [entityType, setEntityType] = useState<string>("");
  const [subCorpType, setSubCorpType] = useState<string>("");
  const [showDba, setShowDba] = useState<boolean>(false);
  const [dbaName, setDbaName] = useState<string>("");
  const [dbaDisplay, setDbaDisplay] = useState<string>("legal-only");

  // ── Primary Contact ─────────────────────────────────────────────────────────
  const [legalEntityName, setLegalEntityName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [website, setWebsite] = useState("");

  // ── Business & Tax ──────────────────────────────────────────────────────────
  const [gstRegistered, setGstRegistered] = useState<string>("");
  const [fiscalYearEnd, setFiscalYearEnd] = useState<string>("");
  const [businessNumber, setBusinessNumber] = useState("");

  const subTypeCfg = entityType ? (SUB_TYPE_CONFIG[`${country}-${entityType}`] ?? null) : null;
  const cfg = entityType ? ENTITY_CONFIG[entityType] : null;
  const taxCfg = COUNTRY_TAX_CONFIG[country];
  const regions = REGION_OPTIONS[country] ?? [];
  const showSections = !!entityType;

  const incLabel: Record<string, string> = {
    corporation: "Date of Incorporation",
    partnership: "Date of Partnership",
    trust: "Date of Trust Formation",
    "sole-proprietor": "Date of Registration",
  };

  // ── Source prefill simulation ────────────────────────────────────────────────
  const applySourcePrefill = () => {
    const sourceName = SOURCE_CARDS.find(s => s.value === selectedSource)?.label ?? selectedSource;
    setCountry("ca");
    setEntityType("corporation");
    setShowDba(false);
    setDbaName("");
    setLegalEntityName("Northline Precision Manufacturing Inc.");
    setFirstName("David");
    setLastName("Chen");
    setEmail("david.chen@northline.ca");
    setBusinessPhone("6045550192");
    setAddressLine1("120 Industrial Parkway");
    setCity("Mississauga");
    setProvince("on");
    setPostalCode("L5T 2B3");
    setWebsite("https://northlineprecision.ca");
    setFiscalYearEnd("Dec 31");
    setBusinessNumber("123456789");
    setGstRegistered("yes");
    setShowPrefillBanner(true);
    toast.success(`Client information imported from ${sourceName}`);
  };

  useEffect(() => {
    if (entryMode !== "source-connecting") return;
    const t1 = setTimeout(() => { applySourcePrefill(); }, 2000);
    const t2 = setTimeout(() => { setEntryMode("manual"); }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [entryMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = () => {
    toast.success("Client added");
    navigate("/clients");
  };

  // Header back action varies by screen
  const handleHeaderBack = () => {
    if (entryMode === "choose") { navigate("/clients"); return; }
    if (entryMode === "source-select") { setEntryMode("choose"); return; }
    if (entryMode === "source-connecting") { setEntryMode("source-select"); return; }
    if (entryMode === "manual") {
      if (legalEntityName) { setEntryMode("source-select"); } else { navigate("/clients"); }
    }
  };

  return (
    <Layout title="Add New Client">
      <div className="flex flex-col h-full overflow-hidden bg-background">

        {/* Sticky header bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-border/60">
          <button
            onClick={handleHeaderBack}
            className="flex items-center gap-2 text-link font-medium text-sm hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 px-4 text-sm" onClick={() => navigate("/clients")}>
              Cancel
            </Button>
            <Button
              className="h-9 px-4 text-sm bg-[#1C63A6] hover:bg-[#1a5a9e] text-white"
              disabled={entryMode === "choose" || entryMode === "source-select" || entryMode === "source-connecting"}
              onClick={handleAdd}
            >
              Add Client
            </Button>
          </div>
        </div>

        {/* ── SCREEN: choose ─────────────────────────────────────────────────── */}
        {entryMode === "choose" && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center max-w-xl w-full">
              <h2 className="text-lg font-semibold text-foreground mb-2">How would you like to add this client?</h2>
              <p className="text-sm text-muted-foreground mb-8">
                You can fill in the details manually, or connect to an accounting source and we'll pull the information in for you.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => setEntryMode("manual")}
                  className="flex-1 max-w-xs cursor-pointer border rounded-xl p-6 text-left hover:border-primary transition-colors bg-card group"
                >
                  <UserPlus className="h-8 w-8 text-primary mb-4" />
                  <p className="text-sm font-semibold text-foreground mb-1">Add Manually</p>
                  <p className="text-xs text-muted-foreground">Fill in client details yourself using the form.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode("source-select")}
                  className="flex-1 max-w-xs cursor-pointer border rounded-xl p-6 text-left hover:border-primary transition-colors bg-card group"
                >
                  <RefreshCw className="h-8 w-8 text-primary mb-4" />
                  <p className="text-sm font-semibold text-foreground mb-1">Connect from Source</p>
                  <p className="text-xs text-muted-foreground">Link QuickBooks Online, Xero, or Sage and we'll import the client information automatically.</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SCREEN: source-select ───────────────────────────────────────────── */}
        {entryMode === "source-select" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-xl">
              <button
                type="button"
                onClick={() => setEntryMode("choose")}
                className="flex items-center gap-1 text-sm text-link hover:underline mb-6"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <h2 className="text-lg font-semibold text-foreground mb-1">Select your accounting source</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We'll connect to your client's accounting software and import their information.
              </p>
              <div className="flex gap-4 mb-6">
                {SOURCE_CARDS.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSelectedSource(s.value)}
                    className={`flex-1 border rounded-xl p-5 cursor-pointer text-left transition-colors ${
                      selectedSource === s.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary bg-card"
                    }`}
                  >
                    <div className="mb-3">{s.logo}</div>
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                  </button>
                ))}
              </div>
              <Button
                className="h-10 px-6 bg-[#1C63A6] hover:bg-[#1a5a9e] text-white"
                disabled={!selectedSource}
                onClick={() => setEntryMode("source-connecting")}
              >
                Connect
              </Button>
            </div>
          </div>
        )}

        {/* ── SCREEN: source-connecting ───────────────────────────────────────── */}
        {(entryMode === "source-connecting" || entryMode === "source-connected") && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 text-primary border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-base font-semibold text-foreground mb-1">
                Connecting to {SOURCE_CARDS.find(s => s.value === selectedSource)?.label ?? selectedSource}...
              </p>
              <p className="text-sm text-muted-foreground">Fetching client information. This will only take a moment.</p>
            </div>
          </div>
        )}

        {/* ── SCREEN: manual (form) ───────────────────────────────────────────── */}
        {entryMode === "manual" && (
          <div className="flex-1 overflow-auto px-6 pb-8 pt-4 space-y-4">

            {/* Prefill banner */}
            {showPrefillBanner && (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="flex-1">
                  Client information imported from {SOURCE_CARDS.find(s => s.value === selectedSource)?.label ?? selectedSource}. Review the details below and make any changes before saving.
                </span>
                <button
                  type="button"
                  onClick={() => setShowPrefillBanner(false)}
                  className="shrink-0 hover:opacity-70 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* ── Section 1: Entity Foundation ──────────────────────────────── */}
            <SectionCard
              icon={Building2}
              title="Entity Foundation"
              subtitle="Start with the legal identity — this drives which other fields appear"
            >
              <div className="space-y-4 max-w-[50%]">
                <InlineField label="Country">
                  <Select value={country} onValueChange={v => { setCountry(v); setGstRegistered(""); setSubCorpType(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                      <SelectItem value="us">🇺🇸 United States</SelectItem>
                    </SelectContent>
                  </Select>
                </InlineField>
                <InlineField label="Client ID" hint="Leave blank to auto-generate.">
                  <Input placeholder="e.g., CLI-0042" />
                </InlineField>
                <InlineField label="Legal Entity Name" required>
                  <Input
                    placeholder="e.g., Acme Holdings Inc."
                    value={legalEntityName}
                    onChange={e => setLegalEntityName(e.target.value)}
                  />
                </InlineField>
                {/* DBA toggle */}
                <div className="flex items-start gap-4">
                  <span className="text-sm font-medium text-foreground shrink-0 w-52 pt-2 leading-snug">
                    {cfg ? cfg.dbaLabel : "Operating Name / DBA"}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={showDba}
                        onCheckedChange={v => { setShowDba(v); if (!v) { setDbaName(""); setDbaDisplay("legal-only"); } }}
                      />
                      {showDba
                        ? <Input className="flex-1" value={dbaName} onChange={e => setDbaName(e.target.value)} placeholder="e.g., Acme Trading Co." />
                        : <p className="text-xs text-muted-foreground">{cfg ? cfg.dbaHint : "The branded name used in public-facing materials, if different from the registered legal name."}</p>
                      }
                    </div>
                  </div>
                </div>
                <InlineField label="Group Name" hint="Use to group related clients together.">
                  <Input placeholder="e.g., Smith Family Group" />
                </InlineField>
                <InlineField label="Entity Type" required>
                  <Select
                    value={entityType}
                    onValueChange={v => {
                      setEntityType(v);
                      setShowDba(false);
                      setDbaName("");
                      setDbaDisplay("legal-only");
                      setGstRegistered("");
                      setSubCorpType("");
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select entity type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="sole-proprietor">Sole Proprietor</SelectItem>
                      <SelectItem value="trust">Trust</SelectItem>
                    </SelectContent>
                  </Select>
                </InlineField>
                {subTypeCfg && (
                  <InlineField label={subTypeCfg.label} required hint={subTypeCfg.hint}>
                    <Select value={subCorpType} onValueChange={setSubCorpType}>
                      <SelectTrigger><SelectValue placeholder={`Select ${subTypeCfg.label.toLowerCase()}`} /></SelectTrigger>
                      <SelectContent>
                        {subTypeCfg.options.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </InlineField>
                )}
                {entityType && (
                  <InlineField label="Engagement Partner" required>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpt">Cpt Group</SelectItem>
                        <SelectItem value="monte">Monte Heilig</SelectItem>
                        <SelectItem value="jangaiah">Jangaiah Arige</SelectItem>
                        <SelectItem value="jude">Jude Law</SelectItem>
                      </SelectContent>
                    </Select>
                  </InlineField>
                )}
                {showDba && dbaName && (
                  <InlineField label="Balance sheet display" hint="Legal name is always retained in legal documents.">
                    <Select value={dbaDisplay} onValueChange={setDbaDisplay}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="legal-only">Legal name only</SelectItem>
                        <SelectItem value="dba-only">DBA only</SelectItem>
                        <SelectItem value="both">Both — legal name and DBA</SelectItem>
                      </SelectContent>
                    </Select>
                  </InlineField>
                )}
              </div>
            </SectionCard>

            {/* Placeholder shown before entity type is selected */}
            {!showSections && (
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Select an entity type above to continue</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    The form adapts to show only the fields relevant to the selected entity and country.
                  </p>
                </div>
              </div>
            )}

            {/* Sections 2 & 3 appear after entity type is selected */}
            {showSections && (
              <div className="space-y-4">

                {/* ── Section 2: Primary Contact & Business Address ──────────── */}
                <SectionCard
                  icon={User}
                  title="Primary Contact & Business Address"
                  subtitle="The person responsible for this client relationship"
                >
                  <div className="space-y-4 max-w-[50%]">
                    <InlineField label="First Name" required>
                      <Input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </InlineField>
                    <InlineField label="Last Name" required>
                      <Input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </InlineField>
                    <InlineField label="Email">
                      <Input type="email" placeholder="contact@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </InlineField>
                    <InlineField label="Business Phone">
                      <Input placeholder="(555) 000-0000" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} />
                    </InlineField>
                    <InlineField label="Cell Phone">
                      <PhoneInput />
                    </InlineField>
                    <InlineField label="Website">
                      <Input type="url" placeholder="https://example.com" value={website} onChange={e => setWebsite(e.target.value)} />
                    </InlineField>
                    <InlineField label="Address Line 1">
                      <Input placeholder="Address Line 1" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
                    </InlineField>
                    <InlineField label="Address Line 2">
                      <Input placeholder="Address Line 2" />
                    </InlineField>
                    <InlineField label="City">
                      <Input placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                    </InlineField>
                    <InlineField label={taxCfg.regionLabel}>
                      <Select value={province} onValueChange={setProvince}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {regions.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </InlineField>
                    <InlineField label={taxCfg.postalLabel}>
                      <Input placeholder={taxCfg.postalPlaceholder} value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                    </InlineField>
                  </div>
                </SectionCard>

                {/* ── Section 3: Business & Tax Details ─────────────────────── */}
                <SectionCard
                  icon={FileText}
                  title="Business & Tax Details"
                  subtitle={`Fiscal dates, registration numbers, and tax identifiers for ${country === "ca" ? "Canada" : "United States"}`}
                >
                  <div className="space-y-4 max-w-[50%]">
                    <InlineField
                      label="Fiscal Year-End (Month/Day)"
                      hint="Not mandatory — can be set at the engagement level."
                    >
                      <MonthDayPicker value={fiscalYearEnd} onChange={setFiscalYearEnd} />
                    </InlineField>
                    {cfg?.hasIncorporation && (
                      <InlineField label={incLabel[entityType] ?? "Date of Incorporation"} required>
                        <Input type="date" className="w-44" />
                      </InlineField>
                    )}
                    <InlineField label={taxCfg.businessNumberLabel} hint={taxCfg.businessNumberHint}>
                      <Input placeholder={taxCfg.businessNumberPlaceholder} value={businessNumber} onChange={e => setBusinessNumber(e.target.value)} />
                    </InlineField>
                    {cfg?.hasCorporateTax && (
                      <InlineField label={taxCfg.corporateTaxLabel}>
                        <Input placeholder={taxCfg.corporateTaxPlaceholder} />
                      </InlineField>
                    )}
                    {cfg?.hasPayroll && (
                      <InlineField label={taxCfg.payrollLabel}>
                        <Input placeholder={taxCfg.payrollPlaceholder} />
                      </InlineField>
                    )}
                    <InlineField label={taxCfg.salesTaxLabel} hint="Informational — helps with sales tax treatment in future engagements.">
                      <Select value={gstRegistered} onValueChange={setGstRegistered}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </InlineField>
                    {gstRegistered === "yes" && (
                      <InlineField label={taxCfg.salesTaxNumberLabel}>
                        <Input placeholder={taxCfg.salesTaxNumberPlaceholder} />
                      </InlineField>
                    )}
                  </div>
                </SectionCard>

              </div>
            )}

          </div>
        )}

      </div>
    </Layout>
  );
}
