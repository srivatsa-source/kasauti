import React from "react";
import { AlertTriangle } from "lucide-react";

interface UnverifiedRuleBadgeProps {
  showTooltip?: boolean;
}

export const UnverifiedRuleBadge: React.FC<UnverifiedRuleBadgeProps> = ({ showTooltip = true }) => {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 tracking-wider uppercase cursor-help"
      title={showTooltip ? "Unverified Rule: Needs verification against official TRAI Gazette text. Kasauti is not legal advice." : undefined}
    >
      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
      Unverified Rule
    </span>
  );
};

export const LegalDisclaimerBanner: React.FC = () => {
  return (
    <div className="p-3 rounded-lg bg-surface border border-border/80 text-xs text-charcoal-400 flex items-start gap-2.5">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-charcoal-200">Legal Notice: </span>
        Kasauti checks agent behavior against a community rule pack and is <strong>not legal advice</strong>.
        Rules flagged with <span className="text-amber-400 font-medium">Unverified Rule</span> are pending confirmation against official TRAI Gazette publications.
      </div>
    </div>
  );
};
