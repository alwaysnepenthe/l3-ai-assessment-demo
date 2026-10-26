import { createDefaultManifest } from "@/lib/course-content";

export async function GET() {
  return Response.json(createDefaultManifest());
}

