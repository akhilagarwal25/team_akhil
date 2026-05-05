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
