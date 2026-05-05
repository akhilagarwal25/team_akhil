# Agent Creator — Design Spec

**Project:** team_akhil
**Date:** 2026-05-05
**Status:** Approved

## Summary

Add the ability to create new AI agents/personas through an AI-assisted form. Users describe what they need, AI generates the full persona, user edits and saves. Also extends chat so "create an agent for X" triggers the generator.

## Background

Currently 33 personas are hardcoded as TypeScript files. Adding a new persona requires manually creating a file with system prompts, goals, dataSources, and tools. This is friction-heavy for Akhil. The goal is frictionless: describe, generate, save.

## Constraints

- Use OpenRouter API with **paid models only** (1¢–21¢/M tokens range)
- No free models for persona generation
- Default model: `anthropic/claude-3.5-sonnet` (~3¢/M input, ~15¢/M output)
- JSON file persistence (`data/agents.json`) — no database yet
- Must not break existing hardcoded 33 personas

## Design

### 1. Data Model

```typescript
// Extend existing Persona type
interface Persona {
  id: string;          // kebab-case, unique
  name: string;
  team: PersonaTeam;    // Executive | Finance | Growth | Industry | Brand | Future | Ops | Compliance | Intelligence
  domain: string;
  description: string;  // 1-2 sentence summary
  systemPrompt: string; // Full persona instruction set
  goals: string[];      // 3-5 key objectives
  dataSources: string[];
  tools: string[];
  createdAt: number;    // Unix timestamp
  isDynamic: boolean;  // true = from storage, false = hardcoded
}
```

### 2. Storage Layer

**File:** `data/agents.json`
```json
{
  "agents": [
    { /* Persona object */ }
  ]
}
```

**Module:** `app/lib/personas/storage.ts`
- `loadAgents()` — read from JSON, validate, return `Persona[]`
- `saveAgent(agent: Persona)` — append/update to JSON, validate schema
- `deleteAgent(id: string)` — remove from JSON
- `listAgents()` — return all dynamic agents
- `getAgent(id: string)` — return single agent

All functions use `fs` with proper error handling. File created on first write.

### 3. Dynamic Agent Export

**File:** `app/lib/personas/dynamic.ts`
- Loads agents from `storage.ts`
- Merges with static exports from `index.ts`
- Exports `dynamicPersonas: Persona[]` — agents from storage
- Exports `allPersonas: Persona[]` — static + dynamic combined

### 4. OpenRouter Client

**File:** `app/lib/openrouter.ts`
- Config from env: `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL` (defaults to `https://openrouter.ai/api/v1`)
- Helper: `generateText(model, prompt, options?)` → string
- Default model: `anthropic/claude-3.5-sonnet`
- Headers: `Authorization: Bearer ${API_KEY}`, `HTTP-Referer`, `X-Title`
- Timeout: 30s

### 5. Agent Generation API

**Endpoint:** `POST /api/agents/generate`

**Request:**
```json
{
  "description": "string",   // What the agent should do
  "name": "string (optional)", // Suggested name
  "team": "PersonaTeam (optional)"
}
```

**Response:**
```json
{
  "agent": {
    "id": "string",
    "name": "string",
    "team": "PersonaTeam",
    "domain": "string",
    "description": "string",
    "systemPrompt": "string (500-800 words, structured sections)",
    "goals": ["string", "string", "string"],
    "dataSources": ["string", "string"],
    "tools": ["string", "string"],
    "createdAt": number,
    "isDynamic": true
  }
}
```

**Prompt to LLM:**
```
Generate a detailed AI persona for the following request:

[description]

The persona must include:
- A compelling systemPrompt with role definition, operating principles, key responsibilities, tone, and coordination notes
- Exactly 3-5 goals
- 2-4 dataSources (be specific to Indian business context)
- 2-4 tools (practical, actionable)

Return ONLY valid JSON matching this schema. No markdown, no explanation:
{
  "id": "kebab-case-slug-of-name",
  "name": "Display Name",
  "team": "Executive|Finance|Growth|Industry|Brand|Future|Ops|Compliance|Intelligence",
  "domain": "Short domain name",
  "description": "1-2 sentence summary",
  "systemPrompt": "...",
  "goals": ["goal1", "goal2", "goal3"],
  "dataSources": ["source1", "source2"],
  "tools": ["tool1", "tool2"],
  "createdAt": [current unix timestamp],
  "isDynamic": true
}
```

### 6. Agent CRUD API

**`GET /api/agents`** — list all dynamic agents
**`POST /api/agents`** — save a generated agent to storage
**`GET /api/agents/[id]`** — get single agent
**`PUT /api/agents/[id]`** — update agent fields
**`DELETE /api/agents/[id]`** — remove agent

All validate the `Persona` schema before writing. Return 400 for invalid data, 404 for missing.

### 7. Creator Page

**Route:** `/agent-creator`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                     │
│                                                          │
│  Agent Creator                              [Generate AI] │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Describe what this agent should do...               │ │
│  │                                                     │ │
│  │ [Name]        [Team ▼]  [Domain]                    │ │
│  │                                                     │ │
│  │ [Description]                                        │ │
│  │                                                     │ │
│  │ [System Prompt - editable textarea]                 │ │
│  │                                                     │ │
│  │ Goals:        Data Sources:       Tools:             │ │
│  │ • [goal 1]    • [source 1]       • [tool 1]         │ │
│  │ • [goal 2]    • [source 2]       • [tool 2]        │ │
│  │ + Add         + Add              + Add              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  [Preview System Prompt]          [Save Agent]           │
└─────────────────────────────────────────────────────────┘
```

**Behavior:**
- All fields editable after generation
- "Generate AI" calls `/api/agents/generate` and populates fields
- "Save Agent" calls `POST /api/agents` and redirects to dashboard
- Agent appears in sidebar under its team immediately
- URL param `?preview=<base64-json>` pre-fills form from chat trigger

### 8. Chat Integration

**File:** `app/api/chat/route.ts` — extend existing stub

Detect intent via keyword match: "create agent", "new persona", "add expert", "make an agent"

**On intent detected:**
1. Extract domain from message (everything after intent keywords)
2. Call `generateText()` to create a brief persona summary
3. Return response with "Review & Save" action pointing to `/agent-creator?preview=...`

```json
{
  "response": "Creating your agent...",
  "expertUsed": [],
  "generatedAgent": { /* full persona object */ },
  "action": {
    "type": "create_agent",
    "preview": "base64-encoded-agent-json"
  }
}
```

**On normal message:** call real AI (future: connect to CEO persona backend)

### 9. Dashboard Sidebar Integration

**File:** `app/(dashboard)/page.tsx`

- Replace static `personas` array with import from `lib/personas/dynamic.ts`
- `allPersonas` includes 33 static + N dynamic agents
- Dynamic agents show a subtle indicator (e.g., small edit icon on hover)
- Click on dynamic agent → chat with that persona directly

### 10. Environment Variables

**`.env.local`:**
```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

## Implementation Order

1. OpenRouter client (`lib/openrouter.ts`)
2. Storage layer (`lib/personas/storage.ts`, `data/agents.json`)
3. Dynamic export (`lib/personas/dynamic.ts`)
4. Agent generation API (`api/agents/generate`)
5. Agent CRUD API (`api/agents/route.ts`, `api/agents/[id]/route.ts`)
6. Creator page (`agent-creator/page.tsx`)
7. Dashboard integration (swap static → dynamic personas)
8. Chat extension (intent detection + preview action)
9. `.env.local` setup + docs

## Files to Create

| Path | Action |
|------|--------|
| `app/lib/openrouter.ts` | Create |
| `app/lib/personas/storage.ts` | Create |
| `app/lib/personas/dynamic.ts` | Create |
| `data/agents.json` | Create (empty) |
| `app/api/agents/route.ts` | Create |
| `app/api/agents/[id]/route.ts` | Create |
| `app/api/agents/generate/route.ts` | Create |
| `app/agent-creator/page.tsx` | Create |
| `app/(dashboard)/page.tsx` | Modify |
| `app/api/chat/route.ts` | Modify |
| `app/lib/personas/types.ts` | Modify (add `isDynamic`) |
| `.env.local` | Create |
| `package.json` | Modify (add `openai` SDK) |
