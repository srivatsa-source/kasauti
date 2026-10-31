"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Shield,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Search,
  Plus,
  RefreshCw,
  QrCode,
  Globe,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
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

export default function MarketplacePage() {
  const [certificates, setCertificates] = useState<HallmarkCertificate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [selectedCert, setSelectedCert] = useState<HallmarkCertificate | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // New Issue Form State
  const [agentName, setAgentName] = useState<string>("");
  const [bolnaAgentId, setBolnaAgentId] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("+91");
  const [purityScore, setPurityScore] = useState<number>(98.5);
  const [selectedDialects, setSelectedDialects] = useState<string[]>([
    "Hindi",
    "Hinglish",
    "Kannada",
    "Indian English",
  ]);
  const [issuing, setIssuing] = useState<boolean>(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/marketplace/certificates`);
      if (res.ok) {
        const data: HallmarkCertificate[] = await res.json();
        setCertificates(data);
      }
    } catch (err) {
      console.warn("Failed to load certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    setIssueError(null);
    try {
      const res = await fetch(`${API_BASE}/marketplace/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: agentName,
          bolna_agent_id: bolnaAgentId,
          phone_number: phoneNumber,
          purity_score: purityScore,
          dialect_coverage: selectedDialects,
        }),
      });

      if (res.ok) {
        const newCert: HallmarkCertificate = await res.json();
        setShowIssueModal(false);
        setAgentName("");
        setBolnaAgentId("");
        fetchCertificates();
        setSelectedCert(newCert);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setIssueError(errJson.detail || "Failed to issue certificate.");
      }
    } catch (err: any) {
      setIssueError(err?.message || "Network error issuing certificate.");
    } finally {
      setIssuing(false);
    }
  };

  const filteredCerts = certificates.filter(
    (c) =>
      c.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cert_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone_number.includes(searchQuery)
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-black hover:underline mb-2 font-black uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Back to Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center text-black font-black shadow-[2px_2px_0px_#000]">
              <Award className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black font-display">
                Hallmark Registry &amp; Marketplace
              </h1>
              <p className="text-xs font-semibold text-gray-700">
                Cryptographically signed statutory compliance certificates for verified Indian voice agents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIssueModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#ff90e8] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Issue Certificate</span>
            </button>

            <button
              onClick={fetchCertificates}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white hover:bg-gray-100 border-2 border-black text-black shadow-[2px_2px_0px_#000]"
              title="Refresh Registry"
            >
              <RefreshCw className={`w-4 h-4 stroke-[2.5] ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Search & Trust Banner */}
      <div className="p-6 rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Search verified certificates by Agent Name or Cert ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 rounded-xl bg-[#faf9f5] border-2 border-black text-xs font-bold text-black placeholder:text-gray-500 shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
          />
          <Search className="w-4 h-4 text-black absolute left-3.5 top-3.5 pointer-events-none stroke-[2.5]" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brutal-green border-2 border-black text-xs font-black shadow-[2px_2px_0px_#000]">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>SHA-256 SIGNED</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brutal-pink border-2 border-black text-xs font-black shadow-[2px_2px_0px_#000]">
            <Globe className="w-4 h-4 stroke-[2.5]" />
            <span>TRAI §1.1 CERTIFIED</span>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight text-black font-display">
            Public Verified Certificates ({filteredCerts.length})
          </h2>
          <span className="text-xs font-mono font-bold text-gray-600">
            Real-time Cryptographic Verification
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center font-bold text-gray-500 bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_#000] font-mono animate-pulse">
            Loading public registry from Kasauti ledger...
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border-3 border-black shadow-[6px_6px_0px_#000]">
            <Award className="w-12 h-12 text-black mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-lg font-black uppercase text-black font-display">No Certificates Found</h3>
            <p className="text-xs font-semibold text-gray-600 mt-1">
              Issue a new certificate for an audited voice agent or run a benchmark to certify compliance.
            </p>
            <button
              onClick={() => setShowIssueModal(true)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-brutal-yellow text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000]"
            >
              Issue First Certificate
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCerts.map((cert) => (
              <div
                key={cert.cert_id}
                className="card-brutal-hover rounded-2xl p-6 flex flex-col justify-between group bg-white border-3 border-black shadow-[6px_6px_0px_#000]"
              >
                <div>
                  {/* Top Seal Stamp */}
                  <div className="flex items-start justify-between pb-3 border-b-2 border-black">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brutal-yellow text-black border border-black shadow-[1px_1px_0px_#000]">
                        {cert.grade} CERTIFICATE
                      </span>
                      <h3 className="font-black text-lg text-black uppercase tracking-tight mt-1.5">
                        {cert.agent_name}
                      </h3>
                      <div className="text-xs font-mono font-bold text-gray-600 mt-0.5">
                        ID: {cert.cert_id}
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-brutal-pink border-2 border-black flex flex-col items-center justify-center font-black text-black shadow-[2px_2px_0px_#000]">
                      <span className="text-[10px] font-mono leading-none">24K</span>
                      <span className="text-xs font-black leading-none">{cert.purity_score.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Standing & Details */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-600">Statutory Standing:</span>
                      <span className="text-emerald-700 font-black">{cert.statutory_standing}</span>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span className="text-gray-600">Bolna Agent ID:</span>
                      <span className="font-mono text-black truncate max-w-[150px]">{cert.bolna_agent_id}</span>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span className="text-gray-600">Issued On:</span>
                      <span className="font-mono text-black">{new Date(cert.issued_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span className="text-gray-600">Valid Until:</span>
                      <span className="font-mono text-black">{new Date(cert.valid_until).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Dialects */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {cert.dialect_coverage?.map((d) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-brutal-bg text-black border border-black shadow-[1px_1px_0px_#000]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 p-2.5 rounded-lg bg-gray-50 border border-black text-[10px] font-mono text-gray-700 truncate">
                    <span className="font-black text-black">Sig:</span> {cert.verifiable_hash}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t-2 border-black flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="flex-1 py-2 rounded-lg bg-brutal-yellow hover:bg-yellow-300 border-2 border-black text-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    View Badges
                  </button>

                  <Link
                    href={`/verify/${cert.cert_id}`}
                    className="p-2 rounded-lg bg-black text-white hover:bg-neutral-800 border-2 border-black shadow-[2px_2px_0px_#000]"
                    title="Public Verification Link"
                  >
                    <ExternalLink className="w-4 h-4 text-brutal-yellow" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badge Embed Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border-3 border-black p-6 sm:p-8 shadow-[10px_10px_0px_#000000] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div>
                <h3 className="text-xl font-black uppercase text-black font-display tracking-tight">
                  Embeddable Hallmark Badges
                </h3>
                <p className="text-xs font-semibold text-gray-600">
                  {selectedCert.agent_name} ({selectedCert.cert_id})
                </p>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="w-7 h-7 rounded-full bg-brutal-pink border-2 border-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0px_#000] hover:scale-105"
              >
                ✕
              </button>
            </div>

            {/* Markdown Badge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black uppercase text-black">
                <span>Markdown Badge</span>
                <button
                  onClick={() => copyToClipboard(selectedCert.badge_markdown, "md")}
                  className="inline-flex items-center gap-1 text-[11px] text-black hover:underline"
                >
                  {copiedType === "md" ? <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === "md" ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={2}
                value={selectedCert.badge_markdown}
                className="w-full p-2.5 rounded-lg bg-[#faf9f5] border-2 border-black font-mono text-[11px] font-bold text-gray-800"
              />
            </div>

            {/* HTML Badge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black uppercase text-black">
                <span>HTML Badge</span>
                <button
                  onClick={() => copyToClipboard(selectedCert.badge_html, "html")}
                  className="inline-flex items-center gap-1 text-[11px] text-black hover:underline"
                >
                  {copiedType === "html" ? <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === "html" ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={2}
                value={selectedCert.badge_html}
                className="w-full p-2.5 rounded-lg bg-[#faf9f5] border-2 border-black font-mono text-[11px] font-bold text-gray-800"
              />
            </div>

            {/* Public Verification Link */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black uppercase text-black">
                <span>Direct Verification URL</span>
                <button
                  onClick={() => copyToClipboard(selectedCert.verified_url, "url")}
                  className="inline-flex items-center gap-1 text-[11px] text-black hover:underline"
                >
                  {copiedType === "url" ? <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === "url" ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={selectedCert.verified_url}
                className="w-full p-2 rounded-lg bg-[#faf9f5] border-2 border-black font-mono text-xs font-bold text-black"
              />
            </div>

            <div className="pt-3 border-t-2 border-black flex justify-end">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-5 py-2 rounded-xl bg-black text-white hover:bg-neutral-800 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#ff90e8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Certificate Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white border-3 border-black p-6 sm:p-8 shadow-[10px_10px_0px_#000000] space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <h3 className="text-xl font-black uppercase text-black font-display tracking-tight">
                Issue Hallmark Certificate
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="w-7 h-7 rounded-full bg-brutal-pink border-2 border-black font-black text-xs flex items-center justify-center shadow-[1.5px_1.5px_0px_#000] hover:scale-105"
              >
                ✕
              </button>
            </div>

            {issueError && (
              <div className="p-3 rounded-lg bg-rose-100 border-2 border-black text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{issueError}</span>
              </div>
            )}

            <form onSubmit={handleIssueCertificate} className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase text-black mb-1">
                  Agent Brand / Enterprise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICICI Bank Loan Assistance Bot"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block font-black uppercase text-black mb-1">
                  Bolna Production Agent ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 74bbf2a4-6561-48de-aec3-aafc7153bcd7"
                  value={bolnaAgentId}
                  onChange={(e) => setBolnaAgentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black font-mono font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block font-black uppercase text-black mb-1">
                  Telephony Number (E.164)
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black font-mono font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
                />
              </div>

              <div>
                <label className="block font-black uppercase text-black mb-1">
                  Benchmarked Purity Score (%): {purityScore}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="0.1"
                  value={purityScore}
                  onChange={(e) => setPurityScore(parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-black uppercase text-black mb-1.5">
                  Dialect &amp; Language Coverage
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Hindi", "Hinglish", "Kannada", "Indian English", "Tamil", "Telugu", "Bengali"].map((lang) => {
                    const isSelected = selectedDialects.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDialects(selectedDialects.filter((d) => d !== lang));
                          } else {
                            setSelectedDialects([...selectedDialects, lang]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase transition-all ${
                          isSelected
                            ? "bg-black text-white border-2 border-black shadow-[1.5px_1.5px_0px_#ff90e8]"
                            : "bg-white text-black border-2 border-black shadow-[1px_1px_0px_#000]"
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-black flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 font-black uppercase text-black hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="px-6 py-2.5 rounded-xl bg-brutal-yellow text-black hover:bg-yellow-300 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                >
                  {issuing ? "Signing Cryptographic Proof..." : "Sign & Issue Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

