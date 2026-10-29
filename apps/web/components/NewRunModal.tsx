"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, X, CheckSquare, Square, Shield, 
  Coins, Sparkles, AlertCircle, ArrowRight
} from "lucide-react";

interface Target {
  id: string;
  name: string;
  phone_number: string;
  bolna_agent_id?: string;
  staging_agent_id?: string;
  languages: string[];
}

interface Scenario {
  id: string;
  title: string;
  language: string;
  persona: string;
  goal: string;
  behavior_flags: string[];
  rule_ids: string[];
}

interface NewRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  targets: Target[];
  onRunLaunched?: (runId: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const NewRunModal: React.FC<NewRunModalProps> = ({
  isOpen,
  onClose,
  targets,
  onRunLaunched
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [suiteName, setSuiteName] = useState("Custom TRAI Compliance Benchmark");
  const [loading, setLoading] = useState(false);
  const [fetchingScenarios, setFetchingScenarios] = useState(true);
  const [filterLang, setFilterLang] = useState<string>("All");

  useEffect(() => {
    if (targets.length > 0 && !selectedTargetId) {
      setSelectedTargetId(targets[0].id);
    }
  }, [targets]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchScenarios = async () => {
      try {
        setFetchingScenarios(true);
        const res = await fetch(`${API_BASE}/runs/scenarios/catalog`);
        if (res.ok) {
          const data: Scenario[] = await res.json();
          setScenarios(data);
          // By default, select all scenarios
          setSelectedScenarioIds(data.map((s) => s.id));
        }
      } catch (err) {
        console.error("Failed to load scenario catalog:", err);
      } finally {
        setFetchingScenarios(false);
      }
    };
    fetchScenarios();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleScenario = (id: string) => {
    setSelectedScenarioIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedScenarioIds(scenarios.map((s) => s.id));
  const deselectAll = () => setSelectedScenarioIds([]);
  const selectSingleForLiveTest = (id: string) => setSelectedScenarioIds([id]);

  const filteredScenarios = scenarios.filter((s) =>
    filterLang === "All" ? true : s.language.toLowerCase().includes(filterLang.toLowerCase())
  );

  const estimatedCost = (selectedScenarioIds.length * 0.03).toFixed(2);

  const handleLaunch = async () => {
    if (!selectedTargetId) {
      alert("Please select a target voice agent.");
      return;
    }
    if (selectedScenarioIds.length === 0) {
      alert("Please select at least 1 scenario to execute.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_id: selectedTargetId,
          suite_name: suiteName,
          scenario_ids: selectedScenarioIds
        })
      });

      if (res.ok) {
        const data = await res.json();
        onClose();
        if (onRunLaunched) {
          onRunLaunched(data.id);
        } else {
          window.location.href = `/runs/${data.id}`;
        }
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to launch run.");
      }
    } catch (err) {
      alert("Error launching run: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-surface border border-gold/40 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-charcoal-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
              <Play className="w-4 h-4 fill-gold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Launch Voice Benchmark Run
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
                  Pre-Flight Guard
                </span>
              </h2>
              <p className="text-xs text-charcoal-400">
                Select target, pick scenarios, and review safety budget before execution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-surfaceHover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Target Selector */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-200 mb-1.5">
              Select Voice Agent Target
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-charcoal-900 border border-border text-white text-xs font-medium focus:outline-none focus:border-gold"
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.phone_number}) — Staging: {t.staging_agent_id || "default"}
                </option>
              ))}
            </select>
          </div>

          {/* Suite Title */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-200 mb-1.5">
              Benchmark Suite Title
            </label>
            <input
              type="text"
              value={suiteName}
              onChange={(e) => setSuiteName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-charcoal-900 border border-border text-white text-xs focus:outline-none focus:border-gold"
            />
          </div>

          {/* Quick Scenario Preset Helpers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-charcoal-200">
                Select Scenarios ({selectedScenarioIds.length} of {scenarios.length} selected)
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-gold hover:underline font-medium"
                >
                  Select All
                </button>
                <span className="text-charcoal-600">&bull;</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-charcoal-400 hover:text-white font-medium"
                >
                  Clear
                </button>
                <span className="text-charcoal-600">&bull;</span>
                <button
                  type="button"
                  onClick={() => {
                    const first = scenarios[0];
                    if (first) selectSingleForLiveTest(first.id);
                  }}
                  className="text-emerald-400 hover:underline font-medium"
                  title="Selects 1 scenario to save Bolna credits on live testing"
                >
                  Single Test (Save Credits)
                </button>
              </div>
            </div>

            {/* Language Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {["All", "Hindi", "Hinglish", "Kannada", "English"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setFilterLang(lang)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    filterLang === lang
                      ? "bg-gold text-charcoal-900"
                      : "bg-charcoal-800 text-charcoal-400 hover:text-charcoal-200 border border-border"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Scenario Checklist */}
            {fetchingScenarios ? (
              <div className="p-6 text-center text-xs text-charcoal-400">Loading catalog...</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredScenarios.map((sc) => {
                  const isChecked = selectedScenarioIds.includes(sc.id);
                  return (
                    <div
                      key={sc.id}
                      onClick={() => toggleScenario(sc.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-charcoal-800/80 border-gold/40 text-white"
                          : "bg-charcoal-900/50 border-border/70 text-charcoal-400 hover:bg-charcoal-800/40"
                      }`}
                    >
                      <div className="mt-0.5 text-gold shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 fill-gold text-charcoal-900" />
                        ) : (
                          <Square className="w-4 h-4 text-charcoal-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold truncate text-white">
                            {sc.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-charcoal-700 text-charcoal-200 border border-border shrink-0">
                            {sc.language}
                          </span>
                        </div>
                        <p className="text-[11px] text-charcoal-400 line-clamp-1 mt-0.5">
                          {sc.goal}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Budget & Safety Warning Card */}
          <div className="p-4 rounded-xl bg-charcoal-900/90 border border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white">Estimated Cost</div>
                <div className="text-[11px] text-charcoal-400 font-mono">
                  {selectedScenarioIds.length} calls &bull; ~${estimatedCost} USD estimated
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/30">
                Safe Staging Target
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-charcoal-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-charcoal-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            disabled={loading || selectedScenarioIds.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-900 font-bold text-xs transition-transform active:scale-95 shadow-lg shadow-gold/20 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-charcoal-900" />
            {loading ? "Launching Call Sequence..." : `Dial & Benchmark (${selectedScenarioIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

