"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  Volume2, Play, Pause, Radio, 
  Terminal, ShieldCheck, Activity, RotateCcw
} from "lucide-react";

interface RealtimeVoiceWaveformProps {
  isActive?: boolean;
  statusText?: string;
  speaker?: "agent" | "user" | "silence";
  currentTurnText?: string;
  onSimulateToggle?: () => void;
}

export const RealtimeVoiceWaveform: React.FC<RealtimeVoiceWaveformProps> = ({
  isActive = false,
  statusText = "Telephony Stream Idle",
  speaker = "agent",
  currentTurnText
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const [running, setRunning] = useState(isActive);
  const [currentSpeaker, setCurrentSpeaker] = useState<"agent" | "user" | "silence">(speaker);
  const [liveDb, setLiveDb] = useState<number>(-24);
  const [turnIndex, setTurnIndex] = useState<number>(0);

  // Demo conversational dialogue for interactive simulation
  const demoDialogue = [
    { speaker: "agent", text: "Namaste, main Bharat FinServe se automated AI assistant bol raha hoon." },
    { speaker: "user", text: "Haan boliye, kya kaam hai aapka?" },
    { speaker: "agent", text: "Sir aapke pre-approved business loan par 8.5% interest rate available hai. Kya aap 2 minute baat kar sakte hain?" },
    { speaker: "user", text: "Nahi mujhe loan nahi chahiye. Kripya mera number call list se hata dijiye." },
    { speaker: "agent", text: "Ji bilkul, aapka DND request record kar liya gaya hai. Dhanyavaad." },
  ];

  useEffect(() => {
    setRunning(isActive);
  }, [isActive]);

  // Turn switcher timer when running simulation
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTurnIndex((prev) => {
        const next = (prev + 1) % demoDialogue.length;
        setCurrentSpeaker(demoDialogue[next].speaker as "agent" | "user");
        return next;
      });
    }, 3800);
    return () => clearInterval(interval);
  }, [running]);

  // Canvas Realtime Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const numBars = 72;

    const render = () => {
      phase += running ? 0.08 : 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw subtle horizontal center axis
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const barWidth = width / numBars - 2;
      let calculatedDb = -36;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);
        
        // Multi-harmonic synthesized speech amplitude
        let amplitude = 0;
        if (running) {
          const freq1 = Math.sin(phase + i * 0.18);
          const freq2 = Math.cos(phase * 0.8 + i * 0.32);
          const freq3 = Math.sin(phase * 1.6 + i * 0.08);

          const envelope = Math.sin((i / numBars) * Math.PI); // tapering envelope at edges
          const voiceEnergy = currentSpeaker === "silence" ? 0.08 : (currentSpeaker === "agent" ? 0.85 : 0.7);

          amplitude = Math.abs(freq1 * 0.5 + freq2 * 0.3 + freq3 * 0.2) * (height * 0.42) * envelope * voiceEnergy + 3;
          calculatedDb = Math.max(calculatedDb, -30 + Math.round(amplitude * 0.5));
        } else {
          // Subtle idle breathing pulse
          amplitude = Math.abs(Math.sin(phase + i * 0.1)) * 3 + 1.5;
          calculatedDb = -42;
        }

        // Draw symmetrical frequency bars around center
        ctx.fillStyle = running ? "#FFFFFF" : "#3F3F46";
        ctx.fillRect(x, centerY - amplitude, barWidth, amplitude * 2);

        // Peak dot on top bar
        if (running && amplitude > 8) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.fillRect(x, centerY - amplitude - 2, barWidth, 1.5);
        }
      }

      setLiveDb(calculatedDb);
      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [running, currentSpeaker]);

  const activeTurn = demoDialogue[turnIndex];
  const displaySpeaker = currentSpeaker === "agent" ? "Agent (Voice Bot)" : "User (Simulated Caller)";
  const displayText = currentTurnText || (running ? activeTurn.text : "Stream standing by. Click 'Engage Live Stream' to monitor live voice oscillations.");

  return (
    <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 sm:p-5 space-y-3 font-mono">
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900 pb-3 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${running ? "bg-white animate-pulse" : "bg-zinc-600"}`} />
          <span className="font-bold text-white uppercase tracking-tight">
            Realtime Voice Stream Oscilloscope
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
            {running ? `Active: ${displaySpeaker}` : statusText}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <div>
            <span className="text-zinc-600">VU: </span>
            <span className="text-white font-bold">{liveDb} dBFS</span>
          </div>
          <div>
            <span className="text-zinc-600">CODEC: </span>
            <span className="text-zinc-300">Opus 24kHz</span>
          </div>
          <div>
            <span className="text-zinc-600">RTT: </span>
            <span className="text-zinc-300">188ms</span>
          </div>
        </div>
      </div>

      {/* Realtime Canvas Waveform */}
      <div className="relative w-full h-24 bg-black rounded-lg border border-zinc-900 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={96}
          className="w-full h-full"
        />

        {/* Live Audio Telemetry Corner Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/85 border border-zinc-800 text-[9px] text-zinc-400">
          <Radio className={`w-2.5 h-2.5 ${running ? "text-white animate-pulse" : "text-zinc-600"}`} />
          <span>{running ? "LIVE MONITORING" : "STREAM STANDBY"}</span>
        </div>
      </div>

      {/* Live Dialogue Transcription Stream Bar */}
      <div className="p-3 rounded-lg bg-black border border-zinc-900 flex items-start gap-2.5 text-xs">
        <div className="mt-0.5 shrink-0">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            currentSpeaker === "agent" ? "bg-white text-black" : "bg-zinc-800 text-zinc-300"
          }`}>
            {currentSpeaker === "agent" ? "BOT" : "USER"}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-zinc-200 leading-relaxed font-sans text-xs">
            {displayText}
          </p>
        </div>

        <button
          onClick={() => setRunning(!running)}
          className={`px-3 py-1 rounded text-[11px] font-semibold transition-all active:scale-95 shrink-0 ${
            running
              ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700"
              : "bg-white hover:bg-zinc-200 text-black shadow-sm"
          }`}
        >
          {running ? "Pause Stream" : "Engage Live Stream"}
        </button>
      </div>
    </div>
  );
};

