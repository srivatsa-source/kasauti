"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Phone, Plus, Play, Sparkles, AlertCircle, 
  ExternalLink, ArrowRight, Activity, Brain,
  ArrowUpRight, Search, CheckCircle2, Globe,
  ShieldCheck, Mic, MessageSquare, Terminal, Zap,
  DownloadCloud, Trash2, Bot, Sliders
} from "lucide-react";
import { PurityScoreBadge } from "@/components/PurityScoreBadge";
import { LegalDisclaimerBanner } from "@/components/UnverifiedRuleBadge";
import { NewRunModal } from "@/components/NewRunModal";
import { ImportBolnaModal } from "@/components/ImportBolnaModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

interface Target {
  id: string;
  name: string;
  phone_number: string;
  bolna_agent_id?: string;
  staging_agent_id?: string;
  languages: string[];
  notes?: string;
}

interface Run {
  id: string;
  target_id: string;
  target_name?: string;
  suite_name: string;
  status: string;
  purity_score: number;
  total_calls: number;
  passed_calls: number;
  failed_calls: number;
  created_at: string;
}

export default function HomePage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTargetForRun, setSelectedTargetForRun] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New target form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+919876543210");
  const [bolnaAgentId, setBolnaAgentId] = useState("agent_prod_bharat");
  const [stagingAgentId, setStagingAgentId] = useState("kasauti_staging_bharat");
  const [notes, setNotes] = useState("You are an outbound customer assistance agent.");

  const fetchData = async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        fetch(`${API_BASE}/targets`),
        fetch(`${API_BASE}/runs`)
      ]);
      if (tRes.ok) setTargets(await tRes.json());
      if (rRes.ok) setRuns(await rRes.json());
    } catch (err) {
      console.error("API error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone_number: phone,
          bolna_agent_id: bolnaAgentId,
          staging_agent_id: stagingAgentId,
          languages: ["Hindi", "Hinglish", "Kannada", "Indian English"],
          notes
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setName("");
        fetchData();
      }
    } catch (err) {
      alert("Failed to create target");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerRun = async (targetId: string) => {
    try {
      const res = await fetch(`${API_BASE}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_id: targetId,
          suite_name: "TRAI Regulatory & Behavioral Pack"
        })
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/runs/${data.id}`;
      }
    } catch (err) {
      alert("Failed to trigger run");
    }
  };

  const handleDeleteTarget = async (id: string, targetName: string) => {
    if (!confirm(`Are you sure you want to remove target "${targetName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/targets/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTargets((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert("Could not delete target.");
      }
    } catch (err) {
      alert("Failed to delete target: " + String(err));
    }
  };

  const handleOpenBenchmark = (targetId?: string) => {
    setSelectedTargetForRun(targetId);
    setShowRunModal(true);
  };

  const filteredTargets = targets.filter((t) => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone_number.includes(searchQuery)
  );

  const avgPurity = runs.length > 0
    ? (runs.reduce((acc, r) => acc + (r.purity_score || 0), 0) / runs.length).toFixed(1)
    : "98.4";

  return (
    <div className="space-y-12 pb-12">
      
      {/* ──────────────────────────────────────────────────────────
          1. HERO SECTION (Gumroad Style "GO FROM 0 TO $1")
         ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-white border-3 border-black p-6 sm:p-12 shadow-[8px_8px_0px_#000000]">
        
        {/* Playful background backdrop cutout */}
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-brutal-purple/30 rounded-3xl -rotate-6 border-2 border-black pointer-events-none hidden lg:block" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left: Giant Typography & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brutal-pink border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              THE TOUCHSTONE FOR VOICE AGENTS
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-black uppercase font-display leading-[0.92]">
              GO FROM <br />
              <span className="text-black">0 TO 100%</span> <br />
              <span className="underline decoration-brutal-pink decoration-wavy decoration-4">PURITY.</span>
            </h1>

            <p className="text-base sm:text-lg text-black font-medium leading-relaxed max-w-xl">
              Anyone can test their voice agent before dialing customers.
              Simulate Indian regional accents (Hindi, Hinglish, Kannada & Indian English),
              detect TRAI compliance violations, and auto-patch prompts. It&apos;s that easy.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setShowRunModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-black text-white hover:bg-neutral-800 border-2 border-black font-black text-sm uppercase tracking-wide shadow-[4px_4px_0px_#ff90e8] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#ff90e8] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                <span>Launch Benchmark</span>
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="relative flex-1 min-w-[220px] max-w-xs">
                <input
                  type="text"
                  placeholder="Search targets or suites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-white border-2 border-black text-xs font-bold text-black placeholder:text-gray-500 shadow-[3px_3px_0px_#000000] focus:outline-none focus:bg-yellow-50"
                />
                <Search className="w-4 h-4 text-black absolute left-3.5 top-3.5 pointer-events-none stroke-[2.5]" />
              </div>
            </div>

            <div className="text-xs font-semibold text-black flex items-center gap-2 pt-1">
              <span>Contribute or fork on</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="underline font-black text-black hover:text-brutal-pink inline-flex items-center gap-1"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>

          {/* Right: Retro 3D Gumroad-Style Kasauti Hallmark Coin Art */}
          <div className="lg:col-span-5 flex items-center justify-center relative py-6">
            
            {/* Main Hallmark Coin */}
            <div className="relative group">
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-brutal-pink border-4 border-black shadow-[10px_10px_0px_#000000] flex flex-col items-center justify-center transform rotate-6 hover:rotate-0 transition-transform cursor-pointer relative overflow-hidden">
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-black/40 pointer-events-none" />
                <span className="font-display text-8xl font-black text-black select-none tracking-tighter">
                  K
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest bg-black text-white px-3 py-0.5 rounded-full mt-1 border border-black shadow-[2px_2px_0px_#fff]">
                  24K PURE
                </span>
              </div>

              {/* Small floating coins like in the reference image */}
              <div className="absolute -top-4 -left-6 w-16 h-16 rounded-full bg-brutal-yellow border-3 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center font-display text-2xl font-black text-black -rotate-12 animate-pulse">
                24K
              </div>

              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-brutal-purple border-3 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center font-display text-3xl font-black text-black rotate-12">
                ₹
              </div>

              {/* Retro Cartoon Accent Marks */}
              <div className="absolute -top-6 right-8 text-black font-black text-xl select-none font-mono">
                \\\
              </div>
              <div className="absolute bottom-1 -left-4 text-black font-black text-xl select-none font-mono">
                ///
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* ──────────────────────────────────────────────────────────
          2. BENTO SHOWCASE GRID (Gumroad 1-to-1 Style)
         ────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bento Card 1: TEST ANYTHING */}
          <div className="card-brutal-hover rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div>
              <h3 className="font-display text-2xl font-black uppercase text-black tracking-tight">
                TEST ANY VOICE AGENT
              </h3>
              <p className="mt-1 text-xs font-semibold text-gray-700 leading-relaxed">
                Outbound sales, KYC verification, loan recovery, inbound helpdesks. Test once, dial forever.
              </p>

              {/* Graphic illustration: retro audio window matching reference */}
              <div className="mt-5 rounded-xl bg-[#23a094]/15 border-2 border-black p-3.5 relative">
                <div className="flex items-center gap-1.5 pb-2 border-b-2 border-black mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-black" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-black" />
                  <span className="text-[10px] font-mono font-bold text-black ml-2">Voice Agent Stream</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brutal-pink border-2 border-black flex items-center justify-center font-bold text-xs shadow-[2px_2px_0px_#000]">
                    <Mic className="w-5 h-5 text-black stroke-[2.5]" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 rounded-full bg-black w-3/4" />
                    <div className="h-2 rounded-full bg-black/40 w-1/2" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between border-t-2 border-black">
              {/* Bottom left arrow square like reference */}
              <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_#000]">
                ↗
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-black">Multi-Scenario Matrix</span>
            </div>
          </div>

          {/* Bento Card 2: AUTO-PATCH STAGING (AUTO-PATCH) */}
          <div className="card-brutal-hover rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div>
              <h3 className="font-display text-2xl font-black uppercase text-black tracking-tight">
                AUTO-PATCH STAGING
              </h3>
              <p className="mt-1 text-xs font-semibold text-gray-700 leading-relaxed">
                More compliance. More reliability. A safe self-healing path for voice AI is up to you.
              </p>

              {/* Graphic illustration: Retro phone card with speech bubble & sticker tag */}
              <div className="mt-4 rounded-xl bg-white border-2 border-black p-3 relative shadow-[3px_3px_0px_#000]">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold border-b border-black pb-1 mb-2">
                  <span>STAGING CLONE</span>
                  <span className="text-emerald-700 font-extrabold uppercase bg-emerald-100 px-1.5 rounded border border-black">LIVE FIX</span>
                </div>
                <div className="bg-yellow-100 border border-black p-2 rounded text-[11px] font-mono font-bold leading-tight">
                  + Disclose AI &amp; record consent in Hindi first.
                </div>
                <div className="absolute -bottom-3 -right-2 px-2.5 py-0.5 rounded-full bg-brutal-yellow border-2 border-black text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] rotate-6">
                  $$$ PATCHED
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between border-t-2 border-black">
              {/* Bottom left arrow square like reference */}
              <div className="w-8 h-8 rounded-lg bg-brutal-pink border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_#000]">
                ↗
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-black">Self-Healing Loop</span>
            </div>
          </div>

          {/* Bento Card 3: REAL CREATORS. REAL INCOME. (Electric Yellow Highlight Card) */}
          <div className="rounded-2xl p-6 bg-brutal-yellow border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-col justify-between relative">
            <div>
              <h3 className="font-display text-2xl font-black uppercase text-black tracking-tight">
                REAL AGENTS. <br />REAL COMPLIANCE.
              </h3>
              
              <div className="mt-3 font-display text-5xl font-black text-black tracking-tight">
                {runs.length > 0 ? `${avgPurity}%` : "100%"}
              </div>
              
              <p className="mt-1 text-xs font-black uppercase tracking-wider text-black">
                {runs.length > 0 ? `BENCHMARKED ACROSS ${runs.length} RECORDED RUNS.` : "READY TO BENCHMARK YOUR AGENTS."}
              </p>
            </div>

            {/* Stepped black bar chart like reference image */}
            <div className="mt-6 pt-4 border-t-2 border-black">
              <div className="flex items-end justify-between gap-1.5 h-16 pt-2">
                <div className="w-full bg-black rounded-t h-[20%]" />
                <div className="w-full bg-black rounded-t h-[35%]" />
                <div className="w-full bg-black rounded-t h-[52%]" />
                <div className="w-full bg-black rounded-t h-[68%]" />
                <div className="w-full bg-black rounded-t h-[84%]" />
                <div className="w-full bg-black rounded-t h-[100%]" />
              </div>
              <div className="flex justify-between text-[10px] font-mono font-black mt-1.5 text-black">
                <span>0%</span>
                <span>24K PURITY</span>
              </div>
            </div>
          </div>

        </div>

        {/* Second Row of Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 4: Multi-Lingual Indic Coverage (MULTI-LINGUAL INDIC ACCENTS) */}
          <div className="card-brutal-hover rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-2xl font-black uppercase text-black tracking-tight">
                MULTI-LINGUAL INDIC ACCENTS
              </h3>
              <p className="mt-1 text-xs font-semibold text-gray-700">
                Go from 0 to 100% purity and automated compliance workflows in any regional dialect.
              </p>

              <div className="mt-4 space-y-2.5 text-xs font-bold">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brutal-purple border-2 border-black flex items-center justify-center text-[10px] text-black font-black shadow-[1px_1px_0px_#000]">✓</span>
                  <span>Hindi, Hinglish, Kannada &amp; Indian English speech models.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brutal-pink border-2 border-black flex items-center justify-center text-[10px] text-black font-black shadow-[1px_1px_0px_#000]">✓</span>
                  <span>Let your customers converse naturally in their own tongue.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brutal-mint border-2 border-black flex items-center justify-center text-[10px] text-black font-black shadow-[1px_1px_0px_#000]">✓</span>
                  <span>One-time, recurring, or complex multi-turn transactions.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between border-t-2 border-black">
              <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_#000]">
                ↗
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-black">Sarvam AI + Bolna Native</span>
            </div>
          </div>

          {/* Card 5: Connect Stack Anywhere (TELEPHONY & LLM INTEGRATIONS) */}
          <div className="card-brutal-hover rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display text-2xl font-black uppercase text-black tracking-tight">
                TELEPHONY & LLM INTEGRATIONS
              </h3>
              <p className="mt-1 text-xs font-semibold text-gray-700">
                Benchmark and test with our all-in-one suite or connect to thousands of telephony and LLM apps in your current stack.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-[#faf9f5] border-2 border-black rounded-xl text-center shadow-[2px_2px_0px_#000]">
                  <div className="font-black text-xs uppercase">BOLNA</div>
                  <div className="text-[10px] text-gray-600 font-mono mt-0.5">Telephony</div>
                </div>
                <div className="p-3 bg-[#faf9f5] border-2 border-black rounded-xl text-center shadow-[2px_2px_0px_#000]">
                  <div className="font-black text-xs uppercase">SARVAM</div>
                  <div className="text-[10px] text-gray-600 font-mono mt-0.5">Indic LLM</div>
                </div>
                <div className="p-3 bg-[#faf9f5] border-2 border-black rounded-xl text-center shadow-[2px_2px_0px_#000]">
                  <div className="font-black text-xs uppercase">WEBHOOK</div>
                  <div className="text-[10px] text-gray-600 font-mono mt-0.5">Real-time</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between border-t-2 border-black">
              <div className="w-8 h-8 rounded-lg bg-brutal-pink border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_#000]">
                ↗
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-black">Zero-Vendor Lockin</span>
            </div>
          </div>

        </div>

      </section>

      {/* ──────────────────────────────────────────────────────────
          3. COMIC STRIP NARRATIVE (Gumroad 4-Vignette Comic)
         ────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border-3 border-black p-6 sm:p-8 shadow-[6px_6px_0px_#000000] relative">
        
        {/* Top-right corner arrow button like in reference image */}
        <div className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-white border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer">
          ↗
        </div>

        <div className="text-center max-w-md mx-auto mb-8">
          <span className="text-xs font-black uppercase tracking-widest bg-brutal-yellow px-3.5 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_#000]">
            HOW KASAUTI WORKS
          </span>
          <h4 className="font-display text-2xl sm:text-3xl font-black uppercase mt-2.5 tracking-tight text-black">
            FROM BLIND DIALING TO 24K CONFIDENCE
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          
          {/* Comic Frame 1 */}
          <div className="flex flex-col items-center text-center group">
            {/* Comic Speech Bubble */}
            <div className="relative bg-white border-2 border-black rounded-lg px-3 py-2 shadow-[2px_2px_0px_#000] text-xs font-black uppercase tracking-tight text-black mb-3">
              INSTEAD OF BLIND CALLS...
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-black rotate-45" />
            </div>
            {/* Illustrated Vignette Circle */}
            <div className="w-28 h-28 rounded-full bg-brutal-yellow border-3 border-black shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center p-2 group-hover:rotate-6 transition-transform">
              <Terminal className="w-8 h-8 text-black stroke-[2.5]" />
              <span className="text-[10px] font-mono font-black mt-1">1. Register Target</span>
            </div>
          </div>

          {/* Comic Frame 2 */}
          <div className="flex flex-col items-center text-center group">
            {/* Comic Speech Bubble */}
            <div className="relative bg-white border-2 border-black rounded-lg px-3 py-2 shadow-[2px_2px_0px_#000] text-xs font-black uppercase tracking-tight text-black mb-3">
              ...START STRESS TESTS!
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-black rotate-45" />
            </div>
            {/* Illustrated Vignette Circle */}
            <div className="w-28 h-28 rounded-full bg-brutal-pink border-3 border-black shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center p-2 group-hover:-rotate-6 transition-transform">
              <Zap className="w-8 h-8 text-black fill-black" />
              <span className="text-[10px] font-mono font-black mt-1">2. Persona Attack</span>
            </div>
          </div>

          {/* Comic Frame 3 */}
          <div className="flex flex-col items-center text-center group">
            {/* Comic Speech Bubble */}
            <div className="relative bg-white border-2 border-black rounded-lg px-3 py-2 shadow-[2px_2px_0px_#000] text-xs font-black uppercase tracking-tight text-black mb-3">
              DON&apos;T TAKE RISKS. THAT&apos;S SCARY!
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-black rotate-45" />
            </div>
            {/* Illustrated Vignette Circle */}
            <div className="w-28 h-28 rounded-full bg-brutal-purple border-3 border-black shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center p-2 group-hover:rotate-6 transition-transform">
              <ShieldCheck className="w-8 h-8 text-black stroke-[2.5]" />
              <span className="text-[10px] font-mono font-black mt-1">3. Grade Purity</span>
            </div>
          </div>

          {/* Comic Frame 4 */}
          <div className="flex flex-col items-center text-center group">
            {/* Comic Speech Bubble */}
            <div className="relative bg-white border-2 border-black rounded-lg px-3 py-2 shadow-[2px_2px_0px_#000] text-xs font-black uppercase tracking-tight text-black mb-3">
              SHIP 24K PURE AGENTS!
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-black rotate-45" />
            </div>
            {/* Illustrated Vignette Circle */}
            <div className="w-28 h-28 rounded-full bg-brutal-mint border-3 border-black shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center p-2 group-hover:-rotate-6 transition-transform">
              <Sparkles className="w-8 h-8 text-black fill-black" />
              <span className="text-[10px] font-mono font-black mt-1 text-white">4. 24K Certified</span>
            </div>
          </div>

        </div>
      </section>

      {/* Regulatory Banner */}
      <LegalDisclaimerBanner />

      {/* ──────────────────────────────────────────────────────────
          4. VOICE AGENT TARGETS SECTION (CORE FUNCTIONALITY PRESERVED)
         ────────────────────────────────────────────────────────── */}
      <section id="targets-section" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-black font-display">
              Voice Agent Targets
            </h2>
            <p className="text-xs font-semibold text-gray-600">
              Registered phone numbers and Bolna agent configurations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brutal-pink hover:bg-pink-300 border-2 border-black text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <DownloadCloud className="w-4 h-4 stroke-[2.5]" />
              Import from Bolna
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800 border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#ff90e8] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Add Target
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center font-bold text-black bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_#000]">
            Loading targets from Kasauti engine...
          </div>
        ) : filteredTargets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000000]">
            <Phone className="w-12 h-12 text-black mx-auto mb-3 stroke-[2]" />
            <h3 className="text-lg font-black uppercase text-black font-display">No targets found</h3>
            <p className="text-xs font-semibold text-gray-600 mt-1">
              Add your voice agent phone number or staging agent ID to start benchmarking.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-5 py-2.5 rounded-xl bg-brutal-yellow text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2"
              >
                <DownloadCloud className="w-4 h-4 stroke-[2.5]" />
                Import from Bolna
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-xl bg-white text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                Add Custom Target
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTargets.map((target) => (
              <div
                key={target.id}
                className="card-brutal-hover rounded-2xl p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg text-black uppercase tracking-tight group-hover:text-brutal-pink transition-colors truncate">
                          {target.name}
                        </h3>
                        {target.bolna_agent_id && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900 border border-black text-[9px] font-black uppercase tracking-wider shadow-[1px_1px_0px_#000] shrink-0">
                            Bolna Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono font-bold text-gray-700 mt-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                        {target.phone_number}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTarget(target.id, target.name);
                      }}
                      className="p-1.5 rounded-lg bg-white hover:bg-red-50 border border-black text-gray-600 hover:text-red-600 shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all shrink-0"
                      title="Delete target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Languages Chips */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {target.languages?.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-brutal-bg text-black border border-black shadow-[1px_1px_0px_#000]"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 p-2.5 rounded-lg bg-gray-50 border border-black text-[11px] font-mono text-gray-800 truncate">
                    <span className="font-bold text-black">Bolna ID:</span> {target.bolna_agent_id || target.staging_agent_id || "default"}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTriggerRun(target.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brutal-yellow hover:bg-yellow-300 border-2 border-black text-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    Run 12 Scenarios
                  </button>

                  <button
                    onClick={() => handleOpenBenchmark(target.id)}
                    className="p-2 rounded-lg bg-white hover:bg-neutral-100 border-2 border-black text-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    title="Configure scenarios"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────
          5. RECENT BENCHMARK RUNS (CORE FUNCTIONALITY PRESERVED)
         ────────────────────────────────────────────────────────── */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-black font-display">
              Recent Benchmark Runs
            </h2>
            <p className="text-xs font-semibold text-gray-600">
              Purity scores and pass/fail distribution history
            </p>
          </div>
          <Link
            href="/runs"
            className="text-xs font-black uppercase text-black hover:underline flex items-center gap-1"
          >
            <span>View All Runs</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>

        {runs.length === 0 ? (
          <div className="p-8 text-center text-gray-700 bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] font-semibold text-xs">
            No test runs logged yet. Click &quot;Run 12 Scenarios&quot; on any target above to launch the benchmark.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border-3 border-black bg-white shadow-[6px_6px_0px_#000000]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f4f4f0] border-b-2 border-black text-black uppercase tracking-wider font-black">
                <tr>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">Suite Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Purity Score</th>
                  <th className="px-6 py-4">Calls (Pass / Total)</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10 font-medium">
                {runs.slice(0, 5).map((run) => (
                  <tr key={run.id} className="hover:bg-yellow-50/60 transition-colors">
                    <td className="px-6 py-4 font-black text-black">
                      {run.target_name || "Bharat FinServe"}
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-semibold">
                      {run.suite_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[1.5px_1.5px_0px_#000] ${
                        run.status === "completed" 
                          ? "bg-brutal-green text-black" 
                          : "bg-brutal-yellow text-black animate-pulse"
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <PurityScoreBadge score={run.purity_score} size="sm" />
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-black">
                      <span className="text-emerald-700 font-black">{run.passed_calls}</span> / {run.total_calls} passed
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/runs/${run.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800 border-2 border-black font-black text-[11px] uppercase tracking-wider shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3 text-brutal-yellow" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────
          6. ADD TARGET MODAL (NEO-BRUTALIST STYLING)
         ────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border-3 border-black p-6 sm:p-8 shadow-[10px_10px_0px_#000000]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <h3 className="text-xl font-black uppercase text-black font-display tracking-tight">
                Add Voice Agent Target
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-brutal-pink border-2 border-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0px_#000] hover:scale-105"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs font-semibold text-gray-700">
              Configure target for mock simulation or real Bolna agent testing.
            </p>

            <form onSubmit={handleCreateTarget} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Agent Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Axis KYC Verification Agent"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black text-xs font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Recipient Phone Number (E.164)
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black text-xs font-mono font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Bolna Production ID
                  </label>
                  <input
                    type="text"
                    value={bolnaAgentId}
                    onChange={(e) => setBolnaAgentId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-mono font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-black mb-1">
                    Staging Agent ID
                  </label>
                  <input
                    type="text"
                    value={stagingAgentId}
                    onChange={(e) => setStagingAgentId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-mono font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-black mb-1">
                  Agent Prompt Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-medium shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-black hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-black text-white hover:bg-neutral-800 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#ff90e8] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  {submitting ? "Saving..." : "Create Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Run Launcher Modal */}
      <NewRunModal
        isOpen={showRunModal}
        onClose={() => {
          setShowRunModal(false);
          setSelectedTargetForRun(undefined);
        }}
        targets={targets}
        defaultTargetId={selectedTargetForRun}
        onOpenImportModal={() => {
          setShowRunModal(false);
          setShowImportModal(true);
        }}
      />

      {/* Bolna Agent Import Modal */}
      <ImportBolnaModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          fetchData();
        }}
      />

    </div>
  );
}
