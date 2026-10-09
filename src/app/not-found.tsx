import Link from "next/link";
export default function NotFound() {
  return (
    <div className="studio-intro">
      <span style={{ fontSize: 65 }}>✧</span>
      <h1>This soul wandered off.</h1>
      <p>We couldn’t find that page, or it isn’t yours to open.</p>
      <Link href="/" className="btn btn-dark" style={{ marginTop: 25 }}>
        Back to the universe
      </Link>
    </div>
  );
}
