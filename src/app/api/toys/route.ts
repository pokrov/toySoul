import { NextRequest } from "next/server";
import { z } from "zod";
import { actor, body, endpoint } from "@/lib/http";
import { saveToy } from "@/lib/services";
const schema = z.object({
  id: z.string().optional(),
  config: z.unknown(),
  secret: z.string().max(1000).optional(),
  version: z.number().int().optional(),
  preview: z
    .string()
    .max(1200000)
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
    .optional(),
});
export async function POST(req: NextRequest) {
  return endpoint(async () =>
    saveToy(await actor(req), schema.parse(await body(req))),
  );
}
