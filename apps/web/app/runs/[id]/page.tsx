"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Download, RefreshCw, Check, 
  X, ChevronRight, Copy, Terminal, Shield, 
  CheckCircle2, XCircle, Search
} from "lucide-react";
import { PurityScoreBadge } from "@/components/PurityScoreBadge";
import { UnverifiedRuleBadge, LegalDisclaimerBanner } from "@/components/UnverifiedRuleBadge";
import { PromptDiff } from "@/components/PromptDiff";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CheckItem {
  id: string;
  kind: string;
  rule_id: string;
  passed: boolean;
  score: number;
  evidence: string;
}

interface Scenario {
  id: string;
  title: string;
  language: string;
  persona: string;
  goal: string;
  expected_outcome: string;
}

interface Call {
  id: string;
  scenario_id: string;
  bolna_execution_id?: string;
  status: string;
  transcript?: string;
  cost: number;
  scenario?: Scenario;
  checks: CheckItem[];
}

interface Fix {
  id: string;
  prompt_before: string;
  prompt_after: string;
  diff: string;
  rerun_run_id?: string;
}

interface RunDetail {
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
  calls: Call[];
  fixes: Fix[];
}

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;

  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [selectedFix, setSelectedFix] = useState<Fix | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<any | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "passed" | "failed">("all");
  const [searchScenario, setSearchScenario] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchRun = async () => {
    try {
      const res = await fetch(`${API_BASE}/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setRun(data);
        if (data.fixes && data.fixes.length > 0 && !selectedFix) {
          setSelectedFix(data.fixes[data.fixes.length - 1]);
        }
      }
    } catch (err) {
      console.error("Failed to load run:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun();
    const interval = setInterval(fetchRun, 3000);
    return () => clearInterval(interval);
  }, [runId]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(runId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAutoFix = async () => {
    setFixing(true);
    try {
      const res = await fetch(`${API_BASE}/runs/${runId}/fix`, {
        method: "POST"
      });
      if (res.ok) {
        const fixData = await res.json();
        setSelectedFix(fixData);
        await fetchRun();
      } else {
        alert("Failed to generate prompt fix.");
      }
    } catch (err) {
      alert("Error proposing fix: " + err);
    } finally {
      setFixing(false);
    }
  };

  const handleRerunFailed = async () => {
    setRerunning(true);
    try {
      const res = await fetch(`${API_BASE}/runs/${runId}/rerun`, {
        method: "POST"
      });
      if (res.ok) {
        const newRun = await res.json();
        router.push(`/runs/${newRun.id}`);
      } else {
        const err = await res.json();
        alert(err.detail || "Rerun failed.");
      }
    } catch (err) {
      alert("Error triggering rerun: " + err);
    } finally {
      setRerunning(false);
    }
  };

  const handlePromote = async () => {
    if (!confirm("Promote this verified staging fix to Production target?")) return;
    setPromoting(true);
    try {
      const res = await fetch(`${API_BASE}/runs/${runId}/promote`, { method: "POST" });
      if (res.ok) {
        setPromotionResult(await res.json());
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to promote fix.");
      }
    } catch (err) {
      alert("Error promoting: " + err);
    } finally {
      setPromoting(false);
    }
  };

  if (loading && !run) {
    return (
      <div className="p-12 text-center text-xs font-mono text-zinc-500">
        &gt; Loading benchmark run {runId.slice(0, 8)}...
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-12 text-center text-xs font-mono text-zinc-500">
        Benchmark run not found.
      </div>
    );
  }

  const allPassed = run.failed_calls === 0 && run.total_calls > 0;

  const filteredCalls = run.calls
    .filter((call) => {
      const checks = call.checks || [];
      const passed = checks.length > 0 && checks.every((c) => c.passed);
      if (filterMode === "passed") return passed;
      if (filterMode === "failed") return !passed;
      return true;
    })
    .filter((call) => {
      if (!searchScenario) return true;
      const q = searchScenario.toLowerCase();
      const title = call.scenario?.title || call.scenario_id;
      return title.toLowerCase().includes(q) || (call.scenario?.language || "").toLowerCase().includes(q);
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
                {run.target_name || "Voice Target"}
              </h1>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                run.status === "completed"
                  ? "bg-zinc-900 text-zinc-200 border border-zinc-700"
                  : "bg-white text-black animate-pulse"
              }`}>
                {run.status === "completed" ? "● Completed" : "◌ Running"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-1">
              <span>Suite: {run.suite_name}</span>
              <span className="text-zinc-700">&bull;</span>
              <span>ID: {run.id.slice(0, 8)}...</span>
              <button
                onClick={handleCopyId}
                className="text-zinc-600 hover:text-white"
                title="Copy Full Run ID"
              >
                {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`${API_BASE}/runs/${run.id}/report.pdf`}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </a>

            {/* 1-Click Promote */}
            {selectedFix && (
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <span>{promoting ? "Promoting..." : "Promote Fix to Prod"}</span>
              </button>
            )}

            {!allPassed && (
              <button
                onClick={handleAutoFix}
                disabled={fixing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{fixing ? "Synthesizing Fix..." : "Auto-Fix Prompt"}</span>
              </button>
            )}

            {run.failed_calls > 0 && selectedFix && (
              <button
                onClick={handleRerunFailed}
                disabled={rerunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rerunning ? "animate-spin" : ""}`} />
                <span>Rerun {run.failed_calls} Failed</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <LegalDisclaimerBanner />

      {/* Top Metric Cards (High Data Visibility) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <PurityScoreBadge score={run.purity_score} size="lg" />
        </div>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between font-mono">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              Scenarios Executed
            </span>
            <div className="text-3xl font-black text-white mt-1">
              {run.total_calls}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">
              Hindi &bull; Hinglish &bull; Kannada &bull; English
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between font-mono">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              Passing Calls
            </span>
            <div className="text-3xl font-black text-white mt-1 flex items-center gap-2">
              <span>{run.passed_calls}</span>
              <span className="text-xs font-normal text-zinc-500">/ {run.total_calls}</span>
            </div>
            <span className="text-[10px] text-zinc-400 mt-1">
              Satisfied all regulatory checkpoints
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between font-mono">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              Failed Regressions
            </span>
            <div className="text-3xl font-black text-zinc-300 mt-1 flex items-center gap-2">
              <span>{run.failed_calls}</span>
              <span className="text-xs font-normal text-zinc-500">failed</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1">
              Auto-fix patches these specific breaches
            </span>
          </div>
        </div>
      </div>

      {/* Proposed Fix Diff Section */}
      {selectedFix && (
        <section className="space-y-3 p-5 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                Proposed Surgical Prompt Fix
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Minimal diff addressing failures, safely applied to staging agent copy.
              </p>
            </div>

            <button
              onClick={handleRerunFailed}
              disabled={rerunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black text-xs font-semibold self-start"
            >
              <RefreshCw className={`w-3 h-3 ${rerunning ? "animate-spin" : ""}`} />
              <span>Rerun Failed Scenarios</span>
            </button>
          </div>

          <PromptDiff diff={selectedFix.diff} />
        </section>
      )}

      {/* Calls Grid Section */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">Scenario Calls &amp; Checks</h2>
            <p className="text-xs text-zinc-500 font-mono">Live multi-turn call progression with evaluated rubrics</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter scenarios..."
                value={searchScenario}
                onChange={(e) => setSearchScenario(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors w-40 sm:w-48"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex rounded-md bg-zinc-950 border border-zinc-800 p-0.5 text-xs font-mono">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                  filterMode === "all" ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-white"
                }`}
              >
                All ({run.calls.length})
              </button>
              <button
                onClick={() => setFilterMode("passed")}
                className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                  filterMode === "passed" ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-white"
                }`}
              >
                Pass ({run.passed_calls})
              </button>
              <button
                onClick={() => setFilterMode("failed")}
                className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                  filterMode === "failed" ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-white"
                }`}
              >
                Fail ({run.failed_calls})
              </button>
            </div>
          </div>
        </div>

        {/* Calls Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Scenario / Persona</th>
                <th className="px-5 py-3">Language</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Outcome</th>
                <th className="px-5 py-3">Evaluated Checks</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {filteredCalls.map((call) => {
                const checks = call.checks || [];
                const passed = checks.length > 0 && checks.every((c) => c.passed);
                const title = call.scenario?.title || call.scenario_id;

                return (
                  <tr key={call.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{title}</div>
                      <div className="text-[11px] text-zinc-500 line-clamp-1 max-w-xs mt-0.5 font-sans">
                        {call.scenario?.persona}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {call.scenario?.language || "N/A"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {call.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      {passed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-white border border-zinc-600">
                          ● PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-black text-zinc-400 border border-zinc-800">
                          ○ FAIL
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 max-w-md">
                      <div className="space-y-1">
                        {checks.slice(0, 2).map((chk) => (
                          <div key={chk.id} className="text-[11px] flex items-center gap-1.5 truncate">
                            <span className={chk.passed ? "text-white" : "text-zinc-600"}>
                              {chk.passed ? "✓" : "✕"}
                            </span>
                            <span className="font-semibold text-zinc-300">{chk.rule_id}:</span>
                            <span className="text-zinc-500 truncate">{chk.evidence}</span>
                          </div>
                        ))}
                        {checks.length > 2 && (
                          <span className="text-[10px] text-zinc-600 italic">
                            +{checks.length - 2} more checks
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/calls/${call.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 transition-colors text-[11px]"
                      >
                        Audio &amp; Turns
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 1-Click Promotion Hallmark Modal */}
      {promotionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-black border border-zinc-800 p-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-lg bg-white text-black flex items-center justify-center font-bold text-xl">
                ✓
              </div>

              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
                Certified Production Ready
              </div>

              <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                Prompt Promoted to Production
              </h3>
              
              <p className="text-xs text-zinc-400 font-mono">
                The surgical fix tested in this benchmark has been safely deployed to target{" "}
                <strong className="text-white">{promotionResult.target_name}</strong>.
              </p>
            </div>

            <div className="mt-5 p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-zinc-500">
                <span>Hallmark Hash:</span>
                <span className="text-white font-bold">{promotionResult.certification_hash}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Purity Verified:</span>
                <span className="text-white font-bold">{promotionResult.purity_score}% Purity</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Timestamp:</span>
                <span className="text-zinc-300">{new Date(promotionResult.promoted_at).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setPromotionResult(null)}
                className="w-full py-2 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors"
              >
                Close Hallmark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
