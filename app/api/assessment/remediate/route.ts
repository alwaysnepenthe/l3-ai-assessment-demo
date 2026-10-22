import { questionBank } from "@/lib/course";

export async function POST(request: Request) {
  const { moduleId, previousItemId } = await request.json() as { moduleId: string; previousItemId?: string };
  const candidates = questionBank.filter((q) => q.moduleId === moduleId && q.id !== previousItemId);
  const item = candidates.find((q) => q.level === "understand") || candidates[0];
  return Response.json({ item });
}
