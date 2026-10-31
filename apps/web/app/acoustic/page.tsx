"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Radio,
  Volume2,
  ShieldCheck,
  Activity,
  RefreshCw,
  Play,
  AlertTriangle,
  Layers,
  ArrowUpRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

interface NoiseProfile {
  id: string;
  name: string;
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
  audio_artifact_url?: string;
  baseline_transcript?: string;
  degraded_transcript?: string;
  timestamp: string;
}

export default function AcousticPage() {
  const [profiles, setProfiles] = useState<NoiseProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] =
    useState<string>("profile_railway");
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
          profile_id: selectedProfileId,
        }),
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
            <div className="w-10 h-10 rounded-xl bg-brutal-purple border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#000]">
              <Volume2 className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
                Acoustic &amp; Noise Stress Tester
              </h1>
              <p className="text-xs font-semibold text-gray-700">
                Evaluate Indian STT phoneme degradation across Bandra railway stations, Chandni Chowk traffic &amp; 2G narrowband packet drops
              </p>
            </div>
          </div>

          <button
            onClick={fetchProfiles}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-yellow-50 text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all self-start"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? "animate-spin" : ""}`}
            />
            <span>Reload Profiles</span>
          </button>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight text-black font-display">
            Select Indian Telephony Acoustic Environment ({profiles.length})
          </h2>
          <span className="text-xs font-mono font-bold text-gray-600">
            Click card to target
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {profiles.map((p) => {
            const isSelected = selectedProfileId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProfileId(p.id)}
                className={`p-5 rounded-2xl border-3 border-black transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-brutal-yellow shadow-[6px_6px_0px_#000] translate-x-[-2px] translate-y-[-2px]"
                    : "bg-white shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider text-black bg-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
                      {p.category.replace("_", " ")}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black text-white font-mono font-black border border-black">
                      SNR {p.snr_db > 0 ? `+${p.snr_db}` : p.snr_db}dB
                    </span>
                  </div>

                  <h3 className="text-base font-black text-black mt-2 leading-snug">
                    {p.name}
                  </h3>

                  <p className="text-[11px] font-semibold text-gray-800 mt-1 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-3 border-t-2 border-black flex items-center justify-between text-[11px] font-mono font-bold text-black">
                  <span>BW: {p.frequency_cutoff_hz}Hz</span>
                  <span>Drop: {(p.packet_loss_rate * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Execution & Results Console */}
      <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <span className="text-[10px] uppercase font-black text-gray-600 block">
              Target Stress Profile
            </span>
            <span className="text-lg font-black uppercase text-black font-display mt-0.5 block">
              {selectedProfile?.name || "Acoustic Profile"} &bull;{" "}
              {selectedProfile?.snr_db}dB SNR
            </span>
          </div>

          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_#ff90e8] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5 fill-white stroke-[2.5]" />
            <span>
              {simulating ? "Degrading Audio..." : "Simulate Acoustic Stress"}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Acoustic Result Display */}
        {result ? (
          <div className="space-y-5">
            {/* KPI Result Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-gray-50 border-2 border-black shadow-[3px_3px_0px_#000]">
                <span className="text-[10px] text-gray-600 font-black uppercase block">
                  Clean Baseline WER
                </span>
                <span className="text-3xl font-black text-black font-display mt-1 block">
                  {result.clean_wer_pct}%
                </span>
                <span className="text-[10px] font-bold text-gray-500 block mt-0.5">
                  Sarvam Indic STT
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border-2 border-black shadow-[3px_3px_0px_#000]">
                <span className="text-[10px] text-gray-600 font-black uppercase block">
                  Degraded WER
                </span>
                <span className="text-3xl font-black text-rose-600 font-display mt-1 block">
                  {result.degraded_wer_pct}%
                </span>
                <span className="text-[10px] font-bold text-gray-500 block mt-0.5">
                  Under {result.snr_db}dB Noise
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border-2 border-black shadow-[3px_3px_0px_#000]">
                <span className="text-[10px] text-gray-600 font-black uppercase block">
                  Error Delta (WER Δ)
                </span>
                <span className="text-3xl font-black text-black font-display mt-1 block">
                  +{result.wer_delta_pct}%
                </span>
                <span className="text-[10px] font-bold text-gray-500 block mt-0.5">
                  Phoneme Distortion
                </span>
              </div>

              <div className="p-4 rounded-xl bg-brutal-green border-2 border-black shadow-[3px_3px_0px_#000]">
                <span className="text-[10px] text-black font-black uppercase block">
                  Resilience Rating
                </span>
                <span className="text-xl font-black text-black font-display mt-1 block uppercase">
                  {result.resilience_rating}
                </span>
                <span className="text-[10px] font-black text-black block mt-0.5">
                  Indic Confidence: {(result.sarvam_indic_confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Transcripts and Degraded Audio Artifact Player */}
            {result.audio_artifact_url && (
              <div className="p-3.5 rounded-lg bg-black border border-zinc-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    Degraded Acoustic Audio Artifact (Supabase Storage)
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">16-bit PCM WAV</span>
                </div>
                <audio controls className="w-full h-8 opacity-90 invert brightness-0 contrast-200" src={result.audio_artifact_url}>
                  Your browser does not support audio element.
                </audio>
                {result.degraded_transcript && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-900 text-[11px]">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Baseline Clean</span>
                      <p className="text-zinc-300 font-mono">{result.baseline_transcript}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Degraded Hypothesis</span>
                      <p className="text-zinc-400 font-mono">{result.degraded_transcript}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation Box */}
            <div className="p-5 rounded-xl bg-yellow-50 border-2 border-black shadow-[3px_3px_0px_#000] text-xs space-y-1">
              <span className="text-[10px] uppercase font-black text-black block tracking-wider">
                Automated Telephony Recommendation
              </span>
              <p className="text-gray-900 leading-relaxed font-semibold text-xs">
                {result.recommendation}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-xs font-semibold text-gray-600 rounded-xl bg-[#faf9f5] border-2 border-dashed border-black">
            Click &quot;Simulate Acoustic Stress&quot; to test STT phoneme
            degradation under {selectedProfile?.name}.
          </div>
        )}
      </div>
    </div>
  );
}
