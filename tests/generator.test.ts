import { afterEach, describe, expect, it, vi } from "vitest";
import { generate } from "../src/lib/generator";
import { defaultDesign, designSchema } from "../src/lib/design";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function external() {
  vi.stubEnv("AI_BASE_URL", "https://provider.invalid/v1");
  vi.stubEnv("AI_API_KEY", "fake-test-key");
  vi.stubEnv("AI_MODEL", "test-model");
}
describe("external concept adapter", () => {
  it("uses the labelled local engine without credentials", async () => {
    vi.stubEnv("AI_API_KEY", "");
    const result = await generate({
      prompt: "a sleepy mint creature",
      mood: "Dreamy",
    });
    expect(result.provider).toContain("no AI model");
    expect(result.concepts).toHaveLength(3);
  });
  it("maps unsupported attributes to supported local defaults", async () => {
    external();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    concepts: Array.from({ length: 3 }, () => ({
                      ...defaultDesign,
                      ears: "antennae",
                      name: "Provider Soul",
                    })),
                  }),
                },
              },
            ],
          }),
        }),
    );
    const result = await generate({ prompt: "a tiny robot", mood: "Cute" });
    expect(result.provider).toBe("External AI provider");
    expect(result.concepts[0].name).toBe("Provider Soul");
    for (const c of result.concepts) {
      expect(designSchema.safeParse(c).success).toBe(true);
      expect(c.ears).not.toBe("antennae");
    }
  });
  it("falls back on provider errors and malformed output", async () => {
    external();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network failure")),
    );
    const result = await generate({
      prompt: "a moon creature",
      mood: "Dreamy",
    });
    expect(result.provider).toContain("fallback");
    expect(result.concepts).toHaveLength(3);
  });
  it("rejects abusive prompts before invoking a provider", async () => {
    external();
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      generate({ prompt: "kill yourself", mood: "Dreamy" }),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
