"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, CheckCircle2, XCircle, FileText, 
  MessageSquare, User, Bot, Shield, AlertTriangle
} from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { UnverifiedRuleBadge, LegalDisclaimerBanner } from "@/components/UnverifiedRuleBadge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    return <div className="p-12 text-center text-charcoal-400">Loading call execution details...</div>;
  }

  if (!call) {
    return <div className="p-12 text-center text-red-400">Call not found.</div>;
  }

  const turns = (call.transcript || "").split("\n").filter(Boolean);
  const passed = call.checks.length > 0 && call.checks.every((c) => c.passed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/runs/${call.run_id}`}
          className="inline-flex items-center gap-1.5 text-xs text-charcoal-400 hover:text-gold mb-2 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Benchmark Run
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              {call.scenario?.title || "Call Execution"}
            </h1>
            <p className="text-xs text-charcoal-400 font-mono mt-1">
              Execution ID: {call.bolna_execution_id || call.id} &bull; Cost: ${call.cost.toFixed(3)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-charcoal-700 text-charcoal-200 border border-border">
              {call.scenario?.language}
            </span>
            {passed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                PASS [Purity 100%]
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <XCircle className="w-4 h-4" />
                FAIL
              </span>
            )}
          </div>
        </div>
      </div>

      <LegalDisclaimerBanner />

      {/* Audio Waveform Player */}
      <AudioPlayer recordingUrl={call.recording_url} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transcript Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gold" />
                Conversational Transcript
              </h2>
              <span className="text-xs text-charcoal-400">{turns.length} turns</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {turns.length === 0 ? (
                <div className="text-xs text-charcoal-400 italic">No transcript recorded yet.</div>
              ) : (
                turns.map((line, idx) => {
                  const isAgent = line.toLowerCase().startsWith("agent:");
                  const text = isAgent ? line.replace(/^agent:\s*/i, "") : line.replace(/^user:\s*/i, "");

                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 text-xs leading-relaxed p-3 rounded-xl ${
                        isAgent 
                          ? "bg-charcoal-900 border border-border/70" 
                          : "bg-surfaceHover border border-border/40"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isAgent ? (
                          <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-charcoal-700 flex items-center justify-center text-charcoal-200">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-charcoal-400 text-[11px] mb-0.5">
                          {isAgent ? "Agent (Voice Bot)" : "User (Simulated Persona)"}
                        </div>
                        <div className="text-charcoal-200 whitespace-pre-wrap">{text}</div>
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
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              Scenario Persona &amp; Goal
            </h2>
            <div className="text-xs space-y-2 text-charcoal-400">
              <div>
                <strong className="text-charcoal-200 block mb-0.5">Persona:</strong>
                <p className="bg-charcoal-900/60 p-2.5 rounded-lg border border-border/60">
                  {call.scenario?.persona}
                </p>
              </div>
              <div>
                <strong className="text-charcoal-200 block mb-0.5">Test Goal:</strong>
                <p className="bg-charcoal-900/60 p-2.5 rounded-lg border border-border/60">
                  {call.scenario?.goal}
                </p>
              </div>
              <div>
                <strong className="text-charcoal-200 block mb-0.5">Expected Outcome:</strong>
                <p className="bg-charcoal-900/60 p-2.5 rounded-lg border border-border/60">
                  {call.scenario?.expected_outcome}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance & Quality Checks Checklist */}
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" />
                Compliance &amp; Quality Checks
              </h2>
              <span className="text-xs text-charcoal-400">{call.checks.length} evaluated</span>
            </div>

            <div className="space-y-2.5">
              {call.checks.map((chk) => (
                <div
                  key={chk.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    chk.passed 
                      ? "bg-emerald-950/20 border-emerald-800/40" 
                      : "bg-rose-950/20 border-rose-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span className="text-white capitalize">{chk.rule_id}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {chk.kind === "rule" && <UnverifiedRuleBadge />}
                      <span className="font-mono text-[11px] text-charcoal-400">
                        {chk.kind === "rubric" ? `${chk.score.toFixed(1)} / 5.0` : (chk.passed ? "1.0" : "0.0")}
                      </span>
                    </div>
                  </div>

                  <p className="text-charcoal-300 text-[11px] leading-relaxed pl-5">
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
