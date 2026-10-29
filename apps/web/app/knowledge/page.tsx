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

          return {
            ...node,
            x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
            y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
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
          ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
          ctx.lineWidth = 2;
        } else if (edge.relationship === "VIOLATES") {
          ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
          ctx.lineWidth = 1.8;
        } else if (edge.relationship === "REGULATES") {
          ctx.strokeStyle = "rgba(229, 184, 66, 0.35)";
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = "rgba(75, 85, 99, 0.25)";
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        // Pulsing synaptic pulse dot along the edge
        const pulseProgress = (time * 0.5 * edge.weight) % 1;
        const px = src.x + (tgt.x - src.x) * pulseProgress;
        const py = src.y + (tgt.y - src.y) * pulseProgress;

        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = edge.relationship === "HEALS" ? "#10B981" : (edge.relationship === "VIOLATES" ? "#F43F5E" : "#E5B842");
        ctx.fill();
      });

      // 2. Draw Nodes
      nodes.forEach((node) => {
        if (!node.x || !node.y) return;

        const isFiltered = activeFilter === "all" || node.type === activeFilter;
        const isHovered = hoveredNodeRef.current?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        const baseRadius = node.val ? node.val * 0.7 : 10;
        const radius = isSelected ? baseRadius * 1.3 : (isHovered ? baseRadius * 1.15 : baseRadius);

        // Node Glow
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = node.type === "failure" 
            ? "rgba(244, 63, 94, 0.25)" 
            : (node.type === "fix" ? "rgba(16, 185, 129, 0.25)" : "rgba(229, 184, 66, 0.25)");
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

        if (node.type === "failure") {
          ctx.fillStyle = isFiltered ? "#E11D48" : "#4c1d24";
        } else if (node.type === "fix") {
          ctx.fillStyle = isFiltered ? "#059669" : "#064e3b";
        } else if (node.type === "language") {
          ctx.fillStyle = isFiltered ? "#D97706" : "#451a03";
        } else if (node.type === "rule") {
          ctx.fillStyle = isFiltered ? "#E5B842" : "#3b2e0e";
        } else {
          ctx.fillStyle = isFiltered ? "#3B82F6" : "#1e293b";
        }

        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = isSelected ? "#FFFFFF" : "#1F222C";
        ctx.stroke();

        // Node Label
        ctx.font = isSelected ? "bold 11px Inter, sans-serif" : "9px Inter, sans-serif";
        ctx.fillStyle = isFiltered ? "#F3F4F6" : "#6B7280";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-charcoal-400 hover:text-gold mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Brain className="w-8 h-8 text-gold" />
              Compliance Neural Network
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold/15 text-gold border border-gold/30 uppercase tracking-widest">
              Live Topology
            </span>
          </div>
          <p className="text-xs text-charcoal-400 mt-1">
            Dynamic graph linking Indian regulatory mandates, identified failure nodes, regional dialect hubs, and automated prompt repairs.
          </p>
        </div>

        <button
          onClick={fetchGraph}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surfaceHover hover:bg-charcoal-600 border border-border text-charcoal-200 hover:text-white text-xs font-semibold self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Topology
        </button>
      </div>

      {/* Top Metric Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-surface border border-gold/30">
            <span className="text-[10px] uppercase font-bold text-charcoal-400">
              Compliance Health
            </span>
            <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1">
              <span className="gold-gradient-text">{data.stats.compliance_health_score}%</span>
            </div>
            <span className="text-[11px] text-emerald-400 mt-1 block">
              Benchmark Integrity Index
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border">
            <span className="text-[10px] uppercase font-bold text-charcoal-400">
              Vulnerabilities Mapped
            </span>
            <div className="text-2xl font-extrabold text-rose-400 mt-1 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5" />
              {data.stats.total_failures_identified}
            </div>
            <span className="text-[11px] text-charcoal-400 mt-1 block">
              TRAI &amp; Vernacular Breaches
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border">
            <span className="text-[10px] uppercase font-bold text-charcoal-400">
              Self-Healing Synapses
            </span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1 flex items-center gap-1.5">
              <Zap className="w-5 h-5" />
              {data.stats.self_healing_fixes_deployed}
            </div>
            <span className="text-[11px] text-charcoal-400 mt-1 block">
              Active Surgical Patches
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border">
            <span className="text-[10px] uppercase font-bold text-charcoal-400">
              Linguistic Hubs
            </span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {data.stats.languages_covered}
            </div>
            <span className="text-[11px] text-charcoal-400 mt-1 block">
              Hindi &bull; Hinglish &bull; Kannada &bull; English
            </span>
          </div>
        </div>
      )}

      {/* Main Interactive Canvas & Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Neural Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-surface border border-border space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gold" />
              <span className="text-xs font-bold text-white">Neural Synapse Visualizer</span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 text-[11px]">
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
                  className={`px-2.5 py-0.5 rounded-lg font-semibold transition-colors ${
                    activeFilter === f.id
                      ? "bg-gold text-charcoal-900"
                      : "bg-charcoal-800 text-charcoal-400 hover:text-white border border-border"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="relative w-full overflow-hidden rounded-xl bg-charcoal-900/90 border border-border/80 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={900}
              height={550}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              className="w-full h-auto cursor-crosshair max-h-[550px]"
            />

            {/* Legend Overlay */}
            <div className="absolute bottom-3 left-3 bg-surface/85 backdrop-blur-md p-2.5 rounded-xl border border-border text-[10px] space-y-1 text-charcoal-400 pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gold" /> Gold: TRAI &amp; Rubric Rules
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Rose: Identified Failure Modes
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Emerald: Self-Healing Patches
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Amber: Vernacular Dialect Hubs
              </div>
            </div>
          </div>
        </div>

        {/* Right: Node Inspector Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl bg-surface border border-gold/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-gold" />
                Synaptic Node Inspector
              </h2>
              {selectedNode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-charcoal-700 text-charcoal-200 border border-border">
                  {selectedNode.type}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-base font-extrabold text-white">
                    {selectedNode.label}
                  </div>
                  <div className="text-charcoal-400 text-xs mt-1">
                    Node ID: <code className="font-mono text-charcoal-300">{selectedNode.id}</code>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-charcoal-900 border border-border space-y-2">
                  <span className="text-[10px] uppercase font-bold text-charcoal-400 block">
                    Description &amp; Behavior
                  </span>
                  <p className="text-charcoal-200 leading-relaxed">
                    {selectedNode.metadata.description || selectedNode.metadata.goal || "Core node in regulatory neural mapping."}
                  </p>
                </div>

                {selectedNode.type === "rule" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-charcoal-400">Source Citation:</span>
                      <span className="text-charcoal-200 font-mono text-right max-w-[180px] truncate">
                        {selectedNode.metadata.citation || "TRAI Telecom Regulation"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-charcoal-400">Total Fails Recorded:</span>
                      <span className="text-rose-400 font-bold font-mono">
                        {selectedNode.metadata.fails || 0}
                      </span>
                    </div>
                  </div>
                )}

                {selectedNode.type === "failure" && (
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1.5">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Active Vulnerability
                    </div>
                    <p className="text-[11px] text-charcoal-300">
                      When this failure triggers, Kasauti automatically synthesizes a prompt patch to heal the agent.
                    </p>
                  </div>
                )}

                {selectedNode.type === "fix" && (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1.5">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      Self-Healing Mitigation
                    </div>
                    <p className="text-[11px] text-charcoal-300">
                      This surgical prompt injection is automatically tested against regressions before production promotion.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-charcoal-400 text-xs">
                Click any node on the neural canvas to inspect its parameters and regulatory connections.
              </div>
            )}
          </div>

          {/* Top Vulnerability Cluster Summary */}
          {data && (
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" />
                Vulnerability Risk Clusters
              </h3>
              <div className="space-y-2">
                {data.stats.top_vulnerabilities.map((v, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-charcoal-900 border border-border/80 flex items-center justify-between text-xs">
                    <span className="font-medium text-charcoal-200">{v.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
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

