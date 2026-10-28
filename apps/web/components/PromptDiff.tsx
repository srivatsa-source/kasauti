import React from "react";
import { GitCompare, Sparkles } from "lucide-react";

interface PromptDiffProps {
  diff: string;
  promptBefore?: string;
  promptAfter?: string;
}

export const PromptDiff: React.FC<PromptDiffProps> = ({ diff }) => {
  const lines = diff.split("\n");

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-charcoal-900 font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface border-b border-border text-charcoal-400">
        <div className="flex items-center gap-2 font-semibold text-charcoal-200">
          <GitCompare className="w-4 h-4 text-gold" />
          <span>Surgical Prompt Patch (Before vs After)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gold font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Staging Agent Auto-Patched</span>
        </div>
      </div>

      <div className="p-4 overflow-x-auto max-h-[400px]">
        {lines.map((line, idx) => {
          let lineStyle = "text-charcoal-400";
          let bgStyle = "bg-transparent";

          if (line.startsWith("+") && !line.startsWith("+++")) {
            lineStyle = "text-emerald-400 font-medium";
            bgStyle = "bg-emerald-950/40";
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            lineStyle = "text-rose-400 font-medium";
            bgStyle = "bg-rose-950/40";
          } else if (line.startsWith("@@")) {
            lineStyle = "text-cyan-400";
            bgStyle = "bg-cyan-950/20";
          }

          return (
            <div key={idx} className={`px-2 py-0.5 rounded ${bgStyle} ${lineStyle} whitespace-pre font-mono`}>
              {line || " "}
            </div>
          );
        })}
      </div>
    </div>
  );
};
