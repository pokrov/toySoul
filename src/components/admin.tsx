"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import { RefreshCw, Shuffle, ArrowRight, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api, message } from "@/lib/client";
import type { Design } from "@/lib/design";
type AdminData = {
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    suspended: boolean;
    _count: { toys: number; sent: number; received: number };
  }[];
  toys: {
    id: string;
    name: string;
    status: string;
    moderated: boolean;
    creator: { name: string };
    design: { config: Design };
    secret: { text: string } | null;
  }[];
  payments: {
    id: string;
    status: string;
    amount: number;
    toy: { name: string };
    history: { status: string; at: string }[];
  }[];
  pool: {
    id: string;
    createdAt: string;
    user: { name: string; suspended: boolean };
    toy: {
      name: string;
      status: string;
      moderated: boolean;
      payment: { status: string } | null;
      match: unknown | null;
    };
  }[];
  exchanges: {
    id: string;
    status: string;
    createdAt: string;
    matches: {
      id: string;
      status: string;
      sender: { name: string };
      recipient: { name: string };
      toy: { name: string };
      history: { status: string; at: string }[];
      shipment: { trackingCode: string; destination: string } | null;
    }[];
  }[];
  logs: {
    id: string;
    action: string;
    entityId: string;
    actor: { name: string };
    createdAt: string;
  }[];
  notifications: {
    id: string;
    userId: string;
    type: string;
    title: string;
    createdAt: string;
  }[];
};
export function Admin() {
  const [data, setData] = useState<AdminData>(),
    [tab, setTab] = useState("Overview"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState(""),
    [editing, setEditing] = useState<AdminData["toys"][number]>();
  const requestKey = useRef<string | null>(null);
  const load = useCallback(
    () =>
      api<AdminData>("/api/admin")
        .then(setData)
        .catch((e) => setError(message(e))),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function action(url: string, payload: unknown, success = "Updated.") {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await api(url, payload);
      await load();
      setNote(success);
      return true;
    } catch (e) {
      setError(message(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!data)
    return (
      <div className="studio-intro">
        <h1>The SoulToy workshop.</h1>
        <p>{error || "Loading exchange operations…"}</p>
      </div>
    );
  const matches = data.exchanges.flatMap((e) => e.matches);
  const stats = [
    ["Users", data.users.length],
    ["Original toys", data.toys.length],
    [
      "Pending payments",
      data.payments.filter((p) => p.status === "PENDING").length,
    ],
    ["Waiting souls", data.pool.length],
    ["Exchange rounds", data.exchanges.length],
    [
      "Active matches",
      matches.filter((m) => !["COMPLETED", "CANCELLED"].includes(m.status))
        .length,
    ],
    [
      "Completed deliveries",
      matches.filter((m) => m.status === "COMPLETED").length,
    ],
    [
      "Cancelled rounds",
      data.exchanges.filter((e) => e.status === "CANCELLED").length,
    ],
  ] as const;
  const chart = [
    "MATCHED",
    "PRODUCTION",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
  ].map((status) => ({
    name: status.toLowerCase(),
    count: matches.filter((m) => m.status === status).length,
  }));
  const reject = (p: AdminData["pool"][number]) =>
    p.user.suspended
      ? "User suspended"
      : p.toy.moderated
        ? "Content held"
        : p.toy.status !== "READY"
          ? "Not finalized"
          : p.toy.payment?.status !== "PAID"
            ? "Payment required"
            : p.toy.match
              ? "Already assigned"
              : "Eligible";
  return (
    <>
      <div className="section-wrap page-heading page-heading-row">
        <div>
          <span className="eyebrow">SOULTOY OPERATIONS · ADMIN ONLY</span>
          <h1>
            Keep the little souls <em>moving.</em>
          </h1>
          <p>
            Manage the exchange, care for the community, and simulate each
            delivery.
          </p>
        </div>
        <button
          className="icon-btn"
          aria-label="Refresh admin data"
          onClick={load}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="section-wrap page-content">
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {note && (
          <div className="success" role="status">
            {note}
          </div>
        )}
        <div className="dashboard-tabs">
          {[
            "Overview",
            "Users",
            "Toys",
            "Payments",
            "Exchange Pool",
            "Exchanges",
            "Shipments",
            "Notifications",
            "Audit log",
          ].map((t) => (
            <button
              className={"chip " + (tab === t ? "selected" : "")}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "Overview" && (
          <>
            <div className="stats-grid">
              {stats.map(([label, value]) => (
                <div key={label} className="stat">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="panel">
              <h3 style={{ fontSize: 20, marginBottom: 25 }}>
                Souls on their journey
              </h3>
              <div className="admin-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chart.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            [
                              "#BAA3CF",
                              "#D1B5A5",
                              "#BACDB9",
                              "#A6BBCD",
                              "#A18AAF",
                            ][i]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        {tab === "Users" && (
          <Table
            headings={["Creator", "Email", "Activity", "Status", "Action"]}
          >
            {data.users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.name}
                  <br />
                  <small>{u.role}</small>
                </td>
                <td>{u.email}</td>
                <td>
                  {u._count.toys} toys · {u._count.sent} sent ·{" "}
                  {u._count.received} incoming
                </td>
                <td>{u.suspended ? "Suspended" : "Active"}</td>
                <td>
                  {u.role !== "ADMIN" && (
                    <button
                      className="btn btn-secondary"
                      disabled={busy}
                      onClick={() =>
                        action("/api/admin", {
                          action: "suspend",
                          id: u.id,
                          value: !u.suspended,
                        })
                      }
                    >
                      {u.suspended ? "Restore" : "Suspend"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
        {tab === "Toys" && (
          <Table
            headings={[
              "Toy",
              "Creator",
              "Status",
              "Configuration",
              "Moderation",
            ]}
          >
            {data.toys.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.creator.name}</td>
                <td>
                  {t.status}
                  {t.moderated ? " · HELD" : ""}
                </td>
                <td>
                  <details>
                    <summary>Inspect design & message</summary>
                    <pre>{JSON.stringify(t.design.config, null, 2)}</pre>
                    <p>{t.secret?.text}</p>
                  </details>
                </td>
                <td>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setEditing(t)}
                  >
                    Review / moderate
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
        {tab === "Payments" && (
          <>
            <p className="demo-badge" style={{ margin: "0 0 20px" }}>
              All payments are simulated. No money is charged.
            </p>
            <Table headings={["Toy", "Amount", "Status", "History"]}>
              {data.payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.toy.name}</td>
                  <td>{p.amount} MAD</td>
                  <td>
                    <span className="badge">{p.status}</span>
                  </td>
                  <td>
                    <details>
                      <summary>{p.history.length} events</summary>
                      {p.history.map((h, i) => (
                        <p key={i}>
                          {h.status} · {new Date(h.at).toLocaleString("en-GB")}
                        </p>
                      ))}
                    </details>
                  </td>
                </tr>
              ))}
            </Table>
          </>
        )}
        {tab === "Exchange Pool" && (
          <>
            <div className="panel" style={{ marginBottom: 25 }}>
              <div className="page-heading-row">
                <div>
                  <h3 style={{ fontSize: 25 }}>
                    One round. Many new connections.
                  </h3>
                  <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                    {data.pool.filter((p) => reject(p) === "Eligible").length}{" "}
                    eligible participants. Minimum 3. Ineligible entries stay
                    waiting.
                    <br />A single cycle prevents self-matches and direct
                    two-person swaps.
                  </p>
                </div>
                <button
                  disabled={busy}
                  className="btn btn-dark"
                  onClick={async () => {
                    requestKey.current ??= crypto.randomUUID();
                    if (
                      await action(
                        "/api/admin",
                        { action: "match", requestKey: requestKey.current },
                        "Matching round created. Every soul has one recipient.",
                      )
                    )
                      requestKey.current = null;
                  }}
                >
                  <Shuffle size={16} />
                  Run Matching
                </button>
              </div>
            </div>
            <Table headings={["Participant", "Toy", "Joined", "Eligibility"]}>
              {data.pool.map((p) => (
                <tr key={p.id}>
                  <td>{p.user.name}</td>
                  <td>{p.toy.name}</td>
                  <td>{new Date(p.createdAt).toLocaleString("en-GB")}</td>
                  <td>{reject(p)}</td>
                </tr>
              ))}
            </Table>
          </>
        )}
        {(tab === "Exchanges" || tab === "Shipments") && (
          <>
            {!data.exchanges.length && (
              <div className="empty-state">
                <h3>No rounds yet.</h3>
                <p>Match eligible participants from the Exchange Pool.</p>
              </div>
            )}
            {data.exchanges.map((e) => (
              <article className="admin-round" key={e.id}>
                <h3>
                  <span>
                    Round {e.id.slice(-7).toUpperCase()} · {e.matches.length}{" "}
                    souls
                  </span>
                  <span className="badge">{e.status}</span>
                </h3>
                {e.matches.map((m) => (
                  <div className="admin-match" key={m.id}>
                    <div>
                      <strong>
                        {m.toy.name} · {m.sender.name} → {m.recipient.name}
                      </strong>
                      <p>
                        {m.status}
                        {m.shipment
                          ? " · " +
                            m.shipment.trackingCode +
                            " · " +
                            m.shipment.destination
                          : ""}
                      </p>
                      <details style={{ fontSize: 10, marginTop: 8 }}>
                        <summary>Lifecycle history</summary>
                        {m.history.map((h, i) => (
                          <p key={i}>
                            {h.status} ·{" "}
                            {new Date(h.at).toLocaleString("en-GB")}
                          </p>
                        ))}
                      </details>
                    </div>
                    <div className="inline-actions">
                      {["MATCHED", "PRODUCTION", "SHIPPED"].includes(
                        m.status,
                      ) && (
                        <button
                          disabled={busy}
                          className="btn btn-dark"
                          onClick={() =>
                            action("/api/matches/" + m.id, {
                              status: (
                                {
                                  MATCHED: "PRODUCTION",
                                  PRODUCTION: "SHIPPED",
                                  SHIPPED: "DELIVERED",
                                } as Record<string, string>
                              )[m.status],
                            })
                          }
                        >
                          {
                            (
                              {
                                MATCHED: "Start production",
                                PRODUCTION: "Simulate shipping",
                                SHIPPED: "Simulate delivery",
                              } as Record<string, string>
                            )[m.status]
                          }
                          <ArrowRight size={13} />
                        </button>
                      )}
                      {["MATCHED", "PRODUCTION"].includes(m.status) && (
                        <button
                          disabled={busy}
                          className="btn btn-secondary"
                          onClick={() =>
                            action("/api/matches/" + m.id, {
                              status: "CANCELLED",
                            })
                          }
                        >
                          Cancel
                        </button>
                      )}
                      {m.status === "DELIVERED" && (
                        <span className="muted" style={{ fontSize: 10 }}>
                          Awaiting recipient confirmation
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </article>
            ))}
          </>
        )}
        {tab === "Notifications" && (
          <Table headings={["Event", "Recipient", "Message", "Date"]}>
            {data.notifications.map((n) => (
              <tr key={n.id}>
                <td>{n.type}</td>
                <td>
                  {data.users.find((u) => u.id === n.userId)?.name ?? n.userId}
                </td>
                <td>{n.title}</td>
                <td>{new Date(n.createdAt).toLocaleString("en-GB")}</td>
              </tr>
            ))}
          </Table>
        )}
        {tab === "Audit log" && (
          <Table headings={["Administrator", "Action", "Entity", "Timestamp"]}>
            {data.logs.map((l) => (
              <tr key={l.id}>
                <td>{l.actor.name}</td>
                <td>{l.action}</td>
                <td>{l.entityId}</td>
                <td>{new Date(l.createdAt).toLocaleString("en-GB")}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
      {editing && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Moderate toy"
          >
            <div className="page-heading-row">
              <h2>Care for this creation.</h2>
              <button
                className="icon-btn"
                aria-label="Close moderation"
                onClick={() => setEditing(undefined)}
              >
                <X size={17} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (
                  await action(
                    "/api/admin",
                    {
                      action: "moderate",
                      id: editing.id,
                      value: f.get("held") === "on",
                      name: f.get("name"),
                      story: f.get("story"),
                      secret: f.get("secret"),
                    },
                    "Moderation saved and audited.",
                  )
                )
                  setEditing(undefined);
              }}
            >
              <label>
                Toy name
                <input
                  name="name"
                  className="field"
                  defaultValue={editing.name}
                  required
                  maxLength={60}
                />
              </label>
              <label>
                Origin story
                <textarea
                  name="story"
                  className="field"
                  defaultValue={editing.design.config.story}
                  maxLength={800}
                />
              </label>
              <label>
                Secret message
                <textarea
                  name="secret"
                  className="field"
                  defaultValue={editing.secret?.text ?? ""}
                  maxLength={1000}
                />
              </label>
              <label className="inline-actions">
                <input
                  name="held"
                  type="checkbox"
                  defaultChecked={editing.moderated}
                />
                Hold from matching and public gallery
              </label>
              <button className="btn btn-dark" disabled={busy}>
                Save moderation
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
function Table({
  headings,
  children,
}: {
  headings: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {headings.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
