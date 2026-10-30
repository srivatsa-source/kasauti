"use client";

import React, { useState } from "react";
import { GitCompare, Copy, Check, Terminal } from "lucide-react";

interface PromptDiffProps {
  diff: string;
  promptBefore?: string;
  promptAfter?: string;
}

export const PromptDiff: React.FC<PromptDiffProps> = ({ diff }) => {
  const [copied, setCopied] = useState(false);
  const lines = diff.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800 bg-black font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-white tracking-tight">Surgical Prompt Patch</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            git diff
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-800 transition-colors"
          title="Copy patch diff"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-white" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-400" />
              <span>Copy Diff</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4 overflow-x-auto max-h-[360px] space-y-0.5 text-[11px] leading-5">
        {lines.map((line, idx) => {
          const isAdded = line.startsWith("+") && !line.startsWith("+++");
          const isRemoved = line.startsWith("-") && !line.startsWith("---");
          const isHeader = line.startsWith("@@");

          let bg = "bg-transparent";
          let textColor = "text-zinc-400";
          let prefix = " ";

          if (isAdded) {
            bg = "bg-zinc-900 border-l-2 border-white pl-2 text-white font-medium";
            textColor = "text-white";
            prefix = "+";
          } else if (isRemoved) {
            bg = "bg-zinc-950/80 border-l-2 border-zinc-700 pl-2 text-zinc-500 line-through";
            textColor = "text-zinc-500";
            prefix = "-";
          } else if (isHeader) {
            bg = "bg-zinc-950 text-zinc-500 italic py-1";
            textColor = "text-zinc-500";
            prefix = "@";
          }

          return (
            <div key={idx} className={`px-2 py-0.5 rounded font-mono ${bg} ${textColor} whitespace-pre`}>
              <span className="text-zinc-600 select-none mr-2 w-4 inline-block text-right">{prefix}</span>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};
