"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { api, message } from "@/lib/client";
type Notice = { id: string; title: string; read: boolean; createdAt: string };
export default function Page() {
  const [items, setItems] = useState<Notice[]>([]),
    [error, setError] = useState("");
  const load = () =>
    api<Notice[]>("/api/notifications")
      .then(setItems)
      .catch((e) => setError(message(e)));
  useEffect(() => {
    load();
  }, []);
  async function read(id?: string) {
    try {
      await api("/api/notifications", id ? { id } : {});
      await load();
    } catch (e) {
      setError(message(e));
    }
  }
  return (
    <>
      <div className="section-wrap page-heading page-heading-row">
        <div>
          <span className="eyebrow">NOTES FROM YOUR UNIVERSE</span>
          <h1>
            A little <em>news.</em>
          </h1>
        </div>
        <button className="btn btn-secondary" onClick={() => read()}>
          Mark all as read <Check size={14} />
        </button>
      </div>
      <div className="section-wrap page-content">
        {error && (
          <div className="error">
            {error} <Link href="/login">Log in</Link>
          </div>
        )}
        {!items.length && !error && (
          <div className="empty-state">
            <Bell size={30} />
            <h3>Your story is just beginning.</h3>
            <p>Your exchange updates will appear here.</p>
          </div>
        )}
        {items.map((n) => (
          <article
            className="notification-row"
            key={n.id}
            style={{ opacity: n.read ? 0.65 : 1 }}
          >
            <span>
              <Bell size={17} />
            </span>
            <div>
              <h3>{n.title}</h3>
              <p>{new Date(n.createdAt).toLocaleString("en-GB")}</p>
            </div>
            {!n.read && (
              <button
                className="icon-btn"
                aria-label={"Mark read: " + n.title}
                onClick={() => read(n.id)}
              >
                <Check size={16} />
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
