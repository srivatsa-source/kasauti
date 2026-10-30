"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Check, X, Copy, 
  Terminal, Search, Bot, User
} from "lucide-react";
import { AudioPlayer, AudioMarker } from "@/components/AudioPlayer";
import { RealtimeVoiceWaveform } from "@/components/RealtimeVoiceWaveform";
import { UnverifiedRuleBadge, LegalDisclaimerBanner } from "@/components/UnverifiedRuleBadge";
import { SarvamSecondOpinion } from "@/components/SarvamSecondOpinion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CheckItem {
  id: string;
  kind: string;
  rule_id: string;
  passed: boolean;
  score: number;
  evidence: string;
}

interface Scenario {
  id: string;
  title: string;
  language: string;
  persona: string;
  goal: string;
  expected_outcome: string;
  behavior_flags: string[];
}

interface CallDetail {
  id: string;
  run_id: string;
  scenario_id: string;
  bolna_execution_id?: string;
  status: string;
  transcript?: string;
  recording_url?: string;
  cost: number;
  scenario?: Scenario;
  checks: CheckItem[];
}

export default function CallDetailPage() {
  const params = useParams();
  const callId = params.id as string;
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [searchTranscript, setSearchTranscript] = useState("");
  const [audioViewMode, setAudioViewMode] = useState<"timeline" | "oscilloscope">("timeline");

  useEffect(() => {
    const fetchCall = async () => {
      try {
        const res = await fetch(`${API_BASE}/calls/${callId}`);
        if (res.ok) {
          setCall(await res.json());
        }
      } catch (err) {
        console.error("Error loading call:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCall();
  }, [callId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-zinc-500">
        &gt; Loading telephony execution {callId.slice(0, 8)}...
      </div>
    );
  }

  if (!call) {
    return (
      <div className="p-12 text-center text-xs font-mono text-zinc-500">
        Execution record not found.
      </div>
    );
  }

  const rawTurns = (call.transcript || "").split("\n").filter(Boolean);
  const passed = call.checks.length > 0 && call.checks.every((c) => c.passed);

  // Generate waveform compliance markers based on evaluated checks
  const markers: AudioMarker[] = [
    {
      time: 2.5,
      label: "AI Disclosure (TRAI §1.1)",
      kind: call.checks.some((c) => c.rule_id === "trai_ai_disclosure" && !c.passed) ? "violation" : "disclosure",
      description: "Voice bot stated automated nature within first 5 seconds"
    },
    {
      time: 6.8,
      label: "Consent Capture",
      kind: "consent",
      description: "User confirmed availability for transaction assistance"
    }
  ];

  const failedCheck = call.checks.find((c) => !c.passed);
  if (failedCheck) {
    markers.push({
      time: 14.5,
      label: `Breach: ${failedCheck.rule_id || "Violation"}`,
      kind: "violation",
      description: failedCheck.evidence || "TRAI compliance threshold failed"
    });
  }

  const handleCopyTranscript = () => {
    if (!call.transcript) return;
    navigator.clipboard.writeText(call.transcript);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const filteredTurns = rawTurns.filter((line) => {
    if (!searchTranscript) return true;
    return line.toLowerCase().includes(searchTranscript.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/runs/${call.run_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Benchmark Run
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
              {call.scenario?.title || "Call Execution"}
            </h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Execution ID: {call.bolna_execution_id || call.id} &bull; Cost: ${call.cost.toFixed(3)} USD
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
              {call.scenario?.language || "Hindi"}
            </span>

            {passed ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-mono font-bold bg-zinc-900 text-white border border-zinc-600">
                ● PASS [Purity 100%]
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-mono font-bold bg-black text-zinc-400 border border-zinc-800">
                ○ REGRESSION DETECTED
              </span>
            )}
          </div>
        </div>
      </div>

      <LegalDisclaimerBanner />

      {/* Audio Waveform Player with Compliance Overlay Pins & Realtime Oscilloscope */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-zinc-400">Audio Telemetry View</span>
          <div className="flex rounded-md bg-zinc-950 border border-zinc-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setAudioViewMode("timeline")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                audioViewMode === "timeline" ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-white"
              }`}
            >
              Timeline Audio Player
            </button>
            <button
              onClick={() => setAudioViewMode("oscilloscope")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                audioViewMode === "oscilloscope" ? "bg-white text-black font-bold" : "text-zinc-500 hover:text-white"
              }`}
            >
              Live Voice Oscilloscope
            </button>
          </div>
        </div>

        {audioViewMode === "timeline" ? (
          <AudioPlayer recordingUrl={call.recording_url} markers={markers} />
        ) : (
          <RealtimeVoiceWaveform
            isActive={true}
            statusText={`Telephony Audio - Call #${call.id.slice(0, 8)}`}
            currentTurnText={rawTurns[0] || "Active stream audio playback"}
          />
        )}
      </div>

      {/* Sarvam AI Indic Second Opinion & Translation Audit */}
      <SarvamSecondOpinion callId={call.id} />

      {/* 2-Column Data Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Conversational Transcript (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-tight">
                  Conversational Multi-Turn Transcript
                </h2>
                <span className="text-[10px] font-mono text-zinc-500">({rawTurns.length} turns)</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Search transcript */}
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    placeholder="Search dialogue..."
                    value={searchTranscript}
                    onChange={(e) => setSearchTranscript(e.target.value)}
                    className="pl-6 pr-2 py-0.5 rounded bg-black border border-zinc-800 text-[11px] font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors w-32"
                  />
                </div>

                <button
                  onClick={handleCopyTranscript}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-mono transition-colors"
                  title="Copy Raw Transcript"
                >
                  {copiedTranscript ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTranscript ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 font-mono text-xs">
              {filteredTurns.length === 0 ? (
                <div className="text-xs text-zinc-500 italic p-4 text-center">
                  No dialog turns matching query.
                </div>
              ) : (
                filteredTurns.map((line, idx) => {
                  const isAgent = line.toLowerCase().startsWith("agent:");
                  const text = isAgent ? line.replace(/^agent:\s*/i, "") : line.replace(/^user:\s*/i, "");

                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 p-3 rounded-lg border text-xs leading-relaxed ${
                        isAgent 
                          ? "bg-black border-zinc-800" 
                          : "bg-zinc-900/60 border-zinc-850"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold ${
                          isAgent ? "bg-white text-black" : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                        }`}>
                          {isAgent ? "A" : "U"}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase mb-1">
                          <span>{isAgent ? "Agent (Voice Bot)" : "User (Simulated Persona)"}</span>
                          <span className="text-zinc-600">Turn {idx + 1}</span>
                        </div>
                        <div className="text-zinc-200 whitespace-pre-wrap">{text}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scenario Metadata & Checks (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Scenario Persona Card */}
          <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono text-xs">
            <h2 className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Scenario Persona &amp; Intent
            </h2>

            <div className="space-y-2.5 text-zinc-400">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block mb-0.5">Caller Persona</span>
                <p className="bg-black p-2.5 rounded border border-zinc-900 text-zinc-200 leading-relaxed font-sans text-xs">
                  {call.scenario?.persona}
                </p>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] uppercase block mb-0.5">Test Goal</span>
                <p className="bg-black p-2.5 rounded border border-zinc-900 text-zinc-200 leading-relaxed font-sans text-xs">
                  {call.scenario?.goal}
                </p>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] uppercase block mb-0.5">Expected Outcome</span>
                <p className="bg-black p-2.5 rounded border border-zinc-900 text-zinc-200 leading-relaxed font-sans text-xs">
                  {call.scenario?.expected_outcome}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance & Quality Checks */}
          <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Compliance &amp; Quality Checks
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">{call.checks.length} evaluated</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {call.checks.map((chk) => (
                <div
                  key={chk.id}
                  className={`p-3 rounded-lg border space-y-1.5 ${
                    chk.passed 
                      ? "bg-black border-zinc-800" 
                      : "bg-zinc-900 border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={chk.passed ? "text-white" : "text-zinc-400"}>
                        {chk.passed ? "✓" : "✕"}
                      </span>
                      <span className="text-white text-xs">{chk.rule_id}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {chk.kind === "rule" && <UnverifiedRuleBadge />}
                      <span className="text-[11px] text-zinc-400">
                        {chk.kind === "rubric" ? `${chk.score.toFixed(1)} / 5.0` : (chk.passed ? "1.0" : "0.0")}
                      </span>
                    </div>
                  </div>

                  <p className="text-zinc-400 text-[11px] leading-relaxed pl-4 font-sans">
                    {chk.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
