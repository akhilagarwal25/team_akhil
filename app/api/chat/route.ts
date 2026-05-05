import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/openrouter";

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
      // Extract the domain/description - remove the trigger phrase
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
    const { message } = body;

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
