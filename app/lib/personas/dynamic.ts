import { Persona } from "./types";
import { loadAgents } from "./storage";

export async function getDynamicPersonas(): Promise<Persona[]> {
  return loadAgents();
}

export async function getAllPersonas(): Promise<Persona[]> {
  return getDynamicPersonas();
}

export const staticPersonasList: Persona[] = [];
export const allPersonas: Persona[] = [];
