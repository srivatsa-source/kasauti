"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Terminal, RefreshCw, Layers, 
  Search, Shield, Check, Copy, Maximize2, Minimize2,
  ZoomIn, ZoomOut, RotateCcw, Calendar, Clock, Database,
  Activity, ShieldAlert, ChevronRight, X, ExternalLink
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TimelineEvent {
  date: string;
  time: string;
  event: string;
  status: string;
  details?: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: "scenario" | "rule" | "failure" | "fix" | "language";
  group: string;
  status: string;
  val: number;
  metadata: Record<string, any>;
  timeline?: TimelineEvent[];
  data_points?: Record<string, any>;
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<"timeline" | "data" | "synapses">("timeline");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

        const width = 1200;
        const height = 800;
        const centerX = width / 2;
        const centerY = height / 2;

        const initializedNodes = json.nodes.map((node, i) => {
          const angle = (i / json.nodes.length) * 2 * Math.PI;
          let radius = 280;
          if (node.type === "language") radius = 100;
          else if (node.type === "failure") radius = 200;
          else if (node.type === "fix") radius = 330;

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

  // ESC key exits fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Center on node and zoom in
  const focusNode = (node: GraphNode) => {
    setSelectedNode(node);
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    // Calculate pan offset to place node right in the visible center
    const targetPanX = (canvas.width / 2) - (node.x || canvas.width / 2);
    const targetPanY = (canvas.height / 2) - (node.y || canvas.height / 2);
    setPan({ x: targetPanX, y: targetPanY });
    setZoom(1.4);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.4), 3.2));
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Canvas Mouse Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy
      });
      return;
    }

    // Node hit testing with zoom and pan transform
    const rect = canvas.getBoundingClientRect();
    const scaleFactorX = canvas.width / rect.width;
    const scaleFactorY = canvas.height / rect.height;
    const screenX = (e.clientX - rect.left) * scaleFactorX;
    const screenY = (e.clientY - rect.top) * scaleFactorY;

    const worldX = (screenX - canvas.width / 2) / zoom + canvas.width / 2 - pan.x;
    const worldY = (screenY - canvas.height / 2) / zoom + canvas.height / 2 - pan.y;

    let found: GraphNode | null = null;
    for (const node of nodesRef.current) {
      if (node.x && node.y) {
        const dist = Math.hypot(node.x - worldX, node.y - worldY);
        if (dist <= (node.val || 16) + 4) {
          found = node;
          break;
        }
      }
    }
    hoveredNodeRef.current = found;
    canvas.style.cursor = found ? "pointer" : isDragging ? "grabbing" : "grab";
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    handleZoom(zoomDelta);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Math.abs(e.clientX - dragStartRef.current.x) > 4 || Math.abs(e.clientY - dragStartRef.current.y) > 4) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleFactorX = canvas.width / rect.width;
    const scaleFactorY = canvas.height / rect.height;
    const screenX = (e.clientX - rect.left) * scaleFactorX;
    const screenY = (e.clientY - rect.top) * scaleFactorY;

    const worldX = (screenX - canvas.width / 2) / zoom + canvas.width / 2 - pan.x;
    const worldY = (screenY - canvas.height / 2) / zoom + canvas.height / 2 - pan.y;

    for (const node of nodesRef.current) {
      if (node.x && node.y) {
        const dist = Math.hypot(node.x - worldX, node.y - worldY);
        if (dist <= (node.val || 16) + 6) {
          focusNode(node);
          return;
        }
      }
    }
  };

  // Canvas Neural Network Animation Loop
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

      ctx.save();
      // Apply Zoom & Pan Camera Matrix
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);
      ctx.translate(-centerX + pan.x, -centerY + pan.y);

      // 1. Draw Subtle Monochrome Radar / Coordinate Grid Background
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.lineWidth = 1;

      // Concentric range rings
      [100, 200, 300, 420].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshair center lines
      ctx.beginPath();
      ctx.moveTo(centerX - 460, centerY);
      ctx.lineTo(centerX + 460, centerY);
      ctx.moveTo(centerX, centerY - 460);
      ctx.lineTo(centerX + 460, centerY);
      ctx.stroke();

      // Corner technical marks
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillText("KASAUTI // NEURAL KNOWLEDGE GRAPH", centerX - 440, centerY - 430);
      ctx.fillText(`ZOOM: ${(zoom * 100).toFixed(0)}% | STATUS: ACTIVE`, centerX + 200, centerY - 430);
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

        const isRelatedToSelected = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (isRelatedToSelected) {
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 2.2;
          ctx.setLineDash([]);
        } else if (edge.relationship === "HEALS") {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1.6;
          ctx.setLineDash([4, 4]);
        } else if (edge.relationship === "VIOLATES") {
          ctx.strokeStyle = "rgba(161, 161, 170, 0.4)";
          ctx.lineWidth = 1.4;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = "rgba(82, 82, 91, 0.25)";
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated flow particle along edge
        const pulseSpeed = isRelatedToSelected ? 0.6 : 0.35;
        const pulseProgress = (time * pulseSpeed * edge.weight) % 1;
        const px = src.x + (tgt.x - src.x) * pulseProgress;
        const py = src.y + (tgt.y - src.y) * pulseProgress;

        ctx.beginPath();
        ctx.arc(px, py, isRelatedToSelected ? 2.5 : 1.8, 0, Math.PI * 2);
        ctx.fillStyle = isRelatedToSelected ? "#FFFFFF" : (edge.relationship === "HEALS" ? "#FFFFFF" : "#71717A");
        ctx.fill();
      });

      // 3. Draw Nodes in Stark Monochrome
      nodes.forEach((node) => {
        if (!node.x || !node.y) return;

        const isFiltered = activeFilter === "all" || node.type === activeFilter;
        const isHovered = hoveredNodeRef.current?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        const baseRadius = node.val ? node.val * 0.7 : 10;
        const radius = isSelected ? baseRadius * 1.35 : (isHovered ? baseRadius * 1.2 : baseRadius);

        // Node Glow for Selected / Hovered
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.08)";
          ctx.fill();
        }

        // Geometric styling by node type
        ctx.beginPath();
        if (node.type === "failure") {
          // Square node for breaches
          ctx.rect(node.x - radius, node.y - radius, radius * 2, radius * 2);
          ctx.fillStyle = isFiltered ? "#18181B" : "#09090B";
          ctx.strokeStyle = isSelected ? "#FFFFFF" : "#71717A";
        } else if (node.type === "fix") {
          // Solid white circle for self-healing fixes
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = isFiltered ? "#FFFFFF" : "#27272A";
          ctx.strokeStyle = "#FFFFFF";
        } else if (node.type === "language") {
          // Central hub circle
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
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.stroke();

        // Node Label
        ctx.font = isSelected ? "bold 11px monospace" : "10px monospace";
        ctx.fillStyle = isFiltered ? (node.type === "fix" && !isSelected ? "#000000" : "#E4E4E7") : "#52525B";
        ctx.textAlign = "center";
        
        const labelText = node.label.replace(/^§\s*/, "").replace(/^★\s*/, "").replace(/^⚠\s*/, "").replace(/^⚡\s*/, "");
        ctx.fillText(labelText, node.x, node.y + radius + 14);
      });

      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [data, activeFilter, selectedNode, zoom, pan]);

  // Connected edges for the selected node
  const selectedNodeSynapses = data && selectedNode
    ? data.edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  const filteredNodesList = data
    ? data.nodes.filter((n) => {
        if (activeFilter !== "all" && n.type !== activeFilter) return false;
        if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      })
    : [];

  return (
    <div className={`space-y-4 font-mono ${isFullscreen ? "fixed inset-0 z-50 bg-black p-4 overflow-hidden flex flex-col space-y-3" : ""}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
          )}

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
              Neural Compliance Topology
            </h1>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase">
            {data ? `${data.stats.total_nodes} Nodes &bull; ${data.stats.total_edges} Synapses` : "Loading Mesh"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Node Category Filters */}
          <div className="flex rounded-md bg-zinc-950 border border-zinc-800 p-0.5 text-xs">
            {["all", "rule", "failure", "fix", "language", "scenario"].map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                  activeFilter === type ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <button
            onClick={fetchGraph}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
            title="Reload Mesh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage & Side Inspector Drawer */}
      <div className={`grid grid-cols-1 ${selectedNode ? "lg:grid-cols-12" : "lg:grid-cols-1"} gap-4 flex-1 min-h-[580px]`}>
        {/* Left: Generative Canvas with Zoom/Pan Matrix */}
        <div className={`${selectedNode ? "lg:col-span-8" : "lg:col-span-12"} relative rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col justify-between`}>
          {/* Top Quick Search Bar inside Canvas */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Find node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-md bg-black/80 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors w-40 sm:w-52 backdrop-blur-sm"
              />
            </div>

            {searchQuery && filteredNodesList.length > 0 && (
              <div className="flex gap-1 overflow-x-auto max-w-xs">
                {filteredNodesList.slice(0, 3).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => focusNode(n)}
                    className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 whitespace-nowrap"
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Canvas Viewport */}
          <div ref={containerRef} className="w-full h-full min-h-[500px] flex-1 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              onClick={handleCanvasClick}
              className="w-full h-full select-none"
            />
          </div>

          {/* Bottom Left Floating Zoom & Pan HUD */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 p-1 rounded-lg bg-black/85 border border-zinc-800 text-xs backdrop-blur-md">
            <button
              onClick={() => handleZoom(0.2)}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(-0.2)}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <div className="h-3 w-px bg-zinc-800 mx-0.5" />
            <button
              onClick={resetView}
              className="px-2 py-1 rounded hover:bg-zinc-800 text-[10px] text-zinc-300 font-bold"
              title="Reset 100%"
            >
              {(zoom * 100).toFixed(0)}%
            </button>
            <button
              onClick={resetView}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Bottom Right Legend */}
          <div className="absolute bottom-3 right-3 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-black/85 border border-zinc-800 text-[10px] text-zinc-400 backdrop-blur-md">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-zinc-400 bg-zinc-900" /> Rule
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm border border-zinc-400 bg-zinc-900" /> Breach
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white" /> Self-Healing Fix
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-700" /> Language Hub
            </span>
          </div>
        </div>

        {/* Right: Deep Node Data & Day Timeline Inspector Drawer */}
        {selectedNode && (
          <div className="lg:col-span-4 rounded-xl bg-zinc-950 border border-zinc-800 p-4 flex flex-col justify-between space-y-4 overflow-y-auto max-h-[750px]">
            {/* Drawer Header */}
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-zinc-900 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                      {selectedNode.type}
                    </span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                      selectedNode.status === "fail"
                        ? "bg-zinc-900 text-white border border-zinc-600"
                        : selectedNode.status === "pass"
                        ? "bg-white text-black"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}>
                      {selectedNode.status}
                    </span>
                  </div>

                  <h2 className="text-sm sm:text-base font-bold text-white mt-1.5 tracking-tight truncate">
                    {selectedNode.label}
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">
                    {selectedNode.metadata?.description || "Neural network graph entity"}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-zinc-500 hover:text-white"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Tabs: Timeline vs Collected Data vs Synapses */}
              <div className="flex rounded-md bg-black border border-zinc-800 p-0.5 text-[11px] mt-3">
                <button
                  onClick={() => setDrawerTab("timeline")}
                  className={`flex-1 py-1 rounded text-center transition-colors font-bold ${
                    drawerTab === "timeline" ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Timelines
                </button>
                <button
                  onClick={() => setDrawerTab("data")}
                  className={`flex-1 py-1 rounded text-center transition-colors font-bold ${
                    drawerTab === "data" ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Collected Data
                </button>
                <button
                  onClick={() => setDrawerTab("synapses")}
                  className={`flex-1 py-1 rounded text-center transition-colors font-bold ${
                    drawerTab === "synapses" ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Synapses ({selectedNodeSynapses.length})
                </button>
              </div>
            </div>

            {/* Tab 1: Exact Day Timelines */}
            {drawerTab === "timeline" && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <span className="text-[10px] uppercase text-zinc-500 block">
                  Historical Trigger &amp; Enforcement Timeline
                </span>

                {selectedNode.timeline && selectedNode.timeline.length > 0 ? (
                  <div className="relative border-l border-zinc-800 ml-2 space-y-4 py-1">
                    {selectedNode.timeline.map((evt, idx) => (
                      <div key={idx} className="relative pl-4">
                        <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-black border-2 border-white" />
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {evt.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {evt.time}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white mt-0.5">{evt.event}</div>
                        {evt.details && (
                          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed bg-black/60 p-2 rounded border border-zinc-900">
                            {evt.details}
                          </p>
                        )}
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] uppercase font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
                          {evt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    No historical timeline logged for this node.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Every Data Collected at This Node */}
            {drawerTab === "data" && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <span className="text-[10px] uppercase text-zinc-500 block">
                  Node Telemetry &amp; Collected Parameters
                </span>

                <div className="space-y-2">
                  {Object.entries({
                    ...(selectedNode.data_points || {}),
                    ...(selectedNode.metadata || {})
                  }).map(([key, val]) => {
                    const displayVal = typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);
                    return (
                      <div key={key} className="p-2.5 rounded-lg bg-black border border-zinc-900 text-xs">
                        <div className="flex items-center justify-between text-[10px] uppercase text-zinc-500 mb-1">
                          <span>{key.replace(/_/g, " ")}</span>
                          <button
                            onClick={() => copyToClipboard(displayVal, key)}
                            className="text-zinc-600 hover:text-white"
                            title="Copy value"
                          >
                            {copiedKey === key ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-zinc-200 font-mono text-[11px] break-words whitespace-pre-wrap">
                          {displayVal}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Synaptic Connections */}
            {drawerTab === "synapses" && (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <span className="text-[10px] uppercase text-zinc-500 block">
                  Connected Neural Filaments
                </span>

                <div className="space-y-2">
                  {selectedNodeSynapses.map((synapse, idx) => {
                    const otherId = synapse.source === selectedNode.id ? synapse.target : synapse.source;
                    const isOutgoing = synapse.source === selectedNode.id;
                    const otherNode = data?.nodes.find((n) => n.id === otherId);

                    return (
                      <div
                        key={idx}
                        onClick={() => otherNode && focusNode(otherNode)}
                        className="p-2.5 rounded-lg bg-black border border-zinc-900 hover:border-zinc-700 transition-colors cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-zinc-500 block uppercase">
                            {isOutgoing ? `→ ${synapse.relationship}` : `← ${synapse.relationship}`}
                          </span>
                          <div className="text-xs text-white font-semibold truncate">
                            {otherNode?.label || otherId}
                          </div>
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Action Footer */}
            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(selectedNode, null, 2), "all")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
              >
                {copiedKey === "all" ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "all" ? "Copied" : "Copy Node JSON"}</span>
              </button>

              <button
                onClick={() => focusNode(selectedNode)}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors"
              >
                <span>Center Node</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
