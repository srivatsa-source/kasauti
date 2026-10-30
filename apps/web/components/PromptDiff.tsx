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
    <div className="rounded-xl overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0px_#000] font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f4f4f0] border-b-2 border-black text-black">
        <div className="flex items-center gap-2 font-black uppercase text-[11px] tracking-wide">
          <GitCompare className="w-4 h-4 text-black stroke-[2.5]" />
          <span>Surgical Prompt Patch (Before vs After)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brutal-pink text-black border border-black shadow-[1px_1px_0px_#000]">
          <Sparkles className="w-3 h-3 fill-black" />
          <span>Staging Auto-Patched</span>
        </div>
      </div>

      <div className="p-4 overflow-x-auto max-h-[400px] bg-white divide-y divide-gray-100 font-mono">
        {lines.map((line, idx) => {
          let lineStyle = "text-gray-700";
          let bgStyle = "bg-transparent";

          if (line.startsWith("+") && !line.startsWith("+++")) {
            lineStyle = "text-emerald-800 font-bold";
            bgStyle = "bg-emerald-50 border-l-4 border-emerald-500 pl-2";
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            lineStyle = "text-rose-800 font-bold line-through";
            bgStyle = "bg-rose-50 border-l-4 border-rose-500 pl-2";
          } else if (line.startsWith("@@")) {
            lineStyle = "text-blue-900 font-black";
            bgStyle = "bg-blue-50";
          }

          return (
            <div key={idx} className={`py-1 ${bgStyle} ${lineStyle} whitespace-pre`}>
              {line || " "}
            </div>
          );
        })}
      </div>
    </div>
  );
};
