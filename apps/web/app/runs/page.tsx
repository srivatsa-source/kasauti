"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Search, Copy, Check, ArrowRight,
  Filter, Terminal
} from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "running">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRuns = runs
    .filter((r) => {
      if (statusFilter === "completed") return r.status === "completed";
      if (statusFilter === "running") return r.status !== "completed";
      return true;
    })
    .filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        (r.target_name || "").toLowerCase().includes(q) ||
        r.suite_name.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
              Benchmark Run History
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Historical ledger of automated voice audits and purity scores
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter by ID or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors w-48 sm:w-56"
              />
            </div>

            <div className="flex rounded-md bg-zinc-950 border border-zinc-800 p-0.5 text-xs font-mono">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  statusFilter === "all" ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-white"
                }`}
              >
                All ({runs.length})
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  statusFilter === "completed" ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-white"
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && runs.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">&gt; Loading historical ledger...</div>
      ) : runs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 text-xs font-mono">
          No benchmark runs recorded in database yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Run ID</th>
                <th className="px-5 py-3">Target Endpoint</th>
                <th className="px-5 py-3">Suite Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Purity Score</th>
                <th className="px-5 py-3">Calls (Pass / Total)</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredRuns.map((run) => (
                <tr key={run.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-5 py-4 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <span>{run.id.slice(0, 8)}...</span>
                      <button
                        onClick={() => handleCopy(run.id, run.id)}
                        className="text-zinc-600 hover:text-white"
                        title="Copy Run ID"
                      >
                        {copiedId === run.id ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {run.target_name || "Voice Target"}
                  </td>

                  <td className="px-5 py-4 text-zinc-300">
                    {run.suite_name}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      run.status === "completed" 
                        ? "bg-zinc-900 text-zinc-200 border border-zinc-700" 
                        : "bg-white text-black font-semibold animate-pulse"
                    }`}>
                      {run.status === "completed" ? "● Completed" : "◌ Running"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <PurityScoreBadge score={run.purity_score} size="sm" />
                  </td>

                  <td className="px-5 py-4 text-zinc-300">
                    <span className="text-white font-bold">{run.passed_calls}</span> / {run.total_calls}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/runs/${run.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 transition-colors text-[11px]"
                    >
                      Inspect
                      <ArrowRight className="w-3 h-3 text-zinc-400" />
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
