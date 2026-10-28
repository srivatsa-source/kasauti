"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Download, Wrench, RefreshCw, CheckCircle2, 
  XCircle, Clock, FileText, ChevronRight, Sparkles, AlertTriangle
} from "lucide-react";
import { PurityScoreBadge } from "@/components/PurityScoreBadge";
import { UnverifiedRuleBadge, LegalDisclaimerBanner } from "@/components/UnverifiedRuleBadge";
import { PromptDiff } from "@/components/PromptDiff";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    // Live polling every 3 seconds as required by specification
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
    return <div className="p-12 text-center text-charcoal-400">Loading benchmark run details...</div>;
  }

  if (!run) {
    return <div className="p-12 text-center text-red-400">Run not found.</div>;
  }

  const allPassed = run.failed_calls === 0 && run.total_calls > 0;

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-charcoal-400 hover:text-gold mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Targets
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {run.target_name || "Voice Target"}
            </h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              run.status === "completed"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-gold/15 text-gold border border-gold/30 animate-pulse"
            }`}>
              {run.status}
            </span>
          </div>
          <p className="text-xs text-charcoal-400 mt-1 font-mono">
            Suite: {run.suite_name} &bull; Run ID: {run.id}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`${API_BASE}/runs/${run.id}/report.pdf`}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surfaceHover hover:bg-charcoal-600 border border-border text-charcoal-200 hover:text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-gold" />
            Export PDF Report
          </a>

          {!allPassed && (
            <button
              onClick={handleAutoFix}
              disabled={fixing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-900 text-xs font-bold transition-transform active:scale-95 shadow-lg shadow-gold/20"
            >
              <Wrench className="w-4 h-4" />
              {fixing ? "Generating Fix..." : "Auto-Fix Prompt"}
            </button>
          )}

          {run.failed_calls > 0 && selectedFix && (
            <button
              onClick={handleRerunFailed}
              disabled={rerunning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-transform active:scale-95 shadow-lg shadow-emerald-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${rerunning ? "animate-spin" : ""}`} />
              {rerunning ? "Rerunning..." : `Rerun ${run.failed_calls} Failed Only`}
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
          <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider text-charcoal-400 font-semibold">
              Scenarios Tested
            </span>
            <div className="text-3xl font-extrabold text-white mt-2">
              {run.total_calls}
            </div>
            <span className="text-[11px] text-charcoal-400 mt-1">
              Hindi, Hinglish, Kannada, Indian English
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider text-charcoal-400 font-semibold">
              Passing Calls
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7" />
              {run.passed_calls}
            </div>
            <span className="text-[11px] text-charcoal-400 mt-1">
              Satisfied all rules and rubric checks
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between">
            <span className="text-xs uppercase tracking-wider text-charcoal-400 font-semibold">
              Failed Calls
            </span>
            <div className="text-3xl font-extrabold text-rose-400 mt-2 flex items-center gap-2">
              <XCircle className="w-7 h-7" />
              {run.failed_calls}
            </div>
            <span className="text-[11px] text-charcoal-400 mt-1">
              Auto-fix patches these specific regressions
            </span>
          </div>
        </div>
      </div>

      {/* Fix Diff Section (if available) */}
      {selectedFix && (
        <section className="space-y-3 p-6 rounded-2xl bg-surface border border-gold/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                Proposed Surgical Prompt Fix
              </h2>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Minimal diff generated to address the failing checks, applied to staging agent.
              </p>
            </div>
            <button
              onClick={handleRerunFailed}
              disabled={rerunning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-900 text-xs font-bold self-start"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rerunning ? "animate-spin" : ""}`} />
              Rerun Failed Scenarios Now
            </button>
          </div>

          <PromptDiff diff={selectedFix.diff} />
        </section>
      )}

      {/* Calls Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Scenario Calls & Checks</h2>
            <p className="text-xs text-charcoal-400">Live call progression with rule verifications</p>
          </div>
          <span className="text-xs text-charcoal-400 font-mono">
            Auto-polling every 3s
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-900 border-b border-border text-charcoal-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Scenario / Persona</th>
                <th className="px-6 py-3.5">Language</th>
                <th className="px-6 py-3.5">Call Status</th>
                <th className="px-6 py-3.5">Purity Outcome</th>
                <th className="px-6 py-3.5">Rule / Rubric Evidence</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {run.calls.map((call) => {
                const checks = call.checks || [];
                const passed = checks.length > 0 && checks.every((c) => c.passed);
                const title = call.scenario?.title || call.scenario_id;

                return (
                  <tr key={call.id} className="hover:bg-surfaceHover/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{title}</div>
                      <div className="text-[11px] text-charcoal-400 line-clamp-1 max-w-xs mt-0.5">
                        {call.scenario?.persona}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-charcoal-700 text-charcoal-200 border border-border">
                        {call.scenario?.language || "N/A"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        call.status === "completed"
                          ? "bg-charcoal-700 text-charcoal-200 border border-border"
                          : "bg-gold/15 text-gold border border-gold/30 animate-pulse"
                      }`}>
                        {call.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {passed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          FAIL
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 max-w-md">
                      <div className="space-y-1">
                        {checks.slice(0, 2).map((chk) => (
                          <div key={chk.id} className="text-[11px] flex items-center gap-1.5 truncate">
                            {chk.passed ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                            )}
                            <span className="font-semibold text-charcoal-200">{chk.rule_id}:</span>
                            <span className="text-charcoal-400 truncate">{chk.evidence}</span>
                            {chk.kind === "rule" && <UnverifiedRuleBadge showTooltip={false} />}
                          </div>
                        ))}
                        {checks.length > 2 && (
                          <span className="text-[10px] text-charcoal-400 italic">
                            +{checks.length - 2} more checks
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/calls/${call.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surfaceHover hover:bg-charcoal-600 text-charcoal-200 hover:text-white font-semibold transition-colors"
                      >
                        Audio &amp; Turns
                        <ChevronRight className="w-3.5 h-3.5 text-gold" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
