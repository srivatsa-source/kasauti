"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, PhoneCall, History, Sparkles, 
  Brain, Plus, Coins, Zap
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
    } catch (err) {
      // Quiet fail if backend warming up
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const isReal = budget?.bolna_mode?.toLowerCase() === "real";

  return (
    <>
      <nav className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-charcoal-900 font-bold shadow-lg shadow-gold/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-charcoal-900 fill-charcoal-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold tracking-wider text-white">
                      KASAUTI
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${
                      isReal 
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse" 
                        : "bg-gold/15 text-gold border border-gold/30"
                    }`}>
                      {isReal ? "REAL BOLNA" : "MOCK MODE"}
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-400 font-medium">Test it like gold before you dial.</p>
                </div>
              </Link>
            </div>

            {/* Nav Links & Controls */}
            <div className="flex items-center space-x-5 text-sm font-medium">
              <Link
                href="/"
                className="text-charcoal-200 hover:text-gold flex items-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-gold" />
                Targets
              </Link>

              <Link
                href="/runs"
                className="text-charcoal-200 hover:text-gold flex items-center gap-1.5 transition-colors"
              >
                <History className="w-4 h-4 text-gold" />
                Runs
              </Link>

              <Link
                href="/knowledge"
                className="text-charcoal-200 hover:text-gold flex items-center gap-1.5 transition-colors"
              >
                <Brain className="w-4 h-4 text-gold" />
                <span className="relative">
                  Neural Graph
                  <span className="absolute -top-2 -right-3 w-1.5 h-1.5 rounded-full bg-gold" />
                </span>
              </Link>

              {/* Live Budget Pill */}
              {budget && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-charcoal-900 border border-border text-xs">
                  <Coins className="w-3.5 h-3.5 text-gold shrink-0" />
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-white font-bold">${budget.total_spent_usd.toFixed(2)}</span>
                    <span className="text-charcoal-600">/</span>
                    <span className="text-charcoal-400">${budget.budget_limit_usd.toFixed(0)}</span>
                  </div>
                  {isReal && budget.bolna_wallet_balance !== undefined && (
                    <span className="text-[10px] font-mono text-emerald-400 pl-1 border-l border-border/80">
                      Bal: {budget.bolna_wallet_balance.toFixed(0)} cr
                    </span>
                  )}
                </div>
              )}

              {/* Quick Launch Button */}
              <button
                onClick={() => setShowRunModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-900 font-bold text-xs transition-transform active:scale-95 shadow-md shadow-gold/20"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">New Benchmark</span>
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
