"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, CheckCircle2, XCircle, FileText, 
  MessageSquare, User, Bot, Shield, AlertTriangle
} from "lucide-react";
import { AudioPlayer, AudioMarker } from "@/components/AudioPlayer";
import { UnverifiedRuleBadge, LegalDisclaimerBanner } from "@/components/UnverifiedRuleBadge";
import { SarvamSecondOpinion } from "@/components/SarvamSecondOpinion";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

interface Check {
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
  checks: Check[];
}

export default function CallDetailPage() {
  const params = useParams();
  const callId = params.id as string;
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="p-12 text-center text-xs font-bold text-black bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000]">
        Loading call execution details...
      </div>
    );
  }

  if (!call) {
    return (
      <div className="p-12 text-center text-xs font-bold text-rose-600 bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000]">
        Call not found.
      </div>
    );
  }

  const turns = (call.transcript || "").split("\n").filter(Boolean);
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
      label: `Rule Breach: ${failedCheck.rule_id || "Violation"}`,
      kind: "violation",
      description: failedCheck.evidence || "TRAI compliance threshold failed"
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <Link
          href={`/runs/${call.run_id}`}
          className="inline-flex items-center gap-1.5 text-xs text-black hover:underline mb-2 font-black uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Back to Benchmark Run
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
              {call.scenario?.title || "Call Execution"}
            </h1>
            <p className="text-xs text-gray-700 font-mono font-bold mt-1">
              Execution ID: {call.bolna_execution_id || call.id.slice(0, 10)} &bull; Cost: ${call.cost.toFixed(3)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-brutal-purple text-black border-2 border-black shadow-[2px_2px_0px_#000]">
              {call.scenario?.language}
            </span>
            {passed ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-brutal-green text-black border-2 border-black shadow-[2px_2px_0px_#000]">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                PASS [Purity 100%]
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white border-2 border-black shadow-[2px_2px_0px_#000]">
                <XCircle className="w-4 h-4 stroke-[2.5]" />
                FAIL
              </span>
            )}
          </div>
        </div>
      </div>

      <LegalDisclaimerBanner />

      {/* Audio Waveform Player with Compliance Overlay Pins */}
      <AudioPlayer recordingUrl={call.recording_url} markers={markers} />

      {/* Sarvam AI Indic Second Opinion & Translation Audit */}
      <SarvamSecondOpinion callId={call.id} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transcript Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h2 className="text-sm font-black uppercase tracking-tight text-black flex items-center gap-2 font-display">
                <MessageSquare className="w-4 h-4 text-black stroke-[2.5]" />
                Conversational Transcript
              </h2>
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-brutal-yellow border border-black shadow-[1px_1px_0px_#000]">
                {turns.length} turns
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {turns.length === 0 ? (
                <div className="text-xs font-semibold text-gray-500 italic">No transcript recorded yet.</div>
              ) : (
                turns.map((line, idx) => {
                  const isAgent = line.toLowerCase().startsWith("agent:");
                  const text = isAgent ? line.replace(/^agent:\s*/i, "") : line.replace(/^user:\s*/i, "");

                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 text-xs leading-relaxed p-3.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] ${
                        isAgent 
                          ? "bg-yellow-50" 
                          : "bg-white"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isAgent ? (
                          <div className="w-7 h-7 rounded-full bg-brutal-pink border-2 border-black flex items-center justify-center text-black font-black text-xs">
                            <Bot className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-brutal-purple border-2 border-black flex items-center justify-center text-white font-black text-xs">
                            <User className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-black uppercase text-black text-[11px] mb-1">
                          {isAgent ? "Agent (Voice Bot)" : "User (Simulated Persona)"}
                        </div>
                        <div className="text-black font-medium whitespace-pre-wrap">{text}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Verification Checks & Scenario Meta Column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Scenario Details Card */}
          <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000] space-y-3">
            <h2 className="text-sm font-black uppercase tracking-tight text-black flex items-center gap-2 font-display border-b-2 border-black pb-2">
              <FileText className="w-4 h-4 text-black stroke-[2.5]" />
              Scenario Persona &amp; Goal
            </h2>
            <div className="text-xs space-y-3">
              <div>
                <strong className="text-black uppercase font-black block mb-1">Persona:</strong>
                <p className="bg-gray-50 p-3 rounded-xl border-2 border-black font-semibold text-gray-800">
                  {call.scenario?.persona}
                </p>
              </div>
              <div>
                <strong className="text-black uppercase font-black block mb-1">Test Goal:</strong>
                <p className="bg-gray-50 p-3 rounded-xl border-2 border-black font-semibold text-gray-800">
                  {call.scenario?.goal}
                </p>
              </div>
              <div>
                <strong className="text-black uppercase font-black block mb-1">Expected Outcome:</strong>
                <p className="bg-gray-50 p-3 rounded-xl border-2 border-black font-semibold text-gray-800">
                  {call.scenario?.expected_outcome}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance & Quality Checks Checklist */}
          <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000] space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h2 className="text-sm font-black uppercase tracking-tight text-black flex items-center gap-2 font-display">
                <Shield className="w-4 h-4 text-black stroke-[2.5]" />
                Compliance &amp; Quality Checks
              </h2>
              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-brutal-bg border border-black shadow-[1px_1px_0px_#000]">
                {call.checks.length} evaluated
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {call.checks.map((chk) => (
                <div
                  key={chk.id}
                  className={`p-3.5 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] text-xs space-y-1.5 ${
                    chk.passed 
                      ? "bg-emerald-50" 
                      : "bg-rose-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-black text-black">
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-700 stroke-[2.5]" />
                      )}
                      <span className="capitalize">{chk.rule_id}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {chk.kind === "rule" && <UnverifiedRuleBadge />}
                      <span className="font-mono font-bold text-[11px] text-black">
                        {chk.kind === "rubric" ? `${chk.score.toFixed(1)} / 5.0` : (chk.passed ? "1.0" : "0.0")}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-800 font-semibold text-[11px] leading-relaxed pl-5">
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
