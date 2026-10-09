import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { DashboardData } from "../src/lib/types";
const base = "http://localhost:3001";
const url = new URL(process.env.TEST_DATABASE_URL!);
const db = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 4,
  }),
});
const password = "SoulTest-" + randomUUID();
let adminEmail: string;
test.beforeAll(async () => {
  await db.operationLock.upsert({
    where: { id: "exchange" },
    create: { id: "exchange" },
    update: {},
  });
  const id = randomUUID();
  adminEmail = "admin-" + id + "@e2e.local";
  await db.user.create({
    data: {
      id,
      email: adminEmail,
      name: "Test Keeper",
      role: "ADMIN",
      emailVerified: true,
      accounts: {
        create: {
          id: randomUUID(),
          providerId: "credential",
          accountId: id,
          password: await hashPassword(password),
        },
      },
    },
  });
});
test.afterAll(async () => {
  await db.$disconnect();
});
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
}
test("three creators → paid souls → concurrent matching → deliveries → permanent collections", async ({
  browser,
}) => {
  const contexts: BrowserContext[] = [],
    pages: Page[] = [],
    users: string[] = [],
    toys: string[] = [];
  const stamp = Date.now();
  try {
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext({
        baseURL: base,
        reducedMotion: "reduce",
      });
      contexts.push(context);
      const page = await context.newPage();
      pages.push(page);
      await page.goto("/login");
      await page
        .getByRole("button", { name: "Create an account", exact: true })
        .click();
      await page.getByLabel("Your creator name").fill("Dreamer " + i);
      await page
        .getByLabel("Email", { exact: true })
        .fill("dreamer-" + stamp + "-" + i + "@e2e.local");
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Create account", exact: true })
        .click();
      await expect(page).toHaveURL(/dashboard/);
      await page.goto("/studio");
      await page
        .getByLabel("Describe the toy you imagine")
        .fill("A lonely purple creature that collects stars");
      await page.getByRole("button", { name: "Generate My Soul" }).click();
      await page
        .getByRole("button", { name: "Customize This Toy" })
        .nth(i)
        .click();
      await expect(page.locator("canvas[data-toy-canvas]")).toBeVisible();
      await page.getByRole("tab", { name: "Identity", exact: true }).click();
      await page.getByLabel("Toy name", { exact: true }).fill("Lumi " + i);
      await page
        .getByLabel("Secret message")
        .fill("Private kindness for recipient " + i);
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveText("All changes saved");
      if (i === 0) {
        await page.getByRole("tab", { name: "Body", exact: true }).click();
        await page.getByRole("button", { name: "bean", exact: true }).click();
        await page.getByRole("button", { name: "Undo", exact: true }).click();
        await page.getByRole("button", { name: "Redo", exact: true }).click();
        await page.screenshot({ path: "test-results/studio-desktop.png" });
      }
      await page.getByRole("button", { name: "Finalize", exact: true }).click();
      await expect(page).toHaveURL(/checkout/);
      if (i === 0) {
        await page
          .getByRole("button", { name: "Simulate Failed Payment", exact: true })
          .click();
        await expect(page.getByText("Simulated payment failed.")).toBeVisible();
      }
      await page
        .getByRole("button", {
          name: "Simulate Successful Payment",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", { name: "Enter the Exchange Pool" })
        .click();
      await expect(page).toHaveURL(/dashboard/);
      await expect(
        page.getByText("IN THE EXCHANGE POOL", { exact: true }),
      ).toBeVisible();
      const data = (await (
        await context.request.get("/api/dashboard")
      ).json()) as DashboardData;
      users.push(data.user.id);
      toys.push(data.toys[0].id);
    }
    // Privacy and ownership checks through authenticated HTTP sessions.
    expect(
      (await contexts[1].request.get("/api/toys/" + toys[0])).status(),
    ).toBe(404);
    expect((await contexts[0].request.get("/api/admin")).status()).toBe(403);
    expect(
      (
        await contexts[0].request.post("/api/toys/" + toys[0], {
          headers: { Origin: "https://attacker.invalid" },
          data: { action: "join" },
        })
      ).status(),
    ).toBe(403);
    const adminContext = await browser.newContext({ baseURL: base });
    contexts.push(adminContext);
    const admin = await adminContext.newPage();
    await login(admin, adminEmail);
    await admin.goto("/admin");
    await admin
      .getByRole("button", { name: "Exchange Pool", exact: true })
      .click();
    await admin
      .getByRole("button", { name: "Run Matching", exact: true })
      .click();
    await expect(admin.getByRole("status")).toContainText(
      "Matching round created",
    );
    const matches = await db.match.findMany({ where: { toyId: { in: toys } } });
    expect(matches).toHaveLength(3);
    expect(new Set(matches.map((m) => m.recipientId)).size).toBe(3);
    expect(new Set(matches.map((m) => m.toyId)).size).toBe(3);
    for (const m of matches) expect(m.senderId).not.toBe(m.recipientId);
    const replayKey = (
      await db.exchange.findUniqueOrThrow({
        where: { id: matches[0].exchangeId },
      })
    ).requestKey;
    const replay = await Promise.all([
      adminContext.request.post("/api/admin", {
        headers: { Origin: base },
        data: { action: "match", requestKey: replayKey },
      }),
      adminContext.request.post("/api/admin", {
        headers: { Origin: base },
        data: { action: "match", requestKey: replayKey },
      }),
    ]);
    for (const r of replay) {
      expect(r.ok()).toBe(true);
      expect((await r.json()).id).toBe(matches[0].exchangeId);
    }
    for (let i = 0; i < 3; i++) {
      const payload = (await (
        await contexts[i].request.get("/api/dashboard")
      ).json()) as DashboardData;
      const serialized = JSON.stringify(payload.incoming);
      expect(serialized).not.toContain("Lumi");
      expect(serialized).not.toContain("Private kindness");
      expect(serialized).not.toContain("senderId");
      expect(payload.incoming).toHaveLength(1);
      const t = await db.toy.findUniqueOrThrow({
        where: { id: matches.find((m) => m.recipientId === users[i])!.toyId },
      });
      const response = await contexts[i].request.get("/toy/" + t.publicId);
      expect(await response.text()).not.toContain("Private kindness");
    }
    await admin.getByRole("button", { name: "Shipments", exact: true }).click();
    const round = admin.locator(".admin-round").filter({
      hasText: "Round " + matches[0].exchangeId.slice(-7).toUpperCase(),
    });
    for (const m of matches) {
      const row = round
        .locator(".admin-match")
        .filter({ hasText: "Lumi " + toys.indexOf(m.toyId) + " ·" });
      await row
        .getByRole("button", { name: "Start production", exact: true })
        .click();
      await expect(
        row.getByRole("button", { name: "Simulate shipping", exact: true }),
      ).toBeEnabled();
      await row
        .getByRole("button", { name: "Simulate shipping", exact: true })
        .click();
      await expect(
        row.getByRole("button", { name: "Simulate delivery", exact: true }),
      ).toBeEnabled();
      await row
        .getByRole("button", { name: "Simulate delivery", exact: true })
        .click();
      await expect(
        row.getByText("Awaiting recipient confirmation"),
      ).toBeVisible();
    }
    for (let i = 0; i < 3; i++) {
      await pages[i].goto("/dashboard");
      await pages[i].getByRole("tab", { name: "Incoming Mystery" }).click();
      await pages[i]
        .getByRole("link", { name: "Confirm receipt & reveal" })
        .click();
      await pages[i]
        .getByRole("button", { name: "Confirm receipt & open my soul" })
        .click();
      await expect(
        pages[i].getByText("Private kindness for recipient", { exact: false }),
      ).toBeVisible();
      if (i === 0)
        await pages[i].screenshot({ path: "test-results/reveal-desktop.png" });
      await pages[i]
        .getByRole("link", { name: "Add to My Collection" })
        .click();
      await pages[i]
        .getByRole("tab", { name: "My Collection", exact: true })
        .click();
      await expect(
        pages[i].getByRole("link", { name: "Revisit the reveal" }),
      ).toHaveCount(1);
      const data = (await (
        await contexts[i].request.get("/api/dashboard")
      ).json()) as DashboardData;
      expect(data.collection).toHaveLength(1);
      expect(data.collection[0].match.toy.id).not.toBe(toys[i]);
      expect(data.notifications.some((n) => n.type === "RECEIVED")).toBe(true);
    }
    expect(
      (
        await db.exchange.findUniqueOrThrow({
          where: { id: matches[0].exchangeId },
        })
      ).status,
    ).toBe("COMPLETED");
  } finally {
    for (const context of contexts) await context.close();
  }
});
test("landing and studio remain usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Create a little soul",
  );
  await expect(page.locator("canvas[data-toy-canvas]")).toBeVisible();
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "Create Your Toy", exact: true })
    .click();
  await page
    .getByLabel("Describe the toy you imagine")
    .fill("A mint forest creature");
  await page.getByRole("button", { name: "Generate My Soul" }).click();
  await page
    .getByRole("button", { name: "Customize This Toy" })
    .first()
    .click();
  await page.getByRole("tab", { name: "Accessories" }).click();
  await page.getByRole("button", { name: "glasses", exact: true }).click();
  await page.screenshot({
    path: "test-results/studio-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("a guest concept survives sign-up, draft reload and preview export", async ({
  page,
}) => {
  await page.goto("/studio");
  await page
    .getByLabel("Describe the toy you imagine")
    .fill("A mint forest creature carrying a flower");
  await page.getByRole("button", { name: "Generate My Soul" }).click();
  await page
    .getByRole("button", { name: "Customize This Toy" })
    .first()
    .click();
  await page.getByRole("tab", { name: "Identity", exact: true }).click();
  await page.getByLabel("Toy name", { exact: true }).fill("Pocket Sage");
  await page
    .getByLabel("Secret message")
    .fill("Keep a little room for wonder.");
  await page.getByRole("link", { name: "Sign in to save" }).click();
  await page
    .getByRole("button", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Your creator name").fill("Guest Dreamer");
  await page
    .getByLabel("Email", { exact: true })
    .fill("guest-" + Date.now() + "@e2e.local");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pocket Sage", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("All changes saved");
  await expect(page).toHaveURL(/studio\?id=/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Pocket Sage", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Identity", exact: true }).click();
  await expect(page.getByLabel("Secret message")).toHaveValue(
    "Keep a little room for wonder.",
  );
  await expect(page.locator("canvas[data-toy-canvas]")).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export preview", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("Pocket Sage.png");
});
