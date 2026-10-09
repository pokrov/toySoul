import { describe, it, expect } from "vitest";
import { designSchema, defaultDesign, localGenerate } from "../src/lib/design";
import { cycle, canTransition, eligible } from "../src/lib/rules";
describe("design generation and validation", () => {
  it("reproduces three bounded concepts and interprets features", () => {
    const input = {
      prompt: "A shy purple bunny with glasses",
      mood: "Dreamy" as const,
    };
    const concepts = localGenerate(input);
    expect(concepts).toEqual(localGenerate(input));
    expect(concepts).toHaveLength(3);
    for (const c of concepts) {
      expect(designSchema.safeParse(c).success).toBe(true);
      expect(c.accessory).toBe("glasses");
      expect(c.ears).toBe("long");
      expect(c.archetype).toBe("bunny");
    }
    expect(concepts[0].primaryColor).toBe("#B7A0DB");
  });
  it("rejects unsupported features, invalid colors, long text and abusive names", () => {
    expect(
      designSchema.safeParse({ ...defaultDesign, ears: "tentacles" }).success,
    ).toBe(false);
    expect(
      designSchema.safeParse({ ...defaultDesign, primaryColor: "red" }).success,
    ).toBe(false);
    expect(
      designSchema.safeParse({ ...defaultDesign, story: "a".repeat(801) })
        .success,
    ).toBe(false);
    expect(
      designSchema.safeParse({ ...defaultDesign, name: "kill yourself" })
        .success,
    ).toBe(false);
  });
});
describe("eligibility", () => {
  const valid = {
    owner: true,
    ready: true,
    paid: true,
    assigned: false,
    active: false,
    suspended: false,
    moderated: false,
  };
  it("requires ownership, finalized design and payment", () => {
    expect(eligible(valid)).toBe(true);
    for (const field of ["owner", "ready", "paid"])
      expect(eligible({ ...valid, [field]: false })).toBe(false);
  });
  it("rejects duplicate entries, assignments, suspended users and held content", () => {
    for (const field of ["assigned", "active", "suspended", "moderated"])
      expect(eligible({ ...valid, [field]: true })).toBe(false);
  });
});
describe("cyclic matching", () => {
  for (const n of [3, 4, 6, 25])
    it("assigns " + n + " users once without self or reciprocal pairs", () => {
      const entries = Array.from({ length: n }, (_, i) => ({
        userId: "u" + i,
        toyId: "t" + i,
      }));
      for (let run = 0; run < 25; run++) {
        const m = cycle(entries);
        expect(new Set(m.map((a) => a.toyId)).size).toBe(n);
        expect(new Set(m.map((a) => a.recipientId)).size).toBe(n);
        expect(new Set(m.map((a) => a.senderId)).size).toBe(n);
        for (const a of m) {
          expect(a.senderId).not.toBe(a.recipientId);
          expect(
            m.some(
              (b) =>
                b.senderId === a.recipientId && b.recipientId === a.senderId,
            ),
          ).toBe(false);
        }
      }
    });
  it("rejects too few participants and duplicates", () => {
    expect(() =>
      cycle([
        { userId: "a", toyId: "a" },
        { userId: "b", toyId: "b" },
      ]),
    ).toThrow();
    expect(() =>
      cycle([
        { userId: "a", toyId: "a" },
        { userId: "a", toyId: "b" },
        { userId: "c", toyId: "c" },
      ]),
    ).toThrow("Duplicate participant");
    expect(() =>
      cycle([
        { userId: "a", toyId: "a" },
        { userId: "b", toyId: "a" },
        { userId: "c", toyId: "c" },
      ]),
    ).toThrow("Duplicate toy");
  });
  it("avoids past pairs where a new cycle exists", () => {
    let seed = 31;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const entries = Array.from({ length: 5 }, (_, i) => ({
      userId: "u" + i,
      toyId: "t" + i,
    }));
    const past = new Set(
      cycle(entries, rng).map((m) => m.senderId + ":" + m.recipientId),
    );
    expect(
      cycle(entries, rng, past).every(
        (m) => !past.has(m.senderId + ":" + m.recipientId),
      ),
    ).toBe(true);
  });
});
describe("lifecycle authorization", () => {
  it("allows only admin production and shipping sequence", () => {
    expect(canTransition("MATCHED", "PRODUCTION", "ADMIN")).toBe(true);
    expect(canTransition("PRODUCTION", "SHIPPED", "ADMIN")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED", "ADMIN")).toBe(true);
    expect(canTransition("MATCHED", "DELIVERED", "ADMIN")).toBe(false);
    expect(canTransition("DELIVERED", "RECEIVED", "ADMIN")).toBe(false);
  });
  it("reserves receipt for the recipient and limits cancellation", () => {
    expect(canTransition("DELIVERED", "RECEIVED", "RECIPIENT")).toBe(true);
    expect(canTransition("SHIPPED", "RECEIVED", "RECIPIENT")).toBe(false);
    expect(canTransition("MATCHED", "CANCELLED", "ADMIN")).toBe(true);
    expect(canTransition("SHIPPED", "CANCELLED", "ADMIN")).toBe(false);
  });
});
