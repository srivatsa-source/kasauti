"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Check,
  Copy,
  ExternalLink,
  Award,
  Lock,
  Globe,
  Radio,
  CheckCircle2,
  FileCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

interface HallmarkCertificate {
  cert_id: string;
  agent_name: string;
  bolna_agent_id: string;
  phone_number: string;
  purity_score: number;
  grade: string;
  statutory_standing: string;
  dialect_coverage: string[];
  verifiable_hash: string;
  issued_at: string;
  valid_until: string;
  verified_url: string;
  badge_markdown: string;
  badge_html: string;
}

export default function VerificationPage() {
  const params = useParams();
  const certId = params.id as string;
  const [cert, setCert] = useState<HallmarkCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedBadge, setCopiedBadge] = useState<string | null>(null);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/marketplace/verify/${certId}`);
        if (res.ok) {
          setCert(await res.json());
        }
      } catch (err) {
        console.warn("Failed to load certificate:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [certId]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBadge(type);
    setTimeout(() => setCopiedBadge(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-brutal-yellow border-3 border-black flex items-center justify-center font-black text-2xl shadow-[4px_4px_0px_#000] animate-bounce">
          K
        </div>
        <p className="font-mono text-sm font-bold text-black uppercase tracking-wider">
          &gt; Cryptographically verifying hallmark signature on Kasauti Trust Registry...
        </p>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-white border-3 border-black shadow-[8px_8px_0px_#000] text-center space-y-4 my-12">
        <div className="w-14 h-14 mx-auto rounded-xl bg-brutal-pink border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
          <Shield className="w-7 h-7 text-black stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-black uppercase font-display text-black">
          Certificate Not Found or Revoked
        </h1>
        <p className="text-xs text-gray-700 font-mono">
          Certificate ID &quot;<span className="font-bold text-black">{certId}</span>&quot; could not be cryptographically validated or has expired.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white border-2 border-black text-xs font-black uppercase tracking-wide shadow-[3px_3px_0px_#ff90e8] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all"
          >
            Browse Hallmark Marketplace ↗
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black border-2 border-black text-xs font-black uppercase tracking-wide shadow-[3px_3px_0px_#000] hover:bg-gray-50 active:translate-x-1 active:translate-y-1 transition-all"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Navigation & Breadcrumb */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-white text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] hover:bg-yellow-50 active:translate-x-0.5 active:translate-y-0.5 transition-all text-black"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Marketplace
          </Link>
          <span className="text-gray-400 font-bold">/</span>
          <span className="text-xs font-mono font-bold text-gray-600 truncate">
            {cert.cert_id}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase font-display tracking-tight text-black">
              24K Verifiable Hallmark Proof
            </h1>
            <p className="text-xs sm:text-sm text-gray-700 font-medium mt-1">
              Cryptographically signed audit proof of TRAI regulatory compliance &amp; Indic speech accuracy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-black bg-[#7fe382] text-black font-black text-xs uppercase shadow-[2px_2px_0px_#000]">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> Public Verified
            </span>
          </div>
        </div>
      </div>

      {/* Main Hallmark Certificate Card */}
      <div className="rounded-2xl bg-white border-3 border-black p-6 sm:p-10 space-y-8 shadow-[8px_8px_0px_#000] relative overflow-hidden">
        {/* Subtle Background Watermark Stamp */}
        <div className="absolute -right-4 -bottom-6 opacity-5 pointer-events-none select-none text-[160px] font-black font-display text-black">
          K
        </div>

        {/* Certificate Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-black pb-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brutal-yellow border-3 border-black flex items-center justify-center text-black font-black text-2xl shadow-[3px_3px_0px_#000] shrink-0">
              24K
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] uppercase font-black tracking-wider text-gray-600 font-mono">
                  Kasauti Trust Authority • Statutory Standard
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-black text-white uppercase tracking-wider">
                  TRAI-AUDITED
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-black font-display uppercase tracking-tight mt-1">
                {cert.agent_name}
              </h2>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block">
              Official Certificate ID
            </span>
            <span className="text-xs font-mono font-black text-black px-2.5 py-1 rounded border-2 border-black bg-yellow-50 inline-block mt-0.5 shadow-[1px_1px_0px_#000]">
              {cert.cert_id}
            </span>
          </div>
        </div>

        {/* 3-Column Key Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-amber-50 border-2 border-black shadow-[3px_3px_0px_#000]">
            <span className="text-[10px] font-black uppercase text-gray-600 block mb-1">
              Purity Hallmark Rating
            </span>
            <div className="text-3xl sm:text-4xl font-black text-black font-display">
              {cert.purity_score}%
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-black bg-black text-white text-[10px] font-bold uppercase">
              <Award className="w-3 h-3 text-brutal-yellow" /> Grade {cert.grade} CERTIFIED
            </div>
          </div>

          <div className="p-4 rounded-xl bg-pink-50 border-2 border-black shadow-[3px_3px_0px_#000]">
            <span className="text-[10px] font-black uppercase text-gray-600 block mb-1">
              TRAI Statutory Standing
            </span>
            <div className="text-sm font-black text-black font-mono mt-1">
              {cert.statutory_standing}
            </div>
            <span className="text-[11px] text-gray-600 block mt-2 font-medium">
              TRAI TCCCPR 2018 / 2024 Compliant
            </span>
          </div>

          <div className="p-4 rounded-xl bg-purple-50 border-2 border-black shadow-[3px_3px_0px_#000]">
            <span className="text-[10px] font-black uppercase text-gray-600 block mb-1">
              Telephony Carrier Target
            </span>
            <div className="text-sm font-black text-black font-mono mt-1 truncate">
              {cert.phone_number}
            </div>
            <span className="text-[11px] text-gray-600 font-mono block mt-2 truncate">
              Bolna: {cert.bolna_agent_id.slice(0, 14)}...
            </span>
          </div>
        </div>

        {/* Verified Dialect Coverage */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-black block">
            Verified Indic Speech &amp; Dialect Profiles
          </span>
          <div className="flex flex-wrap gap-2">
            {cert.dialect_coverage.map((dialect) => (
              <span
                key={dialect}
                className="px-3 py-1 rounded-full text-xs font-black bg-brutal-bg border-2 border-black text-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 border border-black" />
                {dialect}
              </span>
            ))}
          </div>
        </div>

        {/* Cryptographic Verification Box */}
        <div className="p-4 rounded-xl bg-[#faf9f5] border-2 border-black text-xs space-y-2 shadow-[3px_3px_0px_#000]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span className="text-[11px] font-black uppercase text-black font-mono">
                SHA-256 Verifiable Registry Signature
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-gray-600">
              Valid until: {cert.valid_until.slice(0, 10)}
            </span>
          </div>
          <p className="font-mono text-gray-800 text-[11px] break-all leading-relaxed">
            {cert.verifiable_hash}
          </p>
        </div>
      </div>

      {/* Embed Hallmark Badges Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] space-y-6">
        <div>
          <h3 className="text-base font-black text-black uppercase font-display tracking-tight">
            Embed Verifiable Hallmark Badge
          </h3>
          <p className="text-xs text-gray-600 font-medium mt-0.5">
            Embed real-time trust badges into your GitHub repo, documentation, or website footer.
          </p>
        </div>

        {/* Live Badge Visual Preview */}
        <div className="p-4 rounded-xl border-2 border-black bg-brutal-bg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brutal-yellow border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_#000]">
              24K
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-gray-600">Badge Visual Preview</div>
              <div className="text-xs font-black text-black">
                Kasauti Hallmark: {cert.purity_score}% Purity ({cert.grade} Certified)
              </div>
            </div>
          </div>

          <a
            href={cert.verified_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-black bg-white text-xs font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-yellow-50 transition-all text-black"
          >
            <span>Live Audit Proof</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Markdown Embed Snippet */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black uppercase text-black">
            <span>Markdown (for GitHub README.md)</span>
            <button
              onClick={() => copyToClipboard(cert.badge_markdown, "md")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border-2 border-black text-[11px] font-black uppercase bg-white shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all text-black hover:bg-yellow-50"
            >
              {copiedBadge === "md" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBadge === "md" ? "Copied!" : "Copy Markdown"}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-black text-brutal-yellow font-mono text-xs overflow-x-auto border-2 border-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
            {cert.badge_markdown}
          </pre>
        </div>

        {/* HTML Embed Snippet */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black uppercase text-black">
            <span>HTML (for Web Header / Footer)</span>
            <button
              onClick={() => copyToClipboard(cert.badge_html, "html")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border-2 border-black text-[11px] font-black uppercase bg-white shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all text-black hover:bg-yellow-50"
            >
              {copiedBadge === "html" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBadge === "html" ? "Copied!" : "Copy HTML"}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-black text-[#7fe382] font-mono text-xs overflow-x-auto border-2 border-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
            {cert.badge_html}
          </pre>
        </div>
      </div>
    </div>
  );
}
