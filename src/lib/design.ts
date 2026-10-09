import { z } from "zod";
export const moods = [
  "Dreamy",
  "Mysterious",
  "Cute",
  "Mischievous",
  "Melancholic",
  "Cosmic",
  "Playful",
  "Magical",
] as const;
export const palette = [
  "#B7A0DB",
  "#F2A18B",
  "#A8CABB",
  "#E9C86C",
  "#9DBADB",
  "#E9DDD0",
  "#616875",
];
const cleanText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (s) => !/\b(kill yourself|heil hitler|nigger)\b/i.test(s),
      "Please choose kinder words.",
    );
export const designSchema = z.object({
  name: cleanText(60).min(1),
  archetype: z.enum([
    "forest-creature",
    "bunny",
    "monster",
    "robot",
    "astronaut",
  ]),
  bodyShape: z.enum(["round", "pear", "bean"]),
  primaryColor: z.string().regex(/^#[\da-f]{6}$/i),
  secondaryColor: z.string().regex(/^#[\da-f]{6}$/i),
  finish: z.enum(["matte", "satin", "gloss"]),
  eyeStyle: z.enum(["round", "sleepy", "happy", "star"]),
  eyeColor: z.string().regex(/^#[\da-f]{6}$/i),
  mouthStyle: z.enum(["smile", "tiny", "surprised"]),
  eyebrows: z.boolean(),
  ears: z.enum(["none", "round", "long"]),
  horns: z.enum(["none", "tiny", "curved"]),
  tail: z.enum(["none", "puff", "long"]),
  pattern: z.enum(["none", "spots", "belly"]),
  accessory: z.enum([
    "none",
    "glasses",
    "hat",
    "scarf",
    "moon-necklace",
    "backpack",
    "wings",
    "helmet",
    "flower",
  ]),
  mood: z.enum(moods),
  personality: cleanText(200),
  story: cleanText(800),
  seed: z.number().int().nonnegative(),
});
export type Design = z.infer<typeof designSchema>;
export const secretSchema = cleanText(1000);
export const generationSchema = z.object({
  prompt: cleanText(600).min(3),
  mood: z.enum(moods).default("Dreamy"),
  color: z
    .string()
    .regex(/^#[\da-f]{6}$/i)
    .optional(),
});
export const defaultDesign: Design = {
  name: "Moonwhisp",
  archetype: "forest-creature",
  bodyShape: "pear",
  primaryColor: palette[0],
  secondaryColor: "#EAE0F5",
  finish: "satin",
  eyeStyle: "sleepy",
  eyeColor: "#2E2938",
  mouthStyle: "tiny",
  eyebrows: false,
  ears: "long",
  horns: "none",
  tail: "puff",
  pattern: "belly",
  accessory: "moon-necklace",
  mood: "Dreamy",
  personality: "A quiet dreamer with a very big heart.",
  story:
    "A little soul who collects fallen stars and returns them to the night sky.",
  seed: 42,
};
export function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function localGenerate(
  input: z.infer<typeof generationSchema>,
): Design[] {
  const { prompt, mood, color } = generationSchema.parse(input);
  const p = prompt.toLowerCase();
  const seed = hash(`${p}|${mood}|${color ?? ""}`);
  const archetype: Design["archetype"] = /robot/.test(p)
    ? "robot"
    : /astronaut|space/.test(p)
      ? "astronaut"
      : /bunny|rabbit/.test(p)
        ? "bunny"
        : /monster|horn/.test(p)
          ? "monster"
          : "forest-creature";
  const primary =
    color ??
    (/purple|lavender/.test(p)
      ? palette[0]
      : /orange|coral/.test(p)
        ? palette[1]
        : /mint|green|forest/.test(p)
          ? palette[2]
          : /yellow|sun/.test(p)
            ? palette[3]
            : /blue|rain/.test(p)
              ? palette[4]
              : palette[seed % palette.length]);
  const names =
    archetype === "robot"
      ? ["Pip-01", "Milo-9", "Little Orbit"]
      : archetype === "monster"
        ? ["Momo", "Bramble", "Nubbin"]
        : ["Moonwhisp", "Lumi", "Mossling"];
  return names.map((name, i) =>
    designSchema.parse({
      ...defaultDesign,
      name,
      archetype,
      seed: seed + i,
      mood,
      primaryColor: i === 2 ? palette[(seed + 2) % palette.length] : primary,
      bodyShape: (["pear", "round", "bean"] as const)[i],
      eyeStyle: /sleep|shy|lonely|melanch/.test(p)
        ? "sleepy"
        : i === 1
          ? "happy"
          : "round",
      ears:
        archetype === "bunny"
          ? "long"
          : archetype === "robot"
            ? "none"
            : i === 1
              ? "round"
              : "long",
      horns: /horn|monster/.test(p) ? "tiny" : "none",
      accessory: /glasses/.test(p)
        ? "glasses"
        : /flower/.test(p)
          ? "flower"
          : archetype === "astronaut"
            ? "helmet"
            : /moon|star|cosmic/.test(p)
              ? "moon-necklace"
              : i === 1
                ? "scarf"
                : "none",
      personality: `${mood}, curious, and always looking for a friend.`,
      story: `${name} is a tiny ${archetype.replace("-", " ")} who finds wonder in the things everyone else walks past. A pocket-sized companion for your next chapter.`,
    }),
  );
}
