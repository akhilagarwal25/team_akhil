import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "../../../lib/openrouter";
import { Persona } from "../../../lib/personas/types";

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
