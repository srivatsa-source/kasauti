"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Plus, Terminal, Activity, Layers, 
  Cpu, ArrowUpRight
} from "lucide-react";
import { NewRunModal } from "@/components/NewRunModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface BudgetInfo {
  budget_limit_usd: number;
  total_spent_usd: number;
  remaining_usd: number;
  percent_used: number;
  bolna_mode: string;
  bolna_wallet_balance?: number;
  bolna_wallet_currency: string;
}

interface Target {
  id: string;
  name: string;
  phone_number: string;
  bolna_agent_id?: string;
  staging_agent_id?: string;
  languages: string[];
}

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [showRunModal, setShowRunModal] = useState(false);

  const fetchStatus = async () => {
    try {
      const [bRes, tRes] = await Promise.all([
        fetch(`${API_BASE}/budget`),
        fetch(`${API_BASE}/targets`)
      ]);
      if (bRes.ok) setBudget(await bRes.json());
      if (tRes.ok) setTargets(await tRes.json());
    } catch {
      // Quiet fail if backend warming up
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const isReal = budget?.bolna_mode?.toLowerCase() === "real";

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/runs", label: "Runs & Audits" },
    { href: "/knowledge", label: "Neural Topology" },
  ];

  return (
    <>
      <nav className="border-b border-border bg-black/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand Logo & System Status */}
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2.5 group">
                <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-black font-black text-xs tracking-tighter group-hover:bg-zinc-200 transition-colors">
                  K
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight text-white uppercase">
                    Kasauti
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                    / v0.1.0
                  </span>
                </div>
              </Link>

              {/* Navigation Tabs */}
              <div className="hidden md:flex items-center space-x-1 border-l border-zinc-800 pl-4">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? "bg-zinc-900 text-white border border-zinc-700/80"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-950"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Controls & Telemetry */}
            <div className="flex items-center space-x-3 text-xs">
              {/* Telemetry pill */}
              {budget && (
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 rounded-md bg-zinc-950 border border-zinc-800 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isReal ? "bg-white animate-pulse" : "bg-zinc-500"}`} />
                    <span className="text-zinc-400 uppercase tracking-widest text-[10px]">
                      {isReal ? "BOLNA REAL" : "MOCK"}
                    </span>
                  </div>

                  <span className="text-zinc-700">|</span>

                  <div className="flex items-center gap-1 text-zinc-300">
                    <span>${budget.total_spent_usd.toFixed(2)}</span>
                    <span className="text-zinc-600">/</span>
                    <span className="text-zinc-500">${budget.budget_limit_usd.toFixed(0)}</span>
                  </div>

                  {isReal && budget.bolna_wallet_balance !== undefined && (
                    <>
                      <span className="text-zinc-700">|</span>
                      <span className="text-zinc-300">
                        {budget.bolna_wallet_balance.toFixed(0)} <span className="text-zinc-500">cr</span>
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Action Button: Trigger New Run */}
              <button
                onClick={() => setShowRunModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Benchmark</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Modal Launcher */}
      <NewRunModal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        targets={targets}
      />
    </>
  );
};
