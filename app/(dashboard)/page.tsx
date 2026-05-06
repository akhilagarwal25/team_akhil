"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Persona } from "../lib/personas/types";

const DEFAULT_COLOR = { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" };

const TEAM_COLORS = [
  { team: "Finance",       bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  { team: "Growth",        bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/30",  dot: "bg-orange-400" },
  { team: "Industry",      bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/30",    dot: "bg-cyan-400" },
  { team: "Future",        bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/30",  dot: "bg-violet-400" },
  { team: "Ops",           bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30",    dot: "bg-blue-400" },
  { team: "Operations",    bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30",    dot: "bg-blue-400" },
  { team: "Compliance",    bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-400" },
  { team: "Intelligence",   bg: "bg-teal-500/10",    text: "text-teal-400",    border: "border-teal-500/30",    dot: "bg-teal-400" },
  { team: "Brand",         bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/30",    dot: "bg-pink-400" },
  { team: "Executive",     bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400" },
];

function getTeamColor(team: string) {
  return TEAM_COLORS.find((c) => c.team === team) ?? DEFAULT_COLOR;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState<Persona[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    loadAgents();
    const refresh = () => loadAgents();
    window.addEventListener("agents-updated", refresh);
    return () => window.removeEventListener("agents-updated", refresh);
  }, []);

  const loadAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
    } catch (e) {
      console.error("Failed to load agents:", e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, history: messages.map((m) => ({ role: m.role, content: m.content })), agentId: selectedAgent }),
      });
      const data = await res.json();
      if (data.action?.type === "create_agent") {
        const params = new URLSearchParams({ preview: data.action.preview });
        router.push(`/agent-creator?${params}`);
        return;
      }
      setMessages((p) => [...p, { id: `a-${Date.now()}`, role: "assistant", content: data.response || "Agent is thinking...", timestamp: Date.now() }]);
    } catch {
      setMessages((p) => [...p, { id: `e-${Date.now()}`, role: "assistant", content: "Connection error. Try again.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const selected = agents.find((a) => a.id === selectedAgent);
  const colors = selected ? getTeamColor(selected.team) : DEFAULT_COLOR;

  return (
    <div className="flex h-full w-full bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-white/10 bg-zinc-950 transition-all ${sidebarOpen ? "w-64 min-w-64" : "w-0 min-w-0 overflow-hidden"}`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-black font-bold text-sm">A</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-none">Team Akhil</div>
            <div className="text-xs text-zinc-500 leading-none mt-0.5">{agents.length} AI Employees</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {agents.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="text-zinc-500 text-sm mb-3">No agents yet</div>
              <button onClick={() => router.push("/agent-creator")} className="text-xs text-amber-400 hover:text-amber-300">
                + Create your first AI employee
              </button>
            </div>
          ) : (
            agents.map((agent) => {
              const pc = getTeamColor(agent.team);
              const active = selectedAgent === agent.id;
              return (
                <button key={agent.id} onClick={() => setSelectedAgent(agent.id)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-all ${active ? `bg-white/10 ${pc.text}` : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? pc.dot : "bg-zinc-600"}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{agent.name}</div>
                    <div className={`text-xs truncate ${active ? pc.text + "/70" : "text-zinc-600"}`}>{agent.team}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-500">{agents.length} agent{agents.length !== 1 ? "s" : ""} active</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen((v) => !v)} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {selected && (
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                  <span className={`${colors.text} text-sm font-bold`}>{selected.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white leading-none">{selected.name}</div>
                  <div className={`text-xs ${colors.text} leading-none mt-0.5`}>{selected.domain}</div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/agent-creator")} className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-medium transition-colors">
              + Create Agent
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-thin">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">AI Employee Command Center</h2>
                <p className="text-zinc-500 text-sm mb-6 max-w-md">Describe a need and I will create an AI employee for you. Each employee is specialized, connects to your data, and works 24/7.</p>
                <button onClick={() => router.push("/agent-creator")} className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-medium transition-colors">
                  Create Your First AI Employee
                </button>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-2xl rounded-2xl px-5 py-3.5 ${msg.role === "user" ? "bg-gradient-to-br from-amber-500 to-amber-600 text-black" : "bg-zinc-900 border border-white/10 text-zinc-100"}`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  <div className={`text-xs mt-2 ${msg.role === "user" ? "text-amber-900/60" : "text-zinc-600"}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
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
                    <span className="text-xs text-zinc-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/10 bg-zinc-950/50 px-6 py-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-3 bg-zinc-900 border border-white/15 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-colors">
                <textarea value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Describe what you need — I'll create the right AI employee..." rows={1}
                  className="flex-1 bg-transparent text-white text-sm placeholder-zinc-600 resize-none outline-none max-h-32" style={{ minHeight: "24px" }} />
                <button onClick={handleSend} disabled={!input.trim() || isLoading}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${input.trim() && !isLoading ? "bg-amber-500 hover:bg-amber-400 text-black cursor-pointer" : "bg-zinc-800 text-zinc-600 cursor-not-allowed"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
