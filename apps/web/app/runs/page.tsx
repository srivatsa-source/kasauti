"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, History, ArrowUpRight } from "lucide-react";
import { PurityScoreBadge } from "@/components/PurityScoreBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

interface Run {
  id: string;
  target_id: string;
  target_name?: string;
  suite_name: string;
  status: string;
  purity_score: number;
  total_calls: number;
  passed_calls: number;
  failed_calls: number;
  created_at: string;
}

export default function RunsHistoryPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    try {
      const res = await fetch(`${API_BASE}/runs`);
      if (res.ok) {
        setRuns(await res.json());
      }
    } catch (err) {
      console.error("Error fetching runs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-black hover:underline mb-3 font-black uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Back to Targets
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <History className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
              Benchmark Run History
            </h1>
            <p className="text-xs font-semibold text-gray-700">
              Historical record of automated voice agent test runs and purity scores.
            </p>
          </div>
        </div>
      </div>

      {loading && runs.length === 0 ? (
        <div className="p-12 text-center text-xs font-bold text-black bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000]">
          Loading history from Kasauti engine...
        </div>
      ) : runs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border-3 border-black text-black font-bold shadow-[6px_6px_0px_#000]">
          No runs recorded yet. Launch a benchmark run from the home page.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-3 border-black bg-white shadow-[6px_6px_0px_#000000]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f4f0] border-b-2 border-black text-black uppercase tracking-wider font-black">
              <tr>
                <th className="px-6 py-4">Run ID</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Suite</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Purity Score</th>
                <th className="px-6 py-4">Pass / Total</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 font-medium">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-yellow-50/60 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-black">
                    {run.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 font-black text-black">
                    {run.target_name || "Voice Target"}
                  </td>
                  <td className="px-6 py-4 text-gray-800 font-semibold">
                    {run.suite_name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[1.5px_1.5px_0px_#000] ${
                      run.status === "completed" 
                        ? "bg-brutal-green text-black" 
                        : "bg-brutal-yellow text-black animate-pulse"
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <PurityScoreBadge score={run.purity_score} size="sm" />
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-black">
                    <span className="text-emerald-700 font-black">{run.passed_calls}</span> / {run.total_calls}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/runs/${run.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800 border-2 border-black font-black text-[11px] uppercase tracking-wider shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-brutal-yellow" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
