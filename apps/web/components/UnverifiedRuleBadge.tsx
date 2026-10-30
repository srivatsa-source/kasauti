import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface UnverifiedRuleBadgeProps {
  showTooltip?: boolean;
}

export const UnverifiedRuleBadge: React.FC<UnverifiedRuleBadgeProps> = ({ showTooltip = true }) => {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brutal-yellow text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000] tracking-wide uppercase cursor-help hover:translate-x-0.5 transition-transform"
      title={showTooltip ? "Unverified Rule: Needs verification against official TRAI Gazette text. Kasauti is not legal advice." : undefined}
    >
      <AlertTriangle className="w-3 h-3 text-black shrink-0 stroke-[2.5]" />
      Unverified Rule
    </span>
  );
};

export const LegalDisclaimerBanner: React.FC = () => {
  return (
    <div className="p-4 rounded-xl bg-white border-2 border-black shadow-[4px_4px_0px_#000000] text-xs text-black flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-brutal-yellow border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
        <ShieldAlert className="w-4 h-4 text-black stroke-[2.5]" />
      </div>
      <div>
        <span className="font-black uppercase tracking-wide text-black">Regulatory Notice: </span>
        Kasauti benchmarks voice agent conversational behavior against regulatory and compliance packs and is <strong>not formal legal advice</strong>.
        Rules tagged with <span className="bg-brutal-yellow px-1 py-0.2 border border-black font-black text-[10px] rounded">Unverified Rule</span> are pending confirmation against official TRAI Gazette publications.
      </div>
    </div>
  );
};
