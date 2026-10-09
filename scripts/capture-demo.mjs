import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("docs/screenshots", { recursive: true });
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.goto("http://localhost:3000");
  await page.locator("canvas[data-toy-canvas]").waitFor({ state: "visible" });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: "docs/screenshots/home-desktop.png",
    fullPage: true,
  });
  await page.goto("http://localhost:3000/studio");
  await page
    .getByLabel("Describe the toy you imagine")
    .fill("A dreamy purple bunny who collects stars");
  await page.getByRole("button", { name: "Generate My Soul" }).click();
  await page
    .getByRole("button", { name: "Customize This Toy" })
    .first()
    .click();
  await page.locator("canvas[data-toy-canvas]").waitFor({ state: "visible" });
  await page.waitForTimeout(700);
  await page.screenshot({
    path: "docs/screenshots/studio-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/studio-mobile.png",
    fullPage: true,
  });
  console.log("Saved desktop homepage and desktop/mobile studio screenshots.");
} finally {
  await browser.close();
}
