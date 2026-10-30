"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, X, CheckSquare, Square, 
  Terminal, ShieldCheck, ArrowRight, Phone, Plus, Check
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
  initialTargetId?: string;
  onRunLaunched?: (runId: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const NewRunModal: React.FC<NewRunModalProps> = ({
  isOpen,
  onClose,
  targets: propTargets,
  initialTargetId,
  onRunLaunched
}) => {
  const [targets, setTargets] = useState<Target[]>(propTargets || []);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(initialTargetId || "");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [suiteName, setSuiteName] = useState("TRAI Regulatory & Behavioral Pack");
  const [loading, setLoading] = useState(false);
  const [fetchingScenarios, setFetchingScenarios] = useState(true);
  const [filterLang, setFilterLang] = useState<string>("All");

  // Inline quick target creation
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [newTargetName, setNewTargetName] = useState("");
  const [newTargetPhone, setNewTargetPhone] = useState("+919019823296");
  const [newTargetStaging, setNewTargetStaging] = useState("74bbf2a4-6561-48de-aec3-aafc7153bcd7");
  const [creatingTarget, setCreatingTarget] = useState(false);

  // Sync prop targets or fetch fresh from API
  useEffect(() => {
    if (propTargets && propTargets.length > 0) {
      setTargets(propTargets);
      if (!selectedTargetId) {
        setSelectedTargetId(initialTargetId || propTargets[0].id);
      }
    } else if (isOpen) {
      fetch(`${API_BASE}/targets`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setTargets(data);
            setSelectedTargetId(initialTargetId || data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [propTargets, isOpen, initialTargetId]);

  useEffect(() => {
    if (initialTargetId) {
      setSelectedTargetId(initialTargetId);
    }
  }, [initialTargetId]);

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

  const handleCreateInlineTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetName) return;
    setCreatingTarget(true);
    try {
      const res = await fetch(`${API_BASE}/targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTargetName,
          phone_number: newTargetPhone,
          bolna_agent_id: newTargetStaging,
          staging_agent_id: newTargetStaging,
          languages: ["Hindi", "Hinglish", "Kannada", "Indian English"]
        })
      });
      if (res.ok) {
        const created = await res.json();
        setTargets((prev) => [created, ...prev]);
        setSelectedTargetId(created.id);
        setShowInlineAdd(false);
        setNewTargetName("");
      }
    } catch (err) {
      alert("Failed to save target");
    } finally {
      setCreatingTarget(false);
    }
  };

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
        <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Target Selection Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase text-zinc-300 font-semibold flex items-center gap-1.5">
                <span>Select Voice Agent Target</span>
                <span className="text-zinc-600">({targets.length} available)</span>
              </label>

              <button
                type="button"
                onClick={() => setShowInlineAdd(!showInlineAdd)}
                className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{showInlineAdd ? "Cancel" : "Add Target"}</span>
              </button>
            </div>

            {/* Inline Quick Add Form if opened */}
            {showInlineAdd && (
              <form onSubmit={handleCreateInlineTarget} className="p-3 rounded-lg bg-zinc-950 border border-zinc-700 space-y-2.5 font-mono text-xs">
                <span className="text-[10px] uppercase text-white font-bold block">Quick Add New Agent Endpoint</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Agent Name (e.g. Kasauti CSA)"
                    value={newTargetName}
                    onChange={(e) => setNewTargetName(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Recipient Phone (+91...)"
                    value={newTargetPhone}
                    onChange={(e) => setNewTargetPhone(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-black border border-zinc-800 text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInlineAdd(false)}
                    className="px-2.5 py-1 rounded text-[11px] text-zinc-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTarget}
                    className="px-3 py-1 rounded bg-white text-black font-semibold text-[11px]"
                  >
                    {creatingTarget ? "Saving..." : "Save & Select"}
                  </button>
                </div>
              </form>
            )}

            {/* Visual Interactive Target Selection Cards */}
            {targets.length === 0 ? (
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-2">
                <p className="text-xs font-mono text-zinc-400">No voice targets currently registered.</p>
                <button
                  type="button"
                  onClick={() => setShowInlineAdd(true)}
                  className="px-3 py-1 rounded bg-white text-black text-xs font-semibold"
                >
                  Create First Target
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {targets.map((t) => {
                  const isSelected = selectedTargetId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTargetId(t.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-zinc-900 border-white text-white shadow-sm"
                          : "bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-zinc-600"}`} />
                            <span className="truncate">{t.name}</span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 mt-0.5 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-zinc-500" />
                            <span>{t.phone_number}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white text-black font-bold uppercase shrink-0">
                            SELECTED
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-[10px] font-mono text-zinc-500 truncate">
                        Staging: {t.staging_agent_id ? t.staging_agent_id.slice(0, 16) + "..." : "default"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Suite Title Input */}
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
              Benchmark Suite Title
            </label>
            <input
              type="text"
              value={suiteName}
              onChange={(e) => setSuiteName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-800 text-white text-xs font-mono focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Scenarios Header & Filter Controls */}
          <div className="pt-2 border-t border-zinc-900 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-mono uppercase text-zinc-300 font-semibold">
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
            <div className="flex flex-wrap gap-1 font-mono text-[10px]">
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
                &gt; Loading scenario catalog...
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
              <span className="text-[10px] text-zinc-500 block uppercase">Target Selected</span>
              <span className="text-zinc-300">
                {targets.find((t) => t.id === selectedTargetId)?.name || "None Selected"}
              </span>
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
            disabled={loading || selectedScenarioIds.length === 0 || !selectedTargetId}
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
