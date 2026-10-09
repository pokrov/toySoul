"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Bell, Menu, X, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
type Notice = { id: string; title: string; read: boolean };
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="SoulToy home">
      <span className="logo-mark">✳</span>soultoy
      <span className="logo-dot">®</span>
    </Link>
  );
}
export function Nav() {
  const { data: session } = authClient.useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  useEffect(() => {
    if (!session) return;
    let active = true;
    const refresh = () =>
      fetch("/api/notifications")
        .then((r) => (r.ok ? r.json() : []))
        .then((n) => {
          if (active) setNotices(n);
        })
        .catch(() => {});
    refresh();
    const id = setInterval(refresh, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [session]);
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Logo />
        <nav
          className={open ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
        >
          <Link
            className={path === "/studio" ? "active" : ""}
            href="/studio"
            onClick={() => setOpen(false)}
          >
            The Studio <Sparkles size={13} />
          </Link>
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link href="/gallery" onClick={() => setOpen(false)}>
            Soul gallery
          </Link>
          {session && (
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              My universe
            </Link>
          )}
        </nav>
        <div className="nav-actions">
          {session ? (
            <>
              <button
                className="icon-btn bell"
                aria-label="Notifications"
                onClick={() => setBell(!bell)}
              >
                <Bell size={19} />
                {notices.some((n) => !n.read) && (
                  <span className="notice-dot" />
                )}
              </button>
              {bell && (
                <div className="notice-popover">
                  <b>A little news</b>
                  {notices.slice(0, 4).map((n) => (
                    <p key={n.id}>
                      {!n.read ? "• " : ""}
                      {n.title}
                    </p>
                  ))}
                  {!notices.length && <p>Your story is just beginning.</p>}
                  <Link href="/notifications" onClick={() => setBell(false)}>
                    All notifications →
                  </Link>
                </div>
              )}
              <Link
                href="/dashboard"
                className="avatar"
                aria-label="Your universe"
              >
                {session.user.name.slice(0, 1)}
              </Link>
            </>
          ) : (
            <Link href="/login" className="login-link">
              Log in
            </Link>
          )}
          <Link className="btn btn-dark nav-cta" href="/studio">
            Create your toy <ArrowUpRight size={16} />
          </Link>
          <button
            className="icon-btn mobile-menu"
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
