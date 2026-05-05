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
