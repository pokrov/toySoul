import { NextRequest } from "next/server";
import { z } from "zod";
import { actor, body, endpoint } from "@/lib/http";
import { db } from "@/lib/db";
import { assert } from "@/lib/rules";
import { runMatching, locked, audit } from "@/lib/services";
export async function GET(req: NextRequest) {
  return endpoint(async () => {
    await actor(req, true);
    const [users, toys, payments, pool, exchanges, logs, notifications] =
      await Promise.all([
        db.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            suspended: true,
            _count: { select: { toys: true, sent: true, received: true } },
          },
        }),
        db.toy.findMany({
          include: {
            creator: { select: { name: true } },
            design: true,
            secret: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        db.payment.findMany({
          include: { toy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        }),
        db.exchangePoolEntry.findMany({
          where: { status: "WAITING" },
          include: {
            user: { select: { name: true, suspended: true } },
            toy: { include: { payment: true, match: true } },
          },
        }),
        db.exchange.findMany({
          include: {
            matches: {
              include: {
                sender: { select: { name: true } },
                recipient: { select: { name: true } },
                toy: { select: { name: true } },
                shipment: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        db.adminAuditLog.findMany({
          include: { actor: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      ]);
    return { users, toys, payments, pool, exchanges, logs, notifications };
  });
}
export async function POST(req: NextRequest) {
  return endpoint(async () => {
    const u = await actor(req, true);
    const data = z
      .discriminatedUnion("action", [
        z.object({
          action: z.literal("match"),
          requestKey: z.string().min(8).max(100),
        }),
        z.object({
          action: z.literal("suspend"),
          id: z.string(),
          value: z.boolean(),
        }),
        z.object({
          action: z.literal("moderate"),
          id: z.string(),
          value: z.boolean(),
          name: z.string().min(1).max(60).optional(),
          story: z.string().max(800).optional(),
          secret: z.string().max(1000).optional(),
        }),
      ])
      .parse(await body(req));
    if (data.action === "match") return runMatching(u, data.requestKey);
    return locked(async (tx) => {
      if (data.action === "suspend") {
        assert(data.id !== u.id, "You cannot suspend your own account.");
        const target = await tx.user.findUnique({ where: { id: data.id } });
        assert(
          target?.role === "USER",
          "Only participant accounts can be suspended.",
        );
        await tx.user.update({
          where: { id: data.id },
          data: { suspended: data.value },
        });
        if (data.value)
          await tx.session.deleteMany({ where: { userId: data.id } });
      } else {
        const toy = await tx.toy.findUniqueOrThrow({
          where: { id: data.id },
          include: { design: true },
        });
        await tx.toy.update({
          where: { id: data.id },
          data: {
            moderated: data.value,
            ...(data.name ? { name: data.name } : {}),
            ...(data.secret !== undefined
              ? { secret: { update: { text: data.secret } } }
              : {}),
          },
        });
        if (data.story !== undefined || data.name)
          await tx.toyDesign.update({
            where: { toyId: data.id },
            data: {
              config: {
                ...(toy.design?.config as object),
                ...(data.story !== undefined ? { story: data.story } : {}),
                ...(data.name ? { name: data.name } : {}),
              },
              version: { increment: 1 },
            },
          });
      }
      await audit(tx, u.id, data.action, data.id, {
        value: data.value,
        fields:
          data.action === "moderate"
            ? ["name", "story", "secret"].filter((key) => key in data)
            : ["suspended"],
      });
      return { ok: true };
    });
  });
}
