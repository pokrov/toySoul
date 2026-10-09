"use client";
import { create } from "zustand";
import { defaultDesign, type Design } from "./design";
type Snapshot = { config: Design; secret: string };
type StudioState = Snapshot & {
  past: Snapshot[];
  future: Snapshot[];
  change: (patch: Partial<Design>) => void;
  setSecret: (secret: string) => void;
  load: (config: Design, secret?: string) => void;
  undo: () => void;
  redo: () => void;
};
export const useStudio = create<StudioState>((set) => ({
  config: defaultDesign,
  secret: "",
  past: [],
  future: [],
  change: (patch) =>
    set((s) => ({
      config: { ...s.config, ...patch },
      past: [...s.past, { config: s.config, secret: s.secret }].slice(-60),
      future: [],
    })),
  setSecret: (secret) =>
    set((s) => ({
      secret,
      past: [...s.past, { config: s.config, secret: s.secret }].slice(-60),
      future: [],
    })),
  load: (config, secret = "") => set({ config, secret, past: [], future: [] }),
  undo: () =>
    set((s) =>
      s.past.length
        ? {
            ...s.past[s.past.length - 1],
            past: s.past.slice(0, -1),
            future: [{ config: s.config, secret: s.secret }, ...s.future],
          }
        : {},
    ),
  redo: () =>
    set((s) =>
      s.future.length
        ? {
            ...s.future[0],
            past: [...s.past, { config: s.config, secret: s.secret }],
            future: s.future.slice(1),
          }
        : {},
    ),
}));
