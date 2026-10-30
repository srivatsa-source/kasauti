import React from "react";

interface PurityScoreBadgeProps {
  score: number; // 0 to 100
  size?: "sm" | "md" | "lg";
}

export const PurityScoreBadge: React.FC<PurityScoreBadgeProps> = ({ score, size = "md" }) => {
  const isHigh = score >= 80;
  const isMedium = score >= 50 && score < 80;

  const getKaratLabel = () => {
    if (score >= 95) return "24K Hallmark";
    if (score >= 85) return "22K Standard";
    if (score >= 70) return "18K Alloy";
    return "Failed / Impure";
  };

  if (size === "lg") {
    return (
      <div className="relative inline-flex flex-col p-6 rounded-xl bg-zinc-950 border border-zinc-800 w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            Kasauti Purity Rating
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700/80 uppercase">
            {getKaratLabel()}
          </span>
        </div>

        <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white mt-1">
          {score.toFixed(1)}%
        </div>

        {/* Minimalist Progress Meter */}
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-4 border border-zinc-800">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mt-2">
          <span>0.0%</span>
          <span>Target: 100%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-200 font-mono text-[11px]">
      <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? "bg-white" : isMedium ? "bg-zinc-400" : "bg-zinc-600"}`} />
      <span className="font-semibold tracking-tight text-white">
        {score.toFixed(0)}%
      </span>
      <span className="text-zinc-500 text-[10px]">PURITY</span>
    </div>
  );
};
