"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  Radio,
  Phone,
  PhoneCall,
  Clock,
  RefreshCw,
  Volume2,
  Bot,
  User,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

interface LiveTurn {
  index: number;
  speaker: string;
  text: string;
}

interface LiveExecutionResponse {
  execution_id: string;
  status: string;
  created_at?: string;
  duration?: number;
  to_number?: string;
  from_number?: string;
  carrier?: string;
  recording_url?: string;
  turns: LiveTurn[];
  total_turns: number;
  raw_transcript: string;
}

export default function TelemetryPage() {
  const [data, setData] = useState<LiveExecutionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [polling, setPolling] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customAgentId, setCustomAgentId] = useState<string>("");

  const fetchTelemetry = async () => {
    try {
      setError(null);
      const url = customAgentId.trim()
        ? `${API_BASE}/telemetry/live?agent_id=${encodeURIComponent(customAgentId.trim())}`
        : `${API_BASE}/telemetry/live`;

      const res = await fetch(url);
      if (res.ok) {
        const json: LiveExecutionResponse = await res.json();
        setData(json);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.detail || `HTTP Error ${res.status}: Failed to fetch live telemetry.`);
      }
    } catch (err: any) {
      setError(err?.message || "Network error fetching telemetry stream.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, [customAgentId]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 4000);
    return () => clearInterval(interval);
  }, [polling, customAgentId]);

  const isConfigError = error && (error.includes("BOLNA_API_KEY") || error.includes("Bolna Agent ID"));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-black hover:underline mb-2 font-black uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Back to Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brutal-pink border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#000]">
              <Radio className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
                Live Bolna Telemetry
              </h1>
              <p className="text-xs font-semibold text-gray-700">
                Direct telephony session monitoring, carrier diagnostics &amp; live conversational stream
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPolling(!polling)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_#000] ${
                polling
                  ? "bg-brutal-green text-black"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className={`w-2 h-2 rounded-full border border-black ${polling ? "bg-black animate-ping" : "bg-gray-400"}`} />
              <span>{polling ? "Live Polling ON" : "Polling Paused"}</span>
            </button>

            <button
              onClick={() => {
                setLoading(true);
                fetchTelemetry();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-yellow-50 border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Agent ID Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0px_#000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <label className="text-xs font-black uppercase text-black whitespace-nowrap">
            Bolna Agent Override:
          </label>
          <input
            type="text"
            placeholder="Default: BOLNA_CALLER_AGENT_ID / BOLNA_STAGING_AGENT_ID"
            value={customAgentId}
            onChange={(e) => setCustomAgentId(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs font-mono font-bold bg-[#faf9f5] border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
          />
        </div>
        {data && (
          <div className="text-[11px] font-mono font-bold text-gray-600 flex items-center gap-2 self-start md:self-auto">
            <span>Status:</span>
            <span
              className={`px-2 py-0.5 rounded-full border border-black text-black uppercase text-[10px] ${
                data.status === "completed"
                  ? "bg-brutal-green"
                  : data.status === "in-progress"
                  ? "bg-brutal-yellow animate-pulse"
                  : "bg-gray-200"
              }`}
            >
              {data.status || "IDLE"}
            </span>
          </div>
        )}
      </div>

      {/* Configuration Alert when Bolna credentials are not configured */}
      {isConfigError && (
        <div className="p-5 rounded-2xl bg-brutal-yellow border-3 border-black shadow-[6px_6px_0px_#000] space-y-2">
          <div className="flex items-center gap-2 font-black uppercase text-sm text-black">
            <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            Configuration Notice: Bolna Telephony Not Linked
          </div>
          <p className="text-xs font-bold text-black">
            {error}
          </p>
          <p className="text-[11px] font-medium text-gray-800">
            To view real live executions, ensure <code>BOLNA_API_KEY</code> and either <code>BOLNA_CALLER_AGENT_ID</code> or <code>BOLNA_STAGING_AGENT_ID</code> are configured in your <code>.env</code> file. In mock mode, synthetic test runs are executed via the Benchmark Runner.
          </p>
        </div>
      )}

      {/* Telemetry Metric Cards */}
      {data && data.execution_id !== "none" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-gray-600 block">
              Execution ID
            </span>
            <div className="text-sm font-mono font-black text-black truncate mt-1">
              {data.execution_id}
            </div>
            <span className="text-[10px] font-bold text-gray-500 mt-0.5 block">
              {data.created_at ? new Date(data.created_at).toLocaleTimeString() : "Recent"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-gray-600 block">
              Call Duration
            </span>
            <div className="text-2xl font-black text-black font-display mt-0.5">
              {data.duration !== undefined ? `${data.duration.toFixed(1)}s` : "N/A"}
            </div>
            <span className="text-[10px] font-bold text-gray-500 block">
              Billed Telephony Length
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-gray-600 block">
              To / Carrier
            </span>
            <div className="text-sm font-mono font-black text-black truncate mt-1">
              {data.to_number || "Indian DID"}
            </div>
            <span className="text-[10px] font-bold text-gray-600 block">
              {data.carrier || "Telecom Circle"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-gray-600 block">
              Turns Captured
            </span>
            <div className="text-2xl font-black text-black font-display mt-0.5">
              {data.total_turns}
            </div>
            <span className="text-[10px] font-bold text-emerald-700 block">
              ASR &amp; TTS Synthesized
            </span>
          </div>
        </div>
      )}

      {/* Recording Player if Available */}
      {data?.recording_url && (
        <div className="p-5 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000] space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-black stroke-[2.5]" />
            <h3 className="font-black uppercase text-sm text-black font-display">
              Telephony Call Audio Stream
            </h3>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-brutal-yellow text-black border border-black shadow-[1px_1px_0px_#000]">
              Direct Recording
            </span>
          </div>
          <audio controls className="w-full mt-2" src={data.recording_url}>
            Your browser does not support audio playback.
          </audio>
        </div>
      )}

      {/* Live Conversational Transcript */}
      <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-black stroke-[2.5]" />
            <h2 className="text-lg font-black uppercase text-black font-display">
              Turn-By-Turn Conversational Stream
            </h2>
          </div>
          <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-brutal-bg border border-black shadow-[1px_1px_0px_#000]">
            {data?.turns?.length || 0} Turns Processed
          </span>
        </div>

        {loading && !data && (
          <div className="p-12 text-center text-xs font-bold text-gray-500 font-mono animate-pulse">
            Connecting to Bolna Telemetry Websocket / Polling API...
          </div>
        )}

        {data && data.turns.length === 0 && (
          <div className="p-12 text-center rounded-xl bg-gray-50 border-2 border-dashed border-black">
            <PhoneCall className="w-10 h-10 text-gray-400 mx-auto mb-2 stroke-[1.5]" />
            <h3 className="text-sm font-black uppercase text-black">No Active Turns</h3>
            <p className="text-xs font-semibold text-gray-600 mt-1 max-w-sm mx-auto">
              {data.raw_transcript || "Place an outbound call from the Benchmark Runner or dial the staging agent to view real-time turns."}
            </p>
          </div>
        )}

        {data && data.turns.length > 0 && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {data.turns.map((turn) => {
              const isAgent = turn.speaker === "agent";
              return (
                <div
                  key={turn.index}
                  className={`flex gap-3 text-xs leading-relaxed p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] ${
                    isAgent ? "bg-yellow-50" : "bg-white"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isAgent ? (
                      <div className="w-8 h-8 rounded-full bg-brutal-pink border-2 border-black flex items-center justify-center text-black font-black text-xs shadow-[1px_1px_0px_#000]">
                        <Bot className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brutal-purple border-2 border-black flex items-center justify-center text-white font-black text-xs shadow-[1px_1px_0px_#000]">
                        <User className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black uppercase text-black text-[11px]">
                        {isAgent ? "Agent (Voice Bot)" : "User (Caller)"}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-gray-500">
                        Turn #{turn.index + 1}
                      </span>
                    </div>
                    <div className="text-black font-semibold whitespace-pre-wrap">
                      {turn.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

