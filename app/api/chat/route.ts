import { NextRequest, NextResponse } from "next/server";
import { generateText } from "../../lib/openrouter";
import { staticPersonasList } from "../../lib/personas/dynamic";
import { getAgent } from "../../lib/personas/storage";

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
      return message
        .replace(/create\s+(an?)\s+agent|new\s+persona|add\s+expert|make\s+(an?)\s+agent|build\s+(an?)\s+agent|i\s+need\s+an?\s+(agent|expert|persona)\s*/gi, "")
        .trim() || message;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [], agentId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Check for create-agent intent
    const domain = detectCreateIntent(message);
    if (domain) {
      const preview = Buffer.from(JSON.stringify({ description: domain })).toString("base64");
      return NextResponse.json({
        response: `I can create an agent for "${domain}". Let me open the creator with this context.`,
        expertUsed: [],
        action: { type: "create_agent", preview },
        timestamp: Date.now(),
      });
    }

    // Find the agent
    let agent = agentId ? await getAgent(agentId) : null;
    if (!agent) {
      agent = staticPersonasList.find((p) => p.id === agentId) ?? null;
    }

    if (!agent) {
      return NextResponse.json({
        response: "Select an AI employee from the sidebar to start chatting. Or describe what you need and I'll create a new agent for you.",
        expertUsed: [],
        timestamp: Date.now(),
      });
    }

    // Build prompt: system + history + user message
    const systemBlock = `SYSTEM: ${agent.systemPrompt}`;
    const historyBlock = (history as { role: string; content: string }[])
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
    const userBlock = `user: ${message}`;

    const fullPrompt = [systemBlock, historyBlock, userBlock]
      .filter(Boolean)
      .join("\n\n");

    const response = await generateText(fullPrompt, {
      temperature: 0.7,
      maxTokens: 2048,
    });

    return NextResponse.json({
      response,
      expertUsed: [agent.name],
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[CEO Chat] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
