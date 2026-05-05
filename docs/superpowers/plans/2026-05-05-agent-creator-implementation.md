# Agent Creator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI-powered agent creator to team_akhil — describe an agent, OpenRouter generates it, user saves it to persistent storage.

**Architecture:** OpenRouter API client for AI generation, JSON file persistence, dynamic agent loading merged with static personas, creator form page + chat extension.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, OpenRouter API, `openai` SDK (for OpenRouter compatibility), JSON file storage.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add `openai` SDK |
| `.env.local` | Create | API keys + model config |
| `app/lib/openrouter.ts` | Create | OpenRouter API client |
| `app/lib/personas/storage.ts` | Create | JSON read/write agents |
| `app/lib/personas/dynamic.ts` | Create | Merge static + dynamic agents |
| `data/agents.json` | Create | Persisted agent storage |
| `app/lib/personas/types.ts` | Modify | Add `isDynamic`, `createdAt` fields |
| `app/api/agents/generate/route.ts` | Create | AI generate persona |
| `app/api/agents/route.ts` | Create | CRUD list/save agents |
| `app/api/agents/[id]/route.ts` | Create | GET/PUT/DELETE single agent |
| `app/agent-creator/page.tsx` | Create | Creator form UI |
| `app/(dashboard)/page.tsx` | Modify | Swap static → dynamic personas |
| `app/api/chat/route.ts` | Modify | Detect create-agent intent |

---

## Task 1: Project Setup

**Files:**
- Modify: `package.json`
- Create: `.env.local`

### Prerequisites

Read these files first:
- `package.json` — current dependencies
- `app/lib/personas/types.ts` — existing Persona interface

### Steps

- [ ] **Step 1: Install `openai` SDK**

Run in `D:/team_akhil/`:
```
npm install openai
```
Expected: `openai` added to dependencies in `package.json`

- [ ] **Step 2: Create `.env.local`**

File: `D:/team_akhil/.env.local`
```
# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

- [ ] **Step 3: Create empty `data/agents.json`**

File: `D:/team_akhil/data/agents.json`
```json
{
  "agents": []
}
```

- [ ] **Step 4: Commit**

```
git add package.json package-lock.json .env.local data/agents.json
git commit -m "feat: add openai SDK and env config for OpenRouter

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: OpenRouter Client

**Files:**
- Create: `app/lib/openrouter.ts`

### Prerequisites

Read: `.env.local` (for env var names)

### Steps

- [ ] **Step 1: Create OpenRouter client module**

File: `D:/team_akhil/app/lib/openrouter.ts`
```typescript
import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const defaultModel = process.env.OPENROUTER_DEFAULT_MODEL ?? "anthropic/claude-3.5-sonnet";

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY is not set in environment variables");
}

export const openrouter = new OpenAI({
  apiKey,
  baseURL,
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_SITE_NAME ?? "Team Akhil",
  },
  timeout: 30_000,
});

export const DEFAULT_MODEL = defaultModel;

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 2048 } = options;

  const response = await openrouter.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature,
    max_tokens: maxTokens,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content returned from OpenRouter");
  }

  return content;
}

export async function generateJSON<T = unknown>(
  prompt: string,
  options: GenerateOptions = {}
): Promise<T> {
  const text = await generateText(prompt, { ...options, temperature: 0.3 });
  // Strip markdown code blocks if present
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned) as T;
}
```

- [ ] **Step 2: Commit**

```
git add app/lib/openrouter.ts
git commit -m "feat: add OpenRouter client for AI generation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Storage Layer

**Files:**
- Create: `app/lib/personas/storage.ts`

### Prerequisites

Read first:
- `app/lib/personas/types.ts` — Persona interface

### Steps

- [ ] **Step 1: Create storage module**

File: `D:/team_akhil/app/lib/personas/storage.ts`
```typescript
import { promises as fs } from "fs";
import path from "path";
import { Persona } from "./types";

const STORAGE_PATH = path.join(process.cwd(), "data", "agents.json");

export async function ensureStorageFile(): Promise<void> {
  try {
    await fs.access(STORAGE_PATH);
  } catch {
    await fs.mkdir(path.dirname(STORAGE_PATH), { recursive: true });
    await fs.writeFile(STORAGE_PATH, JSON.stringify({ agents: [] }, null, 2));
  }
}

export async function loadAgents(): Promise<Persona[]> {
  await ensureStorageFile();
  const raw = await fs.readFile(STORAGE_PATH, "utf-8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.agents)) {
    return [];
  }
  return data.agents as Persona[];
}

export async function saveAgent(agent: Persona): Promise<void> {
  const agents = await loadAgents();
  const existingIndex = agents.findIndex((a) => a.id === agent.id);
  if (existingIndex >= 0) {
    agents[existingIndex] = agent;
  } else {
    agents.push(agent);
  }
  await fs.writeFile(STORAGE_PATH, JSON.stringify({ agents }, null, 2));
}

export async function deleteAgent(id: string): Promise<boolean> {
  const agents = await loadAgents();
  const filtered = agents.filter((a) => a.id !== id);
  if (filtered.length === agents.length) {
    return false;
  }
  await fs.writeFile(STORAGE_PATH, JSON.stringify({ agents: filtered }, null, 2));
  return true;
}

export async function getAgent(id: string): Promise<Persona | null> {
  const agents = await loadAgents();
  return agents.find((a) => a.id === id) ?? null;
}

export async function listAgents(): Promise<Persona[]> {
  return loadAgents();
}
```

- [ ] **Step 2: Commit**

```
git add app/lib/personas/storage.ts
git commit -m "feat: add persona storage layer for dynamic agents

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Types & Dynamic Export

**Files:**
- Modify: `app/lib/personas/types.ts` — add `isDynamic`, `createdAt`
- Create: `app/lib/personas/dynamic.ts` — merge static + dynamic

### Prerequisites

Read first:
- `app/lib/personas/types.ts`
- `app/lib/personas/index.ts`

### Steps

- [ ] **Step 1: Extend Persona type**

File: `D:/team_akhil/app/lib/personas/types.ts`

Add these fields to the `Persona` interface:
```typescript
  isDynamic?: boolean;   // true = loaded from storage, false/undefined = hardcoded
  createdAt?: number;   // Unix timestamp when created
```

- [ ] **Step 2: Create dynamic export**

File: `D:/team_akhil/app/lib/personas/dynamic.ts`
```typescript
import { Persona } from "./types";
import { loadAgents } from "./storage";

// Import all static personas
import * as staticPersonas from "./index";

// Static personas all have isDynamic = false (implicit)
export const staticPersonasList: Persona[] = Object.values(staticPersonas) as Persona[];

// Load dynamic (stored) agents
export async function getDynamicPersonas(): Promise<Persona[]> {
  return loadAgents();
}

// Merge both sources
export async function getAllPersonas(): Promise<Persona[]> {
  const [staticList, dynamicList] = await Promise.all([
    Promise.resolve(staticPersonasList),
    getDynamicPersonas(),
  ]);
  return [...staticList, ...dynamicList];
}

// For client-side: just return static list (server provides dynamic via API)
// This avoids importing storage (fs) on the client
export { staticPersonasList as allPersonas };
```

- [ ] **Step 3: Commit**

```
git add app/lib/personas/types.ts app/lib/personas/dynamic.ts
git commit -m "feat: add dynamic persona loading, merge static + stored agents

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Agent Generate API

**Files:**
- Create: `app/api/agents/generate/route.ts`

### Prerequisites

Read first:
- `app/lib/personas/types.ts` — Persona interface
- `app/lib/openrouter.ts` — generateJSON function
- `docs/superpowers/specs/2026-05-05-agent-creator-design.md` — generation prompt

### Steps

- [ ] **Step 1: Create generate API route**

File: `D:/team_akhil/app/api/agents/generate/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/openrouter";
import { Persona } from "@/lib/personas/types";

interface GenerateRequest {
  description: string;
  name?: string;
  team?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { description, name, team } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 }
      );
    }

    const prompt = `You are a world-class AI persona designer. Generate a detailed AI agent persona for the following request:

REQUEST: ${description}
${name ? `SUGGESTED NAME: ${name}` : ""}
${team ? `TEAM: ${team}` : ""}

Generate a compelling, well-structured persona that would help Akhil Agarwal with this area. The persona should be specific to the Indian business context (FMCG, retail, delivery, digital platforms) and aligned with the 5-6 CR/year goal.

Return ONLY valid JSON matching this exact schema. No markdown, no explanation, no code fences:

{
  "id": "kebab-case-slug-of-name",
  "name": "Display Name",
  "team": "Executive|Finance|Growth|Industry|Brand|Future|Ops|Compliance|Intelligence",
  "domain": "Short domain descriptor",
  "description": "1-2 sentence summary of what this agent does",
  "systemPrompt": "A detailed system prompt (400-800 words) with: role definition, operating principles, key responsibilities, tone guidelines, coordination notes with other personas. Written in the style of a senior expert advisor — confident, direct, Hindi-English vernacular acceptable.",
  "goals": ["specific goal 1", "specific goal 2", "specific goal 3"],
  "dataSources": ["specific data source 1", "specific data source 2"],
  "tools": ["specific tool 1", "specific tool 2"],
  "createdAt": ${Date.now()},
  "isDynamic": true
}

Respond with ONLY the JSON object.`;

    const agent = await generateJSON<Persona>(prompt, {
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Basic validation
    if (!agent.id || !agent.name || !agent.systemPrompt || !agent.team) {
      return NextResponse.json(
        { error: "Generated persona is missing required fields" },
        { status: 500 }
      );
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("[Agent Generate] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```
git add app/api/agents/generate/route.ts
git commit -m "feat: add agent generation API with OpenRouter

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Agent CRUD API

**Files:**
- Create: `app/api/agents/route.ts`
- Create: `app/api/agents/[id]/route.ts`

### Prerequisites

Read first:
- `app/lib/personas/types.ts`
- `app/lib/personas/storage.ts`

### Steps

- [ ] **Step 1: Create main agents route**

File: `D:/team_akhil/app/api/agents/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import { listAgents, saveAgent } from "@/lib/personas/storage";
import { Persona } from "@/lib/personas/types";

function validatePersona(data: unknown): data is Persona {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.team === "string" &&
    typeof d.domain === "string" &&
    typeof d.description === "string" &&
    typeof d.systemPrompt === "string" &&
    Array.isArray(d.goals) &&
    Array.isArray(d.dataSources) &&
    Array.isArray(d.tools)
  );
}

export async function GET() {
  try {
    const agents = await listAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error("[Agents GET] Error:", error);
    return NextResponse.json({ error: "Failed to list agents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!validatePersona(body)) {
      return NextResponse.json({ error: "Invalid agent data" }, { status: 400 });
    }
    await saveAgent(body);
    return NextResponse.json({ agent: body }, { status: 201 });
  } catch (error) {
    console.error("[Agents POST] Error:", error);
    return NextResponse.json({ error: "Failed to save agent" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create single agent route**

File: `D:/team_akhil/app/api/agents/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAgent, deleteAgent, saveAgent } from "@/lib/personas/storage";
import { Persona } from "@/lib/personas/types";

function validatePersona(data: unknown): data is Persona {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.team === "string" &&
    typeof d.domain === "string" &&
    typeof d.description === "string" &&
    typeof d.systemPrompt === "string" &&
    Array.isArray(d.goals) &&
    Array.isArray(d.dataSources) &&
    Array.isArray(d.tools)
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  return NextResponse.json({ agent });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  if (!validatePersona(body)) {
    return NextResponse.json({ error: "Invalid agent data" }, { status: 400 });
  }
  if (body.id !== id) {
    return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
  }
  await saveAgent(body);
  return NextResponse.json({ agent: body });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteAgent(id);
  if (!deleted) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Commit**

```
git add app/api/agents/route.ts app/api/agents/[id]/route.ts
git commit -m "feat: add agent CRUD API endpoints

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Creator Page

**Files:**
- Create: `app/agent-creator/page.tsx`

### Prerequisites

Read first:
- `app/(dashboard)/page.tsx` — existing UI patterns, colors, team colors
- `app/lib/personas/types.ts` — Persona interface

### Steps

- [ ] **Step 1: Create the agent creator page**

File: `D:/team_akhil/app/agent-creator/page.tsx`

This is a complex UI component. See the design spec for the layout. Key sections:

1. **Header** — "Agent Creator" title, link back to dashboard
2. **Description Input** — Large textarea: "What should this agent do?"
3. **Generate Button** — Calls `POST /api/agents/generate`
4. **Form Fields** — All editable: name, team (dropdown), domain, description, systemPrompt (textarea), goals (editable list), dataSources (editable list), tools (editable list)
5. **Preview** — Shows formatted systemPrompt
6. **Save Button** — Calls `POST /api/agents`, redirects to dashboard

Use the same team colors from `app/(dashboard)/page.tsx`. Copy the `teamColors` object.

For the dynamic list fields (goals, dataSources, tools): render as a list with an "Add" button and individual delete buttons per item.

Use Next.js `useRouter` to redirect to `/` after save.

Handle loading state during generation.

- [ ] **Step 2: Commit**

```
git add app/agent-creator/page.tsx
git commit -m "feat: add agent creator page UI

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Dashboard Integration

**Files:**
- Modify: `app/(dashboard)/page.tsx`

### Prerequisites

Read first:
- `app/(dashboard)/page.tsx` — current implementation
- `app/lib/personas/dynamic.ts` — exported functions

### Steps

- [ ] **Step 1: Swap static personas for dynamic load**

In `app/(dashboard)/page.tsx`:

1. Add `'use client'` + `useEffect` to load dynamic agents
2. Create state: `const [dynamicAgents, setDynamicAgents] = useState<Persona[]>([])`
3. On mount: `fetch('/api/agents').then(r => r.json()).then(d => setDynamicAgents(d.agents))`
4. Merge: `const allPersonas = [...staticPersonasList, ...dynamicAgents]`
5. Use `allPersonas` for the sidebar group rendering

Keep the existing `personas` array as fallback during loading.

The `useEffect` should also listen for a custom event `agents-updated` (fired after save) to refresh:
```typescript
useEffect(() => {
  const refresh = () => fetch('/api/agents').then(r => r.json()).then(d => setDynamicAgents(d.agents));
  window.addEventListener('agents-updated', refresh);
  return () => window.removeEventListener('agents-updated', refresh);
}, []);
```

- [ ] **Step 2: Fire event after save**

In `app/agent-creator/page.tsx`, after successful save:
```typescript
window.dispatchEvent(new CustomEvent('agents-updated'));
```

- [ ] **Step 3: Add "Create Agent" button to dashboard**

In the header area, add a small button:
```tsx
<button
  onClick={() => router.push('/agent-creator')}
  className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-medium transition-colors"
>
  + Create Agent
</button>
```

- [ ] **Step 4: Commit**

```
git add app/\(dashboard\)/page.tsx app/agent-creator/page.tsx
git commit -m "feat: integrate dynamic agents into dashboard sidebar

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Chat Integration

**Files:**
- Modify: `app/api/chat/route.ts`

### Prerequisites

Read first:
- `app/api/chat/route.ts` — current stub
- `app/lib/openrouter.ts`

### Steps

- [ ] **Step 1: Extend chat route for create-agent intent**

File: `D:/team_akhil/app/api/chat/route.ts`

Replace the current stub. Detect intent and handle:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/openrouter";
import { Persona } from "@/lib/personas/types";

const CREATE_AGENT_PATTERNS = [
  /create\s+(an?)\s+agent/i,
  /new\s+persona/i,
  /add\s+expert/i,
  /make\s+(an?)\s+agent/i,
  /build\s+(an?)\s+agent/i,
  /i\s+need\s+an?\s+(agent|expert|persona)/i,
];

function detectCreateIntent(message: string): string | null {
  for (const pattern of CREATE_AGENT_PATTERNS) {
    if (pattern.test(message)) {
      // Extract the domain/description
      return message.replace(/create\s+(an?)\s+agent|new\s+persona|add\s+expert|make\s+(an?)\s+agent|build\s+(an?)\s+agent|i\s+need\s+an?\s+(agent|expert|persona)\s*/gi, "").trim() || message;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Check for create-agent intent
    const domain = detectCreateIntent(message);
    if (domain) {
      const prompt = `Generate a brief AI persona summary (just name, team, domain, description — 2-3 sentences max) for an agent that: ${domain}. Return ONLY valid JSON: {"name": "...", "team": "...", "domain": "...", "description": "..."}. Team must be one of: Executive, Finance, Growth, Industry, Brand, Future, Ops, Compliance, Intelligence.`;

      try {
        const summary = await generateJSON<{ name: string; team: string; domain: string; description: string }>(prompt, {
          temperature: 0.7,
          maxTokens: 300,
        });

        const preview = Buffer.from(JSON.stringify({ description: domain, name: summary.name, team: summary.team })).toString("base64");

        return NextResponse.json({
          response: `I can create an agent for "${summary.domain || domain}". Here's what I have in mind:\n\n**${summary.name}** (${summary.team} Team)\n${summary.description}\n\nClick below to open the full creator with this context pre-filled.`,
          expertUsed: [],
          action: {
            type: "create_agent",
            preview,
            suggestedName: summary.name,
            suggestedTeam: summary.team,
          },
          timestamp: Date.now(),
        });
      } catch {
        // Fallback if generation fails
        const preview = Buffer.from(JSON.stringify({ description: domain })).toString("base64");
        return NextResponse.json({
          response: `I can create an agent for "${domain}". Let me open the creator with this context.`,
          expertUsed: [],
          action: {
            type: "create_agent",
            preview,
          },
          timestamp: Date.now(),
        });
      }
    }

    // Normal chat — CEO under construction stub
    console.log(`[CEO Chat] Message received: ${message.substring(0, 100)}...`);

    return NextResponse.json({
      response: "CEO Advisor is under construction. I'm being built to coordinate all 28 domain experts on your behalf. Stand by — I'll be fully operational soon.",
      expertUsed: [],
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[CEO Chat] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```
git add app/api/chat/route.ts
git commit -m "feat: detect create-agent intent in chat, trigger creator

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Verify & Test

### Prerequisites

Read first:
- `docs/superpowers/specs/2026-05-05-agent-creator-design.md` — verify all requirements met
- `.env.local` — ensure API key is set

### Steps

- [ ] **Step 1: Install dependencies and build**

Run:
```
npm install
npm run build
```
Expected: No TypeScript errors, successful build

- [ ] **Step 2: Manual smoke test**

Start dev server:
```
npm run dev
```

Test these flows:
1. Navigate to `/agent-creator` — page loads
2. Enter "negotiate with raw material suppliers" and click Generate — AI generates a persona
3. Edit fields if needed, click Save — redirects to dashboard
4. New agent appears in sidebar under correct team
5. In dashboard, type "create an agent for real estate investments" — chat shows create-agent response
6. Click the action button — opens `/agent-creator?preview=...` with pre-filled data

- [ ] **Step 3: Run lint**

```
npm run lint
```
Expected: No errors

- [ ] **Step 4: Commit all remaining changes**

```
git add -A
git commit -m "feat: agent creator — full implementation complete

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
