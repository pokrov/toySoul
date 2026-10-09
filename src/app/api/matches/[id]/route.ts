import { NextRequest } from "next/server";
import { z } from "zod";
import { actor, body, endpoint } from "@/lib/http";
import { transition } from "@/lib/services";
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return endpoint(async () => {
    const u = await actor(req),
      { id } = await params;
    const data = z
      .object({
        status: z.enum([
          "PRODUCTION",
          "SHIPPED",
          "DELIVERED",
          "RECEIVED",
          "CANCELLED",
        ]),
      })
      .parse(await body(req));
    return transition(u, id, data.status);
  });
}
