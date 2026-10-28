"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, History } from "lucide-react";
import { PurityScoreBadge } from "@/components/PurityScoreBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-charcoal-400 hover:text-gold mb-2 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Targets
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <History className="w-7 h-7 text-gold" />
          Benchmark Run History
        </h1>
        <p className="text-xs text-charcoal-400 mt-1">
          Historical record of automated voice agent test runs and purity scores.
        </p>
      </div>

      {loading && runs.length === 0 ? (
        <div className="p-12 text-center text-charcoal-400">Loading history...</div>
      ) : runs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border text-charcoal-400">
          No runs recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-900 border-b border-border text-charcoal-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Run ID</th>
                <th className="px-6 py-3.5">Target</th>
                <th className="px-6 py-3.5">Suite</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Purity Score</th>
                <th className="px-6 py-3.5">Pass / Total</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-surfaceHover/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gold">
                    {run.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {run.target_name || "Voice Target"}
                  </td>
                  <td className="px-6 py-4 text-charcoal-200">
                    {run.suite_name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      run.status === "completed" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-gold/15 text-gold border border-gold/30 animate-pulse"
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <PurityScoreBadge score={run.purity_score} size="sm" />
                  </td>
                  <td className="px-6 py-4 font-mono text-charcoal-200">
                    <span className="text-emerald-400 font-bold">{run.passed_calls}</span> / {run.total_calls}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/runs/${run.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surfaceHover hover:bg-charcoal-600 text-charcoal-200 hover:text-white font-semibold transition-colors"
                    >
                      Inspect
                      <ExternalLink className="w-3.5 h-3.5 text-gold" />
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
