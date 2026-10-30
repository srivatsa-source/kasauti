"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GitBranch,
  GitPullRequest,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Lock,
  ArrowUpRight,
  RefreshCw,
  Terminal,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface BolnaDeployResponse {
  status: string;
  agent_id: string;
  agent_name: string;
  updated_at: string;
  isolation_check: string;
  deploy_message: string;
}

interface GitPRResponse {
  branch_name: string;
  commit_sha: string;
  pr_title: string;
  pr_body_markdown: string;
  github_pr_url: string;
  status: string;
  created_at: string;
}

export default function DeployerPage() {
  const [activeTab, setActiveTab] = useState<"bolna" | "git">("bolna");

  // Bolna Staging Sync State
  const [stagingAgentId, setStagingAgentId] = useState<string>("787248b7-9343-4d08-b3a2-9876aa439077");
  const [patchText, setPatchText] = useState<string>(
    "Mandatory TRAI §1.1 compliance injection:\n1. State: 'Namaste, main Bharat FinServe se automated voice bot bol raha hoon' in first 5 seconds.\n2. Obtain explicit consent before discussing any credit or account details."
  );
  const [patchReason, setPatchReason] = useState<string>("Automated Kasauti Regulatory Self-Healing Patch");
  const [syncingBolna, setSyncingBolna] = useState<boolean>(false);
  const [bolnaResult, setBolnaResult] = useState<BolnaDeployResponse | null>(null);
  const [bolnaError, setBolnaError] = useState<string | null>(null);

  // Git PR State
  const [runId, setRunId] = useState<string>("run-benchmark-live-01");
  const [targetName, setTargetName] = useState<string>("Bharat FinServe Customer Agent");
  const [ruleId, setRuleId] = useState<string>("trai_ai_disclosure");
  const [scoreBefore, setScoreBefore] = useState<number>(68.2);
  const [scoreAfter, setScoreAfter] = useState<number>(98.4);
  const [diffText, setDiffText] = useState<string>(
    "--- prompt_before\n+++ prompt_after\n@@ -1,3 +1,6 @@\n You are a customer assistance voice agent.\n-Greet the customer and ask for their loan account.\n+Always disclose: 'Namaste, I am an automated AI voice agent calling from Bharat FinServe.'\n+Verify if the customer is available to talk before disclosing financial details."
  );
  const [generatingPR, setGeneratingPR] = useState<boolean>(false);
  const [prResult, setPrResult] = useState<GitPRResponse | null>(null);
  const [prError, setPrError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Bolna Deploy Handler
  const handleDeployBolna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to deploy this compliance patch to the Bolna Staging Agent? Target production agents remain immutable.")) {
      return;
    }

    setSyncingBolna(true);
    setBolnaError(null);
    setBolnaResult(null);

    try {
      const res = await fetch(`${API_BASE}/deployer/bolna-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staging_agent_id: stagingAgentId,
          prompt_patch_text: patchText,
          reason: patchReason,
        }),
      });

      if (res.ok) {
        setBolnaResult(await res.json());
      } else {
        const err = await res.json().catch(() => ({}));
        setBolnaError(err.detail || "Failed to deploy to Bolna Agent Studio.");
      }
    } catch (err: any) {
      setBolnaError(err?.message || "Network error deploying patch.");
    } finally {
      setSyncingBolna(false);
    }
  };

  // Git PR Handler
  const handleCreateGitPR = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingPR(true);
    setPrError(null);
    setPrResult(null);

    try {
      const res = await fetch(`${API_BASE}/deployer/git-pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: runId,
          target_name: targetName,
          rule_id: ruleId,
          purity_score_before: scoreBefore,
          purity_score_after: scoreAfter,
          prompt_diff: diffText,
        }),
      });

      if (res.ok) {
        setPrResult(await res.json());
      } else {
        const err = await res.json().catch(() => ({}));
        setPrError(err.detail || "Failed to generate Git Pull Request.");
      }
    } catch (err: any) {
      setPrError(err?.message || "Network error formatting PR.");
    } finally {
      setGeneratingPR(false);
    }
  };

  const copyPRBody = () => {
    if (!prResult) return;
    navigator.clipboard.writeText(prResult.pr_body_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-black hover:underline mb-2 font-black uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Back to Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brutal-green border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#000]">
              <GitPullRequest className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
                Autonomous Deployer &amp; Git CI/CD
              </h1>
              <p className="text-xs font-semibold text-gray-700">
                Synchronize self-healed compliance patches directly to Bolna Staging Studio or generate verifiable GitHub PRs
              </p>
            </div>
          </div>

          {/* Safety Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brutal-yellow border-2 border-black text-xs font-black shadow-[2px_2px_0px_#000]">
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>PRODUCTION SAFEGUARD ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b-2 border-black text-xs gap-3">
        <button
          onClick={() => setActiveTab("bolna")}
          className={`pb-2.5 font-black uppercase tracking-wider text-sm transition-all ${
            activeTab === "bolna"
              ? "border-b-4 border-black text-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Bolna Studio Staging Sync
        </button>
        <button
          onClick={() => setActiveTab("git")}
          className={`pb-2.5 font-black uppercase tracking-wider text-sm transition-all ${
            activeTab === "git"
              ? "border-b-4 border-black text-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Autonomous GitHub PR Bot
        </button>
      </div>

      {/* Tab 1: Bolna Staging Sync */}
      {activeTab === "bolna" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] space-y-5">
            <div className="border-b-2 border-black pb-3">
              <h2 className="text-xl font-black uppercase text-black font-display">
                Synchronize Patch to Bolna Studio
              </h2>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">
                Pushes audited prompts directly to your safe Bolna staging clone without touching live production numbers.
              </p>
            </div>

            {bolnaError && (
              <div className="p-3.5 rounded-xl bg-rose-100 border-2 border-black text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{bolnaError}</span>
              </div>
            )}

            <form onSubmit={handleDeployBolna} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block uppercase text-black mb-1">
                  Staging Agent ID (Target for Safe Patching)
                </label>
                <input
                  type="text"
                  required
                  value={stagingAgentId}
                  onChange={(e) => setStagingAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black font-mono shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block uppercase text-black mb-1">
                  Deployment Reason / Audit Label
                </label>
                <input
                  type="text"
                  value={patchReason}
                  onChange={(e) => setPatchReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black font-semibold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block uppercase text-black mb-1">
                  Surgical Prompt Patch Payload
                </label>
                <textarea
                  rows={5}
                  required
                  value={patchText}
                  onChange={(e) => setPatchText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf9f5] border-2 border-black font-mono text-[11px] leading-relaxed shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={syncingBolna}
                  className="w-full py-3 rounded-xl bg-brutal-green text-black hover:bg-emerald-400 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                >
                  {syncingBolna ? "Deploying to Bolna Studio API..." : "Confirm & Deploy to Staging Agent"}
                </button>
              </div>
            </form>
          </div>

          {/* Results Side Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-3">
                <ShieldCheck className="w-5 h-5 text-black stroke-[2.5]" />
                <h3 className="font-black uppercase text-base text-black font-display">
                  Staging Isolation Ledger
                </h3>
              </div>

              {bolnaResult ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 border-2 border-black space-y-1">
                    <div className="flex items-center gap-1.5 font-black uppercase text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>{bolnaResult.status}</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-800">
                      {bolnaResult.deploy_message}
                    </p>
                  </div>

                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">Agent Name:</span>
                      <span className="font-black text-black">{bolnaResult.agent_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">Updated At:</span>
                      <span className="text-black">{new Date(bolnaResult.updated_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-yellow-50 border border-black font-mono text-[10px] text-gray-800 leading-tight">
                    {bolnaResult.isolation_check}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-semibold text-gray-600 rounded-xl bg-[#faf9f5] border-2 border-dashed border-black">
                  No deployment triggered yet. Verify your staging agent ID and click Deploy.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Autonomous GitHub PR Bot */}
      {activeTab === "git" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] space-y-5">
            <div className="border-b-2 border-black pb-3">
              <h2 className="text-xl font-black uppercase text-black font-display">
                Generate Verified Pull Request
              </h2>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">
                Formats git branches, commit SHAs, and markdown PR bodies certified with the Kasauti Hallmark badge.
              </p>
            </div>

            {prError && (
              <div className="p-3.5 rounded-xl bg-rose-100 border-2 border-black text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{prError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGitPR} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block uppercase text-black mb-1">
                  Target Voice Agent Name
                </label>
                <input
                  type="text"
                  required
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black font-bold shadow-[2px_2px_0px_#000]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-black mb-1">
                    Failed Rule ID
                  </label>
                  <input
                    type="text"
                    required
                    value={ruleId}
                    onChange={(e) => setRuleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black font-mono shadow-[2px_2px_0px_#000]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-black mb-1">
                    Run ID
                  </label>
                  <input
                    type="text"
                    required
                    value={runId}
                    onChange={(e) => setRunId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black font-mono shadow-[2px_2px_0px_#000]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-black mb-1">
                    Score Before (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={scoreBefore}
                    onChange={(e) => setScoreBefore(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black font-mono shadow-[2px_2px_0px_#000]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-black mb-1">
                    Score After (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={scoreAfter}
                    onChange={(e) => setScoreAfter(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-black font-mono shadow-[2px_2px_0px_#000]"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-black mb-1">
                  Unified Prompt Diff
                </label>
                <textarea
                  rows={4}
                  required
                  value={diffText}
                  onChange={(e) => setDiffText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf9f5] border-2 border-black font-mono text-[11px] shadow-[2px_2px_0px_#000]"
                />
              </div>

              <button
                type="submit"
                disabled={generatingPR}
                className="w-full py-3 rounded-xl bg-black text-white hover:bg-neutral-800 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#ff90e8] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
              >
                {generatingPR ? "Formatting PR..." : "Generate CI/CD Pull Request"}
              </button>
            </form>
          </div>

          {/* PR Output Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-black stroke-[2.5]" />
                  <h3 className="font-black uppercase text-base text-black font-display">
                    GitHub PR Artifact Preview
                  </h3>
                </div>
                {prResult && (
                  <button
                    onClick={copyPRBody}
                    className="inline-flex items-center gap-1 text-xs font-black uppercase text-black hover:underline"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied!" : "Copy Body"}</span>
                  </button>
                )}
              </div>

              {prResult ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-purple-50 border-2 border-black space-y-1">
                    <span className="text-[10px] uppercase font-black text-gray-600 block">
                      Autonomous Branch
                    </span>
                    <div className="font-mono font-black text-black">
                      {prResult.branch_name}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-black text-gray-600 block mb-1">
                      Pull Request Title
                    </span>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-black font-bold text-black">
                      {prResult.pr_title}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-black text-gray-600 block mb-1">
                      Generated Markdown PR Description
                    </span>
                    <pre className="p-3 rounded-xl bg-[#faf9f5] border-2 border-black font-mono text-[10px] whitespace-pre-wrap max-h-56 overflow-y-auto font-semibold">
                      {prResult.pr_body_markdown}
                    </pre>
                  </div>

                  <a
                    href={prResult.github_pr_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-brutal-yellow hover:bg-yellow-300 border-2 border-black text-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000]"
                  >
                    <span>Open GitHub Pull Request</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </a>
                </div>
              ) : (
                <div className="p-12 text-center text-xs font-semibold text-gray-600 rounded-xl bg-[#faf9f5] border-2 border-dashed border-black">
                  Fill in the benchmark run details and click &quot;Generate CI/CD Pull Request&quot; to inspect the PR artifact.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

