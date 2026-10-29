"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, RotateCcw, AlertTriangle, ShieldCheck, Sparkles, MapPin } from "lucide-react";

export interface AudioMarker {
  time: number; // in seconds
  label: string;
  kind: "disclosure" | "consent" | "violation" | "info";
  description?: string;
}

interface AudioPlayerProps {
  recordingUrl?: string;
  markers?: AudioMarker[];
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ recordingUrl, markers }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeMarker, setActiveMarker] = useState<AudioMarker | null>(null);

  // Default demonstration compliance markers if none provided
  const activeMarkers: AudioMarker[] = markers && markers.length > 0 ? markers : [
    { time: 2.1, label: "AI Identity Disclosure", kind: "disclosure", description: "Mandatory TRAI statement in first 5s" },
    { time: 7.4, label: "Consent Verification", kind: "consent", description: "User permission to proceed requested" },
    { time: 18.2, label: "Opt-Out Flag / Turn", kind: "violation", description: "Compliance checkpoint event" }
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    let WaveSurfer: any;

    const initWaveSurfer = async () => {
      try {
        const wsModule = await import("wavesurfer.js");
        WaveSurfer = wsModule.default;

        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }

        const ws = WaveSurfer.create({
          container: containerRef.current,
          waveColor: "#272a38",
          progressColor: "#E5B842",
          cursorColor: "#FFFFFF",
          barWidth: 3,
          barGap: 3,
          barRadius: 2,
          height: 64,
          normalize: true
        });

        wavesurferRef.current = ws;

        const urlToLoad = recordingUrl || "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg";
        ws.load(urlToLoad);

        ws.on("ready", () => {
          setDuration(ws.getDuration());
        });

        ws.on("audioprocess", () => {
          const t = ws.getCurrentTime();
          setCurrentTime(t);

          // Find if we are near any marker
          const match = activeMarkers.find((m) => Math.abs(m.time - t) < 1.0);
          setActiveMarker(match || null);
        });

        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("finish", () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });
      } catch (err) {
        console.warn("WaveSurfer initialization note:", err);
      }
    };

    initWaveSurfer();

    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
        } catch (_) {}
      }
    };
  }, [recordingUrl]);

  const togglePlay = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.playPause();
  };

  const restart = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.stop();
    setCurrentTime(0);
  };

  const seekTo = (seconds: number) => {
    if (!wavesurferRef.current) return;
    const dur = wavesurferRef.current.getDuration() || duration || 30;
    const progress = Math.min(Math.max(seconds / dur, 0), 1);
    wavesurferRef.current.seekTo(progress);
    setCurrentTime(seconds);
    if (!isPlaying) {
      wavesurferRef.current.play();
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-gold" />
          <span className="font-bold text-white">Call Recording &amp; Compliance Waveform</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-charcoal-700 text-charcoal-200 border border-border">
            Opus 24kHz / Linear16
          </span>
        </div>
        <div className="font-mono text-xs text-gold font-bold">
          {formatTime(currentTime)} / {formatTime(duration || 30)}
        </div>
      </div>

      {/* Waveform Canvas Container */}
      <div className="relative py-2">
        <div ref={containerRef} className="w-full cursor-pointer" />

        {/* Visual Waveform Markers Overlay Pins */}
        <div className="relative w-full h-8 mt-1 border-t border-border/40">
          {activeMarkers.map((marker, idx) => {
            const dur = duration || 30;
            const leftPct = Math.min(Math.max((marker.time / dur) * 100, 2), 98);

            const getPinColor = () => {
              if (marker.kind === "violation") return "bg-rose-500 text-rose-300 border-rose-400";
              if (marker.kind === "consent") return "bg-emerald-500 text-emerald-300 border-emerald-400";
              return "bg-gold text-charcoal-900 border-gold-light";
            };

            return (
              <button
                key={idx}
                type="button"
                onClick={() => seekTo(marker.time)}
                style={{ left: `${leftPct}%` }}
                className="absolute -top-1 -translate-x-1/2 flex flex-col items-center group transition-transform hover:scale-110 z-10"
                title={`${marker.label} @ ${formatTime(marker.time)} - Click to jump`}
              >
                <div className={`w-3 h-3 rounded-full border shadow-md flex items-center justify-center ${getPinColor()}`}>
                  <span className="w-1 h-1 rounded-full bg-current" />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded bg-charcoal-900 text-white border border-border shadow-xl pointer-events-none">
                  {marker.label} ({formatTime(marker.time)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls & Active Marker Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlay}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gold hover:bg-gold-dark text-charcoal-900 font-bold transition-transform active:scale-95 shadow-md shadow-gold/20"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-charcoal-900" /> : <Play className="w-4 h-4 fill-charcoal-900 ml-0.5" />}
          </button>
          <button
            onClick={restart}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-surfaceHover hover:bg-charcoal-600 text-charcoal-200 transition-colors"
            title="Restart audio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Audio Marker Badge */}
        {activeMarker ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-charcoal-900 border border-gold/30 text-[11px] animate-fadeIn">
            <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="font-semibold text-white">{activeMarker.label}:</span>
            <span className="text-charcoal-300">{activeMarker.description}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[11px] text-charcoal-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gold" /> AI Disclosure
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Consent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Compliance Check
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
