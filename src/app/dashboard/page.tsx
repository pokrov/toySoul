"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Plus,
  Sparkles,
  Gift,
  LogOut,
  Shield,
} from "lucide-react";
import { api, message } from "@/lib/client";
import { authClient } from "@/lib/auth-client";
import type { DashboardData } from "@/lib/types";
import { ToyPortrait } from "@/components/toy-portrait";
import { lifecycle } from "@/lib/rules";
export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(),
    [error, setError] = useState(""),
    [tab, setTab] = useState("My Studio");
  const router = useRouter();
  const load = useCallback(
    () =>
      api<DashboardData>("/api/dashboard")
        .then(setData)
        .catch((e) => setError(message(e))),
    [],
  );
  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);
  if (!data)
    return (
      <div className="section-wrap page-content">
        <div className="page-heading">
          <h1>Your little universe.</h1>
          {error ? (
            <>
              <div className="error">{error}</div>
              <Link href="/login?next=/dashboard" className="btn btn-dark">
                Log in to your universe
              </Link>
            </>
          ) : (
            <p>Gathering your little souls…</p>
          )}
        </div>
      </div>
    );
  const waiting = data.toys.find((t) => t.entry?.status === "WAITING");
  return (
    <>
      <div className="section-wrap page-heading page-heading-row">
        <div>
          <span className="eyebrow">A LITTLE SPACE THAT’S ALL YOURS</span>
          <h1>
            Hello, <em>{data.user.name}.</em>
          </h1>
          <p>Your daydreams, your journeys, your unexpected connections.</p>
        </div>
        <div className="inline-actions">
          {data.user.role === "ADMIN" && (
            <Link href="/admin" className="btn btn-secondary">
              <Shield size={14} />
              Admin
            </Link>
          )}
          <button
            className="icon-btn"
            title="Log out"
            aria-label="Log out"
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut size={16} />
          </button>
          <Link href="/studio" className="btn btn-dark">
            <Plus size={16} />
            Create a soul
          </Link>
        </div>
      </div>
      <div className="section-wrap page-content">
        <div
          className="dashboard-tabs"
          role="tablist"
          aria-label="Your universe"
        >
          {[
            "My Studio",
            "My Sent Souls",
            "Incoming Mystery",
            "My Collection",
          ].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={"chip " + (tab === t ? "selected" : "")}
              onClick={() => setTab(t)}
            >
              {t}
              {t === "Incoming Mystery" && data.incoming.length > 0
                ? " (" + data.incoming.length + ")"
                : ""}
            </button>
          ))}
        </div>
        {error && <div className="error">{error}</div>}
        {tab === "My Studio" && (
          <>
            {waiting && (
              <div className="waiting-room">
                <ToyPortrait config={waiting.design.config} />
                <span className="eyebrow" style={{ display: "block" }}>
                  IN THE EXCHANGE POOL
                </span>
                <h2>
                  Your little soul is waiting
                  <br />
                  to <em>meet someone.</em>
                </h2>
                <p>
                  Joined{" "}
                  {new Date(waiting.entry!.createdAt).toLocaleDateString(
                    "en-GB",
                  )}{" "}
                  · Waiting for the next matching round.
                  <br />
                  Everyone sends one soul and receives one. Your recipient stays
                  a surprise.
                </p>
                <span className="pool-count">
                  {data.poolCount} eligible souls in the waiting room
                </span>
              </div>
            )}
            {data.toys.length ? (
              <div className="card-grid">
                {data.toys.map((t) => (
                  <article key={t.id} className="toy-card">
                    <div className="toy-card-art">
                      <span className="badge">
                        {t.entry?.status === "MATCHED"
                          ? "On a journey"
                          : t.entry?.status === "WAITING"
                            ? "In the pool"
                            : t.status === "DRAFT"
                              ? "Work in progress"
                              : "Ready to travel"}
                      </span>
                      <ToyPortrait config={t.design.config} />
                    </div>
                    <div className="toy-card-body">
                      <h3>{t.name}</h3>
                      <p>{t.design.config.personality}</p>
                      <Link
                        className="btn btn-secondary"
                        href={
                          t.status === "DRAFT"
                            ? "/studio?id=" + t.id
                            : t.entry
                              ? "/toy/" + t.publicId
                              : "/checkout/" + t.id
                        }
                      >
                        {t.status === "DRAFT"
                          ? "Continue creating"
                          : t.entry
                            ? "View collectible"
                            : "Send into the world"}
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="Every soul starts somewhere."
                text="Give your first daydream a little face."
              />
            )}
          </>
        )}
        {tab === "My Sent Souls" &&
          (data.sent.length ? (
            <div className="card-grid">
              {data.sent.map((m) => (
                <article key={m.id} className="panel">
                  <span className="eyebrow">
                    A LITTLE PIECE OF YOU, OUT THERE
                  </span>
                  <h3 style={{ fontSize: 25, marginTop: 17 }}>{m.toy?.name}</h3>
                  <Progress status={m.status} />
                  <span className="badge">{m.status}</span>
                  <p className="muted" style={{ fontSize: 11, marginTop: 18 }}>
                    Your recipient’s identity stays private. Their new companion
                    is making its way through the world.
                  </p>
                  {m.shipment && (
                    <p style={{ fontSize: 10, marginTop: 14 }}>
                      Simulated tracking: {m.shipment.trackingCode}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="A little adventure is ahead."
              text="Finalize your creation and enter the exchange pool."
            />
          ))}
        {tab === "Incoming Mystery" &&
          (data.incoming.length ? (
            <div className="card-grid">
              {data.incoming.map((m) => (
                <article key={m.id} className="mystery-card">
                  <span className="eyebrow">MADE BY SOMEONE, FOR YOU</span>
                  <div className="gift-box">
                    <span>✳</span>
                  </div>
                  <h3>A beautiful unknown.</h3>
                  <Progress status={m.status} />
                  <span className="badge">{m.status}</span>
                  <p>
                    {m.status === "DELIVERED"
                      ? "Something special has arrived. Ready to meet your little soul?"
                      : "We’re keeping this one a surprise. Follow its journey here."}
                  </p>
                  {m.status === "DELIVERED" && (
                    <Link href={"/reveal/" + m.id} className="btn btn-dark">
                      Confirm receipt & reveal <Gift size={15} />
                    </Link>
                  )}
                  {m.shipment && <p>DEMO · {m.shipment.trackingCode}</p>}
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="Good things are on their way."
              text="Once you’re matched, your incoming mystery will appear here."
            />
          ))}
        {tab === "My Collection" &&
          (data.collection.length ? (
            <div className="card-grid">
              {data.collection.map((c) => (
                <article className="toy-card" key={c.id}>
                  <div className="toy-card-art">
                    <span className="badge">Edition of one</span>
                    <ToyPortrait config={c.match.toy.design.config} />
                  </div>
                  <div className="toy-card-body">
                    <h3>{c.match.toy.name}</h3>
                    <p>Created with soul by {c.match.toy.creator.name}</p>
                    <Link
                      className="btn btn-secondary"
                      href={"/reveal/" + c.match.id}
                    >
                      Revisit the reveal <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="A collection of connections."
              text="The souls you receive will live here, along with their stories."
            />
          ))}
      </div>
    </>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <Sparkles size={36} />
      <h3>{title}</h3>
      <p>{text}</p>
      <Link className="btn btn-dark" href="/studio">
        Visit the studio <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}
export function Progress({ status }: { status: string }) {
  const index = (lifecycle as readonly string[]).indexOf(status);
  return (
    <div className="progress-track" aria-label={"Delivery status: " + status}>
      {lifecycle.map((s, i) => (
        <span key={s} className={i <= index ? "done" : ""} title={s} />
      ))}
    </div>
  );
}
