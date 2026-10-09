"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowUpRight, Gift, Heart } from "lucide-react";
import { api, message } from "@/lib/client";
import { ToyPortrait } from "./toy-portrait";
import type { Design } from "@/lib/design";
import type { DashboardData } from "@/lib/types";
type Revealed = {
  name: string;
  config: Design;
  creator: string;
  secret: string;
  publicId: string;
};
export function Reveal({
  id,
  status,
  initial,
}: {
  id: string;
  status: string;
  initial?: Revealed;
}) {
  const [toy, setToy] = useState(initial),
    [opening, setOpening] = useState(false),
    [error, setError] = useState("");
  const reduced = useReducedMotion();
  async function open() {
    setOpening(true);
    setError("");
    try {
      await api("/api/matches/" + id, { status: "RECEIVED" });
      const data = await api<DashboardData>("/api/dashboard");
      const t = data.collection.find((c) => c.match.id === id)?.match.toy;
      if (!t) throw new Error("Your soul is saved. Reload to reveal it.");
      if (!reduced) await new Promise((r) => setTimeout(r, 900));
      setToy({
        name: t.name,
        config: t.design.config,
        creator: t.creator.name,
        secret: t.secret?.text ?? "",
        publicId: t.publicId!,
      });
    } catch (e) {
      setError(message(e));
    } finally {
      setOpening(false);
    }
  }
  return (
    <div className="reveal-shell">
      <span className="eyebrow">
        A STRANGER’S IMAGINATION. YOUR NEW COMPANION.
      </span>
      <AnimatePresence mode="wait">
        {toy ? (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: reduced ? 0 : 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1>
              Meet <em>{toy.name}.</em>
            </h1>
            <p>{toy.config.personality}</p>
            <div className="reveal-toy">
              <ToyPortrait config={toy.config} />
            </div>
            <span className="badge">Created with soul by {toy.creator}</span>
            <p>{toy.config.story}</p>
            {toy.secret && (
              <div className="secret-message">
                <Heart size={19} style={{ margin: "0 auto 15px" }} />“
                {toy.secret}”
              </div>
            )}
            <div
              className="inline-actions"
              style={{ justifyContent: "center", marginTop: 28 }}
            >
              <Link href="/dashboard" className="btn btn-dark">
                Add to My Collection <ArrowUpRight size={16} />
              </Link>
              <Link href={"/toy/" + toy.publicId} className="btn btn-secondary">
                Digital collectible & QR
              </Link>
            </div>
            <p style={{ fontSize: 10 }}>
              Receipt confirmed. This soul is already safely saved in your
              permanent collection.
            </p>
          </motion.div>
        ) : (
          <motion.div key="box" exit={{ opacity: 0, scale: reduced ? 1 : 1.1 }}>
            <h1>
              Something special <em>has arrived.</em>
            </h1>
            <p>
              Someone poured a little piece of themselves into this. Now it’s
              yours to discover.
            </p>
            <motion.div
              className="gift-box"
              animate={
                opening && !reduced
                  ? { rotate: [-11, -15, -7, -15, -7, -11], y: [0, -10, 0] }
                  : undefined
              }
              transition={{ duration: 0.7, repeat: opening ? Infinity : 0 }}
            >
              <span>✳</span>
              <i>
                FOR YOU.
                <br />
                YES, YOU.
              </i>
            </motion.div>
            {status === "DELIVERED" ? (
              <button
                className="btn btn-dark"
                disabled={opening}
                onClick={open}
              >
                {opening
                  ? "Opening a little magic…"
                  : "Confirm receipt & open my soul"}
                <Gift size={17} />
              </button>
            ) : (
              <>
                <p>
                  This soul is still on its way. You can open it once delivery
                  is confirmed.
                </p>
                <Link className="btn btn-secondary" href="/dashboard">
                  Back to your universe
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
