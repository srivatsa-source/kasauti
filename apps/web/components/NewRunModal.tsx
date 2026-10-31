"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, X, CheckSquare, Square, Shield, 
  Coins, Sparkles, AlertCircle, ArrowUpRight
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
  defaultTargetId?: string;
  onOpenImportModal?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

export const NewRunModal: React.FC<NewRunModalProps> = ({
  isOpen,
  onClose,
  targets,
  onRunLaunched,
  defaultTargetId,
  onOpenImportModal,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(defaultTargetId || "");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [suiteName, setSuiteName] = useState("Custom TRAI Compliance Benchmark");
  const [isSimulated, setIsSimulated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingScenarios, setFetchingScenarios] = useState(true);
  const [filterLang, setFilterLang] = useState<string>("All");

  useEffect(() => {
    if (defaultTargetId) {
      setSelectedTargetId(defaultTargetId);
    } else if (targets.length > 0 && !selectedTargetId) {
      setSelectedTargetId(targets[0].id);
    }
  }, [targets, defaultTargetId, selectedTargetId]);

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
          if (data.length > 0) {
            setSelectedScenarioIds([data[0].id]);
          }
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
          scenario_ids: selectedScenarioIds,
          simulation_mode: isSimulated
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white border-3 border-black shadow-[10px_10px_0px_#000000] overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brutal-pink border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#000]">
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase text-black font-display flex items-center gap-2">
                Launch Voice Benchmark Run
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brutal-yellow text-black border border-black shadow-[1px_1px_0px_#000]">
                  Pre-Flight
                </span>
              </h2>
              <p className="text-xs font-semibold text-gray-600">
                Select target, pick scenarios, and review safety budget before dialing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center font-black text-sm hover:bg-brutal-pink shadow-[1.5px_1.5px_0px_#000] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto bg-[#faf9f5]">
          
          {/* Target Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black uppercase text-black">
                Select Voice Agent Target
              </label>
              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  className="text-xs font-bold text-black underline hover:text-brutal-pink cursor-pointer"
                >
                  + Import from Bolna
                </button>
              )}
            </div>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black text-xs font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
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
            <label className="block text-xs font-black uppercase text-black mb-1.5">
              Benchmark Suite Title
            </label>
            <input
              type="text"
              value={suiteName}
              onChange={(e) => setSuiteName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
            />
          </div>

          {/* Execution Mode Selector */}
          <div>
            <label className="block text-xs font-black uppercase text-black mb-1.5">
              Benchmark Execution Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsSimulated(false)}
                className={`p-3 rounded-xl border-2 border-black text-left transition-all ${
                  !isSimulated
                    ? "bg-emerald-50 border-black shadow-[2px_2px_0px_#000]"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs text-black uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Real Bolna Telephony
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  Places actual phone call to recipient phone number
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsSimulated(true)}
                className={`p-3 rounded-xl border-2 border-black text-left transition-all ${
                  isSimulated
                    ? "bg-yellow-50 border-black shadow-[2px_2px_0px_#000]"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs text-black uppercase">
                  <span className="w-2 h-2 rounded-full bg-brutal-yellow" />
                  Simulated Dialogue
                </div>
                <div className="text-[11px] text-gray-600 mt-1">
                  Instant zero-credit testing (Runs simulated Indic persona dialogue)
                </div>
              </button>
            </div>
          </div>

          {/* Scenario Selection Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase text-black">
                Select Scenarios ({selectedScenarioIds.length} of {scenarios.length} selected)
              </label>
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-black hover:underline"
                >
                  Select All
                </button>
                <span className="text-black/30">&bull;</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-gray-500 hover:text-black"
                >
                  Clear
                </button>
                <span className="text-black/30">&bull;</span>
                <button
                  type="button"
                  onClick={() => {
                    const first = scenarios[0];
                    if (first) selectSingleForLiveTest(first.id);
                  }}
                  className="text-emerald-700 hover:underline font-extrabold"
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
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase transition-all ${
                    filterLang === lang
                      ? "bg-black text-white border-2 border-black shadow-[2px_2px_0px_#ff90e8]"
                      : "bg-white text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000] hover:bg-gray-100"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Scenario Checklist */}
            {fetchingScenarios ? (
              <div className="p-6 text-center text-xs font-bold text-gray-500">Loading catalog...</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredScenarios.map((sc) => {
                  const isChecked = selectedScenarioIds.includes(sc.id);
                  return (
                    <div
                      key={sc.id}
                      onClick={() => toggleScenario(sc.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isChecked
                          ? "bg-white border-black shadow-[3px_3px_0px_#000]"
                          : "bg-white/60 border-black/30 text-gray-600 hover:border-black"
                      }`}
                    >
                      <div className="mt-0.5 text-black shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 fill-black text-white stroke-[2.5]" />
                        ) : (
                          <Square className="w-4 h-4 text-black/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-xs text-black truncate">
                            {sc.title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-brutal-purple text-black border border-black shadow-[1px_1px_0px_#000] shrink-0">
                            {sc.language}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-600 line-clamp-1 mt-0.5">
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
          <div className="p-4 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brutal-green border-2 border-black flex items-center justify-center text-black font-black shadow-[1.5px_1.5px_0px_#000]">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="font-black uppercase text-black">Estimated Cost</div>
                <div className="text-[11px] text-gray-700 font-mono font-semibold">
                  {selectedScenarioIds.length} calls &bull; ~${estimatedCost} USD estimated
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-black bg-brutal-yellow px-2.5 py-1 rounded-full border border-black shadow-[1.5px_1.5px_0px_#000]">
                Safe Staging Target
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 border-black bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-black hover:underline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            disabled={loading || selectedScenarioIds.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#ff90e8] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {loading ? "Launching Call Sequence..." : `Dial & Benchmark (${selectedScenarioIds.length})`}
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
