"use client";
import dynamic from "next/dynamic";
import { MoveUpRight, Rotate3D, Heart } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
const ToyCanvas = dynamic(
  () => import("./toy-model").then((m) => m.ToyCanvas),
  { ssr: false },
);
export function Hero() {
  const reduced = useReducedMotion();
  return (
    <div className="hero-art">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <span className="hero-star star-one">✧</span>
      <span className="hero-star star-two">✳</span>
      <div className="hero-art-label">
        <span className="tiny-dot" /> ONE OF A KIND. JUST LIKE YOU.
      </div>
      <div className="hero-canvas">
        <ToyCanvas hero reduced={!!reduced} />
      </div>
      <motion.div
        className="floating-note"
        animate={reduced ? {} : { y: [0, -7, 0], rotate: [-5, -3, -5] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <Heart size={18} fill="#EA9E91" strokeWidth={1.4} />
        <span>
          Made by a stranger.
          <br />
          <b>Meant for you.</b>
        </span>
      </motion.div>
      <div className="specimen-tag">
        <div>
          <span className="eyebrow">MEET MOONWHISP</span>
          <p>A collector of forgotten dreams.</p>
        </div>
        <MoveUpRight size={20} />
      </div>
      <div className="rotate-hint">
        <Rotate3D size={15} /> Give me a little spin
      </div>
    </div>
  );
}
