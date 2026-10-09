"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { ToyPortrait } from "@/components/toy-portrait";
function Login() {
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter(),
    params = useSearchParams();
  const destination = params.get("next");
  const next =
    destination?.startsWith("/") && !destination.startsWith("//")
      ? destination
      : "/dashboard";
  return (
    <div className="auth-shell">
      <div className="auth-art">
        <ToyPortrait />
        <p>A little soul is waiting for you.</p>
      </div>
      <div className="auth-form">
        <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
        <h1>
          {register ? "Make yourself at home." : "Welcome back, dreamer."}
        </h1>
        <p>
          {register
            ? "A name, a little imagination, and you’re one of us."
            : "Your creations, connections, and little surprises await."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const data = new FormData(e.currentTarget);
            try {
              const credentials = {
                email: String(data.get("email")),
                password: String(data.get("password")),
              };
              const result = register
                ? await authClient.signUp.email({
                    ...credentials,
                    name: String(data.get("name")),
                  })
                : await authClient.signIn.email(credentials);
              if (result.error)
                setError(result.error.message ?? "Please check your details.");
              else {
                router.push(next);
                router.refresh();
              }
            } catch {
              setError("Unable to connect. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {register && (
            <label>
              Your creator name
              <input
                className="field"
                name="name"
                autoComplete="nickname"
                required
                minLength={2}
                maxLength={40}
                placeholder="A pseudonym is perfect"
              />
            </label>
          )}
          <label>
            Email
            <input
              className="field"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              className="field"
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={10}
              maxLength={128}
              required
              placeholder="At least 10 characters"
            />
          </label>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          <button disabled={busy} className="btn btn-dark">
            {busy
              ? "One little moment…"
              : register
                ? "Create account"
                : "Log in"}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <p className="auth-toggle">
          {register ? "Already part of the universe?" : "New around here?"}
          <button
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register ? "Log in" : "Create an account"}
          </button>
        </p>
        <div className="demo-badge">
          A demonstration universe. Payments and deliveries are simulated.
          Please use a pseudonym and no real shipping information.
        </div>
      </div>
    </div>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div className="studio-intro">Loading…</div>}>
      <Login />
    </Suspense>
  );
}
