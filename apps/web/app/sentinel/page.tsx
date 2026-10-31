"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  Zap,
  Terminal,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

interface SentinelMetric {
  total_chunks_processed: number;
  interceptions_triggered: number;
  avg_latency_ms: number;
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
  const [inputText, setInputText] = useState<string>(
    "Namaste, verification ke liye kripya apna card OTP bataiye."
  );
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [latestResult, setLatestResult] = useState<InterceptionLog | null>(null);

  const fetchSentinelData = async () => {
    try {
      setLoading(true);
      const [mRes, lRes] = await Promise.all([
        fetch(`${API_BASE}/sentinel/metrics`),
        fetch(`${API_BASE}/sentinel/logs`),
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
          language: "Hindi",
        }),
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
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-black hover:underline mb-2 font-black uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Back to Overview
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brutal-mint border-2 border-black flex items-center justify-center text-white font-black shadow-[2px_2px_0px_#000]">
              <Zap className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
                Kasauti Sentinel Streaming Firewall
              </h1>
              <p className="text-xs font-semibold text-gray-700">
                Ultra-low latency streaming guardrail sidecar proxy inspecting audio text chunks before acoustic dispatch
              </p>
            </div>
          </div>

          <button
            onClick={fetchSentinelData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-yellow-50 text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all self-start"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? "animate-spin" : ""}`}
            />
            <span>Sync Shield</span>
          </button>
        </div>
      </div>

      {/* 4-Column High-Density KPI Strip */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-gray-600 block">
              Chunks Inspected
            </span>
            <div className="text-3xl font-black text-black font-display mt-1">
              {metrics.total_chunks_processed}
            </div>
            <span className="text-[10px] font-bold text-gray-500 block mt-0.5">
              Live Stream Packets
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-brutal-yellow border-3 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-black block">
              Breaches Intercepted
            </span>
            <div className="text-3xl font-black text-black font-display mt-1">
              {metrics.interceptions_triggered}
            </div>
            <span className="text-[10px] font-black text-black block mt-0.5">
              Pre-TTS Interventions
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-gray-600 block">
              Average Latency
            </span>
            <div className="text-3xl font-black text-emerald-700 font-display mt-1">
              {metrics.avg_latency_ms} ms
            </div>
            <span className="text-[10px] font-bold text-gray-500 block mt-0.5">
              Sub-50ms Deterministic Guard
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-brutal-green border-3 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-black block">
              Firewall Standing
            </span>
            <div className="text-xl font-black uppercase text-black font-display mt-1 truncate">
              {metrics.system_status}
            </div>
            <span className="text-[10px] font-black text-black block mt-0.5">
              TRAI §5(a) Active
            </span>
          </div>
        </div>
      )}

      {/* Interactive In-Call Interceptor Test Console */}
      <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-black stroke-[2.5]" />
            <h2 className="text-lg font-black uppercase text-black font-display">
              Test Real-Time Interception Sandbox
            </h2>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-brutal-bg font-black border border-black shadow-[1px_1px_0px_#000] uppercase text-black">
            Mock Proxy
          </span>
        </div>

        <form onSubmit={handleInterceptTest} className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-black text-black text-xs uppercase">
              Speaker Origin:
            </span>
            <div className="flex rounded-xl bg-white border-2 border-black p-1 shadow-[2px_2px_0px_#000]">
              <button
                type="button"
                onClick={() => setSpeaker("agent")}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                  speaker === "agent"
                    ? "bg-black text-white shadow-[1px_1px_0px_#ff90e8]"
                    : "text-black hover:bg-gray-100"
                }`}
              >
                Voice Agent (Bot)
              </button>
              <button
                type="button"
                onClick={() => setSpeaker("user")}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all ${
                  speaker === "user"
                    ? "bg-black text-white shadow-[1px_1px_0px_#90a8ed]"
                    : "text-black hover:bg-gray-100"
                }`}
              >
                Customer (Caller)
              </button>
            </div>

            <div className="flex flex-wrap gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setSpeaker("agent");
                  setInputText(
                    "Aapka loan pass ho gaya hai, OTP bata dijiye confirm karne ke liye."
                  );
                }}
                className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#faf9f5] border border-black shadow-[1px_1px_0px_#000] hover:bg-yellow-50"
              >
                OTP Solicit
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeaker("user");
                  setInputText(
                    "Mujhe koi loan nahi chahiye, kripya mera number call list se hata do."
                  );
                }}
                className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#faf9f5] border border-black shadow-[1px_1px_0px_#000] hover:bg-yellow-50"
              >
                DND Opt-Out
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeaker("user");
                  setInputText(
                    "Please speak in Kannada, kannada dalli mathadi."
                  );
                }}
                className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#faf9f5] border border-black shadow-[1px_1px_0px_#000] hover:bg-yellow-50"
              >
                Kannada Shift
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter spoken text chunk to intercept..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#faf9f5] border-2 border-black text-black text-xs font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-white"
            />
            <button
              type="submit"
              disabled={evaluating}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#ff90e8] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
            >
              <span>{evaluating ? "Intercepting..." : "Simulate Stream Chunk"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Latest Interception Output Display */}
        {latestResult && (
          <div className="p-5 rounded-xl bg-yellow-50 border-2 border-black shadow-[3px_3px_0px_#000] space-y-3 text-xs">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-black shadow-[1px_1px_0px_#000] ${
                    latestResult.action === "ALLOW"
                      ? "bg-brutal-green text-black"
                      : "bg-rose-500 text-white"
                  }`}
                >
                  ACTION: {latestResult.action}
                </span>
                <span className="text-[11px] font-mono font-bold text-gray-700">
                  Latency: <strong>{latestResult.latency_ms}ms</strong>
                </span>
              </div>

              {latestResult.breach_prevented && (
                <span className="text-[10px] font-mono font-black text-black px-2 py-0.5 rounded-full bg-brutal-yellow border border-black">
                  Prevented: {latestResult.breach_prevented}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white border border-black">
                <span className="text-[10px] text-gray-600 uppercase font-black block mb-1">
                  Original Spoken Chunk
                </span>
                <p className="text-gray-900 font-semibold">{latestResult.original_text}</p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-black">
                <span className="text-[10px] text-gray-600 uppercase font-black block mb-1">
                  Modified Acoustic Dispatch
                </span>
                <p className="text-black font-black">
                  {latestResult.modified_text}
                </p>
              </div>
            </div>

            {latestResult.reason && (
              <p className="text-xs font-semibold text-black bg-white p-2.5 rounded-lg border border-black">
                <strong className="font-black uppercase">Sentinel Verdict:</strong> {latestResult.reason}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tight text-black font-display">
          Real-Time Interception Ledger ({logs.length})
        </h2>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-600 bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000]">
            No stream interceptions triggered yet. Run a simulation above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border-3 border-black bg-white shadow-[6px_6px_0px_#000]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#f4f4f0] border-b-2 border-black text-black uppercase text-[10px] font-black">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Original Spoken Utterance</th>
                  <th className="px-4 py-3">Synthesized Replacement</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Breach Prevented</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {logs.map((log, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-yellow-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-600 font-bold whitespace-nowrap">
                      {log.timestamp.slice(11, 19)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border border-black shadow-[1px_1px_0px_#000] ${
                          log.action === "ALLOW"
                            ? "bg-brutal-green text-black"
                            : "bg-rose-500 text-white"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-sans font-semibold max-w-xs truncate">
                      {log.original_text}
                    </td>
                    <td className="px-4 py-3 text-black font-sans font-black max-w-xs truncate">
                      {log.modified_text}
                    </td>
                    <td className="px-4 py-3 text-black font-bold whitespace-nowrap">
                      {log.latency_ms}ms
                    </td>
                    <td className="px-4 py-3 text-gray-800 text-[11px] font-sans font-bold max-w-xs truncate">
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
