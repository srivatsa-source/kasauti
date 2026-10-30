"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, Shield, Check, Copy, ExternalLink, 
  CheckCircle2, Award, QrCode, Lock, Globe
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
      <div className="p-16 text-center text-xs font-mono text-zinc-500">
        &gt; Verifying cryptographic hallmark on Kasauti Registry...
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-xl bg-zinc-950 border border-zinc-800 text-center font-mono space-y-3">
        <Shield className="w-10 h-10 text-zinc-600 mx-auto" />
        <h1 className="text-base font-bold text-white uppercase">Certificate Not Found</h1>
        <p className="text-xs text-zinc-500">
          Certificate ID &quot;{certId}&quot; is not registered or has been revoked.
        </p>
        <Link href="/" className="inline-block mt-3 px-3 py-1.5 rounded bg-white text-black text-xs font-semibold">
          Return to Overview
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-mono">
      {/* Top Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
          Public Verifiable Hallmark Certificate
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Cryptographically signed audit proof of TRAI regulatory compliance and Indic dialect accuracy
        </p>
      </div>

      {/* Main Hallmark Certificate Card */}
      <div className="rounded-2xl bg-zinc-950 border-2 border-white p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Subtle Watermark Stamp */}
        <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none select-none text-9xl font-black text-white">
          K
        </div>

        {/* Certificate Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-black font-black text-sm">
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Kasauti Trust Authority
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white text-black uppercase">
                  VERIFIED
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
                {cert.agent_name}
              </h2>
            </div>
          </div>

          <div className="text-right sm:self-auto self-start">
            <span className="text-[10px] text-zinc-500 uppercase block">Certificate ID</span>
            <span className="text-xs font-bold text-zinc-300 font-mono">{cert.cert_id}</span>
          </div>
        </div>

        {/* 3-Column Key Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-black border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">Purity Hallmark</span>
            <div className="text-2xl font-black text-white">
              {cert.purity_score}%
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Grade: <strong className="text-white">{cert.grade} CERTIFIED</strong>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">Statutory Standing</span>
            <div className="text-sm font-bold text-white mt-1.5">
              {cert.statutory_standing}
            </div>
            <span className="text-[10px] text-zinc-500 block mt-0.5">TRAI 2018 / 2024 Audit Pass</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 block mb-1">Telephony Carrier Target</span>
            <div className="text-xs font-bold text-white mt-1.5 truncate">
              {cert.phone_number}
            </div>
            <span className="text-[10px] text-zinc-500 block mt-0.5">Bolna: {cert.bolna_agent_id.slice(0, 12)}...</span>
          </div>
        </div>

        {/* Dialect Coverage Badges */}
        <div>
          <span className="text-[10px] uppercase text-zinc-500 block mb-2">Verified Vernacular Dialects</span>
          <div className="flex flex-wrap gap-1.5">
            {cert.dialect_coverage.map((d) => (
              <span
                key={d}
                className="px-2.5 py-1 rounded-md text-xs bg-black border border-zinc-800 text-zinc-300 font-medium"
              >
                ● {d}
              </span>
            ))}
          </div>
        </div>

        {/* Cryptographic Verification Hash */}
        <div className="p-3.5 rounded-xl bg-black border border-zinc-900 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-zinc-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-zinc-500" /> SHA-256 Verifiable Signature
            </span>
            <span className="text-[10px] text-zinc-500">
              Valid until: {cert.valid_until.slice(0, 10)}
            </span>
          </div>
          <p className="font-mono text-zinc-400 text-[11px] break-all">
            {cert.verifiable_hash}
          </p>
        </div>
      </div>

      {/* Embeddable Hallmark Badges */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 text-xs">
        <h3 className="text-xs font-bold text-white uppercase tracking-tight">
          Embed Verifiable Hallmark Badge
        </h3>

        {/* Markdown Embed Snippet */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase text-zinc-500">
            <span>Markdown (for GitHub README)</span>
            <button
              onClick={() => copyToClipboard(cert.badge_markdown, "md")}
              className="flex items-center gap-1 text-zinc-400 hover:text-white"
            >
              {copiedBadge === "md" ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
              <span>{copiedBadge === "md" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <pre className="p-2.5 rounded bg-black border border-zinc-900 text-[11px] text-zinc-300 overflow-x-auto">
            {cert.badge_markdown}
          </pre>
        </div>

        {/* HTML Embed Snippet */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase text-zinc-500">
            <span>HTML (for Website Header / Footer)</span>
            <button
              onClick={() => copyToClipboard(cert.badge_html, "html")}
              className="flex items-center gap-1 text-zinc-400 hover:text-white"
            >
              {copiedBadge === "html" ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
              <span>{copiedBadge === "html" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <pre className="p-2.5 rounded bg-black border border-zinc-900 text-[11px] text-zinc-300 overflow-x-auto">
            {cert.badge_html}
          </pre>
        </div>
      </div>
    </div>
  );
}

