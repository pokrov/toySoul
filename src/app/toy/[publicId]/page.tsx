import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ToyPortrait } from "@/components/toy-portrait";
import type { Design } from "@/lib/design";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const toy = await db.toy.findUnique({
    where: { publicId },
    include: {
      design: true,
      secret: true,
      creator: { select: { name: true } },
      match: { include: { collection: true } },
    },
  });
  if (!toy || toy.moderated) notFound();
  const session = await auth.api.getSession({ headers: await headers() });
  const owner = session?.user.id === toy.creatorId;
  const received = toy.match?.status === "COMPLETED" && !!toy.match.collection;
  const recipient = received && session?.user.id === toy.match?.recipientId;
  const visible = owner || received;
  const qr = await QRCode.toDataURL(
    new URL(
      "/toy/" + publicId,
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ).href,
    { margin: 1, width: 200, color: { dark: "#29282b", light: "#faf8f4" } },
  );
  const config = toy.design!.config as Design;
  return (
    <div className="section-wrap page-content">
      <div className="page-heading">
        <span className="eyebrow">
          DIGITAL COLLECTIBLE · EDITION {toy.edition} OF ONE
        </span>
      </div>
      {visible ? (
        <div className="toy-detail">
          <ToyPortrait config={config} />
          <div>
            <span className="badge">{publicId}</span>
            <h1>
              <em>{toy.name}</em>
            </h1>
            <p>{config.personality}</p>
            <p>{config.story}</p>
            <span className="eyebrow">CREATED BY {toy.creator.name}</span>
            <p style={{ fontSize: 11 }}>
              Born{" "}
              {toy.createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
              . One little soul, one unique connection.
            </p>
            {(recipient || owner) && toy.secret?.text && (
              <div
                className="panel"
                style={{ fontFamily: "Georgia", fontStyle: "italic" }}
              >
                “{toy.secret.text}”
              </div>
            )}
            <div className="toy-qr">
              <img src={qr} alt={"QR code for " + publicId} />
              <span>
                A permanent little home on the web.
                <br />
                Scan to revisit this collectible.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <span style={{ fontSize: 70 }}>✳</span>
          <h3>A little soul. Still a little secret.</h3>
          <p>
            This original collectible will be unveiled after its recipient
            confirms receipt.
            <br />
            {publicId}
          </p>
          <div className="toy-qr" style={{ justifyContent: "center" }}>
            <img src={qr} alt="Collectible QR code" />
          </div>
          <Link
            className="btn btn-dark"
            href="/studio"
            style={{ marginTop: 25 }}
          >
            Create your own soul
          </Link>
        </div>
      )}
    </div>
  );
}
