import { NextRequest, NextResponse } from "next/server";
import { listAgents, saveAgent } from "../../lib/personas/storage";
import { Persona } from "../../lib/personas/types";
import { getAllPersonas } from "../../lib/personas/dynamic";

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
    const agents = await getAllPersonas();
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
