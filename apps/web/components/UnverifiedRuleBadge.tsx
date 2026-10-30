import React from "react";
import { Info } from "lucide-react";

interface UnverifiedRuleBadgeProps {
  showTooltip?: boolean;
}

export const UnverifiedRuleBadge: React.FC<UnverifiedRuleBadgeProps> = ({ showTooltip = true }) => {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 text-zinc-300 border border-zinc-700 tracking-wider uppercase cursor-help"
      title={showTooltip ? "Community Rule: Derived from TRAI guidelines. Kasauti is a simulation tool and not formal legal advice." : undefined}
    >
      <span className="w-1 h-1 rounded-full bg-zinc-400" />
      TRAI Benchmark
    </span>
  );
};

export const LegalDisclaimerBanner: React.FC = () => {
  return (
    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
      <div className="w-4 h-4 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5 text-[10px] font-mono">
        i
      </div>
      <div className="leading-relaxed">
        <span className="font-semibold text-zinc-200">Regulatory Touchstone: </span>
        Kasauti benchmarks voice agents against TRAI-style telecom rules and regional Indian linguistic criteria. Community-verified simulation test pack; not formal statutory counsel.
      </div>
    </div>
  );
};
