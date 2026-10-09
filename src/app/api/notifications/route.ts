import { NextRequest } from "next/server";
import { z } from "zod";
import { actor, body, endpoint } from "@/lib/http";
import { db } from "@/lib/db";
export async function GET(req: NextRequest) {
  return endpoint(async () => {
    const u = await actor(req);
    return db.notification.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  });
}
export async function POST(req: NextRequest) {
  return endpoint(async () => {
    const u = await actor(req);
    const data = z.object({ id: z.string().optional() }).parse(await body(req));
    return db.notification.updateMany({
      where: { userId: u.id, ...(data.id ? { id: data.id } : {}) },
      data: { read: true },
    });
  });
}
