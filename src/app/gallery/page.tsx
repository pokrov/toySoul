import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ToyPortrait } from "@/components/toy-portrait";
import { db } from "@/lib/db";
import { defaultDesign, localGenerate, type Design } from "@/lib/design";
export const dynamic = "force-dynamic";
export default async function Page() {
  const received = await db.toy.findMany({
    where: {
      moderated: false,
      match: { status: "COMPLETED", collection: { isNot: null } },
    },
    include: { design: true, creator: { select: { name: true } } },
    take: 24,
    orderBy: { createdAt: "desc" },
  });
  const samples = [
    defaultDesign,
    ...localGenerate({
      prompt: "a coral monster with glasses",
      mood: "Playful",
    }),
    ...localGenerate({
      prompt: "a mint bunny who loves the moon",
      mood: "Dreamy",
    }),
    ...localGenerate({
      prompt: "a blue robot carrying a flower",
      mood: "Melancholic",
    }),
  ];
  return (
    <>
      <div className="section-wrap page-heading">
        <span className="eyebrow">AN EVER-GROWING UNIVERSE OF ORIGINALS</span>
        <h1>
          Small souls.
          <br />
          <em>Infinite imagination.</em>
        </h1>
        <p>
          Meet original characters from our concept shelf, and the souls that
          have already found a new home.
        </p>
      </div>
      <div className="section-wrap page-content">
        {received.length > 0 && (
          <>
            <div className="section-heading">
              <h2>
                Souls that found <em>their people.</em>
              </h2>
            </div>
            <div className="toy-grid" style={{ marginBottom: 50 }}>
              {received.map((t, i) => (
                <Link
                  className="collectible"
                  href={"/toy/" + t.publicId}
                  key={t.id}
                >
                  <div className={"collectible-art art-" + (i % 4)}>
                    <span className="edition">RECEIVED · EDITION OF ONE</span>
                    <ToyPortrait config={t.design!.config as Design} />
                    <span className="card-arrow">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                  <div className="collectible-caption">
                    <h3>{t.name}</h3>
                    <span>by {t.creator.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              ORIGINAL CONCEPTS · A LITTLE INSPIRATION
            </span>
            <h2>
              The <em>daydream shelf.</em>
            </h2>
          </div>
        </div>
        <div className="toy-grid">
          {samples.map((c, i) => (
            <Link className="collectible" href="/studio" key={i}>
              <div className={"collectible-art art-" + (i % 4)}>
                <span className="edition">
                  STUDIO CONCEPT / {String(i + 1).padStart(2, "0")}
                </span>
                <ToyPortrait config={c} />
                <span className="card-arrow">
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <div className="collectible-caption">
                <h3>{c.name}</h3>
                <span>{c.mood}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
