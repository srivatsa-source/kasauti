"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PhoneCall,
  History,
  Sparkles,
  Brain,
  ArrowUpRight,
  Coins,
  Radio,
  Volume2,
  Bug,
  Zap,
  Award,
  GitPullRequest,
  Menu,
  X,
  ChevronDown,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const [bRes, tRes] = await Promise.all([
        fetch(`${API_BASE}/budget`),
        fetch(`${API_BASE}/targets`),
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

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  }, [pathname]);

  const isReal = budget?.bolna_mode?.toLowerCase() === "real";

  const primaryLinks = [
    { href: "/", label: "Targets", icon: PhoneCall },
    { href: "/runs", label: "Runs", icon: History },
    { href: "/telemetry", label: "Telemetry", icon: Radio },
    { href: "/knowledge", label: "Neural Graph", icon: Brain },
    { href: "/marketplace", label: "Marketplace", icon: Award },
  ];

  const secondaryLinks = [
    { href: "/acoustic", label: "Acoustic Stress", icon: Volume2, badge: "STT" },
    { href: "/fuzzer", label: "Tool Fuzzer", icon: Bug, badge: "Security" },
    { href: "/sentinel", label: "Live Sentinel", icon: Zap, badge: "Guardrail" },
    { href: "/deployer", label: "CI/CD Deployer", icon: GitPullRequest, badge: "Bolna/Git" },
  ];

  const isSecondaryActive = secondaryLinks.some((l) => pathname === l.href);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand + Status Pill */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-brutal-pink border-2 border-black flex items-center justify-center font-black text-black text-sm shadow-[2px_2px_0px_#000000] group-hover:rotate-12 transition-transform">
                  K
                </div>
                <span className="font-extrabold text-xl sm:text-2xl tracking-tighter text-black uppercase font-display">
                  KASAUTI
                </span>
              </Link>

              {/* Mode Pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-black text-xs font-bold bg-[#f4f4f0] shadow-[2px_2px_0px_#000]">
                <span className={`w-2 h-2 rounded-full border border-black ${isReal ? "bg-emerald-500 animate-ping" : "bg-brutal-yellow"}`} />
                <span className="text-[10px] uppercase tracking-wide">
                  {isReal ? "REAL BOLNA" : "MOCK MODE"}
                </span>
              </div>
            </div>

            {/* Center: Navigation Links for Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {primaryLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 text-xs font-bold tracking-tight rounded-full transition-all ${
                      isActive
                        ? "bg-black text-white shadow-[2px_2px_0px_#ff90e8]"
                        : "text-black hover:bg-black/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Secondary Navigation Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold tracking-tight rounded-full transition-all ${
                    isSecondaryActive || moreDropdownOpen
                      ? "bg-black text-white shadow-[2px_2px_0px_#ffc900]"
                      : "text-black hover:bg-black/5"
                  }`}
                >
                  <span>Labs &amp; Tools</span>
                  <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {moreDropdownOpen && (
                  <div className="absolute top-9 left-0 w-52 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] p-1.5 space-y-1 z-50">
                    {secondaryLinks.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      const Icon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMoreDropdownOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            isSubActive
                              ? "bg-black text-white"
                              : "text-black hover:bg-yellow-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{sub.label}</span>
                          </div>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-black bg-brutal-bg text-black">
                            {sub.badge}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>

            {/* Right: Budget + CTA + Mobile Hamburger */}
            <div className="flex items-center gap-2 sm:gap-3">
              {budget && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brutal-bg border-2 border-black text-xs font-mono font-bold shadow-[2px_2px_0px_#000]">
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

              {/* Launch Run CTA */}
              <button
                onClick={() => setShowRunModal(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-black text-white hover:bg-[#222222] border-2 border-black text-xs font-extrabold uppercase tracking-wide shadow-[3px_3px_0px_#ff90e8] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#ff90e8] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                <span>Launch</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-white border-2 border-black text-black shadow-[2px_2px_0px_#000] focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 stroke-[2.5]" /> : <Menu className="w-5 h-5 stroke-[2.5]" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t-2 border-black bg-white p-4 space-y-3 shadow-[0_4px_0_#000]">
            <div className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Core Platform
            </div>
            <div className="grid grid-cols-2 gap-2">
              {primaryLinks.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-black text-xs font-black uppercase transition-all ${
                      isActive
                        ? "bg-black text-white shadow-[2px_2px_0px_#ff90e8]"
                        : "bg-[#faf9f5] text-black shadow-[2px_2px_0px_#000]"
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="text-[10px] font-black uppercase text-gray-500 tracking-wider pt-2 border-t border-gray-200">
              Labs, Testing &amp; Deploy
            </div>
            <div className="grid grid-cols-2 gap-2">
              {secondaryLinks.map((sub) => {
                const isActive = pathname === sub.href;
                const Icon = sub.icon;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 border-black text-xs font-black uppercase transition-all ${
                      isActive
                        ? "bg-black text-white shadow-[2px_2px_0px_#ffc900]"
                        : "bg-[#faf9f5] text-black shadow-[2px_2px_0px_#000]"
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                    <span>{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
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
