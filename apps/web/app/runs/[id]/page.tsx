"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Download, Wrench, RefreshCw, CheckCircle2, 
  XCircle, Clock, FileText, ChevronRight, Sparkles, AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { PurityScoreBadge } from "@/components/PurityScoreBadge";
import { UnverifiedRuleBadge, LegalDisclaimerBanner } from "@/components/UnverifiedRuleBadge";
import { PromptDiff } from "@/components/PromptDiff";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

interface Check {
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
  checks: Check[];
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

  const handlePromote = async () => {
    if (!confirm("Are you sure you want to promote this verified staging fix to Production?")) return;
    setPromoting(true);
    try {
      const res = await fetch(`${API_BASE}/runs/${runId}/promote`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPromotionResult(data);
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

  if (loading && !run) {
    return (
      <div className="p-12 text-center text-xs font-bold text-black bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000]">
        Loading benchmark run details...
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-12 text-center text-xs font-bold text-red-600 bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000]">
        Run not found.
      </div>
    );
  }

  const allPassed = run.failed_calls === 0 && run.total_calls > 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-black hover:underline mb-2 font-black uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Back to Targets
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
              {run.target_name || "Voice Target"}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000] ${
              run.status === "completed"
                ? "bg-brutal-green text-black"
                : "bg-brutal-yellow text-black animate-pulse"
            }`}>
              {run.status}
            </span>
          </div>
          <p className="text-xs font-mono font-bold text-gray-700 mt-1">
            Suite: {run.suite_name} &bull; Run ID: {run.id.slice(0, 8)}...
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`${API_BASE}/runs/${run.id}/report.pdf`}
            download
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 border-2 border-black text-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            Export PDF
          </a>

          {/* 1-Click Promote Staging Fix to Production */}
          {selectedFix && (
            <button
              onClick={handlePromote}
              disabled={promoting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brutal-pink text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              title="Promote verified staging prompt to production agent"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              {promoting ? "Promoting..." : "Promote Fix to Prod"}
            </button>
          )}

          {!allPassed && (
            <button
              onClick={handleAutoFix}
              disabled={fixing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brutal-yellow text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              <Wrench className="w-4 h-4 stroke-[2.5]" />
              {fixing ? "Generating Fix..." : "Auto-Fix Prompt"}
            </button>
          )}

          {run.failed_calls > 0 && selectedFix && (
            <button
              onClick={handleRerunFailed}
              disabled={rerunning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#ff90e8] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              <RefreshCw className={`w-4 h-4 stroke-[2.5] ${rerunning ? "animate-spin" : ""}`} />
              {rerunning ? "Rerunning..." : `Rerun ${run.failed_calls} Failed`}
            </button>
          )}
        </div>
      </div>

      <LegalDisclaimerBanner />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <PurityScoreBadge score={run.purity_score} size="lg" />
        </div>

        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000] flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-black font-black">
              Scenarios Tested
            </span>
            <div className="text-4xl font-black text-black font-display mt-2">
              {run.total_calls}
            </div>
            <span className="text-[11px] font-semibold text-gray-600 mt-1">
              Hindi, Hinglish, Kannada & English
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000] flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-black font-black">
              Passing Calls
            </span>
            <div className="text-4xl font-black text-emerald-600 font-display mt-2 flex items-center gap-2">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              {run.passed_calls}
            </div>
            <span className="text-[11px] font-semibold text-gray-600 mt-1">
              Satisfied all rules and rubric checks
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000] flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-black font-black">
              Failed Calls
            </span>
            <div className="text-4xl font-black text-rose-600 font-display mt-2 flex items-center gap-2">
              <XCircle className="w-8 h-8 stroke-[2.5]" />
              {run.failed_calls}
            </div>
            <span className="text-[11px] font-semibold text-gray-600 mt-1">
              Auto-fix patches these regressions
            </span>
          </div>
        </div>
      </div>

      {/* Fix Diff Section (if available) */}
      {selectedFix && (
        <section className="space-y-3 p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black uppercase text-black font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-black fill-brutal-yellow" />
                Proposed Surgical Prompt Fix
              </h2>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">
                Minimal diff generated to address the failing checks, staged for testing.
              </p>
            </div>
            <button
              onClick={handleRerunFailed}
              disabled={rerunning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brutal-yellow text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] self-start"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${rerunning ? "animate-spin" : ""}`} />
              Rerun Failed Scenarios Now
            </button>
          </div>

          <PromptDiff diff={selectedFix.diff} />
        </section>
      )}

      {/* Calls Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-black font-display">
              Scenario Calls & Checks
            </h2>
            <p className="text-xs font-semibold text-gray-600">
              Live call progression with rule verifications
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-white border-2 border-black p-1 text-xs shadow-[2px_2px_0px_#000]">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1 rounded-lg font-black uppercase text-[11px] transition-all ${
                  filterMode === "all" ? "bg-black text-white shadow-[1px_1px_0px_#ff90e8]" : "text-black hover:bg-gray-100"
                }`}
              >
                All ({run.calls.length})
              </button>
              <button
                onClick={() => setFilterMode("passed")}
                className={`px-3 py-1 rounded-lg font-black uppercase text-[11px] transition-all ${
                  filterMode === "passed" ? "bg-brutal-green text-black border border-black" : "text-black hover:bg-gray-100"
                }`}
              >
                Pass ({run.passed_calls})
              </button>
              <button
                onClick={() => setFilterMode("failed")}
                className={`px-3 py-1 rounded-lg font-black uppercase text-[11px] transition-all ${
                  filterMode === "failed" ? "bg-rose-500 text-white border border-black" : "text-black hover:bg-gray-100"
                }`}
              >
                Fail ({run.failed_calls})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border-3 border-black bg-white shadow-[6px_6px_0px_#000000]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f4f4f0] border-b-2 border-black text-black uppercase tracking-wider font-black">
              <tr>
                <th className="px-6 py-4">Scenario / Persona</th>
                <th className="px-6 py-4">Language</th>
                <th className="px-6 py-4">Call Status</th>
                <th className="px-6 py-4">Purity Outcome</th>
                <th className="px-6 py-4">Rule / Rubric Evidence</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 font-medium">
              {run.calls
                .filter((call) => {
                  const checks = call.checks || [];
                  const passed = checks.length > 0 && checks.every((c) => c.passed);
                  if (filterMode === "passed") return passed;
                  if (filterMode === "failed") return !passed;
                  return true;
                })
                .map((call) => {
                  const checks = call.checks || [];
                  const passed = checks.length > 0 && checks.every((c) => c.passed);
                  const title = call.scenario?.title || call.scenario_id;

                  return (
                    <tr key={call.id} className="hover:bg-yellow-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-black text-black">{title}</div>
                        <div className="text-[11px] font-semibold text-gray-600 line-clamp-1 max-w-xs mt-0.5">
                          {call.scenario?.persona}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-brutal-bg text-black border border-black shadow-[1px_1px_0px_#000]">
                          {call.scenario?.language || "N/A"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-black ${
                          call.status === "completed"
                            ? "bg-gray-100 text-black"
                            : "bg-brutal-yellow text-black animate-pulse"
                        }`}>
                          {call.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {passed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brutal-green text-black border border-black shadow-[1px_1px_0px_#000]">
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#ff6b6b] text-white border border-black shadow-[1px_1px_0px_#000]">
                            <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            FAIL
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 max-w-md">
                        <div className="space-y-1">
                          {checks.slice(0, 2).map((chk) => (
                            <div key={chk.id} className="text-[11px] flex items-center gap-1.5 truncate">
                              {chk.passed ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 stroke-[2.5] shrink-0" />
                              ) : (
                                <XCircle className="w-3 h-3 text-rose-600 stroke-[2.5] shrink-0" />
                              )}
                              <span className="font-bold text-black">{chk.rule_id}:</span>
                              <span className="text-gray-700 truncate">{chk.evidence}</span>
                              {chk.kind === "rule" && <UnverifiedRuleBadge showTooltip={false} />}
                            </div>
                          ))}
                          {checks.length > 2 && (
                            <span className="text-[10px] text-gray-500 font-bold italic">
                              +{checks.length - 2} more checks
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/calls/${call.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800 border-2 border-black font-black text-[11px] uppercase tracking-wider shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                          <span>Audio &amp; Turns</span>
                          <ArrowUpRight className="w-3 h-3 text-brutal-yellow" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border-3 border-black p-8 shadow-[12px_12px_0px_#000000] relative">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-brutal-yellow border-3 border-black flex items-center justify-center text-black shadow-[4px_4px_0px_#000]">
                <Sparkles className="w-8 h-8 fill-black" />
              </div>

              <div className="inline-block px-3.5 py-1 rounded-full bg-brutal-green text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
                Certified Production Ready
              </div>

              <h3 className="text-2xl font-black text-black uppercase font-display tracking-tight">
                Prompt Promoted to Production!
              </h3>
              
              <p className="text-xs font-semibold text-gray-700">
                The surgical fix tested in this benchmark has been safely deployed to target{" "}
                <strong className="text-black">{promotionResult.target_name}</strong>.
              </p>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gray-50 border-2 border-black space-y-2 text-xs font-mono">
              <div className="flex justify-between text-gray-700">
                <span className="font-bold">Hallmark Hash:</span>
                <span className="text-black font-extrabold">{promotionResult.certification_hash}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="font-bold">Purity Verified:</span>
                <span className="text-emerald-700 font-extrabold">{promotionResult.purity_score}% Purity</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="font-bold">Promoted At:</span>
                <span className="text-black">{new Date(promotionResult.promoted_at).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPromotionResult(null)}
                className="w-full py-3 rounded-xl bg-black text-white hover:bg-neutral-800 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#ff90e8] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
