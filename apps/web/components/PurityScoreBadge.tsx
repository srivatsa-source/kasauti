import React from "react";

interface PurityScoreBadgeProps {
  score: number; // 0 to 100
  size?: "sm" | "md" | "lg";
}

export const PurityScoreBadge: React.FC<PurityScoreBadgeProps> = ({ score, size = "md" }) => {
  const isHigh = score >= 80;
  const isMedium = score >= 50 && score < 80;

  const getBorderColor = () => {
    if (isHigh) return "border-gold text-gold";
    if (isMedium) return "border-yellow-500 text-yellow-400";
    return "border-red-400 text-red-400";
  };

  const getKaratLabel = () => {
    if (score >= 95) return "24K Hallmark";
    if (score >= 85) return "22K Standard";
    if (score >= 70) return "18K Alloy";
    return "Impure / Needs Polish";
  };

  if (size === "lg") {
    return (
      <div className="relative inline-flex flex-col items-center justify-center p-6 rounded-2xl bg-surface border border-gold/40 shadow-2xl shadow-gold/10">
        <div className="text-xs uppercase tracking-widest text-charcoal-400 font-semibold mb-1">
          Kasauti Purity Rating
        </div>
        <div className="text-5xl font-black tracking-tight text-white flex items-baseline gap-1">
          <span className="gold-gradient-text">{score.toFixed(1)}%</span>
        </div>
        <div className="mt-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30">
          {getKaratLabel()}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-surface/80 ${getBorderColor()}`}>
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      <span className="text-xs font-bold tracking-wide">
        {score.toFixed(0)}% Purity
      </span>
    </div>
  );
};
