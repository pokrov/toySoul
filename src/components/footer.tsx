import Link from "next/link";
import { Logo } from "./nav";
export function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div>
          <Logo />
          <p>Little objects. Unexpected connections.</p>
        </div>
        <div className="footer-links">
          {["About", "FAQ", "Privacy", "Terms"].map((s) => (
            <Link key={s} href={"/info/" + s.toLowerCase()}>
              {s}
            </Link>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} SoulToy. Made with a little soul.
        </span>
        <span>DEMO UNIVERSE · NO REAL PAYMENTS OR SHIPPING</span>
      </div>
    </footer>
  );
}
