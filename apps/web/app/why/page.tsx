import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Check,
  Headphones,
  Mic,
  Repeat,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { ResolutionCostChart } from "@/components/ResolutionCostChart";

export const metadata: Metadata = {
  title: "Why Kasauti",
  description:
    "The case for testing Indian voice AI agents before they reach a customer: the rules, the failures, the economics and the market.",
};

const TOTAL_SLIDES = 12;

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

const SOURCES = {
  trai: {
    label: "TRAI Third Amendment, 18 Sep 2026",
    href: "https://www.trai.gov.in/sites/default/files/2026-09/Regulation_18092026.pdf",
  },
  telecomLead: {
    label: "TelecomLead, TRAI Q1 FY27 enforcement",
    href: "https://telecomlead.com/4g-lte/trai-cracks-down-on-spam-183839-telecom-resources-blocked-24-43-bn-ai-flagged-spam-calls-and-sms-detected-in-q1-fy2026-27-127105",
  },
  voiceOfIndia: {
    label: "Voice of India speech benchmark",
    href: "https://arxiv.org/html/2604.19151v1",
  },
  bolnaChecklist: {
    label: "Bolna readiness checklist",
    href: "https://www.bolna.ai/docs/production/readiness-checklist",
  },
  bolnaGuardrails: {
    label: "Bolna calling guardrails",
    href: "https://www.bolna.ai/docs/guides/outbound/calling-guardrails",
  },
  exotel: {
    label: "Exotel calling hours FAQ",
    href: "https://developer.exotel.com/docs/faqs/calling-hours",
  },
  truecaller: {
    label: "TechCrunch, Truecaller and TRAI",
    href: "https://techcrunch.com/2026/07/08/truecaller-clashes-with-indias-telecom-regulator-over-anti-spam-rules/",
  },
  rbiRecovery: {
    label: "RBI recovery directions, TaxGuru reproduction",
    href: "https://taxguru.in/rbi/rbi-issues-comprehensive-commercial-bank-recovery-agent-loan-recovery-conduct-directions-january-2027.html",
  },
  kotak: {
    label: "RBI press release on Kotak penalty",
    href: "https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=56576",
  },
  gartner: {
    label: "Gartner agentic AI forecast",
    href: "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027.",
  },
  callerModel: {
    label: "Caller.digital cost model (vendor)",
    href: "https://caller.digital/blog/cost-per-resolved-contact-chat-vs-voice-ai-india-2026",
  },
  dpdpSchedule: {
    label: "DPDP Act Schedule",
    href: "https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf",
  },
  dpdpTiming: {
    label: "The Privacy Labs, DPDP timeline",
    href: "https://theprivacylabs.com/blogs/dpdp-13-november-2026-what-starts",
  },
  consentManagers: {
    label: "Maheshwari & Co, consent managers",
    href: "https://www.maheshwariandco.com/blog/dpdp-consent-manager-framework-november-2026/",
  },
  coval: {
    label: "Coval pricing",
    href: "https://www.coval.ai/pricing",
  },
  sarvamTests: {
    label: "Sarvam Tests changelog",
    href: "https://docs.sarvam.ai/changelog/2026/9/17.md",
  },
  fccRuling: {
    label: "FCC Declaratory Ruling 24-17",
    href: "https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf",
  },
  tcpa: {
    label: "47 U.S.C. § 227",
    href: "https://www.law.cornell.edu/uscode/text/47/227",
  },
  kramerFine: {
    label: "CyberScoop on the $6M fine",
    href: "https://cyberscoop.com/fcc-fine-joe-biden-deepfake-new-hampshire-robocall-steve-kramer/",
  },
  lingoSettlement: {
    label: "AP on the $1M settlement",
    href: "https://www.clickondetroit.com/news/politics/2024/08/21/company-that-sent-ai-calls-mimicking-joe-biden-to-new-hampshire-voters-agrees-to-pay-1-million-fine/",
  },
  euArticle50: {
    label: "EU AI Act, Article 50",
    href: "https://artificialintelligenceact.eu/article/50/",
  },
  euPenalties: {
    label: "EU AI Act, Article 99",
    href: "https://artificialintelligenceact.eu/article/99/",
  },
  euTiming: {
    label: "Baker Botts on the start date",
    href: "https://www.bakerbotts.com/thought-leadership/publications/2026/september/eu-ai-act-article-50-transparency-obligations-go-live",
  },
  koreaAct: {
    label: "Yahoo Finance on the AI Basic Act",
    href: "https://finance.yahoo.com/news/south-korea-launches-landmark-laws-050945074.html",
  },
  spainLaw: {
    label: "KPMG on Ley 10/2025",
    href: "https://assets.kpmg.com/content/dam/kpmgsites/es/pdf/2026/01/legal-alert-regulacion-servicios-atencion-clientela-ley-10-2025.pdf.coredownload.inline.pdf",
  },
  spainScope: {
    label: "Ringover on who it covers (vendor)",
    href: "https://www.ringover.es/blog/ley-sac",
  },
  cbaReversal: {
    label: "Bloomberg on the reversal",
    href: "https://www.bloomberg.com/news/articles/2025-08-21/commonwealth-bank-reverses-job-cuts-decision-over-ai-chatbots",
  },
  cbaUnion: {
    label: "Finance Sector Union account",
    href: "https://www.fsunion.org.au/win-cba-backflips-on-customer-service-job-cuts-admits-they-got-it-wrong/",
  },
  airCanada: {
    label: "McCarthy Tétrault on Moffatt",
    href: "https://www.mccarthy.ca/en/insights/blogs/techlex/moffatt-v-air-canada-misrepresentation-ai-chatbot",
  },
};

type Source = { label: string; href: string };

const DECK_INDEX = [
  { href: "#problem", label: "Problem" },
  { href: "#failure", label: "Failure" },
  { href: "#gap", label: "Gap" },
  { href: "#who", label: "Who needs it" },
  { href: "#product", label: "Product" },
  { href: "#economics", label: "Economics" },
  { href: "#timing", label: "Why now" },
  { href: "#abroad", label: "Other countries" },
  { href: "#market", label: "Market" },
  { href: "#competition", label: "Competition" },
  { href: "#limits", label: "Open questions" },
];

const SPEECH_ERRORS = [
  { label: "Hindi, best model", value: 5.0, highlight: false },
  { label: "Kannada, best model", value: 16.3, highlight: false },
  { label: "Malayalam, best model", value: 18.9, highlight: false },
  { label: "Hindi, GPT-4o Transcribe", value: 33.9, highlight: true },
];

const AUDIENCES = [
  {
    icon: UserRound,
    color: "bg-brutal-pink",
    title: "The person being called",
    pain: "They say stop and the agent keeps pitching. They get asked for an OTP. They speak Hinglish and get misheard. Many have already given up: Truecaller says its users ignore 79-81% of 1600 and 1400 series calls.",
    gain: "Opt-out, consent and credential checks run on the agent before it reaches them, in the language they actually use.",
    source: SOURCES.truecaller,
  },
  {
    icon: Building2,
    color: "bg-brutal-yellow",
    title: "The company deploying it",
    pain: "A lender answers for what its bot says. Bank recovery calls get an 08:00-19:00 window and six-month recording from 1 January 2027, and RBI has fined a bank before: Kotak's ₹3.95 crore penalty included after-hours contact.",
    gain: "A dated record of what was tested and what failed, before launch and again after every prompt change.",
    source: SOURCES.rbiRecovery,
  },
  {
    icon: Headphones,
    color: "bg-brutal-purple",
    title: "The voice AI vendor",
    pain: "Regulated buyers ask for proof, and a platform cannot credibly grade itself. Gartner expects over 40% of agentic AI projects to be cancelled by the end of 2027, a global figure that is not specific to voice.",
    gain: "Results from outside the vendor's own stack that can go straight into a bid or a security review.",
    source: SOURCES.gartner,
  },
];

const STEPS = [
  {
    icon: Mic,
    color: "bg-brutal-pink",
    title: "Call",
    body: "Simulated personas call the agent through 12 scenarios in Hindi, Hinglish, Kannada and Indian English.",
  },
  {
    icon: ShieldCheck,
    color: "bg-brutal-yellow",
    title: "Score",
    body: "Every call is checked against deterministic rules and LLM rubrics. The purity score is the share of calls that passed every check.",
  },
  {
    icon: Wrench,
    color: "bg-brutal-purple",
    title: "Fix",
    body: "Kasauti patches the prompt on a staging agent. A guard in the code, covered by tests, refuses to touch production.",
  },
  {
    icon: Repeat,
    color: "bg-brutal-green",
    title: "Retest",
    body: "Only the failed scenarios run again, as a new run, so you can see exactly what the fix changed.",
  },
];

const RULES = [
  "Opt-out honoured within 2 turns",
  "Consent before personal data",
  "No OTP, CVV or PIN readback",
  "Calling hours",
  "AI disclosure in 2 turns (best practice)",
];

const LABS = [
  { href: "/acoustic", title: "Acoustic stress", body: "Noise profiles and word error rate on telephone audio." },
  { href: "/fuzzer", title: "Tool fuzzer", body: "Adversarial inputs aimed at the agent's tool calls." },
  { href: "/sentinel", title: "Live sentinel", body: "A guardrail that inspects agent output in flight." },
];

const TIMELINE = [
  { date: "18 Sep 2026", body: "TRAI's Third Amendment brings artificial voice calls into the A2P rules." },
  { date: "About 13 Nov 2026", body: "DPDP consent manager registration opens." },
  { date: "About 17 Nov 2026", body: "Second phase of the TRAI amendment, if Gazette publication matched its date." },
  { date: "About 17 Dec 2026", body: "Third phase of the TRAI amendment, on the same assumption." },
  { date: "1 Jan 2027", body: "RBI recovery directions apply: 08:00-19:00 calls and six-month recording for banks." },
  { date: "13 May 2027", body: "DPDP duties and penalties begin, with a ceiling of ₹250 crore." },
];

const FOREIGN_RULES = [
  {
    code: "US",
    date: "Feb 2024",
    title: "AI voices need consent",
    body: "The FCC confirmed that AI-generated voices count as “artificial” under the TCPA, so these calls need prior express consent. People can sue for $500 per violation, and up to three times that if it was wilful.",
    sources: [SOURCES.fccRuling, SOURCES.tcpa],
  },
  {
    code: "EU",
    date: "2 Aug 2026",
    title: "People must be told it is AI",
    body: "AI systems that talk to people must be designed to say so, unless it is obvious. The duty sits with the provider. Fines reach €15 million or 3% of global turnover, with lower caps for SMEs.",
    sources: [SOURCES.euArticle50, SOURCES.euPenalties, SOURCES.euTiming],
  },
  {
    code: "KR",
    date: "22 Jan 2026",
    title: "Users get advance notice",
    body: "South Korea's AI Basic Act requires advance notice when a service uses generative AI. Fines reach 30 million won (about $20,400), but only after a grace period of at least a year.",
    sources: [SOURCES.koreaAct],
  },
  {
    code: "ES",
    date: "By 28 Dec 2026",
    title: "Customers can demand a person",
    body: "Spain's Ley 10/2025 lets customers ask to be served by a person, not a machine. It covers large companies and basic services, including financial services.",
    sources: [SOURCES.spainLaw, SOURCES.spainScope],
  },
];

const FOREIGN_CASES = [
  {
    code: "US",
    date: "2024",
    title: "$7M in penalties after AI voice calls",
    body: "A consultant was fined $6 million over 3,000 spoofed calls using an AI clone of President Biden's voice, and carrier Lingo Telecom paid $1 million. This was a political deepfake punished over caller ID rules, not a business agent.",
    sources: [SOURCES.kramerFine, SOURCES.lingoSettlement],
  },
  {
    code: "AU",
    date: "Aug 2025",
    title: "A bank reversed its voice bot job cuts",
    body: "Commonwealth Bank cut 45 service roles, saying a voice bot had reduced calls. Staff said calls were rising. After the union took it to the Fair Work Commission, the bank reversed the cuts and called them an error.",
    sources: [SOURCES.cbaReversal, SOURCES.cbaUnion],
  },
  {
    code: "CA",
    date: "Feb 2024",
    title: "A company answers for its bot",
    body: "A tribunal held Air Canada liable for wrong fare advice from its chatbot and rejected the argument that the bot was a separate entity. The bill was about C$800, and it was a small-claims case about a text bot, so it is a signal, not a precedent.",
    sources: [SOURCES.airCanada],
  },
];

const MARKET_ROWS = [
  { label: "India TAM", low: "$5.7M", base: "$28.4M", high: "$97.3M" },
  { label: "India SAM", low: "$2.0M", base: "$14.2M", high: "$63.2M" },
  { label: "India SOM, year 5", low: "$0.2M", base: "$2.1M", high: "$15.8M" },
  { label: "Global TAM", low: "$215M", base: "$987M", high: "$4.3B" },
  { label: "Combined ARR, 2031", low: "$0.7M", base: "$10.0M", high: "$47.9M" },
];

const COMPETITORS = [
  { group: "Global voice testers", players: "Coval, Cekura, Hamming, Bluejay, Roark", finding: "Claim Indian languages. No TRAI, DND or DPDP suite found." },
  { group: "Platform-native tools", players: "Sarvam Tests, Vapi, Retell, ElevenLabs", finding: "Bundled and cheap, but a platform is grading itself. Biggest threat." },
  { group: "India testers", players: "SuperBryn, Prodloop", finding: "Local founders and early customers. No compliance suite found." },
  { group: "India post-call QA", players: "Convin, Gnani, Ozonetel", finding: "Own the contact-centre relationship, and review calls after they happen." },
  { group: "CX assurance", players: "Cyara, Botium", finding: "Well funded. No Indian rules found." },
];

const PROVES = [
  "What the agent says on a call",
  "Whether it stops when asked, in the language asked",
  "Whether it asks for or repeats credentials",
  "Whether a fix helped or broke something else",
];

const CANNOT_PROVE = [
  "Whether a number was scrubbed against DND",
  "Whether a template was registered",
  "Whether real consent exists",
  "Whether the agent is legally compliant. Only a regulator can decide that",
];

const ROADMAP = ["Three paid audits", "Two vendor design partners", "Evidence export", "Production monitoring"];

const SourceLink: React.FC<{ source: Source; inverted?: boolean }> = ({ source, inverted = false }) => (
  <a
    href={source.href}
    target="_blank"
    rel="noreferrer"
    className={`inline-flex items-center gap-1 text-xs font-bold underline underline-offset-2 ${focusRing} ${inverted ? "text-white focus-visible:outline-white" : "text-black"}`}
  >
    <span>{source.label}</span>
    <ArrowUpRight className="w-3 h-3 shrink-0" />
  </a>
);

const EstimateTag: React.FC = () => (
  <span className="inline-block px-2 py-0.5 rounded bg-brutal-yellow border-2 border-black text-xs font-black uppercase tracking-wide text-black">
    Estimate
  </span>
);

const Stat: React.FC<{ value: string; label: string; source?: Source }> = ({ value, label, source }) => (
  <div className="rounded-xl bg-white border-2 border-black p-4 shadow-[3px_3px_0px_#000] flex flex-col text-black">
    <div className="font-display text-4xl lg:text-5xl font-black tracking-tight">{value}</div>
    <p className="mt-2 text-sm font-semibold leading-snug">{label}</p>
    {source && (
      <div className="mt-auto pt-3">
        <SourceLink source={source} />
      </div>
    )}
  </div>
);

const EvidenceCard: React.FC<{
  code: string;
  date: string;
  title: string;
  body: string;
  sources: Source[];
}> = ({ code, date, title, body, sources }) => (
  <article className="rounded-xl bg-white border-2 border-black p-4 shadow-[3px_3px_0px_#000] flex flex-col">
    <div className="flex items-center justify-between gap-2">
      <span className="px-2 py-0.5 rounded bg-black text-white font-mono text-xs font-black">{code}</span>
      <span className="font-mono text-xs font-black">{date}</span>
    </div>
    <h4 className="mt-3 font-display text-lg font-black uppercase tracking-tight leading-tight">{title}</h4>
    <p className="mt-2 text-sm font-medium leading-relaxed">{body}</p>
    <div className="mt-auto pt-3 flex flex-col items-start gap-1">
      {sources.map((source) => (
        <SourceLink key={source.href} source={source} />
      ))}
    </div>
  </article>
);

const SLIDE_TONES = {
  white: "bg-white text-black",
  yellow: "bg-brutal-yellow text-black",
  yellowLight: "bg-brutal-yellow-light text-black",
  pink: "bg-brutal-pink text-black",
  purple: "bg-brutal-purple-light text-black",
  black: "bg-black text-white",
};

const Slide: React.FC<{
  id: string;
  number: number;
  kicker: string;
  title: string;
  tone?: keyof typeof SLIDE_TONES;
  children: React.ReactNode;
}> = ({ id, number, kicker, title, tone = "white", children }) => (
  <section
    id={id}
    className={`scroll-mt-24 rounded-2xl border-[3px] border-black p-6 sm:p-10 shadow-[6px_6px_0px_#000000] ${SLIDE_TONES[tone]}`}
  >
    <div className="flex items-center justify-between gap-4">
      <span className="px-3 py-1 rounded-full bg-white text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
        {kicker}
      </span>
      <span className="font-mono text-sm font-black">
        {String(number).padStart(2, "0")} / {TOTAL_SLIDES}
      </span>
    </div>
    <h2 className="mt-5 max-w-4xl font-display text-3xl sm:text-5xl font-black uppercase tracking-tight leading-[1.02]">
      {title}
    </h2>
    <div className="mt-8">{children}</div>
  </section>
);

export default function WhyPage() {
  return (
    <div className="space-y-10 pb-12">
      {/* Slide 1: Cover */}
      <section className="relative overflow-hidden rounded-3xl bg-white border-[3px] border-black p-6 sm:p-12 shadow-[8px_8px_0px_#000000]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <span className="px-3 py-1 rounded-full bg-brutal-pink border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
                The case for Kasauti
              </span>
              <span className="font-mono text-sm font-black">01 / {TOTAL_SLIDES}</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-[0.95]">
              Voice agents are calling India.{" "}
              <span className="underline decoration-brutal-pink decoration-wavy decoration-4">
                Who checks what they say?
              </span>
            </h1>
            <p className="max-w-2xl text-base sm:text-lg font-medium leading-relaxed">
              A kasauti is the touchstone jewellers rub gold against to test its purity. Kasauti does the
              same for voice AI: it calls an agent before customers do, scores what it says in Hindi,
              Hinglish, Kannada and Indian English, and shows you the evidence.
            </p>
            <nav aria-label="Deck contents" className="flex flex-wrap gap-2">
              {DECK_INDEX.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1 rounded-lg bg-brutal-bg border-2 border-black text-xs font-black uppercase tracking-wide shadow-[2px_2px_0px_#000] hover:bg-brutal-yellow transition-colors ${focusRing}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-4 flex justify-center py-4">
            <div className="relative">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-brutal-pink border-4 border-black shadow-[10px_10px_0px_#000000] flex flex-col items-center justify-center rotate-6">
                <span className="font-display text-7xl sm:text-8xl font-black tracking-tighter select-none">K</span>
                <span className="text-xs font-black uppercase tracking-widest bg-black text-white px-3 py-0.5 rounded-full mt-1">
                  Touchstone
                </span>
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-brutal-purple border-2 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center font-display text-3xl font-black rotate-12">
                ₹
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t-2 border-black flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
          <span>Figures are from Kasauti&apos;s market research, October 2026.</span>
          <span className="inline-flex items-center gap-2">
            <EstimateTag /> marks a modelled figure, not a published one.
          </span>
        </div>
      </section>

      {/* Slide 2: Problem */}
      <Slide
        id="problem"
        number={2}
        tone="yellow"
        kicker="The problem"
        title="Three complaints can silence every line you own."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat value="3" label="complaints from different people in 10 days, with an AI flag on the number. Five without one." source={SOURCES.trai} />
          <Stat value="15 days" label="with outgoing calls barred on all of a sender's resources, across all operators." source={SOURCES.trai} />
          <Stat value="1 year" label="of disconnection and blacklisting for a repeat." source={SOURCES.trai} />
          <Stat value="137,053" label="resources barred for 15 days in April-June 2026 alone." source={SOURCES.telecomLead} />
        </div>
        <p className="mt-6 max-w-3xl text-base font-semibold leading-relaxed">
          TRAI&apos;s rules now cover calls made without a human dialling, including artificial voice. The
          risk is an outage, not a per-call fine. The enforcement numbers cover all senders: no public
          action has named an AI caller yet.
        </p>
      </Slide>

      {/* Slide 3: Failure */}
      <Slide
        id="failure"
        number={3}
        kicker="How it fails"
        title="A misheard “call mat karo” is a compliance event."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide">
              Word error rate on unscripted telephone speech
            </h3>
            <dl className="mt-4 space-y-3">
              {SPEECH_ERRORS.map((row) => (
                <div key={row.label} title={`${row.label}: ${row.value}%`}>
                  <dt className="text-sm font-bold">{row.label}</dt>
                  <dd className="mt-1 flex items-center gap-3">
                    <div
                      className={`h-5 rounded-r border-2 border-black ${row.highlight ? "bg-brutal-pink" : "bg-brutal-mint"}`}
                      style={{ width: `${(row.value / 40) * 85}%` }}
                    />
                    <span className="font-mono text-sm font-black">{row.value}%</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <SourceLink source={SOURCES.voiceOfIndia} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-brutal-bg border-2 border-black p-5 shadow-[3px_3px_0px_#000]">
              <div className="text-xs font-black uppercase tracking-wider">A Kasauti test case</div>
              <p className="mt-3 font-mono text-sm font-bold">Customer: &quot;Mujhe call mat karo.&quot;</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed">
                The agent must acknowledge it and end the call within 2 turns. If it keeps pitching, the
                check fails and the transcript shows where.
              </p>
            </div>
            <p className="text-base font-semibold leading-relaxed">
              Error also swings by region: from about 4% to 44% across districts in the same benchmark, so
              an agent that tests well in one place can fail in another. Missed opt-outs turn into the
              complaints that trigger a bar.
            </p>
          </div>
        </div>
      </Slide>

      {/* Slide 4: Gap */}
      <Slide id="gap" number={4} tone="black" kicker="Today" title="The current safety net is 20 test calls.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat value="20" label="test calls is what Bolna's production checklist asks for. It includes no evals." source={SOURCES.bolnaChecklist} />
          <Stat value="Off" label="by default: Bolna's calling guardrail, which also has a bypass flag." source={SOURCES.bolnaGuardrails} />
          <Stat value="No check" label="on calling hours at API level, according to Exotel." source={SOURCES.exotel} />
        </div>
        <p className="mt-6 max-w-3xl text-base font-semibold leading-relaxed">
          Platforms leave the checking to their customers, and a handful of manual calls cannot cover four
          languages, regional accents and every way a customer says no.
        </p>
      </Slide>

      {/* Slide 5: Who needs it */}
      <Slide id="who" number={5} tone="purple" kicker="Who needs it" title="Three groups carry the risk of a bad call.">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {AUDIENCES.map((audience) => {
            const Icon = audience.icon;
            return (
              <article key={audience.title} className="card-brutal rounded-2xl overflow-hidden flex flex-col">
                <div className={`flex items-center gap-3 p-4 border-b-2 border-black ${audience.color}`}>
                  <Icon className="w-6 h-6 stroke-[2.5] shrink-0" />
                  <h3 className="font-display text-xl font-black uppercase tracking-tight leading-tight">
                    {audience.title}
                  </h3>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider">Without Kasauti</div>
                    <p className="mt-1 text-sm font-medium leading-relaxed">{audience.pain}</p>
                  </div>
                  <div className="rounded-lg bg-brutal-bg border-2 border-black p-3">
                    <div className="text-xs font-black uppercase tracking-wider">With Kasauti</div>
                    <p className="mt-1 text-sm font-bold leading-relaxed">{audience.gain}</p>
                  </div>
                  <div className="mt-auto">
                    <SourceLink source={audience.source} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Slide>

      {/* Slide 6: Product */}
      <Slide id="product" number={6} kicker="The product" title="Call, score, fix, retest. Then ship.">
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="rounded-xl border-2 border-black p-5 shadow-[3px_3px_0px_#000] bg-white">
                <div className={`w-11 h-11 rounded-lg border-2 border-black flex items-center justify-center ${step.color}`}>
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="mt-3 font-display text-2xl font-black uppercase tracking-tight">
                  {index + 1}. {step.title}
                </h3>
                <p className="mt-1 text-sm font-medium leading-relaxed">{step.body}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide">The five rules in the current pack</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {RULES.map((rule) => (
                <li key={rule} className="px-2.5 py-1 rounded-lg bg-brutal-bg border-2 border-black text-sm font-bold">
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide">Beyond the benchmark</h3>
            <ul className="mt-3 space-y-2">
              {LABS.map((lab) => (
                <li key={lab.href} className="text-sm font-medium">
                  <Link href={lab.href} className={`font-black underline underline-offset-2 ${focusRing}`}>
                    {lab.title}
                  </Link>
                  : {lab.body}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Slide>

      {/* Slide 7: Economics */}
      <Slide id="economics" number={7} kicker="The economics" title="Below 33% resolution, the bot costs more than a person.">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 min-w-0">
            <h3 className="mb-3 text-sm font-black uppercase tracking-wide">Cost per resolved contact</h3>
            <ResolutionCostChart />
          </div>
          <div className="space-y-4">
            <Stat value="₹9.8 lakh" label="lost a month per 10 lakh contacts, for each resolution point." source={SOURCES.callerModel} />
            <div className="rounded-xl bg-brutal-green border-2 border-black p-4 shadow-[3px_3px_0px_#000]">
              <p className="text-base font-black leading-snug">
                Testing pays for itself if it lifts resolution by under one point.
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed">
                A testing budget of about 4% of spend comes to ₹0.36-₹0.88 per contact. One point is worth
                ₹0.98.
              </p>
            </div>
            <div className="flex items-start gap-2 text-sm font-medium leading-relaxed">
              <EstimateTag />
              <p>
                Calculated on one vendor&apos;s assumptions. No Indian evidence yet shows that testing raises
                resolution.
              </p>
            </div>
          </div>
        </div>
      </Slide>

      {/* Slide 8: Why now */}
      <Slide id="timing" number={8} tone="purple" kicker="Why now" title="The deadlines are already on the calendar.">
        <ol className="space-y-3">
          {TIMELINE.map((item) => (
            <li
              key={item.date}
              className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-x-4 gap-y-1 rounded-xl bg-white border-2 border-black p-4 shadow-[3px_3px_0px_#000]"
            >
              <span className="font-mono text-sm font-black">{item.date}</span>
              <span className="text-sm font-semibold leading-relaxed">{item.body}</span>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          <SourceLink source={SOURCES.rbiRecovery} />
          <SourceLink source={SOURCES.dpdpTiming} />
          <SourceLink source={SOURCES.consentManagers} />
        </div>
      </Slide>

      {/* Slide 9: Other countries */}
      <Slide id="abroad" number={9} kicker="Other countries" title="Other countries are already writing these rules.">
        <h3 className="text-sm font-black uppercase tracking-wide">The rules</h3>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FOREIGN_RULES.map((rule) => (
            <EvidenceCard key={rule.title} {...rule} />
          ))}
        </div>

        <h3 className="mt-8 text-sm font-black uppercase tracking-wide">The cases</h3>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {FOREIGN_CASES.map((item) => (
            <EvidenceCard key={item.title} {...item} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-brutal-green border-2 border-black p-4 shadow-[3px_3px_0px_#000]">
            <h3 className="text-sm font-black uppercase tracking-wide">What this shows</h3>
            <p className="mt-2 text-sm font-semibold leading-relaxed">
              Consent, AI disclosure and a route to a human keep appearing. Kasauti already has rules for the
              first two, plus one Kannada scenario that tests a handoff to a human. Disclosure is best
              practice in India today, but it is already law in the EU.
            </p>
          </div>
          <div className="rounded-xl bg-brutal-bg border-2 border-black p-4 shadow-[3px_3px_0px_#000] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 stroke-[2.5]" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">What it does not show</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed">
                This review found no public penalty against a business&apos;s AI voice agent for what it said on a
                call, and no country that requires independent testing. India may not follow. Kasauti&apos;s
                rule pack covers India only and does not test these foreign rules.
              </p>
            </div>
          </div>
        </div>
      </Slide>

      {/* Slide 10: Market */}
      <Slide id="market" number={10} tone="yellowLight" kicker="The market" title="Small and sharp in India. Bigger abroad.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat value="$28M" label="India TAM in 2031 (₹270 crore): testing, monitoring and compliance evidence." />
          <Stat value="$987M" label="Global TAM in 2031 for the same categories." />
          <Stat value="$10M" label="Combined ARR by 2031 if Kasauti also sells overseas." />
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl bg-white border-2 border-black shadow-[3px_3px_0px_#000]">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <caption className="sr-only">Market size estimates for 2031 in three scenarios</caption>
            <thead className="bg-brutal-bg border-b-2 border-black uppercase tracking-wide">
              <tr>
                <th scope="col" className="px-4 py-3 font-black">2031 estimate</th>
                <th scope="col" className="px-4 py-3 font-black text-right">Low</th>
                <th scope="col" className="px-4 py-3 font-black text-right">Base</th>
                <th scope="col" className="px-4 py-3 font-black text-right">High</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 font-mono font-bold">
              {MARKET_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-4 py-2.5 font-sans font-bold">{row.label}</th>
                  <td className="px-4 py-2.5 text-right">{row.low}</td>
                  <td className="px-4 py-2.5 text-right font-black bg-brutal-yellow-light">{row.base}</td>
                  <td className="px-4 py-2.5 text-right">{row.high}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-start gap-2 max-w-3xl text-sm font-semibold leading-relaxed">
          <EstimateTag />
          <p>
            Bottom-up from about 200M Indian voice AI minutes a month, assuming 10% of spend goes to testing
            and compliance, with no direct benchmark for that share. India alone is unlikely to be
            venture-scale. The realistic win is a capital-efficient $5M-$15M ARR business or a sale to a
            platform.
          </p>
        </div>
      </Slide>

      {/* Slide 11: Competition */}
      <Slide id="competition" number={11} kicker="Competition" title="Nobody reviewed ships an Indian rule suite. Yet.">
        <div className="overflow-x-auto rounded-xl border-2 border-black shadow-[3px_3px_0px_#000]">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Competitor groups and their position on Indian compliance testing</caption>
            <thead className="bg-brutal-bg border-b-2 border-black uppercase tracking-wide">
              <tr>
                <th scope="col" className="px-4 py-3 font-black">Group</th>
                <th scope="col" className="px-4 py-3 font-black">Players</th>
                <th scope="col" className="px-4 py-3 font-black">On Indian compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 font-medium">
              {COMPETITORS.map((row) => (
                <tr key={row.group}>
                  <th scope="row" className="px-4 py-3 font-black">{row.group}</th>
                  <td className="px-4 py-3">{row.players}</td>
                  <td className="px-4 py-3">{row.finding}</td>
                </tr>
              ))}
              <tr className="bg-brutal-yellow">
                <th scope="row" className="px-4 py-3 font-black">Kasauti</th>
                <td className="px-4 py-3 font-bold">Independent tester</td>
                <td className="px-4 py-3 font-bold">
                  Aims for independent, India-specific evidence across platforms. Bolna only today.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-3xl text-base font-semibold leading-relaxed">
          A rule pack can be copied in days to weeks, and Sarvam Tests already lets customers write their
          own. What lasts is harder to copy: a lawyer-reviewed rule record kept current, a labelled Indian
          telephony audio set, and published per-language benchmarks.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <SourceLink source={SOURCES.sarvamTests} />
          <SourceLink source={SOURCES.coval} />
        </div>
      </Slide>

      {/* Slide 12: Open questions and close */}
      <Slide id="limits" number={12} tone="pink" kicker="Open questions" title="What this does not prove yet.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card-brutal rounded-2xl p-5">
            <h3 className="font-display text-xl font-black uppercase tracking-tight">A test call proves</h3>
            <ul className="mt-3 space-y-2">
              {PROVES.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm font-semibold">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 stroke-[3]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-brutal rounded-2xl p-5">
            <h3 className="font-display text-xl font-black uppercase tracking-tight">It cannot prove</h3>
            <ul className="mt-3 space-y-2">
              {CANNOT_PROVE.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm font-semibold">
                  <X className="w-4 h-4 mt-0.5 shrink-0 stroke-[3]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-white border-2 border-black p-5 shadow-[3px_3px_0px_#000] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 stroke-[2.5]" />
          <div className="text-sm font-medium leading-relaxed space-y-2">
            <p>
              <strong className="font-black">Demand is unproven.</strong> This research found no public case
              of an Indian company paying a third party to test a voice agent.
            </p>
            <p>
              <strong className="font-black">The rule pack is a first version.</strong> It uses one calling
              window where the real rules vary by call purpose, and its citations are being corrected
              against primary texts. Legal readings here need a lawyer&apos;s review. Kasauti is not legal
              advice, and its certificate is a prototype, not a statement of compliance.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-black uppercase tracking-wide">The next proof points</h3>
          <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROADMAP.map((step, index) => (
              <li key={step} className="rounded-xl bg-white border-2 border-black p-4 shadow-[3px_3px_0px_#000] text-sm font-black uppercase tracking-tight">
                <span className="font-mono">{index + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-black text-white border-2 border-black font-black text-sm uppercase tracking-wide shadow-[4px_4px_0px_#ffffff] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#ffffff] transition-all ${focusRing}`}
          >
            <span>Try a benchmark</span>
            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
          </Link>
          <Link
            href="/runs"
            className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black border-2 border-black font-black text-sm uppercase tracking-wide shadow-[4px_4px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000] transition-all ${focusRing}`}
          >
            <span>See past runs</span>
          </Link>
        </div>
      </Slide>
    </div>
  );
}
