"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, Play, Terminal, Phone, Copy, Check,
  ExternalLink, ArrowRight, Activity, Search, Shield
} from "lucide-react";
import { PurityScoreBadge } from "@/components/PurityScoreBadge";
import { LegalDisclaimerBanner } from "@/components/UnverifiedRuleBadge";
import { NewRunModal } from "@/components/NewRunModal";
import { RealtimeVoiceWaveform } from "@/components/RealtimeVoiceWaveform";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Target {
  id: string;
  name: string;
  phone_number: string;
  bolna_agent_id?: string;
  staging_agent_id?: string;
  languages: string[];
  notes?: string;
}

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

export default function HomePage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [runFilter, setRunFilter] = useState<"all" | "passed" | "failed">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  useEffect(() => {
    if (targets.length > 0 && !selectedTargetId) {
      setSelectedTargetId(targets[0].id);
    }
  }, [targets, selectedTargetId]);

  // New target form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+919876543210");
  const [bolnaAgentId, setBolnaAgentId] = useState("agent_prod_bharat");
  const [stagingAgentId, setStagingAgentId] = useState("kasauti_staging_bharat");
  const [notes, setNotes] = useState("You are an outbound customer assistance agent.");

  const fetchData = async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/targets`),
        fetch(`${API_BASE}/runs`)
      ]);
      if (tRes.ok) setTargets(await tRes.json());
      if (rRes.ok) setRuns(await rRes.json());
    } catch (err) {
      console.error("API error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone_number: phone,
          bolna_agent_id: bolnaAgentId,
          staging_agent_id: stagingAgentId,
          languages: ["Hindi", "Hinglish", "Kannada", "Indian English"],
          notes
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setName("");
        fetchData();
      }
    } catch {
      alert("Failed to create target");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerRun = async (targetId: string) => {
    try {
      const res = await fetch(`${API_BASE}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_id: targetId,
          suite_name: "TRAI Regulatory & Behavioral Pack"
        })
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/runs/${data.id}`;
      }
    } catch {
      alert("Failed to trigger run");
    }
  };

  // Metrics calculations
  const totalCalls = runs.reduce((acc, r) => acc + (r.total_calls || 0), 0);
  const avgPurity = runs.length > 0
    ? (runs.reduce((acc, r) => acc + r.purity_score, 0) / runs.length).toFixed(1)
    : "0.0";

  // Filtered runs
  const filteredRuns = runs.filter((r) => {
    if (runFilter === "passed") return r.purity_score >= 80;
    if (runFilter === "failed") return r.purity_score < 80;
    return true;
  }).filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.target_name || "").toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.suite_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Minimalist Technical Hero Strip */}
      <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-5 space-y-4 font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <h1 className="text-xl font-bold tracking-tight text-white uppercase">
                Kasauti // Touchstone
              </h1>
            </div>
            <p className="text-zinc-400 text-xs">
              Automated adversarial testing for Indian voice agents &bull; Hindi, Hinglish, Kannada &bull; TRAI Compliance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowRunModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-95 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Launch Benchmark</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Target</span>
            </button>

            <Link
              href="/knowledge"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Neural Topology</span>
            </Link>
          </div>
        </div>

        {/* 4-Column KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-zinc-900 text-xs">
          <div className="p-2.5 rounded-lg bg-black border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase block">Targets</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{targets.length}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-black border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase block">Benchmark Runs</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{runs.length}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-black border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase block">Purity Index</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{avgPurity}%</span>
          </div>

          <div className="p-2.5 rounded-lg bg-black border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase block">Dialects</span>
            <span className="text-lg font-bold text-white mt-0.5 block">HI &bull; HG &bull; KN &bull; EN</span>
          </div>
        </div>
      </div>

      {/* Targets Grid Section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono text-white uppercase tracking-tight">Registered Targets ({targets.length})</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>New Target</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-zinc-500">&gt; Loading target registry...</div>
        ) : targets.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <Phone className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="text-xs font-semibold text-white">No Targets Configured</div>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Add your voice agent phone number or staging agent ID to start automated benchmarking.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-3 py-1.5 rounded-md bg-white text-black font-semibold text-xs"
            >
              Add First Target
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {targets.map((target) => {
              const isSelected = selectedTargetId === target.id;
              return (
                <div
                  key={target.id}
                  onClick={() => setSelectedTargetId(target.id)}
                  className={`rounded-xl border p-5 transition-all flex flex-col justify-between group space-y-4 cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 border-white shadow-lg"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : "bg-zinc-600"}`} />
                          <h3 className="font-bold text-white text-sm truncate">
                            {target.name}
                          </h3>
                        </div>

                        <div className="text-xs font-mono text-zinc-400 mt-1 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{target.phone_number}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(target.phone_number, target.id);
                            }}
                            className="text-zinc-600 hover:text-white"
                            title="Copy phone"
                          >
                            {copiedId === target.id ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white text-black font-bold uppercase shrink-0">
                          SELECTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-500 border border-zinc-800 uppercase shrink-0">
                          Click to Select
                        </span>
                      )}
                    </div>

                    {/* Languages Tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {target.languages?.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 p-2.5 rounded bg-black border border-zinc-900 text-[11px] font-mono text-zinc-500 truncate">
                      Staging: {target.staging_agent_id || "kasauti_staging_default"}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTargetId(target.id);
                        setShowRunModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-transform active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>Benchmark Agent</span>
                    </button>

                    <span className="text-[11px] font-mono text-zinc-500">
                      12 checks &bull; TRAI
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Realtime Voice Agent Execution Waveform Oscilloscope */}
      <section className="space-y-2">
        <RealtimeVoiceWaveform
          isActive={false}
          statusText="Standby &bull; Opus 24kHz"
        />
      </section>

      {/* Benchmark Runs Table */}
      <section className="space-y-2 pt-1 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-tight">
            Benchmark Runs ({filteredRuns.length})
          </h2>

          <div className="flex items-center gap-2">
            {/* Search filter input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter runs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors w-40 sm:w-48"
              />
            </div>

            {/* Run Filter Pills */}
            <div className="flex rounded-md bg-zinc-950 border border-zinc-800 p-0.5 text-xs font-mono">
              <button
                onClick={() => setRunFilter("all")}
                className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                  runFilter === "all" ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRunFilter("passed")}
                className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                  runFilter === "passed" ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-white"
                }`}
              >
                Pass
              </button>
              <button
                onClick={() => setRunFilter("failed")}
                className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
                  runFilter === "failed" ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-white"
                }`}
              >
                Fail
              </button>
            </div>
          </div>
        </div>

        {runs.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-zinc-500 bg-zinc-950 rounded-xl border border-zinc-800">
            No test runs yet. Run a benchmark on any target above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Run ID</th>
                  <th className="px-5 py-3">Target</th>
                  <th className="px-5 py-3">Suite Name</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Purity Score</th>
                  <th className="px-5 py-3">Calls Passed</th>
                  <th className="px-5 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredRuns.slice(0, 8).map((run) => (
                  <tr key={run.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-400">
                      {run.id.slice(0, 8)}...
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-white">
                      {run.target_name || "Bharat FinServe"}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      {run.suite_name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        run.status === "completed" 
                          ? "bg-zinc-900 text-zinc-200 border border-zinc-700" 
                          : "bg-white text-black font-semibold animate-pulse"
                      }`}>
                        {run.status === "completed" ? "● Completed" : "◌ Running"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <PurityScoreBadge score={run.purity_score} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      <span className="text-white font-bold">{run.passed_calls}</span> / {run.total_calls}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/runs/${run.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 transition-colors text-[11px]"
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
      </section>

      {/* Add Target Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-black border border-zinc-800 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Add Voice Agent Target</h3>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Configure telephony target for automated regulatory benchmarking.
            </p>

            <form onSubmit={handleCreateTarget} className="mt-4 space-y-3 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 uppercase text-[10px]">
                  Agent Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Axis KYC Verification Agent"
                  className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 uppercase text-[10px]">
                  Recipient Phone Number (E.164)
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 uppercase text-[10px]">
                    Production Agent ID
                  </label>
                  <input
                    type="text"
                    value={bolnaAgentId}
                    onChange={(e) => setBolnaAgentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 uppercase text-[10px]">
                    Staging Agent ID
                  </label>
                  <input
                    type="text"
                    value={stagingAgentId}
                    onChange={(e) => setStagingAgentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 uppercase text-[10px]">
                  Current Prompt Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-white transition-colors font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors"
                >
                  {submitting ? "Saving..." : "Create Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Run Modal */}
      <NewRunModal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        targets={targets}
        initialTargetId={selectedTargetId}
      />
    </div>
  );
}
