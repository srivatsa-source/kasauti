"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Shield, ShieldAlert, Zap, 
  Terminal, Activity, Clock, CheckCircle2, AlertTriangle, RefreshCw
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SentinelMetric {
  total_chunks_processed: int;
  interceptions_triggered: int;
  avg_latency_ms: float;
  violations_prevented: Record<string, number>;
  system_status: string;
}

interface InterceptionLog {
  action: string;
  modified_text: string;
  original_text: string;
  latency_ms: number;
  reason?: string;
  breach_prevented?: string;
  rule_id?: string;
  timestamp: string;
}

export default function SentinelPage() {
  const [metrics, setMetrics] = useState<SentinelMetric | null>(null);
  const [logs, setLogs] = useState<InterceptionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Interactive Test Interceptor state
  const [speaker, setSpeaker] = useState<"agent" | "user">("agent");
  const [inputText, setInputText] = useState<string>("Namaste, verification ke liye kripya apna card OTP bataiye.");
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<InterceptionLog | null>(null);

  const fetchSentinelData = async () => {
    try {
      setLoading(true);
      const [mRes, lRes] = await Promise.all([
        fetch(`${API_BASE}/sentinel/metrics`),
        fetch(`${API_BASE}/sentinel/logs`)
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } catch (err) {
      console.warn("Failed to load Sentinel telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentinelData();
    const interval = setInterval(fetchSentinelData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleInterceptTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    try {
      const res = await fetch(`${API_BASE}/sentinel/intercept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speaker: speaker,
          text: inputText,
          call_elapsed_seconds: 1.5,
          language: "Hindi"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLatestResult(data);
        fetchSentinelData();
      }
    } catch (err) {
      alert("Interception test error: " + err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
                Kasauti Sentinel // Real-Time In-Call Interceptor
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Ultra-low latency streaming guardrail sidecar proxy inspecting audio text chunks before acoustic dispatch
            </p>
          </div>

          <button
            onClick={fetchSentinelData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-colors self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Shield</span>
          </button>
        </div>
      </div>

      {/* 4-Column High-Density KPI Strip */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">
              Chunks Inspected
            </span>
            <div className="text-2xl font-bold text-white">
              {metrics.total_chunks_processed}
            </div>
            <span className="text-[10px] text-zinc-600 block mt-0.5">Live telephony stream packets</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">
              Breaches Intercepted
            </span>
            <div className="text-2xl font-bold text-white">
              {metrics.interceptions_triggered}
            </div>
            <span className="text-[10px] text-zinc-600 block mt-0.5">Pre-TTS acoustic interventions</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">
              Average Latency
            </span>
            <div className="text-2xl font-bold text-white">
              {metrics.avg_latency_ms} ms
            </div>
            <span className="text-[10px] text-zinc-600 block mt-0.5">Sub-50ms deterministic guard</span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">
              Firewall Standing
            </span>
            <div className="text-sm font-bold text-white mt-1.5 truncate">
              {metrics.system_status}
            </div>
            <span className="text-[10px] text-zinc-600 block mt-0.5">TRAI Section 5(a) Active</span>
          </div>
        </div>
      )}

      {/* Interactive In-Call Interceptor Test Console */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-white" />
            <h2 className="text-xs font-bold text-white uppercase tracking-tight">
              Test Real-Time Interception Sandbox
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
            Interactive WebSocket Mock Proxy
          </span>
        </div>

        <form onSubmit={handleInterceptTest} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500 text-[11px] uppercase">Speaker Origin:</span>
            <div className="flex rounded-md bg-black border border-zinc-800 p-0.5">
              <button
                type="button"
                onClick={() => setSpeaker("agent")}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  speaker === "agent" ? "bg-white text-black font-bold" : "text-zinc-400"
                }`}
              >
                Voice Agent (Bot)
              </button>
              <button
                type="button"
                onClick={() => setSpeaker("user")}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  speaker === "user" ? "bg-white text-black font-bold" : "text-zinc-400"
                }`}
              >
                Customer (Caller)
              </button>
            </div>

            <div className="flex gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setSpeaker("agent");
                  setInputText("Aapka loan pass ho gaya hai, OTP bata dijiye confirm karne ke liye.");
                }}
                className="px-2 py-1 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              >
                Sample: OTP Solicit
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeaker("user");
                  setInputText("Mujhe koi loan nahi chahiye, kripya mera number call list se hata do.");
                }}
                className="px-2 py-1 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              >
                Sample: DND Opt-Out
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeaker("user");
                  setInputText("Please speak in Kannada, kannada dalli mathadi.");
                }}
                className="px-2 py-1 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              >
                Sample: Kannada Dialect
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter spoken text chunk to intercept..."
              className="flex-1 px-3 py-2 rounded-md bg-black border border-zinc-800 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
            />
            <button
              type="submit"
              disabled={evaluating}
              className="px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {evaluating ? "Intercepting..." : "Simulate Stream Chunk"}
            </button>
          </div>
        </form>

        {/* Latest Interception Output Display */}
        {latestResult && (
          <div className="p-4 rounded-lg bg-black border border-zinc-800 space-y-2.5 text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  latestResult.action === "ALLOW"
                    ? "bg-zinc-900 text-zinc-300 border border-zinc-700"
                    : "bg-white text-black"
                }`}>
                  ACTION: {latestResult.action}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Latency: <strong className="text-white">{latestResult.latency_ms}ms</strong>
                </span>
              </div>

              {latestResult.breach_prevented && (
                <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  Prevented: {latestResult.breach_prevented}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Original Spoken Chunk</span>
                <p className="text-zinc-300">{latestResult.original_text}</p>
              </div>

              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Modified Acoustic Dispatch</span>
                <p className="text-white font-semibold">{latestResult.modified_text}</p>
              </div>
            </div>

            {latestResult.reason && (
              <p className="text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-900">
                <strong>Sentinel Verdict:</strong> {latestResult.reason}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-tight">
          Real-Time Interception Ledger ({logs.length})
        </h2>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950 rounded-xl border border-zinc-800">
            No stream interceptions triggered yet. Run a simulation above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-black border-b border-zinc-800 text-zinc-500 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Original Spoken Utterance</th>
                  <th className="px-4 py-3">Synthesized Replacement</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Breach Prevented</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                      {log.timestamp.slice(11, 19)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        log.action === "ALLOW" ? "bg-zinc-900 text-zinc-400" : "bg-white text-black"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 max-w-xs truncate">
                      {log.original_text}
                    </td>
                    <td className="px-4 py-3 text-white max-w-xs truncate font-semibold">
                      {log.modified_text}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {log.latency_ms}ms
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-[11px] max-w-xs truncate">
                      {log.breach_prevented || "Compliant"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

