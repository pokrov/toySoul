"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Check, Gift } from "lucide-react";
import { ToyPortrait } from "./toy-portrait";
import type { Design } from "@/lib/design";
import { api, message } from "@/lib/client";
export function Checkout({
  toy,
  price,
}: {
  toy: {
    id: string;
    name: string;
    config: Design;
    status: string;
    amount: number;
    joined: boolean;
  };
  price: { creation: number; shipping: number };
}) {
  const [status, setStatus] = useState(toy.status),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  async function pay(value: string) {
    setBusy(true);
    setError("");
    try {
      await api("/api/toys/" + toy.id, { action: "pay", status: value });
      setStatus(value);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-wrap page-heading">
        <span className="eyebrow">
          A LITTLE SOUL, READY FOR A BIG ADVENTURE
        </span>
        <h1>
          Let’s send <em>{toy.name}</em> into the world.
        </h1>
      </div>
      <div className="section-wrap page-content">
        <div className="checkout-grid">
          <div className="checkout-art">
            <ToyPortrait config={toy.config} />
          </div>
          <div className="panel checkout-panel">
            <span className="eyebrow">YOUR SOULTOY EXCHANGE</span>
            <h2 style={{ marginTop: 12 }}>
              {status === "PAID"
                ? "A little kindness, confirmed."
                : "One creation. One surprise."}
            </h2>
            <p className="muted" style={{ fontSize: 12 }}>
              Send your original soul to a stranger and receive a collectible
              created by someone else.
            </p>
            <div className="price-line">
              <span>Toy creation</span>
              <span>{toy.amount - price.shipping} MAD</span>
            </div>
            <div className="price-line">
              <span>Simulated shipping</span>
              <span>{price.shipping} MAD</span>
            </div>
            <div className="price-line total">
              <span>Total</span>
              <span>{toy.amount} MAD</span>
            </div>
            <div className="demo-badge">
              Demo payment — no money will be charged.
              <br />
              These are fictional demo prices. No card information is needed.
            </div>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            {status === "PAID" ? (
              <>
                <div className="success">
                  <Check
                    size={14}
                    style={{ display: "inline", marginRight: 8 }}
                  />
                  Simulated payment successful
                </div>
                {toy.joined ? (
                  <Link href="/dashboard" className="btn btn-dark">
                    Visit your waiting room <ArrowUpRight size={15} />
                  </Link>
                ) : (
                  <button
                    className="btn btn-dark"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError("");
                      try {
                        await api("/api/toys/" + toy.id, { action: "join" });
                        router.push("/dashboard");
                      } catch (e) {
                        setError(message(e));
                        setBusy(false);
                      }
                    }}
                  >
                    Enter the Exchange Pool <Gift size={16} />
                  </button>
                )}
              </>
            ) : (
              <>
                {status === "FAILED" && (
                  <div className="error">
                    Simulated payment failed. Your toy is safe; you can retry.
                  </div>
                )}
                {status === "CANCELLED" && (
                  <p className="muted">
                    Demo payment cancelled. You can return whenever you’re
                    ready.
                  </p>
                )}
                <button
                  className="btn btn-dark"
                  disabled={busy}
                  onClick={() => pay("PAID")}
                >
                  Simulate Successful Payment <ArrowUpRight size={16} />
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => pay("FAILED")}
                >
                  Simulate Failed Payment
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => pay("CANCELLED")}
                >
                  Cancel demo payment
                </button>
              </>
            )}
            <small>
              Your creation is finalized and cannot be edited. Every participant
              sends and receives one soul. Your recipient’s identity remains
              private.
            </small>
          </div>
        </div>
      </div>
    </>
  );
}
