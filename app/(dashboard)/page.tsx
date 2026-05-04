"use client";

import { useState, useRef, useEffect } from "react";
import { Persona } from "../lib/personas/types";

// ─── Persona Data ────────────────────────────────────────────────────────────

const personas: Persona[] = [
  {
    id: "ceo",
    name: "CEO Advisor",
    team: "Executive",
    domain: "Strategic Leadership",
    description: "Your chief strategic advisor.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "task-operator",
    name: "Task Operator",
    team: "Executive",
    domain: "Execution & Agent Coordination",
    description: "Executes tasks and dispatches to agents.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "investment-analyst",
    name: "Investment Analyst",
    team: "Finance",
    domain: "Portfolio Management",
    description: "Stocks, MF, crypto, real estate.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "tax-advisor",
    name: "Tax Advisor",
    team: "Finance",
    domain: "Tax Planning & Compliance",
    description: "Tax planning, GST, savings strategies.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "capital-funding",
    name: "Capital & Funding",
    team: "Finance",
    domain: "Capital Raising & Financial Structure",
    description: "Loans, investors, government schemes.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "bookkeeping-mis",
    name: "Bookkeeping & MIS",
    team: "Finance",
    domain: "Financial Reporting & Cash Management",
    description: "Cash flow, receivables, daily MIS.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "partner-investor-relations",
    name: "Partner & Investor Relations",
    team: "Finance",
    domain: "Deals, Partnerships & Fundraising",
    description: "Pitch decks, investor relations.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "business-growth",
    name: "Business Growth",
    team: "Growth",
    domain: "Scale Existing Lines",
    description: "Revenue maximization, scaling.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "horizontal-growth",
    name: "Horizontal Growth",
    team: "Growth",
    domain: "Diversification & New Industries",
    description: "Greenfield opportunities, diversification.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "vertical-growth",
    name: "Vertical Growth",
    team: "Growth",
    domain: "Value Chain Integration",
    description: "Backward/forward integration.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "manufacturing-expo",
    name: "Manufacturing & Expo",
    team: "Industry",
    domain: "Operations & B2B Sales",
    description: "Factory operations, trade shows, B2B.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "product-expert",
    name: "Product Expert",
    team: "Industry",
    domain: "Category Strategy",
    description: "Dry fruits, spices, ghee, teas, pooja products.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "marketing-expert",
    name: "Marketing Expert",
    team: "Industry",
    domain: "Campaigns & Growth Marketing",
    description: "SEO, ads, content marketing, funnels.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "customer-experience",
    name: "Customer Experience",
    team: "Industry",
    domain: "Retention & Satisfaction",
    description: "Retention, loyalty, NPS, reviews.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "ecommerce-operations",
    name: "E-commerce Operations",
    team: "Industry",
    domain: "Multi-Platform Selling",
    description: "Amazon, Flipkart, Nykaa, D2C sync.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "personal-brand",
    name: "Personal Brand",
    team: "Brand",
    domain: "Reputation & Content",
    description: "Content strategy, social media, thought leadership.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "life-wellness",
    name: "Life & Wellness",
    team: "Future",
    domain: "Personal Goals & Financial Freedom",
    description: "Health, leisure, FIRE roadmap.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "saas-product",
    name: "SaaS Product",
    team: "Future",
    domain: "B2B Software Tools",
    description: "Identify and launch SaaS tools.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "education-business",
    name: "Education Business",
    team: "Future",
    domain: "Books, Learning & EdTech",
    description: "Books, courses, ed-tech opportunities.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "ngo-social",
    name: "NGO & Social Impact",
    team: "Future",
    domain: "Philanthropy & CSR",
    description: "CSR, grants, social impact strategy.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "succession-legacy",
    name: "Succession & Legacy",
    team: "Future",
    domain: "Long-term Wealth Transfer",
    description: "Exit planning, generational wealth.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "hr-talent",
    name: "HR & Talent",
    team: "Ops",
    domain: "Hiring, Culture & Payroll",
    description: "Hiring, team building, culture.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "data-analytics",
    name: "Data Analytics",
    team: "Ops",
    domain: "Business Intelligence",
    description: "Dashboards, metrics, insights.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "risk-manager",
    name: "Risk Manager",
    team: "Ops",
    domain: "Risk Assessment & Insurance",
    description: "Fail-safe strategies, insurance coverage.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "operations-expert",
    name: "Operations Expert",
    team: "Ops",
    domain: "Efficiency & Scaling",
    description: "Lean ops, automation, cost reduction.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "supply-chain",
    name: "Supply Chain",
    team: "Ops",
    domain: "Sourcing & Supplier Management",
    description: "Raw material sourcing, supplier negotiation.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "market-intelligence",
    name: "Market Intelligence",
    team: "Ops",
    domain: "Competitor & Market Analysis",
    description: "Competitor analysis, pricing benchmarks.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "legal-compliance",
    name: "Legal & Compliance",
    team: "Compliance",
    domain: "Contracts, IP & Entity Structure",
    description: "Contracts, IP, business entity structure.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "regulatory-compliance",
    name: "Regulatory Compliance",
    team: "Compliance",
    domain: "FSSAI, AYUSH & Food Safety",
    description: "FSSAI, labeling, food safety audits.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "health-coach",
    name: "Health Coach",
    team: "Future",
    domain: "Fitness, Health & Longevity",
    description: "Fitness, health optimization, longevity, peak performance.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "control-management",
    name: "Control & Management",
    team: "Executive",
    domain: "Employee & Business Control",
    description: "Employee management, self-discipline, accountability.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "research-risk-intelligence",
    name: "Research & Risk Intelligence",
    team: "Intelligence",
    domain: "Future Insights & Risk Prediction",
    description: "OpenClaw-style research, market intel, risk prediction.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
  {
    id: "smart-buyer",
    name: "Smart Buyer",
    team: "Ops",
    domain: "Procurement & Cost Arbitrage",
    description: "Deal-finding, negotiation, supplier arbitrage.",
    systemPrompt: "",
    goals: [],
    dataSources: [],
    tools: [],
  },
];

// ─── Team Colors ─────────────────────────────────────────────────────────────

const teamColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Executive:  { bg: "bg-amber-500/10", text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400" },
  Finance:    { bg: "bg-emerald-500/10", text: "text-emerald-400",  border: "border-emerald-500/30",  dot: "bg-emerald-400" },
  Growth:     { bg: "bg-blue-500/10",   text: "text-blue-400",     border: "border-blue-500/30",     dot: "bg-blue-400" },
  Industry:   { bg: "bg-orange-500/10", text: "text-orange-400",    border: "border-orange-500/30",   dot: "bg-orange-400" },
  Brand:      { bg: "bg-pink-500/10",   text: "text-pink-400",     border: "border-pink-500/30",    dot: "bg-pink-400" },
  Future:     { bg: "bg-purple-500/10", text: "text-purple-400",   border: "border-purple-500/30",  dot: "bg-purple-400" },
  Ops:        { bg: "bg-cyan-500/10",   text: "text-cyan-400",     border: "border-cyan-500/30",    dot: "bg-cyan-400" },
  Compliance:  { bg: "bg-red-500/10",    text: "text-red-400",      border: "border-red-500/30",     dot: "bg-red-400" },
  Intelligence: { bg: "bg-teal-500/10",   text: "text-teal-400",     border: "border-teal-500/30",    dot: "bg-teal-400" },
};

const teamOrder = ["Executive", "Finance", "Growth", "Industry", "Brand", "Future", "Ops", "Compliance", "Intelligence"];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ─── Initial Sample Messages ──────────────────────────────────────────────────

const initialMessages: Message[] = [
  {
    id: "sample-1",
    role: "user",
    content: "What should be our top priority for the next 90 days?",
    timestamp: Date.now() - 300000,
  },
  {
    id: "sample-2",
    role: "assistant",
    content:
      "Based on our current trajectory and the 5-6 CR goal, here are the three priorities I'd recommend for the next 90 days:\n\n**1. Revenue Concentration Reduction (URGENT)**\nOur e-commerce revenue is too concentrated on Amazon. If they change their algorithm or commission rates, we're exposed. I want to diversify: grow Flipkart to 25% of e-commerce revenue, and build Andhapansari.com D2C to 15% within 90 days.\n\n**2. Working Capital Liberation (HIGH)**\nThe money tied up in slow-moving inventory is costing us ₹X lakh per month in opportunity cost. I'm going to coordinate with Supply Chain and Operations to reduce inventory days from 45 to 25. That frees up ₹Y crore for growth.\n\n**3. Customer Acquisition Engine (MEDIUM)**\nWe're spending on ads but not tracking LTV properly. I want Data Analytics to build a cohort analysis first — then Marketing can double down on channels where LTV > 3x CAC.\n\nShould I route any of these to specific experts for detailed execution plans?",
    timestamp: Date.now() - 240000,
  },
  {
    id: "sample-3",
    role: "user",
    content: "The factory lease is expiring in 6 months. Should we buy land and build, or just renew the lease?",
    timestamp: Date.now() - 120000,
  },
  {
    id: "sample-4",
    role: "assistant",
    content:
      "This is a big capital decision. Let me give you the framework — I'll pull in Capital & Funding and Operations Expert for the detailed analysis.\n\n**The Short Answer**: If you can afford the down payment (typically 20-25% for industrial land loans), BUYING is almost always better over a 10-year horizon.\n\n**Why Buying Wins:\n**- Leased factory: you're paying rent forever, with escalation clauses\n- Owned factory: after the loan is paid off, it's an appreciating asset AND a cost you eliminated\n- At 5-6 CR revenue, a 2000 sq yard factory in a Tier 2 location is likely ₹2-5 crore. Bank loan at 11-13% over 10-15 years is very manageable.\n- Plus: government subsidies for food processing units can bring effective interest to 8-9%.\n\n**Risks of Buying:**\n- Large upfront capital (down payment + construction + time to build)\n- Location lock-in: if the area develops unfavorably, you're stuck\n- Maintenance costs fall entirely on you\n\n**My Recommendation:**\nStart the land search NOW. Identify 3-4 locations. Get pricing. Approach SIDBI or HDFC for a pre-approved loan amount. Meanwhile, negotiate a 6-month lease extension as backup.\n\nWant me to dispatch Capital & Funding and Operations Expert to build a detailed buy-vs-lease model?",
    timestamp: Date.now() - 60000,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string>("ceo");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "CEO Advisor is under construction. Stand by.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Connection error. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const selected = personas.find((p) => p.id === selectedPersona);
  const colors = teamColors[selected?.team ?? "Executive"] ?? teamColors["Executive"];

  // Group personas by team
  const grouped = teamOrder
    .map((team) => ({
      team,
      personas: personas.filter((p) => p.team === team),
    }))
    .filter((g) => g.personas.length > 0);

  return (
    <div className="flex h-full w-full bg-black text-white overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`
          flex flex-col border-r border-white/10 bg-zinc-950
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-64 min-w-64" : "w-0 min-w-0 overflow-hidden"}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-none">Team Akhil</div>
              <div className="text-xs text-zinc-500 leading-none mt-0.5">33 Personas</div>
            </div>
          </div>
        </div>

        {/* Personas List */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {grouped.map(({ team, personas: teamPersonas }) => {
            const tc = teamColors[team] ?? teamColors["Ops"];
            return (
              <div key={team} className="mb-1">
                <div className={`flex items-center gap-2 px-4 py-2 ${tc.text} text-xs font-semibold uppercase tracking-wider`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                  {team}
                </div>
                {teamPersonas.map((persona) => {
                  const pc = teamColors[persona.team] ?? teamColors["Ops"];
                  const isActive = selectedPersona === persona.id;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => setSelectedPersona(persona.id)}
                      className={`
                        w-full text-left px-4 py-2.5 flex items-center gap-2.5
                        transition-all duration-150
                        ${isActive
                          ? `bg-white/10 ${pc.text}`
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                        }
                      `}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                          isActive ? pc.dot : "bg-zinc-600"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className={`text-sm font-medium truncate ${isActive ? "" : ""}`}>
                          {persona.name}
                        </div>
                        <div className={`text-xs truncate ${isActive ? pc.text + "/70" : "text-zinc-600"}`}>
                          {persona.domain}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-500">All 29 personas ready</span>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {selected && (
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                  <span className={`${colors.text} text-sm font-bold`}>
                    {selected.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white leading-none">{selected.name}</div>
                  <div className={`text-xs ${colors.text} leading-none mt-0.5`}>{selected.domain}</div>
                </div>
              </div>
            )}
          </div>

          {/* Metrics Strip */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Revenue Target</div>
                <div className="text-sm font-semibold text-amber-400">5-6 CR/yr</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Active Personas</div>
                <div className="text-sm font-semibold text-white">29</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Status</div>
                <div className="text-sm font-semibold text-emerald-400">Building</div>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-2xl rounded-2xl px-5 py-3.5
                    ${msg.role === "user"
                      ? "bg-gradient-to-br from-amber-500 to-amber-600 text-black"
                      : "bg-zinc-900 border border-white/10 text-zinc-100"
                    }
                  `}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      msg.role === "user" ? "text-amber-900/60" : "text-zinc-600"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-zinc-500">CEO Advisor is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 bg-zinc-950/50 px-6 py-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-3 bg-zinc-900 border border-white/15 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask the CEO Advisor anything..."
                  rows={1}
                  className="flex-1 bg-transparent text-white text-sm placeholder-zinc-600 resize-none outline-none max-h-32"
                  style={{ minHeight: "24px" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`
                    w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    transition-all duration-200
                    ${input.trim() && !isLoading
                      ? "bg-amber-500 hover:bg-amber-400 text-black cursor-pointer"
                      : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    }
                  `}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-xs text-zinc-700">
                  Press Enter to send, Shift+Enter for new line
                </span>
                <span className="text-xs text-zinc-700">
                  {selectedPersona === "ceo"
                    ? "CEO routes to 28 experts"
                    : `Chatting with ${selected?.name}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
