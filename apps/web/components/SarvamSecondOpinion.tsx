"use client";

import React, { useState } from "react";
import { 
  Check, RefreshCw, Terminal, 
  ArrowRight, Shield, Layers, FileText
} from "lucide-react";

interface TurnComparison {
  turn_index: number;
  speaker: string;
  bolna_text: string;
  sarvam_gloss: string;
  indic_features_detected: string;
}

interface CulturalAudit {
  respectful_greeting: boolean;
  honorific_usage: boolean;
  code_mixing_intact: boolean;
  verdict: string;
}

interface SarvamVerificationData {
  call_id: string;
  bolna_transcript: string;
  sarvam_indic_stt: string;
  english_translation: string;
  indic_confidence_pct: number;
  detected_dialect: string;
  discrepancies_detected: number;
  turn_comparisons: TurnComparison[];
  cultural_etiquette_audit: CulturalAudit;
}

interface SarvamSecondOpinionProps {
  callId: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const SarvamSecondOpinion: React.FC<SarvamSecondOpinionProps> = ({ callId }) => {
  const [data, setData] = useState<SarvamVerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"diff" | "translation" | "culture">("diff");

  const runVerification = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/calls/${callId}/sarvam-verify`, {
        method: "POST"
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        alert("Sarvam verification request failed.");
      }
    } catch (err) {
      alert("Error querying Sarvam AI: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white" />
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">
              Sarvam AI Indic Second Opinion
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-800 uppercase">
              Saarika STT &bull; Mayura
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Independent vernacular audit verifying regional phonetics, code-mixed Hinglish/Kannada, and etiquette.
          </p>
        </div>

        <button
          onClick={runVerification}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Auditing Indic Stream..." : data ? "Re-Run Audit" : "Run Sarvam Audit"}
        </button>
      </div>

      {!data && !loading && (
        <div className="p-8 text-center rounded-lg bg-black border border-zinc-900 space-y-2">
          <Terminal className="w-6 h-6 text-zinc-600 mx-auto" />
          <h3 className="text-xs font-semibold text-zinc-300">
            Awaiting Vernacular Verification
          </h3>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
            Run an independent cross-reference of this audio against Sarvam AI Saarika v2 Indic speech models.
          </p>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center text-xs text-zinc-400 font-mono animate-pulse">
          &gt; Querying Sarvam Indic STT and Translation API endpoints...
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-black border border-zinc-800">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                Detected Dialect
              </span>
              <div className="text-xs font-semibold text-white">
                {data.detected_dialect}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black border border-zinc-800">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                Phonetic Confidence
              </span>
              <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-white" />
                {data.indic_confidence_pct}% Accurate
              </div>
            </div>

            <div className="p-3 rounded-lg bg-black border border-zinc-800">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                Etiquette (Tehzeeb)
              </span>
              <div className="text-xs font-mono text-zinc-200">
                {data.cultural_etiquette_audit.respectful_greeting ? "Pass (Formal Respect)" : "Direct Register"}
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-zinc-800 text-xs gap-4 font-mono">
            <button
              onClick={() => setActiveTab("diff")}
              className={`pb-2 transition-colors ${
                activeTab === "diff"
                  ? "border-b-2 border-white text-white font-bold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              [ Turn-by-Turn Diff ]
            </button>
            <button
              onClick={() => setActiveTab("translation")}
              className={`pb-2 transition-colors ${
                activeTab === "translation"
                  ? "border-b-2 border-white text-white font-bold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              [ English Translation ]
            </button>
            <button
              onClick={() => setActiveTab("culture")}
              className={`pb-2 transition-colors ${
                activeTab === "culture"
                  ? "border-b-2 border-white text-white font-bold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              [ Cultural Etiquette Audit ]
            </button>
          </div>

          {/* Tab 1: Diff View */}
          {activeTab === "diff" && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {data.turn_comparisons.map((turn) => (
                <div
                  key={turn.turn_index}
                  className="p-3 rounded-lg bg-black border border-zinc-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 border-b border-zinc-900 pb-1.5">
                    <span className="uppercase text-white font-semibold">Turn {turn.turn_index} &bull; {turn.speaker}</span>
                    <span className="text-zinc-400">{turn.indic_features_detected}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/60">
                      <span className="text-[10px] uppercase text-zinc-500 block mb-1">
                        Primary ASR (Deepgram / Bolna)
                      </span>
                      <p className="text-zinc-300 leading-relaxed">{turn.bolna_text}</p>
                    </div>

                    <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-700/60">
                      <span className="text-[10px] uppercase text-zinc-300 block mb-1 font-semibold">
                        Sarvam Saarika Indic Audit
                      </span>
                      <p className="text-white leading-relaxed">{turn.sarvam_gloss}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Translation */}
          {activeTab === "translation" && (
            <div className="p-4 rounded-lg bg-black border border-zinc-800 space-y-2 font-mono text-xs">
              <span className="text-[10px] uppercase text-zinc-500 block">
                Sarvam Mayura v1 Translation
              </span>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap p-3 rounded bg-zinc-950 border border-zinc-800">
                {data.english_translation || "No translated text available."}
              </p>
            </div>
          )}

          {/* Tab 3: Cultural Etiquette */}
          {activeTab === "culture" && (
            <div className="p-4 rounded-lg bg-black border border-zinc-800 space-y-3 font-mono text-xs">
              <span className="text-[10px] uppercase text-zinc-500 block">
                Indian Telecom Behavioral Checks
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] mb-1">Greeting Disclosure</span>
                  <span className="text-white font-bold">
                    {data.cultural_etiquette_audit.respectful_greeting ? "PASS [Namaste / Ji]" : "FAIL [Missing]"}
                  </span>
                </div>
                <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] mb-1">Honorific Register</span>
                  <span className="text-white font-bold">
                    {data.cultural_etiquette_audit.honorific_usage ? "PASS [Aap / Ji]" : "NEUTRAL [Tum / Direct]"}
                  </span>
                </div>
                <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] mb-1">Code-Switching</span>
                  <span className="text-white font-bold">PASS [Natural Mix]</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                {data.cultural_etiquette_audit.verdict}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
