export type PersonaTeam =
  | "Executive"
  | "Finance"
  | "Growth"
  | "Industry"
  | "Future"
  | "Ops"
  | "Compliance"
  | "Intelligence";

export interface Persona {
  id: string;
  name: string;
  team: PersonaTeam;
  domain: string;
  systemPrompt: string;
  goals: string[];
  dataSources: string[];
  tools: string[];
  description: string;
  isDynamic?: boolean;  // true = loaded from storage, false/undefined = hardcoded
  createdAt?: number;  // Unix timestamp when created
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  expertUsed?: string[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  activePersona: string;
}
