"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, RotateCcw, MapPin } from "lucide-react";

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
          waveColor: "#000000",
          progressColor: "#ff90e8",
          cursorColor: "#ffc900",
          barWidth: 3,
          barGap: 3,
          barRadius: 1,
          height: 64,
          normalize: true
        });

        wavesurferRef.current = ws;

        if (recordingUrl) {
          ws.load(recordingUrl);
        }

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
    <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000] space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between text-xs pb-2 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-black stroke-[2.5]" />
          <span className="font-black uppercase tracking-tight text-black font-display text-sm">
            Call Recording &amp; Compliance Waveform
          </span>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brutal-bg text-black border border-black shadow-[1px_1px_0px_#000]">
            Opus 24kHz
          </span>
        </div>
        <div className="font-mono text-xs font-black text-black bg-brutal-yellow px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">
          {formatTime(currentTime)} / {formatTime(duration || 30)}
        </div>
      </div>

      {/* Waveform Canvas Container */}
      <div className="relative py-2 bg-[#f4f4f0] rounded-xl border-2 border-black p-3">
        {!recordingUrl && (
          <div className="py-6 text-center">
            <Volume2 className="w-8 h-8 text-black/40 mx-auto mb-2" />
            <p className="text-xs font-bold text-black uppercase tracking-wide">
              Real-Time Carrier Audio Finalizing
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              Audio artifact will appear here as soon as Bolna carrier finalization finishes.
            </p>
          </div>
        )}
        <div ref={containerRef} className={`w-full cursor-pointer ${!recordingUrl ? 'hidden' : ''}`} />

        {/* Visual Waveform Markers Overlay Pins */}
        <div className="relative w-full h-8 mt-2 border-t-2 border-black">
          {activeMarkers.map((marker, idx) => {
            const dur = duration || 30;
            const leftPct = Math.min(Math.max((marker.time / dur) * 100, 2), 98);

            const getPinColor = () => {
              if (marker.kind === "violation") return "bg-rose-500 text-white";
              if (marker.kind === "consent") return "bg-brutal-green text-black";
              return "bg-brutal-yellow text-black";
            };

            return (
              <button
                key={idx}
                type="button"
                onClick={() => seekTo(marker.time)}
                style={{ left: `${leftPct}%` }}
                className="absolute -top-2 -translate-x-1/2 flex flex-col items-center group transition-transform hover:scale-125 z-10"
                title={`${marker.label} @ ${formatTime(marker.time)} - Click to jump`}
              >
                <div className={`w-4 h-4 rounded-full border-2 border-black shadow-[1px_1px_0px_#000] flex items-center justify-center ${getPinColor()}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-5 whitespace-nowrap text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black text-white border border-black shadow-[2px_2px_0px_#ff90e8] pointer-events-none">
                  {marker.label} ({formatTime(marker.time)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls & Active Marker Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlay}
            disabled={!recordingUrl}
            className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 border-black text-black font-black transition-all shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
              !recordingUrl ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50' : 'bg-brutal-yellow hover:bg-yellow-300'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
          </button>
          <button
            onClick={restart}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white hover:bg-gray-100 border-2 border-black text-black font-black transition-all shadow-[2px_2px_0px_#000]"
            title="Restart audio"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Live Audio Marker Badge */}
        {activeMarker ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brutal-pink border-2 border-black text-xs font-black shadow-[2px_2px_0px_#000] text-black animate-fadeIn">
            <MapPin className="w-4 h-4 text-black shrink-0" />
            <span className="uppercase">{activeMarker.label}:</span>
            <span className="font-medium text-black">{activeMarker.description}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs font-black uppercase text-black">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-brutal-yellow border border-black" /> AI Disclosure
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-brutal-green border border-black" /> Consent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-black" /> Violation
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
