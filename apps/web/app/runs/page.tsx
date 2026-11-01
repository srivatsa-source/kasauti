"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, History, ArrowUpRight, Search, RefreshCw, AlertCircle, Zap } from "lucide-react";
import { PurityScoreBadge } from "@/components/PurityScoreBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

interface Run {
  id: string;
  target_id: string;
  target_name?: string;
  target_phone?: string;
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
  const [isWaking, setIsWaking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Initialize from cache immediately for instant render
  useEffect(() => {
    try {
      const cached = localStorage.getItem("kasauti_runs_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRuns(parsed);
          setLoading(false);
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, []);

  const sanitizeRun = (r: Run): Run => {
    if (r.target_phone && r.target_phone.includes("9019823296")) {
      return { ...r, target_phone: "+919800000000" };
    }
    return r;
  };

  const fetchRuns = async () => {
    try {
      const res = await fetch(`${API_BASE}/runs`);
      if (res.ok) {
        const raw = await res.json();
        const sanitized = Array.isArray(raw) ? raw.map(sanitizeRun) : [];
        setRuns(sanitized);
        setIsWaking(false);
        setLastRefreshed(new Date());
        try {
          localStorage.setItem("kasauti_runs_cache", JSON.stringify(sanitized));
        } catch (e) {}
      } else {
        // Render may be waking up or returning 502/503 during cold boot
        setIsWaking(true);
      }
    } catch (err) {
      console.warn("Kasauti engine connecting / waking up:", err);
      setIsWaking(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredRuns = runs.filter((r) =>
    r.suite_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.target_name && r.target_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-black hover:underline mb-3 font-black uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Back to Targets
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px] max-w-xs">
              <input
                type="text"
                placeholder="Search suite, target, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 pl-9 rounded-xl bg-white border-2 border-black text-xs font-bold text-black placeholder:text-gray-500 shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
              />
              <Search className="w-3.5 h-3.5 text-black absolute left-3 top-2.5 pointer-events-none stroke-[2.5]" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-gray-500 hover:text-black font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => { setLoading(true); fetchRuns(); }}
              className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all text-black font-black text-xs flex items-center gap-1.5"
              title="Refresh runs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Cold-Start Notice Banner */}
      {isWaking && (
        <div className="p-3.5 rounded-2xl bg-amber-100 border-3 border-black text-black shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <Zap className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <span>
              <strong>Render Engine Waking Up:</strong> Render free-tier spins down after inactivity (takes ~30–50s on initial load). {runs.length > 0 ? "Showing cached benchmark history while live engine boots." : "Retrying automatically..."}
            </span>
          </div>
          <button
            onClick={() => fetchRuns()}
            className="px-2.5 py-1 bg-black text-white font-black text-[11px] rounded-lg border-2 border-black hover:bg-neutral-800 transition-colors uppercase shrink-0"
          >
            Check Now
          </button>
        </div>
      )}

      {loading && runs.length === 0 ? (
        <div className="p-12 text-center text-xs font-bold text-black bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] space-y-3">
          <div className="flex justify-center items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-black" />
            <span className="text-sm font-black uppercase">Loading History from Kasauti Engine...</span>
          </div>
          <p className="text-gray-600 text-[11px]">
            Render backend waking up (30–50 seconds on cold start). Please wait...
          </p>
        </div>
      ) : runs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border-3 border-black text-black font-bold shadow-[6px_6px_0px_#000] space-y-4">
          <div className="text-base font-black uppercase">No runs recorded yet</div>
          <p className="text-xs text-gray-700 max-w-md mx-auto">
            Launch a benchmark run from the home page to test voice agents against TRAI regulations and behavioral quality standards.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brutal-yellow text-black border-2 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              Go to Targets & Launch Run
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border-3 border-black text-black font-bold shadow-[6px_6px_0px_#000]">
          No benchmark runs match &quot;{searchQuery}&quot;. Clear search to view all {runs.length} runs.
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
              {filteredRuns.map((run) => (
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
