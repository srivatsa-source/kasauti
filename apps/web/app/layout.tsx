import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ArrowUpRight, Sparkles } from "lucide-react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Kasauti — Voice Agent Quality & Compliance Testing in India",
  description: "Test it like gold before you dial. Benchmark your voice agents against TRAI-style rules, regional languages (Hindi, Hinglish, Kannada, Indian English), and auto-patch prompts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-brutal-bg text-black min-h-screen flex flex-col font-sans antialiased selection:bg-brutal-pink selection:text-black">
        <Navbar />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Gumroad-Style Pink Ticker / Newsletter Banner */}
        <div className="w-full bg-brutal-pink border-t-2 border-b-2 border-black py-4 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-black rounded-full animate-bounce" />
              <p className="font-extrabold text-sm sm:text-base uppercase tracking-tight text-black">
                TEST IT LIKE GOLD BEFORE YOU DIAL. AUTOMATE QUALITY & REGULATORY BENCHMARKS.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="developer@yourcompany.com"
                readOnly
                value="docs.kasauti.ai"
                className="px-3 py-1.5 text-xs font-mono bg-white border-2 border-black rounded shadow-[2px_2px_0px_#000] text-black focus:outline-none"
              />
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 text-xs font-extrabold uppercase bg-black text-white border-2 border-black rounded shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none flex items-center gap-1 transition-all"
              >
                <span>Read Docs</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Gumroad-Style Multi-column Footer */}
        <footer className="bg-white border-t-0 py-8 text-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs font-semibold">
            <div>
              <div className="flex items-center gap-1.5 font-black text-base uppercase tracking-tight font-display mb-3">
                <div className="w-5 h-5 rounded-full bg-brutal-pink border border-black flex items-center justify-center text-[10px]">
                  K
                </div>
                KASAUTI
              </div>
              <p className="text-gray-600 font-medium leading-relaxed">
                Indian telecommunications compliance and behavioral quality testing suite for conversational AI.
              </p>
            </div>

            <div>
              <div className="font-extrabold uppercase tracking-wider text-black mb-3 text-[11px] border-b border-black pb-1 inline-block">
                Benchmarks
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="hover:underline cursor-pointer">TRAI Regulatory Pack</li>
                <li className="hover:underline cursor-pointer">Multi-Lingual Indic (Hindi/Kannada)</li>
                <li className="hover:underline cursor-pointer">Sarvam Second Opinion LLM</li>
                <li className="hover:underline cursor-pointer">Prompt Auto-Patch Loop</li>
              </ul>
            </div>

            <div>
              <div className="font-extrabold uppercase tracking-wider text-black mb-3 text-[11px] border-b border-black pb-1 inline-block">
                Integrations
              </div>
              <ul className="space-y-2 text-gray-700">
                <li className="hover:underline cursor-pointer">Bolna Agent Orchestrator</li>
                <li className="hover:underline cursor-pointer">Sarvam AI Bulbul & Saaras</li>
                <li className="hover:underline cursor-pointer">Twilio & SIP Telephony</li>
                <li className="hover:underline cursor-pointer">Webhook Streaming API</li>
              </ul>
            </div>

            <div>
              <div className="font-extrabold uppercase tracking-wider text-black mb-3 text-[11px] border-b border-black pb-1 inline-block">
                Compliance Notice
              </div>
              <p className="text-[11px] text-gray-600 leading-normal">
                Testing simulation tool for Indian Telecom networks. Designed to verify consent, DND timing, clear disclosures & audio clarity.
              </p>
              <div className="mt-3 font-mono text-[10px] text-gray-500">
                Kasauti &copy; {new Date().getFullYear()} &bull; All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
