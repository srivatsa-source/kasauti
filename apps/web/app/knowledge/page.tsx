"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Brain, Sparkles, Shield, AlertTriangle, 
  RefreshCw, Zap, CheckCircle2, Filter, Layers, Info
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

        // Initialize positions in a circle/neural layout
        const width = 900;
        const height = 600;
        const centerX = width / 2;
        const centerY = height / 2;

        const initializedNodes = json.nodes.map((node, i) => {
          const angle = (i / json.nodes.length) * 2 * Math.PI;
          let radius = 220;
          if (node.type === "language") radius = 80;
          else if (node.type === "failure") radius = 170;
          else if (node.type === "fix") radius = 260;

          const deterministicJitter = ((i * 19) % 37 - 18) * 1.2;
          return {
            ...node,
            x: centerX + radius * Math.cos(angle) + deterministicJitter,
            y: centerY + radius * Math.sin(angle) + deterministicJitter,
            vx: 0,
            vy: 0
          };
        });

        nodesRef.current = initializedNodes;
        if (!selectedNode && initializedNodes.length > 0) {
          // Select failure or rule node by default
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

  // Canvas Neural Network Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      // 1. Draw Synaptic Connection Lines
      data.edges.forEach((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt || !src.x || !src.y || !tgt.x || !tgt.y) return;

        // Filter check
        if (activeFilter !== "all") {
          if (src.type !== activeFilter && tgt.type !== activeFilter) return;
        }

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (edge.relationship === "HEALS") {
          ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
          ctx.lineWidth = 2.5;
        } else if (edge.relationship === "VIOLATES") {
          ctx.strokeStyle = "rgba(244, 63, 94, 0.6)";
          ctx.lineWidth = 2.2;
        } else if (edge.relationship === "REGULATES") {
          ctx.strokeStyle = "rgba(255, 201, 0, 0.7)";
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();

        // Pulsing synaptic pulse dot along the edge
        const pulseProgress = (time * 0.5 * edge.weight) % 1;
        const px = src.x + (tgt.x - src.x) * pulseProgress;
        const py = src.y + (tgt.y - src.y) * pulseProgress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = edge.relationship === "HEALS" ? "#10B981" : (edge.relationship === "VIOLATES" ? "#F43F5E" : "#000000");
        ctx.fill();
      });

      // 2. Draw Nodes
      nodes.forEach((node) => {
        if (!node.x || !node.y) return;

        const isFiltered = activeFilter === "all" || node.type === activeFilter;
        const isHovered = hoveredNodeRef.current?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        const baseRadius = node.val ? node.val * 0.75 : 11;
        const radius = isSelected ? baseRadius * 1.3 : (isHovered ? baseRadius * 1.15 : baseRadius);

        // Node Drop-shadow brutalist outline
        ctx.beginPath();
        ctx.arc(node.x + 2, node.y + 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#000000";
        ctx.fill();

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

        if (node.type === "failure") {
          ctx.fillStyle = isFiltered ? "#ff6b6b" : "#ffcccc";
        } else if (node.type === "fix") {
          ctx.fillStyle = isFiltered ? "#7fe382" : "#d4f7d6";
        } else if (node.type === "language") {
          ctx.fillStyle = isFiltered ? "#b2a8fd" : "#e3e0ff";
        } else if (node.type === "rule") {
          ctx.fillStyle = isFiltered ? "#ffc900" : "#fff3b3";
        } else {
          ctx.fillStyle = isFiltered ? "#90a8ed" : "#dbe4ff";
        }

        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000000";
        ctx.stroke();

        // Node Label
        ctx.font = isSelected ? "bold 11px sans-serif" : "bold 9px sans-serif";
        ctx.fillStyle = isFiltered ? "#000000" : "#888888";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + radius + 13);
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

    // Find clicked node
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-black hover:underline mb-2 font-black uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display flex items-center gap-2.5">
              <Brain className="w-8 h-8 text-black stroke-[2.5]" />
              Compliance Neural Network
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-brutal-yellow text-black border-2 border-black shadow-[2px_2px_0px_#000] uppercase tracking-wider">
              Live Topology
            </span>
          </div>
          <p className="text-xs font-semibold text-gray-700 mt-1">
            Dynamic graph linking Indian regulatory mandates, identified failure nodes, regional dialect hubs, and automated prompt repairs.
          </p>
        </div>

        <button
          onClick={fetchGraph}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 border-2 border-black text-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${loading ? "animate-spin" : ""}`} />
          Refresh Topology
        </button>
      </div>

      {/* Top Metric Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-gray-600">
              Compliance Health
            </span>
            <div className="text-3xl font-black text-black mt-1 font-display">
              {data.stats.compliance_health_score}%
            </div>
            <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
              Benchmark Integrity Index
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-gray-600">
              Vulnerabilities Mapped
            </span>
            <div className="text-3xl font-black text-rose-600 mt-1 flex items-center gap-1.5 font-display">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              {data.stats.total_failures_identified}
            </div>
            <span className="text-[11px] font-bold text-gray-700 mt-1 block">
              TRAI &amp; Vernacular Breaches
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-gray-600">
              Self-Healing Synapses
            </span>
            <div className="text-3xl font-black text-emerald-600 mt-1 flex items-center gap-1.5 font-display">
              <Zap className="w-6 h-6 stroke-[2.5]" />
              {data.stats.self_healing_fixes_deployed}
            </div>
            <span className="text-[11px] font-bold text-gray-700 mt-1 block">
              Active Surgical Patches
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border-3 border-black shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] uppercase font-black text-gray-600">
              Linguistic Hubs
            </span>
            <div className="text-3xl font-black text-black mt-1 font-display">
              {data.stats.languages_covered}
            </div>
            <span className="text-[11px] font-bold text-gray-700 mt-1 block">
              Hindi &bull; Hinglish &bull; Kannada &bull; English
            </span>
          </div>
        </div>
      )}

      {/* Main Interactive Canvas & Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Neural Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-black stroke-[2.5]" />
              <span className="text-xs font-black uppercase text-black font-display tracking-tight">
                Neural Synapse Visualizer
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: "all", label: "All Synapses" },
                { id: "rule", label: "Rules" },
                { id: "failure", label: "Violations" },
                { id: "fix", label: "Self-Heals" },
                { id: "language", label: "Dialects" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-black uppercase transition-all ${
                    activeFilter === f.id
                      ? "bg-black text-white border-2 border-black shadow-[2px_2px_0px_#ff90e8]"
                      : "bg-white text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000] hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="relative w-full overflow-hidden rounded-xl bg-[#faf9f5] border-2 border-black flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={900}
              height={550}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              className="w-full h-auto cursor-crosshair max-h-[550px]"
            />

            {/* Legend Overlay */}
            <div className="absolute bottom-3 left-3 bg-white/95 p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] text-[10px] font-black uppercase space-y-1 text-black pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brutal-yellow border border-black" /> Yellow: TRAI &amp; Rubric Rules
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-black" /> Pink: Identified Failures
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brutal-green border border-black" /> Green: Self-Healing Patches
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brutal-purple border border-black" /> Purple: Dialect Hubs
              </div>
            </div>
          </div>
        </div>

        {/* Right: Node Inspector Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h2 className="text-sm font-black uppercase tracking-tight text-black flex items-center gap-2 font-display">
                <Info className="w-4 h-4 text-black stroke-[2.5]" />
                Synaptic Node Inspector
              </h2>
              {selectedNode && (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-brutal-bg text-black border border-black shadow-[1px_1px_0px_#000]">
                  {selectedNode.type}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-base font-black text-black uppercase font-display">
                    {selectedNode.label}
                  </div>
                  <div className="text-gray-700 text-xs mt-1 font-mono font-bold">
                    Node ID: <code>{selectedNode.id}</code>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border-2 border-black space-y-2">
                  <span className="text-[10px] uppercase font-black text-gray-700 block">
                    Description &amp; Behavior
                  </span>
                  <p className="text-black font-medium leading-relaxed">
                    {selectedNode.metadata.description || selectedNode.metadata.goal || "Core node in regulatory neural mapping."}
                  </p>
                </div>

                {selectedNode.type === "rule" && (
                  <div className="space-y-2 font-bold">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-600">Source Citation:</span>
                      <span className="text-black font-mono text-right max-w-[180px] truncate">
                        {selectedNode.metadata.citation || "TRAI Telecom Regulation"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-600">Total Fails Recorded:</span>
                      <span className="text-rose-600 font-black font-mono">
                        {selectedNode.metadata.fails || 0}
                      </span>
                    </div>
                  </div>
                )}

                {selectedNode.type === "failure" && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-black space-y-1.5">
                    <div className="font-black text-rose-800 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                      Active Vulnerability
                    </div>
                    <p className="text-[11px] font-medium text-rose-900">
                      When this failure triggers, Kasauti automatically synthesizes a prompt patch to heal the agent.
                    </p>
                  </div>
                )}

                {selectedNode.type === "fix" && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border-2 border-black space-y-1.5">
                    <div className="font-black text-emerald-800 uppercase flex items-center gap-1.5">
                      <Zap className="w-4 h-4 stroke-[2.5]" />
                      Self-Healing Mitigation
                    </div>
                    <p className="text-[11px] font-medium text-emerald-900">
                      This surgical prompt injection is automatically tested against regressions before production promotion.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-600 font-semibold text-xs">
                Click any node on the neural canvas to inspect its parameters and regulatory connections.
              </div>
            )}
          </div>

          {/* Top Vulnerability Cluster Summary */}
          {data && (
            <div className="p-5 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000] space-y-3">
              <h3 className="text-xs font-black uppercase text-black tracking-wider flex items-center gap-2 font-display">
                <Shield className="w-4 h-4 text-black stroke-[2.5]" />
                Vulnerability Risk Clusters
              </h3>
              <div className="space-y-2">
                {data.stats.top_vulnerabilities.map((v, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50 border-2 border-black flex items-center justify-between text-xs">
                    <span className="font-bold text-black">{v.name}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-black">
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
