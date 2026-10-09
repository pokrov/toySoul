"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Sparkles,
  Undo2,
  Redo2,
  RotateCcw,
  Shuffle,
  Download,
  Rotate3D,
  Pause,
  Play,
  Check,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import {
  defaultDesign,
  localGenerate,
  moods,
  palette,
  type Design,
} from "@/lib/design";
import { useStudio } from "@/lib/studio-store";
import { api, message } from "@/lib/client";
import { authClient } from "@/lib/auth-client";
import { ToyPortrait } from "@/components/toy-portrait";
const ToyCanvas = dynamic(
  () => import("@/components/toy-model").then((m) => m.ToyCanvas),
  { ssr: false },
);
type SavedToy = {
  id: string;
  status: string;
  design: { config: Design; version: number };
  secret?: { text: string };
};
const examples = [
  "A shy purple forest creature who loves the moon.",
  "A mischievous orange monster with oversized glasses.",
  "A dreamy astronaut bunny.",
  "A sleepy mint creature inspired by rainy afternoons.",
  "A tiny robot carrying a flower.",
];
function Studio() {
  const { data: session } = authClient.useSession(),
    params = useSearchParams(),
    router = useRouter();
  const requestedId = params.get("id");
  const state = useStudio();
  const { config, secret, change, setSecret } = state;
  const [mode, setMode] = useState<"imagine" | "concepts" | "edit">(
      requestedId ? "edit" : "imagine",
    ),
    [prompt, setPrompt] = useState(""),
    [mood, setMood] = useState<Design["mood"]>("Dreamy"),
    [color, setColor] = useState<string>(),
    [concepts, setConcepts] = useState<Design[]>([]),
    [provider, setProvider] = useState(""),
    [tab, setTab] = useState("Body");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saveLabel, setSaveLabel] = useState("Not saved yet"),
    [ready, setReady] = useState(!requestedId),
    [resetKey, setResetKey] = useState(0),
    [rotate, setRotate] = useState(false),
    [reduce, setReduce] = useState(false);
  const prefersReduced = useReducedMotion();
  const idRef = useRef<string | undefined>(requestedId ?? undefined),
    version = useRef<number | undefined>(undefined),
    lastSaved = useRef(""),
    saving = useRef<Promise<SavedToy> | null>(null),
    mounted = useRef(true),
    finalizing = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!requestedId) {
      if (params.get("resume") === "1") {
        try {
          const draft = JSON.parse(
            sessionStorage.getItem("soultoy-guest") ?? "null",
          );
          if (draft) {
            useStudio.getState().load(draft.config, draft.secret);
            setMode("edit");
            return;
          }
        } catch {
          /* An invalid browser draft falls back to a fresh design. */
        }
      }
      useStudio.getState().load(defaultDesign);
      return;
    }
    if (idRef.current === requestedId && version.current !== undefined) return;
    api<SavedToy>("/api/toys/" + requestedId)
      .then((t) => {
        if (t.status !== "DRAFT") {
          router.replace("/checkout/" + t.id);
          return;
        }
        state.load(t.design.config, t.secret?.text);
        version.current = t.design.version;
        lastSaved.current = JSON.stringify({
          config: t.design.config,
          secret: t.secret?.text ?? "",
        });
        setSaveLabel("All changes saved");
        setReady(true);
      })
      .catch((e) => setError(message(e)));
  }, [requestedId]); // eslint-disable-line react-hooks/exhaustive-deps
  async function persist(preview?: string): Promise<SavedToy> {
    if (saving.current) await saving.current;
    const current = useStudio.getState();
    const snapshot = JSON.stringify({
      config: current.config,
      secret: current.secret,
    });
    setSaveLabel("Saving…");
    const promise = api<SavedToy>("/api/toys", {
      id: idRef.current,
      version: version.current,
      config: current.config,
      secret: current.secret,
      preview,
    });
    saving.current = promise;
    try {
      const result = await promise;
      const first = !idRef.current;
      idRef.current = result.id;
      version.current = result.design.version;
      lastSaved.current = snapshot;
      if (mounted.current) {
        setSaveLabel("All changes saved");
        if (first)
          window.history.replaceState(null, "", "/studio?id=" + result.id);
      }
      sessionStorage.removeItem("soultoy-guest");
      return result;
    } catch (e) {
      if (mounted.current) setSaveLabel("Save failed — retry");
      throw e;
    } finally {
      if (saving.current === promise) saving.current = null;
    }
  }
  useEffect(() => {
    if (mode !== "edit" || !ready || !session || finalizing.current) return;
    const snapshot = JSON.stringify({ config, secret });
    if (snapshot === lastSaved.current) return;
    setSaveLabel("Unsaved changes");
    const timer = setTimeout(() => {
      if (!finalizing.current) persist().catch((e) => setError(message(e)));
    }, 1200);
    return () => clearTimeout(timer);
  }, [config, secret, mode, ready, session]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mode === "edit" && !session)
      sessionStorage.setItem(
        "soultoy-guest",
        JSON.stringify({ config, secret }),
      );
  }, [config, secret, mode, session]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (
        mode === "edit" &&
        JSON.stringify({ config, secret }) !== lastSaved.current
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [config, secret, mode]);
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const result = session
        ? await api<{ concepts: Design[]; provider: string }>("/api/generate", {
            prompt,
            mood,
            color,
          })
        : {
            concepts: localGenerate({ prompt, mood, color }),
            provider: "Local concept engine · deterministic, no AI model",
          };
      setConcepts(result.concepts);
      setProvider(result.provider);
      setMode("concepts");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const preview = () => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      "canvas[data-toy-canvas]",
    );
    if (!canvas) return undefined;
    const small = document.createElement("canvas");
    small.width = 600;
    small.height = Math.round((600 * canvas.height) / canvas.width);
    small.getContext("2d")?.drawImage(canvas, 0, 0, small.width, small.height);
    return small.toDataURL("image/png");
  };
  const options = <K extends keyof Design>(key: K, values: Design[K][]) => (
    <div className="option-grid">
      {values.map((value) => (
        <button
          key={String(value)}
          className={config[key] === value ? "selected" : ""}
          onClick={() => change({ [key]: value })}
        >
          {String(value).replaceAll("-", " ")}
        </button>
      ))}
    </div>
  );
  const group = (label: string, children: React.ReactNode) => (
    <div className="control-group">
      <span className="label">{label}</span>
      {children}
    </div>
  );
  const colors = (key: "primaryColor" | "secondaryColor" | "eyeColor") => (
    <div className="swatches">
      {palette.map((c) => (
        <button
          aria-label={key + " " + c}
          key={c}
          className={"swatch " + (config[key] === c ? "selected" : "")}
          style={{ background: c }}
          onClick={() => change({ [key]: c })}
        />
      ))}
      <input
        aria-label={"Custom " + key}
        className="color-input"
        type="color"
        value={config[key]}
        onChange={(e) => change({ [key]: e.target.value })}
      />
    </div>
  );
  if (mode === "imagine" || mode === "concepts")
    return (
      <div className="studio-intro">
        <span className="eyebrow">
          THE SOULTOY STUDIO · A PLAYGROUND FOR YOUR IMAGINATION
        </span>
        <h1>
          What’s your <em>little soul</em> like?
        </h1>
        <p>Start with a feeling. We’ll help you give it a face.</p>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {mode === "imagine" ? (
          <>
            <div className="studio-prompt">
              <label className="label" htmlFor="prompt">
                Describe the toy you imagine…
              </label>
              <textarea
                id="prompt"
                className="field"
                value={prompt}
                maxLength={600}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A lonely little purple creature that collects stars…"
              />
              <div className="mood-chips">
                {moods.map((m) => (
                  <button
                    className={"chip " + (mood === m ? "selected" : "")}
                    key={m}
                    onClick={() => setMood(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="prompt-bottom">
                <div className="swatches">
                  <span className="muted" style={{ fontSize: 10 }}>
                    A color feeling
                  </span>
                  {palette.slice(0, 5).map((c) => (
                    <button
                      key={c}
                      aria-label={"Palette " + c}
                      style={{ background: c }}
                      className={"swatch " + (color === c ? "selected" : "")}
                      onClick={() => setColor(color === c ? undefined : c)}
                    />
                  ))}
                </div>
                <button
                  disabled={busy || prompt.trim().length < 3}
                  className="btn btn-dark"
                  onClick={generate}
                >
                  <Sparkles size={16} />
                  {busy ? "Dreaming up your souls…" : "Generate My Soul"}
                </button>
              </div>
            </div>
            <div className="prompt-examples">
              {examples.slice(0, 3).map((p) => (
                <button key={p} onClick={() => setPrompt(p)}>
                  {p}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10, margin: "20px 0" }}>
              Works instantly with our local concept engine. An external AI
              provider is optional.
            </p>
            <button
              className="text-link"
              style={{ border: 0, background: "none" }}
              onClick={() => {
                state.load(defaultDesign);
                setMode("edit");
              }}
            >
              Or start from scratch <ArrowUpRight size={15} />
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 10, marginTop: 25 }}>{provider}</p>
            <div className="concept-grid">
              {concepts.map((c, i) => (
                <article className="concept-card" key={c.seed}>
                  <ToyPortrait config={c} />
                  <div>
                    <span className="eyebrow">
                      CONCEPT 0{i + 1} · {c.mood}
                    </span>
                    <h3>{c.name}</h3>
                    <p>{c.personality}</p>
                    <p>{c.story}</p>
                    <button
                      className="btn btn-dark"
                      onClick={() => {
                        state.load(c);
                        setMode("edit");
                      }}
                    >
                      Customize This Toy <ArrowUpRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setMode("imagine")}
            >
              Try another daydream
            </button>
          </>
        )}
      </div>
    );
  return (
    <div className="studio-shell">
      <div className="studio-toolbar">
        <div>
          <span className="eyebrow">YOUR LITTLE WORKSHOP</span>
          <h1>{config.name}</h1>
          <span className="save-note" role="status">
            {session ? saveLabel : "Explore freely · sign in to save your soul"}
          </span>
        </div>
        <div className="toolbar-actions">
          <button
            className="icon-btn"
            title="Undo"
            aria-label="Undo"
            disabled={!state.past.length || busy}
            onClick={state.undo}
          >
            <Undo2 size={16} />
          </button>
          <button
            className="icon-btn"
            title="Redo"
            aria-label="Redo"
            disabled={!state.future.length || busy}
            onClick={state.redo}
          >
            <Redo2 size={16} />
          </button>
          {session ? (
            <>
              <button
                disabled={busy || !ready}
                className="btn btn-secondary"
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await persist(preview());
                  } catch (e) {
                    setError(message(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Check size={14} />
                Save draft
              </button>
              <button
                disabled={busy || !ready}
                className="btn btn-dark"
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  finalizing.current = true;
                  try {
                    const t = await persist(preview());
                    await api("/api/toys/" + t.id, { action: "finalize" });
                    router.push("/checkout/" + t.id);
                  } catch (e) {
                    setError(message(e));
                    finalizing.current = false;
                    setBusy(false);
                  }
                }}
              >
                Finalize <ArrowUpRight size={15} />
              </button>
            </>
          ) : (
            <Link
              href="/login?next=%2Fstudio%3Fresume%3D1"
              className="btn btn-dark"
            >
              Sign in to save <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </div>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      <div className="studio-grid">
        <div className="studio-stage">
          <span className="stage-label">ORIGINAL SOUL / EDITION OF ONE</span>
          <div className="stage-canvas">
            <ToyCanvas
              config={config}
              resetKey={resetKey}
              autoRotate={rotate}
              reduced={reduce || !!prefersReduced}
            />
          </div>
          <div className="stage-tools">
            <div>
              <button
                title="Reset camera"
                aria-label="Reset camera"
                className="icon-btn"
                onClick={() => setResetKey((v) => v + 1)}
              >
                <RotateCcw size={16} />
              </button>
              <button
                title="Auto rotate"
                aria-label="Auto rotate"
                aria-pressed={rotate}
                className="icon-btn"
                onClick={() => setRotate(!rotate)}
              >
                <Rotate3D size={17} />
              </button>
              <button
                title="Reduce motion"
                aria-label="Reduce motion"
                aria-pressed={reduce}
                className="icon-btn"
                onClick={() => setReduce(!reduce)}
              >
                {reduce ? <Play size={15} /> : <Pause size={15} />}
              </button>
              <button
                title="Export preview"
                aria-label="Export preview"
                className="icon-btn"
                onClick={() => {
                  const url = preview();
                  if (!url) {
                    setError("Preview export needs a WebGL-capable browser.");
                    return;
                  }
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = config.name + ".png";
                  a.click();
                }}
              >
                <Download size={16} />
              </button>
              <button
                title="Randomize"
                aria-label="Randomize"
                className="icon-btn"
                disabled={busy}
                onClick={() =>
                  change(
                    localGenerate({
                      prompt: "A magical creature " + Math.random(),
                      mood: moods[Math.floor(Math.random() * moods.length)],
                    })[Math.floor(Math.random() * 3)],
                  )
                }
              >
                <Shuffle size={16} />
              </button>
            </div>
            <span className="stage-hint">DRAG TO ROTATE · SCROLL TO ZOOM</span>
          </div>
        </div>
        <aside className="studio-panel">
          <div
            className="studio-tabs"
            role="tablist"
            aria-label="Customization"
          >
            {["Body", "Face", "Features", "Accessories", "Identity"].map(
              (t) => (
                <button
                  role="tab"
                  aria-selected={tab === t}
                  className={tab === t ? "selected" : ""}
                  key={t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          <fieldset
            disabled={busy || !ready}
            className="controls-body"
            style={{ border: 0, margin: 0 }}
          >
            {tab === "Body" && (
              <>
                {group(
                  "Body shape",
                  options("bodyShape", ["round", "pear", "bean"]),
                )}
                {group("Primary color", colors("primaryColor"))}
                {group("Secondary color", colors("secondaryColor"))}
                {group(
                  "Surface finish",
                  options("finish", ["matte", "satin", "gloss"]),
                )}
              </>
            )}
            {tab === "Face" && (
              <>
                {group(
                  "Eyes",
                  options("eyeStyle", ["round", "sleepy", "happy", "star"]),
                )}
                {group("Eye color", colors("eyeColor"))}
                {group(
                  "Mouth",
                  options("mouthStyle", ["smile", "tiny", "surprised"]),
                )}
                {group(
                  "Expression",
                  <div className="option-grid">
                    <button
                      onClick={() =>
                        change({ eyeStyle: "happy", mouthStyle: "smile" })
                      }
                    >
                      Happy
                    </button>
                    <button
                      onClick={() =>
                        change({ eyeStyle: "sleepy", mouthStyle: "tiny" })
                      }
                    >
                      Sleepy
                    </button>
                    <button
                      onClick={() =>
                        change({ eyeStyle: "round", mouthStyle: "surprised" })
                      }
                    >
                      Curious
                    </button>
                  </div>,
                )}
                <label className="inline-actions">
                  <input
                    type="checkbox"
                    checked={config.eyebrows}
                    onChange={(e) => change({ eyebrows: e.target.checked })}
                  />{" "}
                  Little eyebrows
                </label>
              </>
            )}
            {tab === "Features" && (
              <>
                {group("Ears", options("ears", ["none", "round", "long"]))}
                {group("Horns", options("horns", ["none", "tiny", "curved"]))}
                {group("Tail", options("tail", ["none", "puff", "long"]))}
                {group(
                  "Body pattern",
                  options("pattern", ["none", "spots", "belly"]),
                )}
              </>
            )}
            {tab === "Accessories" && (
              <>
                {group(
                  "One special finishing touch",
                  options("accessory", [
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
                )}
                <p className="muted" style={{ fontSize: 11 }}>
                  Choose one accessory for this edition. Spin your soul to see
                  every little detail.
                </p>
              </>
            )}
            {tab === "Identity" && (
              <div className="form-stack">
                <label className="label">
                  Toy name
                  <input
                    className="field"
                    value={config.name}
                    maxLength={60}
                    onChange={(e) => change({ name: e.target.value })}
                  />
                </label>
                <label className="label">
                  Personality
                  <input
                    className="field"
                    value={config.personality}
                    maxLength={200}
                    onChange={(e) => change({ personality: e.target.value })}
                  />
                </label>
                <label className="label">
                  Origin story
                  <textarea
                    className="field"
                    value={config.story}
                    maxLength={800}
                    onChange={(e) => change({ story: e.target.value })}
                  />
                </label>
                <label className="label">
                  Secret message
                  <textarea
                    className="field"
                    value={secret}
                    maxLength={1000}
                    placeholder="A little kindness for a stranger…"
                    onChange={(e) => setSecret(e.target.value)}
                  />
                </label>
                <p className="muted" style={{ fontSize: 10 }}>
                  Only your recipient can unlock this message after confirming
                  receipt.
                </p>
              </div>
            )}
          </fieldset>
        </aside>
      </div>
      <p className="studio-bottom-note">
        A digital prototype of your collectible. Manufacturing and delivery are
        simulated in this demo.
      </p>
    </div>
  );
}
export default function Page() {
  return (
    <Suspense
      fallback={<div className="studio-intro">Opening your studio…</div>}
    >
      <Studio />
    </Suspense>
  );
}
