"use client";

import React, { useEffect, useRef, useState } from "react";

const HEIGHT = 320;
const MARGIN = { top: 28, right: 20, bottom: 48, left: 52 };
const X_MIN = 20;
const X_MAX = 70;
const Y_MIN = 40;
const Y_MAX = 120;
const X_TICKS = [20, 30, 40, 50, 60, 70];
const Y_TICKS = [40, 60, 80, 100, 120];

// Rebuilt from Caller.digital's cost-per-resolved-contact model.
const HUMAN_COST = 99.75;
const aiCost = (resolution: number) => 132 - 0.98 * resolution;
const BREAKEVEN = (132 - HUMAN_COST) / 0.98;

const rupees = (value: number) => `₹${value.toFixed(2)}`;

export const ResolutionCostChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [resolution, setResolution] = useState(55);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const xScale = (value: number) => MARGIN.left + ((value - X_MIN) / (X_MAX - X_MIN)) * plotWidth;
  const yScale = (value: number) => MARGIN.top + ((Y_MAX - value) / (Y_MAX - Y_MIN)) * plotHeight;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left - MARGIN.left) / plotWidth;
    const next = Math.round(X_MIN + ratio * (X_MAX - X_MIN));
    setResolution(Math.min(X_MAX, Math.max(X_MIN, next)));
  };

  const current = aiCost(resolution);
  const saving = HUMAN_COST - current;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold" aria-live="polite">
        <span>
          At <span className="font-mono font-black">{resolution}%</span> resolution
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-5 h-1 bg-brutal-mint" aria-hidden="true" />
          AI agent <span className="font-mono font-black">{rupees(current)}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-5 h-1 bg-black" aria-hidden="true" />
          Human agent <span className="font-mono font-black">{rupees(HUMAN_COST)}</span>
        </span>
        <span className={`px-2 py-0.5 rounded border-2 border-black font-black ${saving >= 0 ? "bg-brutal-green" : "bg-brutal-pink"}`}>
          {saving >= 0 ? `AI saves ${rupees(saving)}` : `AI costs ${rupees(-saving)} more`}
        </span>
      </div>

      <div ref={containerRef} className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          role="img"
          aria-label="Line chart of cost per resolved contact. The AI agent's cost falls from ₹112.40 at 20% resolution to ₹63.40 at 70%. The human agent stays at ₹99.75. They match at about 33% resolution."
          onPointerMove={handlePointerMove}
          className="block w-full h-auto touch-pan-y cursor-crosshair"
        >
          {/* Zone where the AI agent costs more than a person */}
          <rect
            x={xScale(X_MIN)}
            y={MARGIN.top}
            width={xScale(BREAKEVEN) - xScale(X_MIN)}
            height={plotHeight}
            fill="#ffb8f1"
            opacity={0.45}
          />

          {Y_TICKS.map((tick) => (
            <g key={tick}>
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={yScale(tick)} y2={yScale(tick)} stroke="#000000" strokeOpacity={0.12} />
              <text x={MARGIN.left - 8} y={yScale(tick) + 4} textAnchor="end" fontSize={12} fontWeight={700} fontFamily="JetBrains Mono, monospace">
                ₹{tick}
              </text>
            </g>
          ))}

          {X_TICKS.map((tick) => (
            <text key={tick} x={xScale(tick)} y={HEIGHT - MARGIN.bottom + 20} textAnchor="middle" fontSize={12} fontWeight={700} fontFamily="JetBrains Mono, monospace">
              {tick}%
            </text>
          ))}
          <text x={MARGIN.left + plotWidth / 2} y={HEIGHT - 6} textAnchor="middle" fontSize={12} fontWeight={800}>
            Calls resolved by the agent
          </text>

          <line x1={xScale(X_MIN)} x2={xScale(X_MAX)} y1={yScale(HUMAN_COST)} y2={yScale(HUMAN_COST)} stroke="#000000" strokeWidth={2} />
          <line x1={xScale(X_MIN)} x2={xScale(X_MAX)} y1={yScale(aiCost(X_MIN))} y2={yScale(aiCost(X_MAX))} stroke="#23a094" strokeWidth={3} />

          <text x={xScale(X_MAX)} y={yScale(HUMAN_COST) - 8} textAnchor="end" fontSize={12} fontWeight={800}>
            Human agent
          </text>
          <text x={xScale(X_MAX)} y={yScale(aiCost(X_MAX)) + 18} textAnchor="end" fontSize={12} fontWeight={800}>
            AI agent
          </text>
          <text x={xScale(X_MIN) + 8} y={MARGIN.top + 16} fontSize={12} fontWeight={800}>
            AI costs more
          </text>

          {/* Crosshair */}
          <line x1={xScale(resolution)} x2={xScale(resolution)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} stroke="#000000" strokeDasharray="4 4" />
          <circle cx={xScale(resolution)} cy={yScale(HUMAN_COST)} r={5} fill="#000000" stroke="#ffffff" strokeWidth={2} />
          <circle cx={xScale(resolution)} cy={yScale(current)} r={6} fill="#23a094" stroke="#000000" strokeWidth={2} />
        </svg>
      </div>

      <div>
        <label htmlFor="resolution-rate" className="block text-sm font-black uppercase tracking-wide">
          Drag to change the resolution rate
        </label>
        <input
          id="resolution-rate"
          type="range"
          min={X_MIN}
          max={X_MAX}
          value={resolution}
          onChange={(e) => setResolution(Number(e.target.value))}
          className="mt-2 w-full accent-black"
        />
      </div>
    </div>
  );
};
