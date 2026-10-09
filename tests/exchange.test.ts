import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { defaultDesign } from "../src/lib/design";
import {
  saveToy,
  finalize,
  pay,
  joinPool,
  runMatching,
  transition,
} from "../src/lib/services";
import type { User } from "../src/generated/prisma/client";
let admin: User,
  users: User[] = [];
const prefix = "test-" + randomUUID();
beforeAll(async () => {
  expect(new URL(process.env.DATABASE_URL!).pathname).toBe("/soultoy_test");
  await db.operationLock.upsert({
    where: { id: "exchange" },
    create: { id: "exchange" },
    update: {},
  });
  admin = await db.user.create({
    data: {
      id: randomUUID(),
      email: prefix + "-admin@test.local",
      name: "Test admin",
      role: "ADMIN",
    },
  });
  for (let i = 0; i < 3; i++)
    users.push(
      await db.user.create({
        data: {
          id: randomUUID(),
          email: prefix + i + "@test.local",
          name: "Creator " + i,
        },
      }),
    );
});
afterAll(async () => {
  await db.$disconnect();
});
describe("persistent complete exchange", () => {
  let toyIds: string[] = [];
  let exchangeId: string;
  it("saves exact configurations with optimistic draft versioning and ownership", async () => {
    for (const [i, u] of users.entries()) {
      const t = await saveToy(u, {
        config: { ...defaultDesign, name: "Test soul " + i },
        secret: "Private kindness " + i,
      });
      toyIds.push(t.id);
      expect(t.design!.config).toEqual({
        ...defaultDesign,
        name: "Test soul " + i,
      });
      await expect(
        saveToy(u, { id: t.id, config: defaultDesign, version: 0 }),
      ).rejects.toThrow("another tab");
    }
    await expect(finalize(users[1], toyIds[0])).rejects.toThrow("not found");
  });
  it("persists finalization, failed/retried payment and rejects unpaid pool entry", async () => {
    for (const [i, u] of users.entries()) {
      await expect(joinPool(u, toyIds[i])).rejects.toThrow();
      await finalize(u, toyIds[i]);
      await expect(joinPool(u, toyIds[i])).rejects.toThrow();
      const failed = await pay(u, toyIds[i], "FAILED");
      expect(failed.status).toBe("FAILED");
      expect((await pay(u, toyIds[i], "PAID")).status).toBe("PAID");
      expect((await pay(u, toyIds[i], "FAILED")).status).toBe("PAID");
    }
    await expect(
      saveToy(users[0], { id: toyIds[0], config: defaultDesign, version: 1 }),
    ).rejects.toThrow("Finalized");
  });
  it("prevents duplicate active entries and creates idempotent entries", async () => {
    for (const [i, u] of users.entries()) {
      const a = await joinPool(u, toyIds[i]);
      const b = await joinPool(u, toyIds[i]);
      expect(a.id).toBe(b.id);
    }
    const extra = await saveToy(users[0], { config: defaultDesign });
    await finalize(users[0], extra.id);
    await pay(users[0], extra.id, "PAID");
    await expect(joinPool(users[0], extra.id)).rejects.toThrow(
      "no other waiting",
    );
  });
  it("serializes simultaneous matching attempts, with no duplicate assignments", async () => {
    const results = await Promise.allSettled([
      runMatching(admin, prefix + "-one"),
      runMatching(admin, prefix + "-two"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const result = results.find((r) => r.status === "fulfilled");
    if (result?.status !== "fulfilled") throw new Error("No exchange");
    exchangeId = result.value.id;
    expect(result.value.matches).toHaveLength(3);
    for (const m of result.value.matches)
      expect(m.senderId).not.toBe(m.recipientId);
    expect(new Set(result.value.matches.map((m) => m.recipientId)).size).toBe(
      3,
    );
    expect(new Set(result.value.matches.map((m) => m.toyId)).size).toBe(3);
    const replay = await runMatching(admin, result.value.requestKey);
    expect(replay.id).toBe(exchangeId);
    expect(await db.match.count({ where: { toyId: { in: toyIds } } })).toBe(3);
  });
  it("enforces admin transitions, recipient-only receipt, collections and completed-round status", async () => {
    const matches = await db.match.findMany({ where: { exchangeId } });
    for (const [i, m] of matches.entries()) {
      await expect(transition(admin, m.id, "DELIVERED")).rejects.toThrow(
        "transition",
      );
      await expect(transition(users[0], m.id, "PRODUCTION")).rejects.toThrow(
        "cannot",
      );
      await transition(admin, m.id, "PRODUCTION");
      await transition(admin, m.id, "SHIPPED");
      await transition(admin, m.id, "DELIVERED");
      await expect(
        transition(
          users.find((u) => u.id === m.senderId)!,
          m.id,
          "RECEIVED",
        ),
      ).rejects.toThrow("cannot");
      const recipient = users.find((u) => u.id === m.recipientId)!;
      await transition(recipient, m.id, "RECEIVED");
      await transition(recipient, m.id, "RECEIVED");
      expect(
        await db.collectionEntry.count({
          where: { matchId: m.id, userId: recipient.id },
        }),
      ).toBe(1);
      if (i < 2)
        expect(
          (await db.exchange.findUniqueOrThrow({ where: { id: exchangeId } }))
            .status,
        ).toBe("ACTIVE");
    }
    expect(
      (await db.exchange.findUniqueOrThrow({ where: { id: exchangeId } }))
        .status,
    ).toBe("COMPLETED");
    expect(
      await db.notification.count({
        where: { userId: users[0].id, type: "COMPLETED" },
      }),
    ).toBe(1);
    expect(
      await db.adminAuditLog.count({ where: { actorId: admin.id } }),
    ).toBeGreaterThanOrEqual(10);
  });
  it("supports another round in the same persistent pool", async () => {
    const ids = [];
    for (const u of users) {
      const t = await saveToy(u, { config: defaultDesign });
      await finalize(u, t.id);
      await pay(u, t.id, "PAID");
      await joinPool(u, t.id);
      ids.push(t.id);
    }
    const round = await runMatching(admin, prefix + "-next");
    expect(round.id).not.toBe(exchangeId);
    expect(round.matches.map((m) => m.toyId).sort()).toEqual(ids.sort());
    for (const m of round.matches) await transition(admin, m.id, "CANCELLED");
    expect(
      (await db.exchange.findUniqueOrThrow({ where: { id: round.id } })).status,
    ).toBe("CANCELLED");
    await expect(joinPool(users[0], ids[0])).rejects.toThrow();
  });
});
