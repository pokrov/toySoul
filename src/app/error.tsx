"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="studio-intro">
      <h1>A little pause in the universe.</h1>
      <p>
        We couldn’t load this page. Check that the database is running, then try
        again.
      </p>
      <button
        onClick={reset}
        className="btn btn-dark"
        style={{ marginTop: 25 }}
      >
        Try again
      </button>
    </div>
  );
}
