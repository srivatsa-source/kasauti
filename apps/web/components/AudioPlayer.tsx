"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, RotateCcw } from "lucide-react";

interface AudioPlayerProps {
  recordingUrl?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ recordingUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
          waveColor: "#313545",
          progressColor: "#E5B842",
          cursorColor: "#FFFFFF",
          barWidth: 3,
          barGap: 3,
          barRadius: 2,
          height: 60,
          normalize: true
        });

        wavesurferRef.current = ws;

        // Load synthetic beep/audio or recording URL
        const urlToLoad = recordingUrl || "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg";
        ws.load(urlToLoad);

        ws.on("ready", () => {
          setDuration(ws.getDuration());
        });

        ws.on("audioprocess", () => {
          setCurrentTime(ws.getCurrentTime());
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

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-4 rounded-xl bg-surface border border-border">
      <div className="flex items-center justify-between mb-3 text-xs text-charcoal-400">
        <div className="flex items-center gap-1.5 font-semibold text-charcoal-200">
          <Volume2 className="w-4 h-4 text-gold" />
          <span>Call Recording Audio</span>
        </div>
        <div className="font-mono text-gold">
          {formatTime(currentTime)} / {formatTime(duration || 42)}
        </div>
      </div>

      <div ref={containerRef} className="w-full my-2 cursor-pointer" />

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/60">
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

        <span className="text-[11px] font-mono text-charcoal-400">
          Codec: Opus 24kHz / Linear16
        </span>
      </div>
    </div>
  );
};
