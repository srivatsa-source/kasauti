"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  PhoneCall, History, Sparkles, 
  Brain, ArrowUpRight, Coins
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

  const navLinks = [
    { href: "/", label: "Targets", icon: PhoneCall },
    { href: "/runs", label: "Runs History", icon: History },
    { href: "/knowledge", label: "Neural Graph", icon: Brain },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand + Status Pill */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-brutal-pink border-2 border-black flex items-center justify-center font-black text-black text-sm shadow-[2px_2px_0px_#000000] group-hover:rotate-12 transition-transform">
                  K
                </div>
                <span className="font-extrabold text-2xl tracking-tighter text-black uppercase font-display">
                  KASAUTI
                </span>
              </Link>

              {/* GitHub Stars Badge - Gumroad style ( 9K ★ ) */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-2 border-black text-xs font-black bg-white shadow-[2px_2px_0px_#000] hover:bg-yellow-50 transition-colors"
                title="Star on GitHub"
              >
                <span className="font-mono text-[11px]">★ 9.4K</span>
              </a>

              {/* Mode Pill - Gumroad style badge */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-black text-xs font-bold bg-[#f4f4f0] shadow-[2px_2px_0px_#000]">
                <span className={`w-2 h-2 rounded-full border border-black ${isReal ? "bg-emerald-500 animate-ping" : "bg-brutal-yellow"}`} />
                <span className="text-[11px] uppercase tracking-wide">
                  {isReal ? "REAL BOLNA" : "MOCK MODE"}
                </span>
              </div>
            </div>

            {/* Center: Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-1.5 text-xs font-bold tracking-tight rounded-full transition-all ${
                      isActive 
                        ? "bg-black text-white shadow-[2px_2px_0px_#ff90e8]" 
                        : "text-black hover:bg-black/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Budget + CTA */}
            <div className="flex items-center gap-3">
              {budget && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brutal-bg border-2 border-black text-xs font-mono font-bold shadow-[2px_2px_0px_#000]">
                  <Coins className="w-3.5 h-3.5 text-black" />
                  <span>
                    ${budget.total_spent_usd.toFixed(2)} / ${budget.budget_limit_usd.toFixed(0)}
                  </span>
                  {isReal && budget.bolna_wallet_balance !== undefined && (
                    <span className="text-[10px] bg-brutal-mint text-white px-1.5 py-0.5 rounded border border-black font-sans">
                      {budget.bolna_wallet_balance.toFixed(0)} cr
                    </span>
                  )}
                </div>
              )}

              {/* Launch Run CTA - Matches Gumroad "Start selling ↗" */}
              <button
                onClick={() => setShowRunModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white hover:bg-[#222222] border-2 border-black text-xs font-extrabold uppercase tracking-wide shadow-[3px_3px_0px_#ff90e8] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#ff90e8] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                <span>Launch Benchmark</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Modal Launcher */}
      <NewRunModal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        targets={targets}
      />
    </>
  );
};
