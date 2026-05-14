import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway";

export const ASSISTANT_MODES = {
  chat: {
    label: "Chat",
    system:
      "You are Aria, a friendly and capable workplace AI assistant. Help with general workplace questions clearly and concisely. Use markdown formatting.",
  },
  email: {
    label: "Email",
    system:
      "You are Aria, an expert workplace email writer. Draft professional, clear, and appropriately-toned emails. Always include a subject line, greeting, body, and sign-off. Ask one quick clarifying question if critical info is missing, otherwise produce the draft. Use markdown.",
  },
  meeting: {
    label: "Meeting Summary",
    system:
      "You are Aria, an expert meeting summarizer. Given raw notes or a transcript, produce: 1) a 2-3 sentence TL;DR, 2) Key Decisions, 3) Action Items (with owner if mentioned), 4) Open Questions. Use markdown headings and bullet lists. If the user has not yet pasted notes, ask them to.",
  },
  tasks: {
    label: "Task Planning",
    system:
      "You are Aria, a workplace task planner. Break the user's goal into a prioritized, actionable plan. For each task list: title, owner (if applicable), estimated effort, and dependencies. End with a suggested timeline. Use markdown checklists.",
  },
  research: {
    label: "Research",
    system:
      "You are Aria, a research assistant. Provide structured, balanced summaries on the topic. Include: Overview, Key Points, Considerations / Trade-offs, and Suggested Next Steps. Be transparent that you cannot browse the live web — base answers on general knowledge and clearly flag uncertainty. Use markdown.",
  },
} as const;

export type AssistantMode = keyof typeof ASSISTANT_MODES;

const ETHICS_NOTE =
  "Use AI responsibly: do not fabricate facts, flag uncertainty, avoid sensitive personal data, and remind the user to verify critical outputs before sending or acting on them.";

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        message: z.string().min(1).max(8000),
        mode: z.enum(["chat", "email", "meeting", "tasks", "research"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    // Persist user message
    const { error: userErr } = await supabase.from("messages").insert({
      user_id: userId,
      role: "user",
      content: data.message,
      mode: data.mode,
    });
    if (userErr) throw new Error(userErr.message);

    // Load recent history for context
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(40);

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const modeConfig = ASSISTANT_MODES[data.mode];

    try {
      const { text } = await generateText({
        model,
        system: `${modeConfig.system}\n\n${ETHICS_NOTE}`,
        messages: (history ?? []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });

      const { error: aErr } = await supabase.from("messages").insert({
        user_id: userId,
        role: "assistant",
        content: text,
        mode: data.mode,
      });
      if (aErr) throw new Error(aErr.message);

      return { reply: text };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI request failed";
      // Surface gateway errors clearly
      if (msg.includes("429"))
        throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (msg.includes("402"))
        throw new Error("AI credits exhausted. Add credits in workspace settings.");
      throw new Error(msg);
    }
  });

export const clearHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("messages").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
