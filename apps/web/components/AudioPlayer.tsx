"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, RotateCcw, FastForward } from "lucide-react";

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
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [activeMarker, setActiveMarker] = useState<AudioMarker | null>(null);

  const activeMarkers: AudioMarker[] = markers && markers.length > 0 ? markers : [
    { time: 2.1, label: "AI Identity Disclosure", kind: "disclosure", description: "TRAI mandate in first 5s" },
    { time: 7.4, label: "Consent Verification", kind: "consent", description: "Customer authorization confirmed" },
    { time: 18.2, label: "Opt-Out Intercept", kind: "violation", description: "Compliance checkpoint threshold" }
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
          waveColor: "#27272a",
          progressColor: "#ffffff",
          cursorColor: "#ffffff",
          cursorWidth: 1.5,
          barWidth: 2,
          barGap: 3,
          barRadius: 1,
          height: 56,
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

  const cycleSpeed = () => {
    if (!wavesurferRef.current) return;
    const nextRate = playbackRate === 1.0 ? 1.5 : (playbackRate === 1.5 ? 2.0 : 1.0);
    wavesurferRef.current.setPlaybackRate(nextRate);
    setPlaybackRate(nextRate);
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
    <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="font-semibold text-white tracking-tight">Audio Telephony Stream</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            Linear16 / 24kHz
          </span>
        </div>

        <div className="font-mono text-xs text-white font-bold tracking-tight">
          {formatTime(currentTime)} <span className="text-zinc-600">/</span> {formatTime(duration || 30)}
        </div>
      </div>

      {/* Waveform Canvas Container */}
      <div className="relative py-1">
        <div ref={containerRef} className="w-full cursor-pointer" />

        {/* Minimalist Pin Overlay Markers */}
        <div className="relative w-full h-7 mt-1.5 border-t border-zinc-800">
          {activeMarkers.map((marker, idx) => {
            const dur = duration || 30;
            const leftPct = Math.min(Math.max((marker.time / dur) * 100, 2), 98);

            const isViolation = marker.kind === "violation";
            const isConsent = marker.kind === "consent";

            return (
              <button
                key={idx}
                type="button"
                onClick={() => seekTo(marker.time)}
                style={{ left: `${leftPct}%` }}
                className="absolute -top-1.5 -translate-x-1/2 flex flex-col items-center group transition-transform hover:scale-110 z-10"
                title={`${marker.label} @ ${formatTime(marker.time)}`}
              >
                <div className={`w-3 h-3 rounded-sm border flex items-center justify-center text-[8px] font-mono font-bold ${
                  isViolation 
                    ? "bg-zinc-100 text-black border-white" 
                    : isConsent 
                    ? "bg-zinc-800 text-white border-zinc-600" 
                    : "bg-black text-white border-zinc-400"
                }`}>
                  {isViolation ? "▲" : isConsent ? "■" : "◆"}
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded bg-black text-white border border-zinc-700 pointer-events-none shadow-lg">
                  {marker.label} ({formatTime(marker.time)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls & Active Marker Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800 text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlay}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-white hover:bg-zinc-200 text-black font-bold transition-transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
          </button>
          
          <button
            onClick={restart}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={cycleSpeed}
            className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono text-[11px] transition-colors"
            title="Toggle playback speed"
          >
            {playbackRate.toFixed(1)}x
          </button>
        </div>

        {/* Active Marker Indicator */}
        {activeMarker ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 border border-zinc-700 text-[11px]">
            <span className="font-mono text-zinc-400 font-semibold uppercase">{activeMarker.label}:</span>
            <span className="text-zinc-200">{activeMarker.description}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
            <span>◆ AI Disclosure</span>
            <span>■ Consent Check</span>
            <span>▲ Regulation Flag</span>
          </div>
        )}
      </div>
    </div>
  );
};
