"use client";

import React, { useState } from "react";
import { 
  Sparkles, CheckCircle2, AlertCircle, Languages, 
  RefreshCw, Globe, Shield, ArrowRight, BookOpen
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
    <div className="p-6 rounded-2xl bg-surface border border-gold/40 shadow-xl space-y-4">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Languages className="w-4 h-4 text-gold" />
              Sarvam AI Indic &ldquo;Second Opinion&rdquo;
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold/15 text-gold border border-gold/30 uppercase tracking-wider">
              Mayura &bull; Saarika
            </span>
          </div>
          <p className="text-xs text-charcoal-400 mt-1">
            Independent vernacular audit checking regional phonetics, code-mixed nuances, and English translation.
          </p>
        </div>

        <button
          onClick={runVerification}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-900 font-bold text-xs transition-transform active:scale-95 shadow-lg shadow-gold/20 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Auditing Indic Nuances..." : data ? "Re-Run Sarvam Audit" : "Run Sarvam Audit"}
        </button>
      </div>

      {!data && !loading && (
        <div className="p-8 text-center rounded-xl bg-charcoal-900/40 border border-border/80">
          <Globe className="w-8 h-8 text-charcoal-600 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-charcoal-200">
            Audit Bharat-First Nuances &amp; Phonetics
          </h3>
          <p className="text-[11px] text-charcoal-400 max-w-md mx-auto mt-1">
            Click above to cross-reference this call with Sarvam AI&apos;s models for Hindi, Hinglish, and Kannada speech verification.
          </p>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center text-xs text-charcoal-400 animate-pulse">
          Connecting to Sarvam AI Mayura &amp; Saarika engines...
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-charcoal-900/70 border border-border">
              <span className="text-[10px] uppercase font-bold text-charcoal-400">
                Detected Dialect
              </span>
              <div className="text-xs font-bold text-white mt-1">
                {data.detected_dialect}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-900/70 border border-border">
              <span className="text-[10px] uppercase font-bold text-charcoal-400">
                Indic Phonetic Confidence
              </span>
              <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {data.indic_confidence_pct}% Accurate
              </div>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-900/70 border border-border">
              <span className="text-[10px] uppercase font-bold text-charcoal-400">
                Etiquette &amp; Respect Index
              </span>
              <div className="text-xs font-bold text-gold mt-1">
                {data.cultural_etiquette_audit.respectful_greeting ? "Pass (Tehzeeb Verified)" : "Direct Tone"}
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b border-border text-xs gap-4">
            <button
              onClick={() => setActiveTab("diff")}
              className={`pb-2 font-bold transition-colors ${
                activeTab === "diff"
                  ? "border-b-2 border-gold text-gold"
                  : "text-charcoal-400 hover:text-white"
              }`}
            >
              Turn-by-Turn Indic Diff
            </button>
            <button
              onClick={() => setActiveTab("translation")}
              className={`pb-2 font-bold transition-colors ${
                activeTab === "translation"
                  ? "border-b-2 border-gold text-gold"
                  : "text-charcoal-400 hover:text-white"
              }`}
            >
              Sarvam English Translation
            </button>
            <button
              onClick={() => setActiveTab("culture")}
              className={`pb-2 font-bold transition-colors ${
                activeTab === "culture"
                  ? "border-b-2 border-gold text-gold"
                  : "text-charcoal-400 hover:text-white"
              }`}
            >
              Cultural Etiquette &amp; Honorifics
            </button>
          </div>

          {/* Tab 1: Diff */}
          {activeTab === "diff" && (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {data.turn_comparisons.map((turn) => (
                <div
                  key={turn.turn_index}
                  className="p-3 rounded-xl bg-charcoal-900 border border-border text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-charcoal-400 font-mono">
                    <span className="capitalize font-bold text-gold">Turn {turn.turn_index} ({turn.speaker})</span>
                    <span className="px-1.5 py-0.5 rounded bg-charcoal-800 text-charcoal-200 border border-border">
                      {turn.indic_features_detected}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded bg-surfaceHover/60 border border-border/40">
                      <span className="text-[10px] uppercase font-bold text-charcoal-400 block mb-0.5">
                        Primary ASR (Deepgram/Bolna)
                      </span>
                      <p className="text-charcoal-200 text-xs">{turn.bolna_text}</p>
                    </div>
                    <div className="p-2 rounded bg-gold/5 border border-gold/20">
                      <span className="text-[10px] uppercase font-bold text-gold block mb-0.5">
                        Sarvam Indic Verification
                      </span>
                      <p className="text-white text-xs">{turn.sarvam_gloss}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Translation */}
          {activeTab === "translation" && (
            <div className="p-4 rounded-xl bg-charcoal-900 border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <BookOpen className="w-4 h-4 text-gold" />
                English Translation by Sarvam Mayura v1
              </div>
              <p className="text-xs text-charcoal-300 leading-relaxed whitespace-pre-wrap font-mono p-3 rounded-lg bg-surfaceHover/80 border border-border/40">
                {data.english_translation || "No translated text available."}
              </p>
            </div>
          )}

          {/* Tab 3: Cultural Etiquette */}
          {activeTab === "culture" && (
            <div className="p-4 rounded-xl bg-charcoal-900 border border-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Shield className="w-4 h-4 text-gold" />
                Indian Telephone Etiquette &amp; Code-Mixing Audit
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <span className="text-charcoal-400 block mb-1">Namaste / Greeting</span>
                  <span className="font-bold text-emerald-400">
                    {data.cultural_etiquette_audit.respectful_greeting ? "✓ Present in Turn 1" : "✗ Missing"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <span className="text-charcoal-400 block mb-1">Honorifics (&apos;Ji&apos; / &apos;Aap&apos;)</span>
                  <span className="font-bold text-emerald-400">
                    {data.cultural_etiquette_audit.honorific_usage ? "✓ Polite Register" : "Neutral Register"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-border">
                  <span className="text-charcoal-400 block mb-1">Code-Switching Intact</span>
                  <span className="font-bold text-emerald-400">✓ No Translation Artifacts</span>
                </div>
              </div>
              <p className="text-[11px] text-charcoal-400 italic">
                {data.cultural_etiquette_audit.verdict}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

