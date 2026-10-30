type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: unknown;
};

type ChatCompletionRequest = {
  model?: string;
  messages?: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type?: string };
  [key: string]: unknown;
};

function contentAsText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part: any) => typeof part === "string" ? part : part?.text || part?.content || "")
    .filter(Boolean)
    .join("\n");
}

export function hasAIConfiguration() {
  return Boolean(process.env.ANTHROPIC_AUTH_TOKEN?.trim() || process.env.AI_API_KEY?.trim());
}

/**
 * Keep route handlers on one chat-completion shape while supporting both the
 * existing OpenAI-compatible config and TokenHub's Anthropic Messages config.
 */
export async function createModelCompletion(body: ChatCompletionRequest, timeoutMs = 30000) {
  const anthropicToken = process.env.ANTHROPIC_AUTH_TOKEN?.trim();
  if (anthropicToken) {
    const configuredBase = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/+$/, "");
    const url = /\/v1\/messages$/i.test(configuredBase)
      ? configuredBase
      : /\/v1$/i.test(configuredBase)
        ? `${configuredBase}/messages`
        : `${configuredBase}/v1/messages`;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const system = messages
      .filter((message) => message.role === "system")
      .map((message) => contentAsText(message.content))
      .filter(Boolean);
    if (body.response_format?.type === "json_object") {
      system.push("Return only valid JSON. Do not wrap the JSON in Markdown code fences.");
    }
    const anthropicBody: Record<string, unknown> = {
      model: process.env.ANTHROPIC_MODEL || body.model || "glm-5.3-flash",
      max_tokens: body.max_tokens || 1024,
      messages: messages
        .filter((message) => message.role !== "system")
        .map((message) => ({ role: message.role, content: message.content })),
    };
    if (system.length) anthropicBody.system = system.join("\n\n");

    const response = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicToken,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });
    if (!response.ok) throw new Error(`AI ${response.status}`);
    const data = await response.json() as any;
    const text = Array.isArray(data?.content)
      ? data.content.filter((part: any) => part?.type === "text").map((part: any) => part.text || "").join("\n").trim()
      : "";
    return { choices: [{ message: { content: text } }] };
  }

  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) throw new Error("AI provider is not configured");
  const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const url = /\/chat\/completions$/i.test(base) ? base : `${base}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ ...body, model: process.env.AI_MODEL || body.model }),
  });
  if (!response.ok) throw new Error(`AI ${response.status}`);
  return response.json();
}
