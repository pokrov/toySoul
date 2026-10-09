import { NextRequest } from "next/server";
import { actor, body, endpoint } from "@/lib/http";
import { generate } from "@/lib/generator";
export async function POST(req: NextRequest) {
  return endpoint(async () => {
    await actor(req);
    return generate(await body(req));
  });
}
