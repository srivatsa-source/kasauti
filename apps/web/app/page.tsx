"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Phone, Plus, Play, Sparkles, AlertCircle, 
  ExternalLink, ArrowRight, Activity
} from "lucide-react";
import { PurityScoreBadge } from "@/components/PurityScoreBadge";
import { LegalDisclaimerBanner } from "@/components/UnverifiedRuleBadge";

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
  const [submitting, setSubmitting] = useState(false);

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
    } catch (err) {
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
    } catch (err) {
      alert("Failed to trigger run");
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-surface border border-gold/30 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-xs font-bold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Voice Agent Touchstone
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Test it like gold before you dial.
          </h1>
          <p className="mt-3 text-charcoal-400 text-sm sm:text-base leading-relaxed">
            Kasauti places automated test calls across <strong className="text-charcoal-200">Hindi, Hinglish, Kannada & Indian English</strong>, checks TRAI-style compliance rules, identifies failures, and automatically patches your staging prompt.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 items-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-900 font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-gold/20"
          >
            <Plus className="w-4 h-4" />
            Add Voice Agent Target
          </button>
          {runs.length > 0 && (
            <Link
              href={`/runs/${runs[0].id}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surfaceHover hover:bg-charcoal-600 border border-border text-charcoal-200 hover:text-white font-medium text-sm transition-colors"
            >
              <Activity className="w-4 h-4 text-gold" />
              View Latest Benchmark ({runs[0].purity_score}% Purity)
            </Link>
          )}
        </div>
      </div>

      <LegalDisclaimerBanner />

      {/* Targets Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Voice Agent Targets</h2>
            <p className="text-xs text-charcoal-400">Agents monitored and benchmarked by Kasauti</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs text-gold hover:text-gold-light font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Target
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-charcoal-400">Loading targets...</div>
        ) : targets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface border border-border">
            <Phone className="w-10 h-10 text-charcoal-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No targets registered yet</h3>
            <p className="text-xs text-charcoal-400 mt-1">Add your voice agent phone number or staging agent ID to start testing.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-gold text-charcoal-900 text-xs font-bold"
            >
              Add First Target
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {targets.map((target) => (
              <div
                key={target.id}
                className="rounded-2xl bg-surface border border-border p-6 hover:border-gold/50 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-gold transition-colors">
                        {target.name}
                      </h3>
                      <div className="text-xs font-mono text-charcoal-400 mt-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gold/80" />
                        {target.phone_number}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {target.languages?.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-charcoal-700 text-charcoal-200 border border-border"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-charcoal-900/60 border border-border/60 text-xs font-mono text-charcoal-400 truncate">
                    Staging Agent: {target.staging_agent_id || "kasauti_staging_default"}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() => handleTriggerRun(target.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-dark text-charcoal-900 font-bold text-xs transition-transform active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-charcoal-900" />
                    Run 12 Scenarios
                  </button>

                  <span className="text-[11px] text-charcoal-400 font-medium">
                    12 checks &bull; TRAI pack
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Benchmark Runs Table */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Recent Test Runs</h2>
            <p className="text-xs text-charcoal-400">Purity scores and pass/fail distributions</p>
          </div>
          <Link href="/runs" className="text-xs text-gold hover:text-gold-light font-bold flex items-center gap-1">
            View All Runs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {runs.length === 0 ? (
          <div className="p-8 text-center text-charcoal-400 bg-surface rounded-xl border border-border">
            No test runs yet. Run a test on any target above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-900 border-b border-border text-charcoal-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Target</th>
                  <th className="px-6 py-3.5">Suite Name</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Purity Score</th>
                  <th className="px-6 py-3.5">Calls (Pass / Total)</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {runs.slice(0, 5).map((run) => (
                  <tr key={run.id} className="hover:bg-surfaceHover/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">
                      {run.target_name || "Bharat FinServe"}
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
                      <span className="text-emerald-400 font-bold">{run.passed_calls}</span> / {run.total_calls} passed
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/runs/${run.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surfaceHover hover:bg-charcoal-600 text-charcoal-200 hover:text-white font-semibold transition-colors"
                      >
                        Inspect Run
                        <ExternalLink className="w-3.5 h-3.5 text-gold" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-gold/40 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Voice Agent Target</h3>
            <p className="text-xs text-charcoal-400 mt-1">
              Configure target for mock simulation or real Bolna agent testing.
            </p>

            <form onSubmit={handleCreateTarget} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-200 mb-1">
                  Agent Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Axis KYC Verification Agent"
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-900 border border-border text-white text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-200 mb-1">
                  Recipient Phone Number (E.164)
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-900 border border-border text-white text-xs font-mono focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-200 mb-1">
                    Bolna Production Agent ID
                  </label>
                  <input
                    type="text"
                    value={bolnaAgentId}
                    onChange={(e) => setBolnaAgentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-charcoal-900 border border-border text-white text-xs font-mono focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-200 mb-1">
                    Staging Agent ID (Safe Patching)
                  </label>
                  <input
                    type="text"
                    value={stagingAgentId}
                    onChange={(e) => setStagingAgentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-charcoal-900 border border-border text-white text-xs font-mono focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-200 mb-1">
                  Current Agent Prompt Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-900 border border-border text-white text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-charcoal-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-gold hover:bg-gold-dark text-charcoal-900 font-bold text-xs transition-colors"
                >
                  {submitting ? "Saving..." : "Create Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
