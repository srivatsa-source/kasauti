import React from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowUpRight } from "lucide-react";

interface StatutoryRuleBadgeProps {
  showTooltip?: boolean;
  citation?: string;
}

export const UnverifiedRuleBadge: React.FC<StatutoryRuleBadgeProps> = ({
  showTooltip = true,
  citation,
}) => {
  return (
    <Link
      href="/docs"
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-300 text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000] tracking-wide uppercase cursor-pointer hover:bg-emerald-400 hover:translate-x-0.5 transition-all"
      title={
        showTooltip
          ? citation ||
            "Statutory Rule: Verified against Gazette of India TCCCPR 2025 & TRAI AI Guidelines PR 145/2026. Click to inspect docs."
          : undefined
      }
    >
      <CheckCircle2 className="w-3 h-3 text-black shrink-0 stroke-[2.5]" />
      <span>TRAI &apos;25/&apos;26 Statutory</span>
    </Link>
  );
};

export const StatutoryRuleBadge = UnverifiedRuleBadge;

export const LegalDisclaimerBanner: React.FC = () => {
  return (
    <div className="p-4 rounded-xl bg-white border-2 border-black shadow-[4px_4px_0px_#000000] text-xs text-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-300 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
          <ShieldCheck className="w-4 h-4 text-black stroke-[2.5]" />
        </div>
        <div>
          <span className="font-black uppercase tracking-wide text-black">
            Official TRAI Statutory Rule Pack (2025 / 2026):{" "}
          </span>
          Kasauti benchmarks voice agent conversational safety directly against the{" "}
          <strong>Gazette of India TCCCPR Second Amendment Regulations 2025</strong> and{" "}
          <strong>TRAI Press Release No. 145/2026 (7 Sutras of AI Governance)</strong>.
        </div>
      </div>
      <Link
        href="/docs"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-[11px] font-black uppercase tracking-wider shrink-0 border-2 border-black shadow-[2px_2px_0px_#ff90e8] hover:bg-zinc-800 transition-all self-start sm:self-auto"
      >
        <span>Read TRAI Rules</span>
        <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
      </Link>
    </div>
  );
};
