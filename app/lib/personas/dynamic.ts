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
