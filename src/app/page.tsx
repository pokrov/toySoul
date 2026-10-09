import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Gift,
  Orbit,
  Heart,
  PenLine,
  Package,
  Truck,
} from "lucide-react";
import { Hero } from "@/components/hero";
import { ToyPortrait } from "@/components/toy-portrait";
import { defaultDesign, localGenerate } from "@/lib/design";
const examples = [
  { ...defaultDesign, name: "Moonwhisp" },
  localGenerate({
    prompt: "playful coral monster with tiny horns",
    mood: "Playful",
  })[1],
  {
    ...localGenerate({
      prompt: "sleepy mint forest creature",
      mood: "Dreamy",
    })[0],
    name: "Mossling",
  },
  {
    ...localGenerate({ prompt: "yellow bunny with glasses", mood: "Cute" })[0],
    name: "Sunday",
  },
];
export default function Home() {
  return (
    <>
      <section className="hero section-wrap">
        <div className="hero-copy">
          <div className="pill">
            <span className="tiny-dot" /> A LITTLE CREATIVITY. A LOT OF
            CONNECTION.
          </div>
          <h1>
            Create a little soul.
            <br />
            Send it into
            <br />
            <em>the world.</em>
            <span className="headline-star">✧</span>
          </h1>
          <p className="hero-description">
            Design a one-of-a-kind collectible, send it to a stranger, and
            discover what someone else has created for you.
          </p>
          <div className="hero-buttons">
            <Link className="btn btn-primary" href="/studio">
              Create Your Toy <ArrowUpRight size={18} />
            </Link>
            <Link className="text-link" href="#how-it-works">
              How It Works <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="mini-souls">
              <i>✦</i>
              <i>♡</i>
              <i>✳</i>
            </span>
            <span>
              A little piece of you.
              <br />
              <strong>A whole new connection.</strong>
            </span>
          </div>
        </div>
        <Hero />
      </section>
      <div className="manifesto-strip">
        <span>IMAGINATION, MADE TANGIBLE</span>
        <span>✳</span>
        <span>NO TWO SOULS ALIKE</span>
        <span>✳</span>
        <span>CREATED BY YOU. FOUND BY FATE.</span>
        <span>✳</span>
        <span>A SMALL OBJECT. A BIG FEELING.</span>
      </div>
      <section id="how-it-works" className="section-wrap how-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A BEAUTIFUL LITTLE CYCLE</span>
            <h2>
              Your imagination.
              <br />
              Someone else’s <em>happy moment.</em>
            </h2>
          </div>
          <p>
            Part creative playground. Part unexpected gift.
            <br />
            All heart. Here’s how your soul finds its way.
          </p>
        </div>
        <div className="steps-grid">
          {[
            {
              n: "01",
              Icon: Sparkles,
              title: "Dream it.",
              text: "A daydream, a feeling, a wonderfully weird idea. Bring it to life in your own little collectible.",
              color: "lavender",
            },
            {
              n: "02",
              Icon: Gift,
              title: "Send it.",
              text: "Add a secret message and let it go. We’ll match your creation with someone you’ve never met.",
              color: "peach",
            },
            {
              n: "03",
              Icon: Orbit,
              title: "Discover it.",
              text: "A mystery soul arrives, made by another imagination. Open it. Meet it. Make it part of your world.",
              color: "mint",
            },
          ].map(({ n, Icon, title, text, color }) => (
            <article className={"step-card " + color} key={n}>
              <div className="step-top">
                <Icon size={28} strokeWidth={1.25} />
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="gallery-section section-wrap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SMALL SOULS, BIG PERSONALITIES</span>
            <h2>
              A few souls in <em>the universe.</em>
            </h2>
          </div>
          <Link className="text-link" href="/gallery">
            Meet the souls <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="toy-grid">
          {examples.map((c, i) => (
            <Link href="/studio" key={c.name} className="collectible">
              <div className={"collectible-art art-" + i}>
                <span className="edition">ORIGINAL SOUL / 00{i + 1}</span>
                <ToyPortrait config={c} />
                <span className="card-arrow">
                  <ArrowUpRight size={18} />
                </span>
              </div>
              <div className="collectible-caption">
                <h3>{c.name}</h3>
                <span>{c.mood} soul</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="surprise-section section-wrap">
        <div className="surprise-art">
          <div className="gift-box">
            <span>✳</span>
            <i>
              FOR SOMEONE,
              <br />
              SOMEWHERE.
            </i>
          </div>
          <span className="surprise-spark">✧</span>
          <div className="secret-note">
            “I hope this little soul
            <br />
            makes your day brighter.”
            <Heart size={18} />
          </div>
        </div>
        <div className="surprise-copy">
          <span className="eyebrow">LET A LITTLE MYSTERY IN</span>
          <h2>
            You don’t choose
            <br />
            who gets it.
            <br />
            <em>That’s the magic.</em>
          </h2>
          <p>
            Somewhere, someone is creating something you haven’t imagined yet.
            Your soul travels to them. Their soul finds you. Two strangers,
            connected by a little act of creativity.
          </p>
          <Link href="/studio" className="btn btn-dark">
            Make someone’s day <ArrowUpRight size={17} />
          </Link>
          <small>Every exchange is a surprise. Every soul is original.</small>
        </div>
      </section>
      <section className="journey-section section-wrap">
        <span className="eyebrow">FROM A SPARK TO A NEW HOME</span>
        <h2>
          A little soul. <em>A whole journey.</em>
        </h2>
        <div className="journey-line">
          {[
            { Icon: PenLine, t: "Imagined" },
            { Icon: Heart, t: "Matched" },
            { Icon: Package, t: "Made with care" },
            { Icon: Truck, t: "On its way" },
            { Icon: Gift, t: "Home, at last" },
          ].map(({ Icon, t }, i) => (
            <div key={t}>
              <span>
                <Icon size={23} strokeWidth={1.4} />
              </span>
              <b>{t}</b>
              <small>0{i + 1}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="closing-cta">
        <span>✳</span>
        <h2>
          The world could use
          <br />
          <em>a little more soul.</em>
        </h2>
        <Link className="btn btn-dark" href="/studio">
          Let’s create yours <ArrowUpRight size={18} />
        </Link>
        <p>No design skills needed. Just a little imagination.</p>
      </section>
    </>
  );
}
