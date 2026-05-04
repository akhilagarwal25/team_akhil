import { NextRequest, NextResponse } from "next/server";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Phase 1: Echo response. Swappable for real AI later.
    // The CEO is "under construction" — we log the message for now.
    console.log(`[CEO Chat] Message received: ${message.substring(0, 100)}...`);

    const response = {
      response:
        "CEO Advisor is under construction. I'm being built to coordinate all 28 domain experts on your behalf. Stand by — I'll be fully operational soon. In the meantime, tell me what you'd like to work on and I'll route it to the right expert persona.",
      expertUsed: [] as string[],
      timestamp: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[CEO Chat] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
