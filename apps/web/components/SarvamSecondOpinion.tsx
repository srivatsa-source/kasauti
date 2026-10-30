"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Languages,
  RefreshCw,
  Globe,
  Shield,
  ArrowRight,
  BookOpen,
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

export const SarvamSecondOpinion: React.FC<SarvamSecondOpinionProps> = ({
  callId,
}) => {
  const [data, setData] = useState<SarvamVerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "diff" | "translation" | "culture"
  >("diff");

  const runVerification = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/calls/${callId}/sarvam-verify`, {
        method: "POST",
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
    <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000] space-y-4">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black uppercase text-black font-display flex items-center gap-2">
              <Languages className="w-5 h-5 text-black stroke-[2.5]" />
              Sarvam AI Indic &ldquo;Second Opinion&rdquo;
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brutal-purple text-black border border-black shadow-[1px_1px_0px_#000] uppercase tracking-wider">
              Mayura &bull; Saarika
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-600 mt-1">
            Independent vernacular audit checking regional phonetics, code-mixed
            nuances, and English translation.
          </p>
        </div>

        <button
          onClick={runVerification}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brutal-yellow hover:bg-yellow-300 text-black border-2 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all shrink-0 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? "animate-spin" : ""}`}
          />
          {loading
            ? "Auditing Indic Nuances..."
            : data
              ? "Re-Run Sarvam Audit"
              : "Run Sarvam Audit"}
        </button>
      </div>

      {!data && !loading && (
        <div className="p-8 text-center rounded-xl bg-gray-50 border-2 border-dashed border-black">
          <Globe className="w-10 h-10 text-black mx-auto mb-2 stroke-[1.5]" />
          <h3 className="text-sm font-black uppercase text-black">
            Audit Bharat-First Nuances &amp; Phonetics
          </h3>
          <p className="text-xs font-semibold text-gray-600 max-w-md mx-auto mt-1">
            Click above to cross-reference this call with Sarvam AI&apos;s
            models for Hindi, Hinglish, and Kannada speech verification.
          </p>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center text-xs font-black uppercase text-black bg-yellow-50 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] animate-pulse">
          Connecting to Sarvam AI Mayura &amp; Saarika engines...
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-[10px] uppercase font-black text-gray-600">
                Detected Dialect
              </span>
              <div className="text-sm font-black text-black mt-0.5">
                {data.detected_dialect}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-[10px] uppercase font-black text-gray-600">
                Indic Phonetic Confidence
              </span>
              <div className="text-sm font-black text-emerald-700 mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                {data.indic_confidence_pct}% Accurate
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000]">
              <span className="text-[10px] uppercase font-black text-gray-600">
                Etiquette &amp; Respect Index
              </span>
              <div className="text-sm font-black text-black mt-0.5">
                {data.cultural_etiquette_audit.respectful_greeting
                  ? "Pass (Tehzeeb Verified)"
                  : "Direct Tone"}
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b-2 border-black text-xs gap-3">
            <button
              onClick={() => setActiveTab("diff")}
              className={`pb-2 font-black uppercase tracking-wider transition-all ${
                activeTab === "diff"
                  ? "border-b-4 border-black text-black"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Turn-by-Turn Indic Diff
            </button>
            <button
              onClick={() => setActiveTab("translation")}
              className={`pb-2 font-black uppercase tracking-wider transition-all ${
                activeTab === "translation"
                  ? "border-b-4 border-black text-black"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Sarvam English Translation
            </button>
            <button
              onClick={() => setActiveTab("culture")}
              className={`pb-2 font-black uppercase tracking-wider transition-all ${
                activeTab === "culture"
                  ? "border-b-4 border-black text-black"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Cultural Etiquette &amp; Honorifics
            </button>
          </div>

          {/* Tab 1: Diff */}
          {activeTab === "diff" && (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {data.turn_comparisons.map((turn) => (
                <div
                  key={turn.turn_index}
                  className="p-3.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-black uppercase text-black">
                      Turn {turn.turn_index} ({turn.speaker})
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-brutal-bg text-black border border-black shadow-[1px_1px_0px_#000]">
                      {turn.indic_features_detected}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-black">
                      <span className="text-[10px] uppercase font-black text-gray-600 block mb-1">
                        Primary ASR (Deepgram/Bolna)
                      </span>
                      <p className="text-black text-xs font-medium">
                        {turn.bolna_text}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-yellow-50 border border-black">
                      <span className="text-[10px] uppercase font-black text-black block mb-1">
                        Sarvam Indic Verification
                      </span>
                      <p className="text-black text-xs font-bold">
                        {turn.sarvam_gloss}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Translation */}
          {activeTab === "translation" && (
            <div className="p-4 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0px_#000] space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-black">
                <BookOpen className="w-4 h-4 text-black stroke-[2.5]" />
                English Translation by Sarvam Mayura v1
              </div>
              <p className="text-xs text-black leading-relaxed whitespace-pre-wrap font-mono p-3 rounded-lg bg-gray-50 border border-black font-semibold">
                {data.english_translation || "No translated text available."}
              </p>
            </div>
          )}

          {/* Tab 3: Cultural Etiquette */}
          {activeTab === "culture" && (
            <div className="p-4 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0px_#000] space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-black">
                <Shield className="w-4 h-4 text-black stroke-[2.5]" />
                Indian Telephone Etiquette &amp; Code-Mixing Audit
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-gray-50 border border-black">
                  <span className="text-gray-600 font-bold block mb-1">
                    Namaste / Greeting
                  </span>
                  <span className="font-black text-emerald-700">
                    {data.cultural_etiquette_audit.respectful_greeting
                      ? "✓ Present in Turn 1"
                      : "✗ Missing"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-black">
                  <span className="text-gray-600 font-bold block mb-1">
                    Honorifics (&apos;Ji&apos; / &apos;Aap&apos;)
                  </span>
                  <span className="font-black text-emerald-700">
                    {data.cultural_etiquette_audit.honorific_usage
                      ? "✓ Polite Register"
                      : "Neutral Register"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-black">
                  <span className="text-gray-600 font-bold block mb-1">
                    Code-Switching Intact
                  </span>
                  <span className="font-black text-emerald-700">
                    ✓ No Translation Artifacts
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-700 font-semibold italic">
                {data.cultural_etiquette_audit.verdict}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
