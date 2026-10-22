import { selectAssessment } from "@/lib/course";

export async function POST() {
  return Response.json({ sessionId: crypto.randomUUID(), items: selectAssessment(), startedAt: new Date().toISOString() });
}
