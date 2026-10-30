"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Radio, Volume2, ShieldCheck, 
  Activity, RefreshCw, Play, AlertTriangle, Layers
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface NoiseProfile {
  id: string;
  name: str;
  category: string;
  snr_db: number;
  frequency_cutoff_hz: number;
  packet_loss_rate: number;
  description: string;
}

interface AcousticResult {
  profile_id: string;
  profile_name: string;
  snr_db: number;
  clean_wer_pct: number;
  degraded_wer_pct: number;
  wer_delta_pct: number;
  carrier_codec: string;
  sarvam_indic_confidence: number;
  resilience_rating: string;
  recommendation: string;
  timestamp: string;
}

export default function AcousticPage() {
  const [profiles, setProfiles] = useState<NoiseProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("profile_railway");
  const [result, setResult] = useState<AcousticResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/acoustic/profiles`);
      if (res.ok) {
        const data: NoiseProfile[] = await res.json();
        setProfiles(data);
        if (data.length > 0 && !selectedProfileId) {
          setSelectedProfileId(data[0].id);
        }
      }
    } catch (err) {
      console.warn("Failed to load acoustic profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/acoustic/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: selectedProfileId
        })
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch (err) {
      alert("Acoustic simulation error: " + err);
    } finally {
      setSimulating(false);
    }
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

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
                Acoustic &amp; Ambient Noise Stress Tester
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Evaluates Indian STT phoneme degradation across Bandra railway stations, Chandni Chowk traffic, and 2G narrowband packet drops
            </p>
          </div>

          <button
            onClick={fetchProfiles}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-colors self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload Profiles</span>
          </button>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-tight">
          Select Indian Telephony Acoustic Environment ({profiles.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {profiles.map((p) => {
            const isSelected = selectedProfileId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProfileId(p.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-zinc-900 border-white shadow-lg"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      {p.category.replace("_", " ")}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-black text-white font-mono border border-zinc-800">
                      SNR {p.snr_db > 0 ? `+${p.snr_db}` : p.snr_db}dB
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">
                    {p.name}
                  </h3>

                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Bandwidth: {p.frequency_cutoff_hz}Hz</span>
                  <span>Loss: {(p.packet_loss_rate * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Execution & Results Console */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
          <div>
            <span className="text-[10px] uppercase text-zinc-500 block">Selected Stress Profile</span>
            <span className="text-sm font-bold text-white mt-0.5 block">
              {selectedProfile?.name || "Acoustic Profile"} &bull; {selectedProfile?.snr_db}dB SNR
            </span>
          </div>

          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>{simulating ? "Degrading Audio..." : "Simulate Acoustic Stress"}</span>
          </button>
        </div>

        {/* Acoustic Result Display */}
        {result ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* KPI Result Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-black border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase block">Clean Baseline WER</span>
                <span className="text-xl font-bold text-white mt-0.5 block">{result.clean_wer_pct}%</span>
                <span className="text-[10px] text-zinc-500 block">Sarvam Indic STT</span>
              </div>

              <div className="p-3 rounded-lg bg-black border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase block">Degraded WER</span>
                <span className="text-xl font-bold text-white mt-0.5 block">{result.degraded_wer_pct}%</span>
                <span className="text-[10px] text-zinc-500 block">Under {result.snr_db}dB Noise</span>
              </div>

              <div className="p-3 rounded-lg bg-black border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase block">Error Delta (WER Δ)</span>
                <span className="text-xl font-bold text-white mt-0.5 block">+{result.wer_delta_pct}%</span>
                <span className="text-[10px] text-zinc-500 block">Phoneme distortion</span>
              </div>

              <div className="p-3 rounded-lg bg-black border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase block">Resilience Rating</span>
                <span className="text-sm font-bold text-white mt-1.5 block uppercase">
                  {result.resilience_rating}
                </span>
                <span className="text-[10px] text-zinc-500 block">Indic Confidence: {(result.sarvam_indic_confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="p-3.5 rounded-lg bg-black border border-zinc-800 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                Automated Telephony Recommendation
              </span>
              <p className="text-zinc-200 leading-relaxed font-sans text-xs">
                {result.recommendation}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500">
            Click &quot;Simulate Acoustic Stress&quot; to test STT phoneme degradation under {selectedProfile?.name}.
          </div>
        )}
      </div>
    </div>
  );
}
