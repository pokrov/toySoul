import { NextRequest } from "next/server";
import { z } from "zod";
import { actor, body, endpoint } from "@/lib/http";
import { db } from "@/lib/db";
import { assert } from "@/lib/rules";
import { finalize, pay, joinPool } from "@/lib/services";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return endpoint(async () => {
    const u = await actor(req);
    const { id } = await params;
    const toy = await db.toy.findUnique({
      where: { id },
      include: { design: true, secret: true, payment: true, entry: true },
    });
    assert(toy && toy.creatorId === u.id, "Toy not found.", 404);
    return toy;
  });
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return endpoint(async () => {
    const u = await actor(req),
      { id } = await params;
    const data = z
      .object({
        action: z.enum(["finalize", "pay", "join"]),
        status: z.enum(["PAID", "FAILED", "CANCELLED"]).optional(),
      })
      .parse(await body(req));
    if (data.action === "finalize") return finalize(u, id);
    if (data.action === "join") return joinPool(u, id);
    return pay(u, id, data.status ?? "PAID");
  });
}
