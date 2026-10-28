import React from "react";
import Link from "next/link";
import { ShieldCheck, PhoneCall, History, Sparkles } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-charcoal-900 font-bold shadow-lg shadow-gold/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-charcoal-900 fill-charcoal-900" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-wider text-white flex items-center gap-1.5">
                  KASAUTI
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                    MOCK MODE
                  </span>
                </span>
                <p className="text-xs text-charcoal-400 font-medium">Test it like gold before you dial.</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-6 text-sm font-medium">
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
              Run History
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-border text-xs text-charcoal-400">
              <ShieldCheck className="w-4 h-4 text-gold/80" />
              <span>TRAI Compliance Suite</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
