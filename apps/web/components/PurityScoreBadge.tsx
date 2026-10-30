import React from "react";

interface PurityScoreBadgeProps {
  score: number; // 0 to 100
  size?: "sm" | "md" | "lg";
}

export const PurityScoreBadge: React.FC<PurityScoreBadgeProps> = ({ score, size = "md" }) => {
  const isHigh = score >= 80;
  const isMedium = score >= 50 && score < 80;

  const getTheme = () => {
    if (isHigh) return "bg-brutal-green text-black border-black shadow-[2px_2px_0px_#000]";
    if (isMedium) return "bg-brutal-yellow text-black border-black shadow-[2px_2px_0px_#000]";
    return "bg-[#ff6b6b] text-white border-black shadow-[2px_2px_0px_#000]";
  };

  const getKaratLabel = () => {
    if (score >= 95) return "24K Hallmark (Exceptional)";
    if (score >= 85) return "22K Standard (Production Ready)";
    if (score >= 70) return "18K Alloy (Needs Polish)";
    return "Failed Purity Threshold";
  };

  if (size === "lg") {
    return (
      <div className="relative inline-flex flex-col items-center justify-center p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000]">
        <div className="text-[11px] uppercase tracking-widest text-black font-extrabold mb-1">
          Kasauti Purity Rating
        </div>
        <div className="text-5xl font-black tracking-tight text-black flex items-baseline gap-1 font-display">
          <span>{score.toFixed(1)}%</span>
        </div>
        <div className="mt-3 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-brutal-yellow text-black border-2 border-black shadow-[2px_2px_0px_#000]">
          {getKaratLabel()}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 text-xs font-black tracking-tight ${getTheme()}`}>
      <span className="w-2 h-2 rounded-full bg-black" />
      <span>{score.toFixed(0)}% Purity</span>
    </div>
  );
};
