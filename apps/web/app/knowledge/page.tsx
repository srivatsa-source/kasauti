"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Terminal, RefreshCw, Layers, 
  Search, Shield, Check, Copy, Info
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface GraphNode {
  id: string;
  label: string;
  type: "scenario" | "rule" | "failure" | "fix" | "language";
  group: string;
  status: string;
  val: number;
  metadata: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  status: string;
  weight: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    total_rules: number;
    total_failures_identified: number;
    self_healing_fixes_deployed: number;
    compliance_health_score: number;
    languages_covered: number;
    top_vulnerabilities: Array<{ name: string; risk: string }>;
  };
}

export default function KnowledgePage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const hoveredNodeRef = useRef<GraphNode | null>(null);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/knowledge-graph`);
      if (res.ok) {
        const json: GraphData = await res.json();
        setData(json);

        const width = 940;
        const height = 580;
        const centerX = width / 2;
        const centerY = height / 2;

        const initializedNodes = json.nodes.map((node, i) => {
          const angle = (i / json.nodes.length) * 2 * Math.PI;
          let radius = 220;
          if (node.type === "language") radius = 80;
          else if (node.type === "failure") radius = 160;
          else if (node.type === "fix") radius = 250;

          return {
            ...node,
            x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 30,
            y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 30,
            vx: 0,
            vy: 0
          };
        });

        nodesRef.current = initializedNodes;
        if (!selectedNode && initializedNodes.length > 0) {
          const defaultNode = initializedNodes.find((n) => n.type === "failure") || initializedNodes[0];
          setSelectedNode(defaultNode);
        }
      }
    } catch (err) {
      console.error("Failed to fetch knowledge graph:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  // Canvas Neural Network Animation Loop in Stark B/W Artstyle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Draw Subtle Monochrome Radar / Coordinate Grid Background
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;

      // Concentric range rings
      [80, 160, 240].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshair center lines
      ctx.beginPath();
      ctx.moveTo(centerX - 260, centerY);
      ctx.lineTo(centerX + 260, centerY);
      ctx.moveTo(centerX, centerY - 260);
      ctx.lineTo(centerX, centerY + 260);
      ctx.stroke();

      // Corner technical coordinate marks
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillText("GRID_SYS // KASAUTI-NET-01", 16, 22);
      ctx.fillText("[TOPOLOGY: TRAI-BHARAT-24K]", width - 170, 22);
      ctx.restore();

      const nodes = nodesRef.current;
      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      // 2. Draw Synaptic Connection Filaments
      data.edges.forEach((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt || !src.x || !src.y || !tgt.x || !tgt.y) return;

        if (activeFilter !== "all") {
          if (src.type !== activeFilter && tgt.type !== activeFilter) return;
        }

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (edge.relationship === "HEALS") {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = 1.8;
          ctx.setLineDash([4, 4]);
        } else if (edge.relationship === "VIOLATES") {
          ctx.strokeStyle = "rgba(161, 161, 170, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = "rgba(82, 82, 91, 0.25)";
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Flowing white pulse dot along the edge
        const pulseProgress = (time * 0.4 * edge.weight) % 1;
        const px = src.x + (tgt.x - src.x) * pulseProgress;
        const py = src.y + (tgt.y - src.y) * pulseProgress;

        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = edge.relationship === "HEALS" ? "#FFFFFF" : "#A1A1AA";
        ctx.fill();
      });

      // 3. Draw Nodes in Stark Monochrome
      nodes.forEach((node) => {
        if (!node.x || !node.y) return;

        const isFiltered = activeFilter === "all" || node.type === activeFilter;
        const isHovered = hoveredNodeRef.current?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        const baseRadius = node.val ? node.val * 0.65 : 9;
        const radius = isSelected ? baseRadius * 1.3 : (isHovered ? baseRadius * 1.15 : baseRadius);

        // Node Glow for Selected / Hovered
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
          ctx.fill();
        }

        // Geometric styling by node type
        ctx.beginPath();
        if (node.type === "failure") {
          // Sharp square node for breaches
          ctx.rect(node.x - radius, node.y - radius, radius * 2, radius * 2);
          ctx.fillStyle = isFiltered ? "#18181B" : "#09090B";
          ctx.strokeStyle = isSelected ? "#FFFFFF" : "#71717A";
        } else if (node.type === "fix") {
          // Solid white glowing circle for self-healing fixes
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = isFiltered ? "#FFFFFF" : "#3F3F46";
          ctx.strokeStyle = "#FFFFFF";
        } else if (node.type === "language") {
          // Central hub node
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = isFiltered ? "#27272A" : "#121215";
          ctx.strokeStyle = isSelected ? "#FFFFFF" : "#52525B";
        } else {
          // Rule & scenario nodes
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = isFiltered ? "#18181B" : "#09090B";
          ctx.strokeStyle = isSelected ? "#FFFFFF" : "#3F3F46";
        }

        ctx.fill();
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Node Label
        ctx.font = isSelected ? "bold 10px monospace" : "9px monospace";
        ctx.fillStyle = isFiltered ? (node.type === "fix" && !isSelected ? "#000000" : "#D4D4D8") : "#52525B";
        ctx.textAlign = "center";
        
        // Label text below node
        const labelText = node.label.replace(/^§\s*/, "").replace(/^★\s*/, "").replace(/^⚠\s*/, "").replace(/^⚡\s*/, "");
        ctx.fillText(labelText, node.x, node.y + radius + 12);
      });

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [data, activeFilter, selectedNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (const node of nodesRef.current) {
      if (node.x && node.y) {
        const dist = Math.hypot(node.x - x, node.y - y);
        if (dist <= (node.val || 12)) {
          setSelectedNode(node);
          return;
        }
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    let found: GraphNode | null = null;
    for (const node of nodesRef.current) {
      if (node.x && node.y) {
        const dist = Math.hypot(node.x - x, node.y - y);
        if (dist <= (node.val || 12)) {
          found = node;
          break;
        }
      }
    }
    hoveredNodeRef.current = found;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
                Compliance Neural Topology
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-800 uppercase">
                Interactive Graph
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Live generative mapping of TRAI mandates, failure modes, dialect clusters, and self-healing synapses
            </p>
          </div>

          <button
            onClick={fetchGraph}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono transition-colors self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload Mesh</span>
          </button>
        </div>
      </div>

      {/* Top 4-Column KPI Strip */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">
              Compliance Index
            </span>
            <div className="text-2xl font-black text-white">
              {data.stats.compliance_health_score}%
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Benchmark Health Score
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">
              Breaches Mapped
            </span>
            <div className="text-2xl font-black text-white">
              {data.stats.total_failures_identified}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              TRAI &amp; Dialect Regressions
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">
              Self-Healing Fixes
            </span>
            <div className="text-2xl font-black text-white">
              {data.stats.self_healing_fixes_deployed}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Surgical Prompt Synapses
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">
              Vernacular Hubs
            </span>
            <div className="text-2xl font-black text-white">
              {data.stats.languages_covered}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Hindi &bull; Hinglish &bull; Kannada &bull; EN
            </span>
          </div>
        </div>
      )}

      {/* Main Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Generative Canvas (8 cols) */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-bold text-white font-mono uppercase tracking-tight">
                Synaptic Mesh
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 font-mono text-[10px]">
              {[
                { id: "all", label: "All Synapses" },
                { id: "rule", label: "Rules" },
                { id: "failure", label: "Breaches" },
                { id: "fix", label: "Self-Heals" },
                { id: "language", label: "Dialects" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    activeFilter === f.id
                      ? "bg-white text-black font-bold"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stark B/W Canvas */}
          <div className="relative w-full overflow-hidden rounded-lg bg-black border border-zinc-900 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={940}
              height={560}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              className="w-full h-auto cursor-crosshair max-h-[560px]"
            />

            {/* Geometric Legend Overlay */}
            <div className="absolute bottom-3 left-3 bg-black/90 p-2.5 rounded border border-zinc-800 text-[10px] font-mono space-y-1 text-zinc-400 pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-zinc-500 bg-black" />
                <span>Circle: TRAI Rule</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 border border-zinc-400 bg-zinc-900" />
                <span>Square: Breach / Regression</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="text-white font-semibold">Solid White: Self-Healing Fix</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Technical Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4 font-mono">
          <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-zinc-400" />
                Node Inspector
              </h2>
              {selectedNode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-zinc-300 border border-zinc-800">
                  {selectedNode.type}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-sm font-bold text-white">
                    {selectedNode.label}
                  </div>
                  <div className="text-zinc-500 text-[11px] mt-0.5">
                    node_id: <span className="text-zinc-300">{selectedNode.id}</span>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-black border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase text-zinc-500 block">
                    Telemetry / Description
                  </span>
                  <p className="text-zinc-300 leading-relaxed font-sans text-xs">
                    {selectedNode.metadata.description || selectedNode.metadata.goal || "Core node in regulatory neural mapping."}
                  </p>
                </div>

                {selectedNode.type === "rule" && (
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span className="text-zinc-500">Citation:</span>
                      <span className="text-zinc-300 truncate max-w-[170px]">
                        {selectedNode.metadata.citation || "TRAI Gazette"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span className="text-zinc-500">Breaches Count:</span>
                      <span className="text-white font-bold">{selectedNode.metadata.fails || 0}</span>
                    </div>
                  </div>
                )}

                {selectedNode.type === "failure" && (
                  <div className="p-3 rounded bg-zinc-900 border border-zinc-700 space-y-1 text-xs">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>■</span>
                      <span>Active Vulnerability</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Detected breach triggers automated surgical prompt injection.
                    </p>
                  </div>
                )}

                {selectedNode.type === "fix" && (
                  <div className="p-3 rounded bg-zinc-900 border border-white space-y-1 text-xs">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>●</span>
                      <span>Self-Healing Synapse</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-sans">
                      Verified prompt patch applied to staging agent and validated regression-free.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Click any node on the canvas to inspect its parameters.
              </div>
            )}
          </div>

          {/* Risk Cluster Summary */}
          {data && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-tight">
                Vulnerability Risk Clusters
              </h3>
              <div className="space-y-1.5">
                {data.stats.top_vulnerabilities.map((v, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-black border border-zinc-900 flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{v.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {v.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
