import { randomBytes, randomInt } from "node:crypto";
import { db } from "./db";
import { Prisma, type User, type MatchStatus } from "@/generated/prisma/client";
import { designSchema, secretSchema } from "./design";
import { assert, canTransition, cycle, eligible } from "./rules";
type Tx = Prisma.TransactionClient;
export const price = () => ({
  creation: Number(process.env.TOY_PRICE_MAD || 149),
  shipping: Number(process.env.SHIPPING_PRICE_MAD || 25),
});
const event = (status: string) => ({ status, at: new Date().toISOString() });
const history = (value: Prisma.JsonValue, status: string) => [
  ...(Array.isArray(value) ? value : []),
  event(status),
];
export async function notify(
  tx: Tx,
  userId: string,
  type: string,
  title: string,
  relatedId?: string,
) {
  await tx.notification.create({
    data: { userId, type, title, message: title, relatedId },
  });
}
export async function audit(
  tx: Tx,
  actorId: string,
  action: string,
  entityId: string,
  details: Prisma.InputJsonValue = {},
) {
  await tx.adminAuditLog.create({
    data: { actorId, action, entityId, details },
  });
}
export async function locked<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.$transaction(
    async (tx) => {
      const lock = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM OperationLock WHERE id = 'exchange' FOR UPDATE`;
      assert(
        lock.length === 1,
        "Database migrations must be applied before using the exchange.",
        503,
      );
      return fn(tx);
    },
    { maxWait: 20000, timeout: 30000, isolationLevel: "ReadCommitted" },
  );
}
async function liveUser(tx: Tx, id: string) {
  const u = await tx.user.findUnique({ where: { id } });
  assert(u && !u.suspended, "Account unavailable.", 403);
  return u;
}
async function owned(tx: Tx, id: string, userId: string) {
  const toy = await tx.toy.findUnique({
    where: { id },
    include: { design: true, payment: true, entry: true, match: true },
  });
  assert(toy && toy.creatorId === userId, "Toy not found.", 404);
  return toy;
}
export async function saveToy(
  user: User,
  input: {
    id?: string;
    config: unknown;
    secret?: string;
    preview?: string;
    version?: number;
  },
) {
  const config = designSchema.parse(input.config),
    secret = secretSchema.parse(input.secret ?? "");
  return locked(async (tx) => {
    await liveUser(tx, user.id);
    if (input.id) {
      const toy = await owned(tx, input.id, user.id);
      assert(toy.status === "DRAFT", "Finalized toys cannot be edited.");
      assert(
        input.version === toy.design?.version,
        "This draft changed in another tab. Reload before saving.",
        409,
      );
      return tx.toy.update({
        where: { id: toy.id },
        data: {
          name: config.name,
          design: { update: { config, version: { increment: 1 } } },
          secret: {
            upsert: { create: { text: secret }, update: { text: secret } },
          },
          ...(input.preview
            ? {
                assets: {
                  deleteMany: { kind: "preview" },
                  create: { kind: "preview", url: input.preview },
                },
              }
            : {}),
        },
        include: { design: true, secret: true },
      });
    }
    return tx.toy.create({
      data: {
        creatorId: user.id,
        name: config.name,
        design: { create: { config } },
        secret: { create: { text: secret } },
        ...(input.preview
          ? { assets: { create: { kind: "preview", url: input.preview } } }
          : {}),
      },
      include: { design: true, secret: true },
    });
  });
}
export async function finalize(user: User, toyId: string) {
  return locked(async (tx) => {
    await liveUser(tx, user.id);
    const toy = await owned(tx, toyId, user.id);
    if (toy.status === "READY") return toy;
    assert(!toy.moderated, "This toy needs moderation review.");
    designSchema.parse(toy.design?.config);
    const updated = await tx.toy.update({
      where: { id: toyId },
      data: {
        status: "READY",
        publicId: `SOUL-${new Date().getUTCFullYear()}-${randomBytes(5).toString("hex").toUpperCase()}`,
      },
    });
    const p = price();
    await tx.payment.create({
      data: {
        toyId,
        userId: user.id,
        amount: p.creation + p.shipping,
        history: [event("PENDING")],
      },
    });
    await notify(
      tx,
      user.id,
      "FINALIZED",
      `${toy.name} is ready to meet the world.`,
      toyId,
    );
    return updated;
  });
}
export async function pay(
  user: User,
  toyId: string,
  status: "PAID" | "FAILED" | "CANCELLED",
) {
  return locked(async (tx) => {
    await liveUser(tx, user.id);
    const toy = await owned(tx, toyId, user.id);
    assert(toy.status === "READY" && toy.payment, "Finalize your toy first.");
    assert(!toy.moderated, "This toy needs moderation review.");
    if (toy.payment.status === "PAID") return toy.payment;
    const payment = await tx.payment.update({
      where: { id: toy.payment.id },
      data: { status, history: history(toy.payment.history, status) },
    });
    if (status === "PAID")
      await notify(
        tx,
        user.id,
        "PAYMENT",
        "Demo payment confirmed. No money was charged.",
        toyId,
      );
    return payment;
  });
}
export async function joinPool(user: User, toyId: string) {
  return locked(async (tx) => {
    const current = await liveUser(tx, user.id);
    const toy = await owned(tx, toyId, user.id);
    if (toy.entry?.status === "WAITING") return toy.entry;
    const active = await tx.exchangePoolEntry.findUnique({
      where: { activeUserId: user.id },
    });
    assert(
      eligible({
        owner: true,
        ready: toy.status === "READY",
        paid: toy.payment?.status === "PAID",
        assigned: !!toy.match,
        active: !!active,
        suspended: current.suspended,
        moderated: toy.moderated,
      }),
      "A paid, finalized toy and no other waiting entry are required.",
    );
    const entry = await tx.exchangePoolEntry.create({
      data: { toyId, userId: user.id, activeUserId: user.id },
    });
    await notify(
      tx,
      user.id,
      "POOL",
      "Your little soul has joined the exchange pool.",
      toyId,
    );
    return entry;
  });
}
export async function runMatching(admin: User, requestKey: string) {
  return locked(async (tx) => {
    const current = await liveUser(tx, admin.id);
    assert(current.role === "ADMIN", "Administrator access required.", 403);
    const existing = await tx.exchange.findUnique({
      where: { requestKey },
      include: { matches: true },
    });
    if (existing) return existing;
    const waiting = await tx.exchangePoolEntry.findMany({
      where: { status: "WAITING" },
      include: { user: true, toy: { include: { payment: true, match: true } } },
      orderBy: { createdAt: "asc" },
    });
    const entries = waiting.filter((e) =>
      eligible({
        owner: e.toy.creatorId === e.userId,
        ready: e.toy.status === "READY",
        paid: e.toy.payment?.status === "PAID",
        assigned: !!e.toy.match,
        active: false,
        suspended: e.user.suspended,
        moderated: e.toy.moderated,
      }),
    );
    assert(
      entries.length >= Math.max(3, Number(process.env.MIN_PARTICIPANTS || 3)),
      "At least three eligible participants are needed.",
    );
    const past = await tx.match.findMany({
      select: { senderId: true, recipientId: true },
    });
    const assignments = cycle(
      entries,
      () => randomInt(0, 1000000) / 1000000,
      new Set(past.map((m) => `${m.senderId}:${m.recipientId}`)),
    );
    const exchange = await tx.exchange.create({ data: { requestKey } });
    for (const assignment of assignments) {
      const match = await tx.match.create({
        data: {
          ...assignment,
          exchangeId: exchange.id,
          history: [event("MATCHED")],
        },
      });
      await tx.exchangePoolEntry.update({
        where: { toyId: assignment.toyId },
        data: { status: "MATCHED", activeUserId: null, matchedAt: new Date() },
      });
      await notify(
        tx,
        assignment.senderId,
        "MATCHED",
        "A new chapter: your soul has found someone.",
        match.id,
      );
      await notify(
        tx,
        assignment.recipientId,
        "MATCHED",
        "Someone made a little soul just for you.",
        match.id,
      );
    }
    await audit(tx, admin.id, "RUN_MATCHING", exchange.id, {
      participants: assignments.length,
    });
    return tx.exchange.findUniqueOrThrow({
      where: { id: exchange.id },
      include: { matches: true },
    });
  });
}
export async function transition(user: User, matchId: string, to: MatchStatus) {
  return locked(async (tx) => {
    const current = await liveUser(tx, user.id);
    const match = await tx.match.findUnique({ where: { id: matchId } });
    assert(match, "Match not found.", 404);
    const recipient = to === "RECEIVED";
    assert(
      recipient ? match.recipientId === user.id : current.role === "ADMIN",
      "You cannot change this delivery.",
      403,
    );
    if (recipient && match.status === "COMPLETED") return match;
    assert(
      canTransition(match.status, to, recipient ? "RECIPIENT" : "ADMIN"),
      "That lifecycle transition is not allowed.",
    );
    let updated = await tx.match.update({
      where: { id: matchId },
      data: { status: to, history: history(match.history, to) },
    });
    if (to === "SHIPPED")
      await tx.shipment.create({
        data: {
          matchId,
          trackingCode: `DEMO-${randomBytes(6).toString("hex").toUpperCase()}`,
        },
      });
    if (recipient) {
      await tx.collectionEntry.create({ data: { matchId, userId: user.id } });
      updated = await tx.match.update({
        where: { id: matchId },
        data: {
          status: "COMPLETED",
          receivedAt: new Date(),
          history: history(updated.history, "COMPLETED"),
        },
      });
      await notify(
        tx,
        user.id,
        "RECEIVED",
        "Something special has arrived. Your secret is unlocked.",
        matchId,
      );
    }
    await notify(
      tx,
      match.senderId,
      to,
      `Your sent soul: ${to.toLowerCase()}.`,
      matchId,
    );
    await notify(
      tx,
      match.recipientId,
      to,
      `Your incoming soul: ${to.toLowerCase()}.`,
      matchId,
    );
    const matches = await tx.match.findMany({
      where: { exchangeId: match.exchangeId },
    });
    if (matches.every((m) => m.status === "COMPLETED")) {
      await tx.exchange.update({
        where: { id: match.exchangeId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      for (const m of matches)
        await notify(
          tx,
          m.recipientId,
          "COMPLETED",
          "Your exchange round is complete. A little more connection in the world.",
          match.exchangeId,
        );
    } else if (
      matches.every((m) => ["COMPLETED", "CANCELLED"].includes(m.status))
    )
      await tx.exchange.update({
        where: { id: match.exchangeId },
        data: { status: "CANCELLED" },
      });
    if (!recipient) await audit(tx, user.id, `MATCH_${to}`, matchId);
    return updated;
  });
}
