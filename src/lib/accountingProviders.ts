import quickbooks from "@/assets/quickbooks-icon.svg";
import xero from "@/assets/xero-logo.svg";
import sage from "@/assets/sage-logo.svg";
import quickbooksBadge from "@/assets/intuit-quickbooks-logo.svg";
import xeroBadge from "@/assets/xero-logo-full.svg";
import type { AccountingProvider } from "@/lib/clientSource";

export const accountingProviders: Record<AccountingProvider, { name: string; buttonName: string; logo: string; badgeLogo: string }> = {
  quickbooks: { name: "QuickBooks Online", buttonName: "QuickBooks", logo: quickbooks, badgeLogo: quickbooksBadge },
  xero: { name: "Xero", buttonName: "Xero", logo: xero, badgeLogo: xeroBadge },
  sage: { name: "Sage", buttonName: "Sage", logo: sage, badgeLogo: sage },
};
