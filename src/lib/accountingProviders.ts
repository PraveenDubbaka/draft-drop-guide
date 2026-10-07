import quickbooks from "@/assets/quickbooks-icon.svg";
import xero from "@/assets/xero-logo.svg";
import sage from "@/assets/sage-logo.svg";
import type { AccountingProvider } from "@/lib/clientSource";

export const accountingProviders: Record<AccountingProvider, { name: string; buttonName: string; logo: string }> = {
  quickbooks: { name: "QuickBooks Online", buttonName: "QuickBooks", logo: quickbooks },
  xero: { name: "Xero", buttonName: "Xero", logo: xero },
  sage: { name: "Sage", buttonName: "Sage", logo: sage },
};