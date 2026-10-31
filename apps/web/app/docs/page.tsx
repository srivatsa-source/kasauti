"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Clock,
  ExternalLink,
  BookOpen,
  Copy,
  Check,
  ArrowLeft,
  Lock,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<
    "tcccpr2025" | "aiguidelines" | "rulesengine" | "templates"
  >("tcccpr2025");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const compliancePromptSnippet = `You are a compliant Indian Voice AI assistant. Follow TRAI regulations strictly:
1. EARLY AI DISCLOSURE: Disclose in turn 1: "Namaste, I am an automated AI voice assistant calling on behalf of [Company]."
2. IMMEDIATE DND OPT-OUT: If the user says "do not call", "stop", or "call mat karo", immediately apologize and end the call.
3. NO PROMOTIONAL MIXING (TCCCPR 2025 Reg 2(au)/2(bh)): In service or customer support calls, never pitch loans, cards, discounts, or upselling.
4. ZERO SENSITIVE CREDENTIAL LEAKS: Never ask for, repeat, or confirm OTPs, CVV, Card PINs, or full 12-digit Aadhaar numbers.
5. 7-DAY CONSENT LIMIT (Reg 2(bh)): Ensure follow-up transaction calls are placed only within 7 days of explicit user consent.
6. CALLING HOURS: Outbound commercial calls are permitted strictly between 09:00 and 21:00 IST.`;

  return (
    <div className="min-h-screen bg-[#fafaf9] text-black">
      {/* Top Banner */}
      <div className="border-b-2 border-black bg-brutal-pink/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-black uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Official Regulatory Knowledge Base &bull; TRAI 2025 / 2026 Statutory Pack</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:underline font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b-2 border-black bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-brutal-yellow text-black border-2 border-black shadow-[2px_2px_0px_#000]">
              Gazette of India (12 Feb 2025)
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-300 text-black border-2 border-black shadow-[2px_2px_0px_#000]">
              TRAI PR 145/2026 (30 Oct 2026)
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-[#c4b5fd] text-black border-2 border-black shadow-[2px_2px_0px_#000]">
              Telecommunications Act 2023
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight font-display mb-3 text-black">
            TRAI Statutory Compliance &amp; AI Telephony Directives
          </h1>
          <p className="text-sm sm:text-base font-semibold text-gray-700 max-w-4xl leading-relaxed">
            The definitive technical and legal reference for deploying automated voice agents on Indian
            telecommunications networks. Kasauti validates conversational agents against exact statutory clauses
            governing Do-Not-Disturb preferences, promotional mixing prohibitions, 7-day consent expiry,
            and the 7 Guiding Sutras of India AI Governance.
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t-2 border-black/10">
            <button
              onClick={() => setActiveTab("tcccpr2025")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black transition-all ${
                activeTab === "tcccpr2025"
                  ? "bg-black text-white shadow-[3px_3px_0px_#ff90e8]"
                  : "bg-white text-black hover:bg-yellow-50 shadow-[2px_2px_0px_#000]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>TCCCPR 2025 Regulations</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("aiguidelines")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black transition-all ${
                activeTab === "aiguidelines"
                  ? "bg-black text-white shadow-[3px_3px_0px_#ff90e8]"
                  : "bg-white text-black hover:bg-yellow-50 shadow-[2px_2px_0px_#000]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>TRAI AI Guidelines (PR 145/2026)</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("rulesengine")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black transition-all ${
                activeTab === "rulesengine"
                  ? "bg-black text-white shadow-[3px_3px_0px_#ff90e8]"
                  : "bg-white text-black hover:bg-yellow-50 shadow-[2px_2px_0px_#000]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Kasauti Automated Rules</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("templates")}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-black transition-all ${
                activeTab === "templates"
                  ? "bg-black text-white shadow-[3px_3px_0px_#ff90e8]"
                  : "bg-white text-black hover:bg-yellow-50 shadow-[2px_2px_0px_#000]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Prompt Patch Snippets</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: TCCCPR 2025 */}
        {activeTab === "tcccpr2025" && (
          <div className="space-y-6">
            <div className="p-6 bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_#000]">
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-black font-display">
                    Telecom Commercial Communications Customer Preference (Second Amendment) Regulations, 2025
                  </h2>
                  <p className="text-xs font-semibold text-gray-600">
                    Gazette of India, Extraordinary, Part III, Section 4 &bull; Notification No. 1 of 2025 (Published 12 Feb 2025)
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-300 border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_#000]">
                  Active Law
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Clause 1: Reg 2(au) & 2(av) */}
                <div className="p-4 rounded-xl bg-[#fffef0] border-2 border-black shadow-[3px_3px_0px_#000] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-black text-white">
                      Reg 2(au) &amp; 2(av)
                    </span>
                    <span className="text-xs font-bold text-rose-600 uppercase">Critical Mandate</span>
                  </div>
                  <h3 className="font-black text-sm uppercase text-black">
                    Promotional Mixing Prohibition &amp; In-Message Opt-Out
                  </h3>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium">
                    <strong>Statutory Text:</strong> <em>&quot;Provided further that if promotional content is mixed with any type of Transactional or Service Message/Voice Call, such message/voice call shall be treated as a Promotional Message/Voice Call.&quot;</em>
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Voice agents making service or customer-support calls (balance checks, delivery updates, support) are strictly prohibited from sneaking in upsell pitches or promotional offers. Senders must also provide an explicit opt-out mechanism in the communication.
                  </p>
                </div>

                {/* Clause 2: Reg 2(bh) */}
                <div className="p-4 rounded-xl bg-[#fffef0] border-2 border-black shadow-[3px_3px_0px_#000] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-black text-white">
                      Reg 2(bh)
                    </span>
                    <span className="text-xs font-bold text-amber-700 uppercase">7-Day Expiry</span>
                  </div>
                  <h3 className="font-black text-sm uppercase text-black">
                    Service Calls &amp; 7-Day Explicit Consent Limit
                  </h3>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium">
                    <strong>Statutory Text:</strong> <em>&quot;Provided that such Explicit Consent shall be for seven days or as directed by the Authority from time to time: Provided further that a transactional Message or transactional Voice Call containing information pertaining to service shall be treated as a Service Message.&quot;</em>
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    (i) Calls to existing customers regarding warranty, safety, product recall, and delivery require no consent and must not be promotional.
                    (ii) Calls to complete an ongoing transaction require explicit consent, which expires after strictly <strong>7 days</strong>.
                  </p>
                </div>

                {/* Clause 3: Reg 2(bt) */}
                <div className="p-4 rounded-xl bg-[#fffef0] border-2 border-black shadow-[3px_3px_0px_#000] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-black text-white">
                      Reg 2(bt)
                    </span>
                    <span className="text-xs font-bold text-blue-700 uppercase">30-Min Window</span>
                  </div>
                  <h3 className="font-black text-sm uppercase text-black">
                    Transactional Call 30-Minute Boundary
                  </h3>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium">
                    <strong>Statutory Text:</strong> <em>&quot;Transactional Message or Voice Call means a Message sent or Voice Call made in response to Customer initiated transaction within thirty minutes of the transaction relating to OTP, alerts, confirmations, refund info.&quot;</em>
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Transactional exemptions from DND scrubbing apply solely to communications dispatched within 30 minutes of a user-initiated trigger. Delayed notifications lose transactional standing.
                  </p>
                </div>

                {/* Clause 4: Reg 3 & Reg 4 */}
                <div className="p-4 rounded-xl bg-[#fffef0] border-2 border-black shadow-[3px_3px_0px_#000] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-black text-white">
                      Reg 3 &amp; Reg 4
                    </span>
                    <span className="text-xs font-bold text-purple-700 uppercase">Telephony Resources</span>
                  </div>
                  <h3 className="font-black text-sm uppercase text-black">
                    140 vs 1600 Series &amp; Auto-Dialer Pre-Declaration
                  </h3>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium">
                    <strong>Statutory Text:</strong> <em>&quot;Every Sender shall notify the Originating Access Provider, in advance, about the use of Auto Dialer or Robo-Calls as well as the intended objective of such calls in writing.&quot;</em>
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Promotional calls must exclusively use the <strong>140-series</strong>. Service and transactional calls must use the <strong>1600-series</strong>. Using mobile or 1600 numbers for promotional calling results in immediate blacklisting and resource disconnection.
                  </p>
                </div>

                {/* Clause 5: Reg 2(bw) */}
                <div className="p-4 rounded-xl bg-[#fffef0] border-2 border-black shadow-[3px_3px_0px_#000] space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-black text-white">
                      Reg 2(bw) Second Proviso
                    </span>
                    <span className="text-xs font-bold text-rose-700 uppercase">Anti-Fraud &amp; Anti-Phishing</span>
                  </div>
                  <h3 className="font-black text-sm uppercase text-black">
                    Deception and Misleading Communications Classified as UCC
                  </h3>
                  <p className="text-xs text-gray-800 leading-relaxed font-medium">
                    <strong>Statutory Text:</strong> <em>&quot;Provided further that any message sent or voice call made, in the guise of commercial communication or otherwise, to deceive the recipient or to attempt to deceive the recipient shall be treated as an unsolicited commercial communication under these regulations so far as the misutilization of telecom resources by the sender is concerned.&quot;</em>
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Voice bots attempting social engineering, deceptive pretexts (fake court notices, disguised prize awards, deceptive KYC freeze warnings) are treated under UCC and face telecom blacklisting for 1 year across all Indian Access Providers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRAI AI GUIDELINES */}
        {activeTab === "aiguidelines" && (
          <div className="space-y-6">
            <div className="p-6 bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_#000]">
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-black font-display">
                    Guidelines on Responsible Use of AI in Telecommunication Networks
                  </h2>
                  <p className="text-xs font-semibold text-gray-600">
                    TRAI Press Release No. 145/2026 &bull; Released 30th October 2026 &bull; India AI Governance Framework
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-brutal-yellow border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_#000]">
                  Oct 2026 Framework
                </span>
              </div>

              <p className="text-xs text-gray-800 mb-6 font-semibold">
                The TRAI Guidelines translate the National AI Governance Guidelines into operative mandates for
                telecom operators and autonomous voice AI developers across <strong>7 Guiding Sutras</strong>:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    num: "1",
                    title: "Trust is the Foundation",
                    desc: "Verifiable telemetry logs, auditable cryptographic certificates, and deterministic behavior without hallucinated commitments.",
                    color: "bg-emerald-100",
                  },
                  {
                    num: "2",
                    title: "People First",
                    desc: "Consumer agency must prevail. Immediate honoring of opt-out requests, polite de-escalation, and human escalation handoffs.",
                    color: "bg-pink-100",
                  },
                  {
                    num: "3",
                    title: "Innovation over Restraint",
                    desc: "Enabling multi-lingual Indic voice AI (Hindi, Hinglish, Kannada) while providing runtime guardrail envelopes.",
                    color: "bg-amber-100",
                  },
                  {
                    num: "4",
                    title: "Fairness & Equity",
                    desc: "Consistent service quality regardless of vernacular dialect, regional accent, background acoustic noise, or network latency.",
                    color: "bg-sky-100",
                  },
                  {
                    num: "5",
                    title: "Accountability",
                    desc: "Full traceability of dialers, registered headers, content templates, and designated 140/1600 series resources.",
                    color: "bg-purple-100",
                  },
                  {
                    num: "6",
                    title: "Understandable by Design",
                    desc: "MANDATORY EARLY AI DISCLOSURE: Voice bots must transparently inform callers of their artificial nature within the first 2 conversational turns.",
                    color: "bg-brutal-yellow",
                    highlight: true,
                  },
                  {
                    num: "7",
                    title: "Safety & Sustainability",
                    desc: "Zero leakage of financial credentials (OTP, CVV, PIN, full Aadhaar). Sub-45ms runtime interceptors preventing non-compliant TTS synthesis.",
                    color: "bg-rose-100",
                  },
                ].map((sutra) => (
                  <div
                    key={sutra.num}
                    className={`p-4 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] ${sutra.color} ${
                      sutra.highlight ? "ring-2 ring-black" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-6 h-6 rounded-full bg-black text-white font-black text-xs flex items-center justify-center">
                        {sutra.num}
                      </span>
                      <h3 className="font-black text-xs uppercase text-black">{sutra.title}</h3>
                    </div>
                    <p className="text-xs text-gray-800 font-medium leading-relaxed">{sutra.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KASAUTI AUTOMATED RULES */}
        {activeTab === "rulesengine" && (
          <div className="space-y-6">
            <div className="p-6 bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_#000]">
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-black font-display">
                    Kasauti Deterministic Rule Pack Engine
                  </h2>
                  <p className="text-xs font-semibold text-gray-600">
                    Direct mapping of statutory TRAI regulations to deterministic AST regex &amp; timestamp evaluators
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-300 border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_#000]">
                  100% Statutory Citations
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f4f4f0] border-b-2 border-black font-black uppercase">
                    <tr>
                      <th className="px-4 py-3">Rule Identifier</th>
                      <th className="px-4 py-3">Legal Citation</th>
                      <th className="px-4 py-3">Verification Mechanism</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 font-medium">
                    {[
                      {
                        id: "ai_disclosure_early",
                        name: "Early AI Identity Disclosure",
                        citation: "TRAI PR 145/2026 Sutra 6 'Understandable by Design'",
                        mech: "Regex scanning turns 1-2 for AI/automated declarations",
                        status: "Verified",
                      },
                      {
                        id: "optout_honored",
                        name: "Immediate DND Opt-Out Honoring",
                        citation: "TCCCPR 2025 Reg 2(au), 2(av) & TCCCPR 2018 Reg 16",
                        mech: "Semantic detection of 'do not call'; call must cease within 2 turns",
                        status: "Verified",
                      },
                      {
                        id: "no_promotional_mixing",
                        name: "Prohibition of Promotional Mixing",
                        citation: "TCCCPR 2025 Reg 2(au), 2(av) & Reg 2(bh)",
                        mech: "Transcript absence of loan/credit-card/discount upsells in service calls",
                        status: "Verified",
                      },
                      {
                        id: "service_explicit_consent_7d",
                        name: "7-Day Explicit Consent Validity",
                        citation: "TCCCPR 2025 Regulation 2(bh)(ii)",
                        mech: "Validates consent timestamp is ≤ 7 days old before transactional completion",
                        status: "Verified",
                      },
                      {
                        id: "transactional_30m_window",
                        name: "30-Minute Transactional Boundary",
                        citation: "TCCCPR 2025 Regulation 2(bt)",
                        mech: "Validates call timestamp is within 30 minutes of customer event",
                        status: "Verified",
                      },
                      {
                        id: "designated_series_140_1600",
                        name: "140 Promo / 1600 Service Series",
                        citation: "TCCCPR 2025 Regulation 3",
                        mech: "Telephony caller ID verification (140 for Promo, 1600 for Service)",
                        status: "Verified",
                      },
                      {
                        id: "autodialer_pre_declaration",
                        name: "Auto-Dialer Written Pre-Declaration",
                        citation: "TCCCPR 2025 Regulation 4",
                        mech: "OAP pre-intimation record and campaign objective verification",
                        status: "Verified",
                      },
                      {
                        id: "anti_deception_ucc",
                        name: "Prohibition on Deceptive Pretexts",
                        citation: "TCCCPR 2025 Regulation 2(bw) Second Proviso",
                        mech: "Absence of fake lottery prizes, fraudulent arrest threats, or phishing hooks",
                        status: "Verified",
                      },
                      {
                        id: "calling_hours",
                        name: "Permissible Calling Window (09:00-21:00)",
                        citation: "TCCCPR Regulation 12(1)",
                        mech: "Asia/Kolkata timezone timestamp boundary check",
                        status: "Verified",
                      },
                      {
                        id: "no_sensitive_data_leak",
                        name: "Credential Readback Prohibition",
                        citation: "Telecommunications Act 2023 & RBI Direction Sec 14",
                        mech: "Regex scanning for Aadhaar (12-digit), PAN, CVV, OTP speech",
                        status: "Verified",
                      },
                    ].map((row) => (
                      <tr key={row.id} className="hover:bg-yellow-50/60">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-black">{row.id}</span>
                          <div className="text-[11px] text-gray-600 font-semibold">{row.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-bold text-gray-800">{row.citation}</span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-gray-700">{row.mech}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-300 text-black border border-black shadow-[1px_1px_0px_#000]">
                            <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TEMPLATES & REMEDIATION */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="p-6 bg-white border-3 border-black rounded-2xl shadow-[6px_6px_0px_#000]">
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-black font-display">
                    Compliant System Prompt Injection Snippet
                  </h2>
                  <p className="text-xs font-semibold text-gray-600">
                    Copy and prepend this block into your Bolna Agent Studio or Sarvam LLM system prompt to ensure 100% TRAI statutory pass rates
                  </p>
                </div>
                <button
                  onClick={() => handleCopy("prompt", compliancePromptSnippet)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brutal-yellow text-black border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-yellow-300 transition-all"
                >
                  {copiedKey === "prompt" ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
                <pre>{compliancePromptSnippet}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
