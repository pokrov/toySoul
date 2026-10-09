import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import { db } from "./db";
import { assert, DomainError } from "./rules";
import { ZodError } from "zod";
const limits = new Map<string, { n: number; until: number }>();
export async function actor(req: NextRequest, admin = false) {
  const session = await auth.api.getSession({ headers: req.headers });
  assert(session, "Sign in to continue.", 401);
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  assert(user && !user.suspended, "Account unavailable.", 403);
  if (admin)
    assert(user.role === "ADMIN", "Administrator access required.", 403);
  if (req.method !== "GET") {
    assert(
      req.headers.get("origin") ===
        new URL(process.env.BETTER_AUTH_URL ?? req.url).origin,
      "Invalid request origin.",
      403,
    );
    const now = Date.now(),
      key = `${user.id}:${req.nextUrl.pathname}`;
    if (limits.size > 10000)
      for (const [k, v] of limits) if (v.until < now) limits.delete(k);
    const bucket = limits.get(key);
    if (bucket && bucket.until > now) {
      assert(bucket.n < 90, "Please slow down.", 429);
      bucket.n++;
    } else limits.set(key, { n: 1, until: now + 60000 });
  }
  return user;
}
export async function body(req: NextRequest) {
  const raw = await req.text();
  assert(raw.length < 1500000, "Request too large.", 413);
  return JSON.parse(raw);
}
export async function endpoint(work: () => Promise<unknown>) {
  try {
    return NextResponse.json(await work(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof DomainError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof ZodError)
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input." },
        { status: 400 },
      );
    if (e instanceof SyntaxError)
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      e.code === "P2002"
    )
      return NextResponse.json(
        { error: "This action has already been recorded." },
        { status: 409 },
      );
    console.error(e);
    return NextResponse.json(
      { error: "We could not complete that action. Please try again." },
      { status: 500 },
    );
  }
}
