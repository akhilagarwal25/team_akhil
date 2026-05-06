"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Persona } from "../lib/personas/types";

const teamColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Executive:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/30",   dot: "bg-amber-400" },
  Finance:     { bg: "bg-emerald-500/10", text: "text-emerald-400",  border: "border-emerald-500/30",  dot: "bg-emerald-400" },
  Growth:      { bg: "bg-blue-500/10",    text: "text-blue-400",     border: "border-blue-500/30",     dot: "bg-blue-400" },
  Industry:    { bg: "bg-orange-500/10",  text: "text-orange-400",    border: "border-orange-500/30",   dot: "bg-orange-400" },
  Brand:       { bg: "bg-pink-500/10",    text: "text-pink-400",     border: "border-pink-500/30",     dot: "bg-pink-400" },
  Future:      { bg: "bg-purple-500/10", text: "text-purple-400",    border: "border-purple-500/30",  dot: "bg-purple-400" },
  Ops:         { bg: "bg-cyan-500/10",    text: "text-cyan-400",     border: "border-cyan-500/30",     dot: "bg-cyan-400" },
  Compliance:  { bg: "bg-red-500/10",     text: "text-red-400",      border: "border-red-500/30",     dot: "bg-red-400" },
  Intelligence:{ bg: "bg-teal-500/10",    text: "text-teal-400",     border: "border-teal-500/30",    dot: "bg-teal-400" },
};

const teams = ["Executive", "Finance", "Growth", "Industry", "Brand", "Future", "Ops", "Compliance", "Intelligence"] as const;
type Team = typeof teams[number];

interface ListField {
  id: string;
  value: string;
}

const emptyList = (count = 0): ListField[] =>
  Array.from({ length: count }, () => ({ id: crypto.randomUUID(), value: "" }));

export default function AgentCreatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AgentCreatorContent />
    </Suspense>
  );
}

function AgentCreatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [team, setTeam] = useState<Team>("Executive");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [goals, setGoals] = useState<ListField[]>(emptyList(3));
  const [dataSources, setDataSources] = useState<ListField[]>(emptyList(2));
  const [tools, setTools] = useState<ListField[]>(emptyList(2));

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  // Handle ?preview= URL param
  useEffect(() => {
    const preview = searchParams.get("preview");
    if (!preview) return;
    try {
      const decoded = JSON.parse(atob(preview));
      if (decoded.description) setDescription(decoded.description);
      if (decoded.name) setName(decoded.name);
      if (decoded.team && teams.includes(decoded.team as Team)) {
        setTeam(decoded.team as Team);
      }
    } catch {
      // ignore malformed preview
    }
  }, [searchParams]);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      setGenerateError("Please enter a description first.");
      return;
    }
    setIsGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, name: name || undefined, team: team || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error || "Generation failed. Please try again.");
        return;
      }
      const agent: Persona = data.agent;
      setName(agent.name || name);
      setTeam((agent.team as Team) || team);
      setDomain(agent.domain || domain);
      setDescription(agent.description || description);
      setSystemPrompt(agent.systemPrompt || systemPrompt);
      setGoals(agent.goals?.length ? agent.goals.map((g) => ({ id: crypto.randomUUID(), value: g })) : goals);
      setDataSources(agent.dataSources?.length ? agent.dataSources.map((d) => ({ id: crypto.randomUUID(), value: d })) : dataSources);
      setTools(agent.tools?.length ? agent.tools.map((t) => ({ id: crypto.randomUUID(), value: t })) : tools);
    } catch {
      setGenerateError("Network error. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [description, name, team, domain, systemPrompt, goals, dataSources, tools]);

  const handleSave = useCallback(async () => {
    if (!name.trim() || !team.trim() || !description.trim() || !systemPrompt.trim()) {
      setSaveError("Please fill in all required fields: name, team, description, and system prompt.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      const agent: Persona = {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agent-" + Date.now(),
        name: name.trim(),
        team: team as Persona["team"],
        domain: domain.trim(),
        description: description.trim(),
        systemPrompt: systemPrompt.trim(),
        goals: goals.map((g) => g.value.trim()).filter(Boolean),
        dataSources: dataSources.map((d) => d.value.trim()).filter(Boolean),
        tools: tools.map((t) => t.value.trim()).filter(Boolean),
        createdAt: Date.now(),
        isDynamic: true,
      };
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Failed to save agent. Please try again.");
        return;
      }
      window.dispatchEvent(new CustomEvent("agents-updated"));
      router.push("/");
    } catch {
      setSaveError("Network error. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  }, [name, team, domain, description, systemPrompt, goals, dataSources, tools, router]);

  const canSave = name.trim() && team.trim() && description.trim() && systemPrompt.trim();

  const colors = teamColors[team] ?? teamColors["Executive"];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur-sm">
        <a
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </a>
        <div className="w-px h-5 bg-white/10" />
        <h1 className="text-lg font-semibold text-white">Agent Creator</h1>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-200
              ${isGenerating
                ? "bg-purple-500/20 text-purple-300 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-500 text-white"
              }
            `}
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate AI
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              transition-all duration-200
              ${canSave && !isSaving
                ? "bg-amber-500 hover:bg-amber-400 text-black"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }
            `}
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Agent
              </>
            )}
          </button>
        </div>
      </header>

      {/* Error banners */}
      {generateError && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          {generateError}
        </div>
      )}
      {saveError && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
          {saveError}
        </div>
      )}

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Agent preview badge */}
        {name && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${colors.bg} border ${colors.border}`}>
            <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
              <span className={`${colors.text} text-sm font-bold`}>{name.charAt(0)}</span>
            </div>
            <div>
              <div className={`text-sm font-semibold ${colors.text}`}>{name}</div>
              <div className="text-xs text-zinc-400">{domain || "No domain set"}</div>
            </div>
            <div className={`ml-auto text-xs ${colors.text} px-2 py-1 rounded-md ${colors.bg} border ${colors.border}`}>
              {team}
            </div>
          </div>
        )}

        {/* Name + Team row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Supply Chain Strategist"
              className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Team <span className="text-red-400">*</span>
            </label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value as Team)}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2372727a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: "16px" }}
            >
              {teams.map((t) => (
                <option key={t} value={t} style={{ background: "#18181b" }}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Domain */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. Procurement & Cost Arbitrage"
            className="w-full px-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe what this agent should do (1-2 sentences)..."
            rows={3}
            className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 transition-colors resize-none"
          />
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-300">
              System Prompt <span className="text-red-400">*</span>
            </label>
            <button
              onClick={() => setShowPromptPreview((v) => !v)}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              {showPromptPreview ? "Edit" : "Preview"}
            </button>
          </div>
          {showPromptPreview ? (
            <div className="px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed min-h-48">
              {systemPrompt || "No system prompt yet. Generate one with AI or write it yourself."}
            </div>
          ) : (
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Write a detailed system prompt (400-800 words) defining the agent's role, responsibilities, tone, and behavior..."
              rows={10}
              className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 transition-colors resize-none font-mono"
            />
          )}
          <div className="text-xs text-zinc-600 text-right">{systemPrompt.length} chars</div>
        </div>

        {/* Goals */}
        <ListFieldSection
          label="Goals"
          hint="3-5 specific objectives this agent should pursue"
          items={goals}
          onChange={setGoals}
          placeholder="e.g. Reduce procurement costs by 15%"
        />

        {/* Data Sources */}
        <ListFieldSection
          label="Data Sources"
          hint="Where this agent gets its information"
          items={dataSources}
          onChange={setDataSources}
          placeholder="e.g. Vendor spreadsheets, GST portal"
        />

        {/* Tools */}
        <ListFieldSection
          label="Tools"
          hint="Capabilities and tools this agent can use"
          items={tools}
          onChange={setTools}
          placeholder="e.g. Web search, Spreadsheet analysis"
        />

      </div>
    </div>
  );
}

// Inline sub-component
interface ListFieldSectionProps {
  label: string;
  hint: string;
  items: ListField[];
  onChange: (items: ListField[]) => void;
  placeholder: string;
}

function ListFieldSection({ label, hint, items, onChange, placeholder }: ListFieldSectionProps) {
  const addItem = () => onChange([...items, { id: crypto.randomUUID(), value: "" }]);
  const removeItem = (id: string) => onChange(items.filter((i) => i.id !== id));
  const updateItem = (id: string, value: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, value } : i)));

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-zinc-300">{label}</label>
        <p className="text-xs text-zinc-600 mt-0.5">{hint}</p>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium ${index < 3 ? "bg-purple-500/20 text-purple-400" : "bg-zinc-800 text-zinc-500"}`}>
              {index + 1}
            </div>
            <input
              type="text"
              value={item.value}
              onChange={(e) => updateItem(item.id, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        className="flex items-center gap-2 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add
      </button>
    </div>
  );
}
