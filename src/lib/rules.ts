export class DomainError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function assert(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new DomainError(message, status);
}
export const lifecycle = [
  "MATCHED",
  "PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "RECEIVED",
  "COMPLETED",
] as const;
export function canTransition(
  from: string,
  to: string,
  actor: "ADMIN" | "RECIPIENT",
) {
  if (actor === "RECIPIENT") return from === "DELIVERED" && to === "RECEIVED";
  if (to === "CANCELLED") return ["MATCHED", "PRODUCTION"].includes(from);
  return (
    (from === "MATCHED" && to === "PRODUCTION") ||
    (from === "PRODUCTION" && to === "SHIPPED") ||
    (from === "SHIPPED" && to === "DELIVERED")
  );
}
export function eligible(v: {
  owner: boolean;
  ready: boolean;
  paid: boolean;
  assigned: boolean;
  active: boolean;
  suspended: boolean;
  moderated?: boolean;
}) {
  return (
    v.owner &&
    v.ready &&
    v.paid &&
    !v.assigned &&
    !v.active &&
    !v.suspended &&
    !v.moderated
  );
}
export function cycle<T extends { userId: string; toyId: string }>(
  entries: T[],
  random: () => number = Math.random,
  previous: Set<string> = new Set(),
) {
  assert(entries.length >= 3, "At least three participants are required.");
  assert(
    new Set(entries.map((e) => e.userId)).size === entries.length,
    "Duplicate participant.",
  );
  assert(
    new Set(entries.map((e) => e.toyId)).size === entries.length,
    "Duplicate toy.",
  );
  let best: { toyId: string; senderId: string; recipientId: string }[] = [];
  let bestScore = Infinity;
  for (let attempt = 0; attempt < 80; attempt++) {
    const shuffled = [...entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const matches = shuffled.map((e, i) => ({
      toyId: e.toyId,
      senderId: e.userId,
      recipientId: shuffled[(i + 1) % shuffled.length].userId,
    }));
    const score = matches.filter((m) =>
      previous.has(`${m.senderId}:${m.recipientId}`),
    ).length;
    if (score < bestScore) {
      best = matches;
      bestScore = score;
    }
    if (score === 0) break;
  }
  return best;
}
