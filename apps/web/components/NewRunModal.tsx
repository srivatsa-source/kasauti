"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, X, CheckSquare, Square, 
  Terminal, ShieldCheck, ArrowRight
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
  const [suiteName, setSuiteName] = useState("TRAI Regulatory & Behavioral Pack");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-black border border-zinc-800 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">
                Benchmark Run Dispatcher
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                Pre-Flight Guard
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Target configuration, scenario checklist, and budget verification
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Target Selection */}
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
              Select Voice Agent Target
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:outline-none focus:border-white transition-colors"
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.phone_number}) &mdash; Staging: {t.staging_agent_id || "default"}
                </option>
              ))}
            </select>
          </div>

          {/* Suite Name */}
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
              Benchmark Suite Title
            </label>
            <input
              type="text"
              value={suiteName}
              onChange={(e) => setSuiteName(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Scenarios Header & Filter Controls */}
          <div className="pt-2 border-t border-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-mono uppercase text-zinc-300">
                Scenarios ({selectedScenarioIds.length} of {scenarios.length} selected)
              </label>

              <div className="flex items-center gap-2 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-zinc-300 hover:text-white underline"
                >
                  All
                </button>
                <span className="text-zinc-700">&bull;</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  Clear
                </button>
                <span className="text-zinc-700">&bull;</span>
                <button
                  type="button"
                  onClick={() => {
                    if (scenarios.length > 0) selectSingleForLiveTest(scenarios[0].id);
                  }}
                  className="text-white font-semibold underline"
                  title="Selects 1 call to minimize credit burn"
                >
                  [ 1 Live Test ]
                </button>
              </div>
            </div>

            {/* Language Filter Pills */}
            <div className="flex flex-wrap gap-1 mb-2 font-mono text-[10px]">
              {["All", "Hindi", "Hinglish", "Kannada", "English"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setFilterLang(lang)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    filterLang === lang
                      ? "bg-white text-black font-bold"
                      : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Scenarios List */}
            {fetchingScenarios ? (
              <div className="p-6 text-center text-xs font-mono text-zinc-500">
                &gt; Loading test scenario catalog...
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {filteredScenarios.map((sc) => {
                  const isChecked = selectedScenarioIds.includes(sc.id);
                  return (
                    <div
                      key={sc.id}
                      onClick={() => toggleScenario(sc.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-zinc-900/90 border-zinc-600 text-white"
                          : "bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:bg-zinc-900/40"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-3.5 h-3.5 rounded-sm bg-white text-black flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-sm border border-zinc-700 bg-zinc-950" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate text-zinc-200">
                            {sc.title}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 shrink-0">
                            {sc.language}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                          {sc.goal}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Telemetry Footer Card */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Estimated Spend</span>
              <span className="text-white font-bold">
                ${estimatedCost} USD <span className="text-zinc-600 font-normal">({selectedScenarioIds.length} calls)</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 block uppercase">Execution Safety</span>
              <span className="text-zinc-300">Staging Guard Active</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-mono text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleLaunch}
            disabled={loading || selectedScenarioIds.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-black" />
            <span>{loading ? "Dispatching..." : `Execute Benchmark (${selectedScenarioIds.length})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
