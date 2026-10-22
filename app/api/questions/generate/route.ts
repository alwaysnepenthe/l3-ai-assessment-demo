import { modules, questionBank } from "@/lib/course";

export async function POST() {
  return Response.json({ courseVersion: "1.0.0-demo", generated: questionBank.length, modules: modules.length, items: questionBank });
}
