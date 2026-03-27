import { query } from "@anthropic-ai/claude-agent-sdk";

export async function generateTitle(messages: Array<{ role: string; text: string }>): Promise<string> {
  try {
    const preview = messages.slice(0, 4).map((m) => `${m.role}: ${m.text.slice(0, 200)}`).join("\n");

    const q = query({
      prompt: `Generate a short conversation title (max 30 chars, no quotes) for:\n\n${preview}`,
      options: { model: "claude-haiku-4-5", maxTurns: 1 },
    });

    for await (const msg of q) {
      if (msg.type === "result") return msg.result.trim().slice(0, 50);
    }
    return "New Conversation";
  } catch {
    return "New Conversation";
  }
}
