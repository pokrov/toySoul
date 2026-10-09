import { notFound } from "next/navigation";
const pages: Record<string, { title: string; sections: [string, string][] }> = {
  about: {
    title: "A little more connection.",
    sections: [
      [
        "Objects with a story",
        "SoulToy is a creative experiment: design an original collectible, attach a kind message, and exchange it with a stranger. Each participant sends one creation and receives another.",
      ],
      [
        "A demonstration universe",
        "This MVP simulates payment, production, shipping, and receipt. No physical product is manufactured or shipped. Characters are original procedural designs. The local concept engine uses deterministic rules, with an optional external AI provider.",
      ],
    ],
  },
  faq: {
    title: "A few little answers.",
    sections: [
      [
        "Do I need design experience?",
        "No. Describe an idea, pick a concept, and adjust it in the studio. Or start manually. You can rotate, zoom, change colors, and experiment with accessories.",
      ],
      [
        "How does matching work?",
        "An administrator starts a round when at least three eligible participants are waiting. Everyone sends one toy and receives one toy, without receiving their own. We try to avoid previous pairings.",
      ],
      [
        "Is payment real?",
        "No. All prices are fictional demo values, and all payments are simulated. Never enter real card or banking information.",
      ],
      [
        "When can I see my surprise?",
        "After an administrator simulates delivery, you confirm receipt to unlock your incoming toy and its private message.",
      ],
      [
        "Can I change a finalized toy?",
        "Drafts are editable. Finalization locks the design so the exact configuration is preserved throughout the exchange.",
      ],
    ],
  },
  privacy: {
    title: "A little care for your privacy.",
    sections: [
      [
        "Demo data",
        "The app stores your email, pseudonym, hashed password, sessions, designs, simulated payment states, exchanges, notifications, and audit events in the configured database. Use a pseudonym and test information. No shipping address or banking details are needed.",
      ],
      [
        "What others see",
        "Your creator pseudonym and toy design become public after receipt. Your email and payment data remain private. Only the creator, recipient after receipt, and authorized moderators can access the secret message.",
      ],
      [
        "Optional AI",
        "If an external provider is configured, your design prompt, mood, and palette are sent to that provider. API keys stay on the server. Without a configured provider, generation runs locally.",
      ],
      [
        "Cookies and retention",
        "A session cookie keeps you signed in. Demo records persist until the operator removes the database. This local demonstration has no analytics or advertising cookies. Production retention, deletion requests, and operator contact details must be established before a public launch.",
      ],
    ],
  },
  terms: {
    title: "A few thoughtful ground rules.",
    sections: [
      [
        "A simulated experience",
        "SoulToy is a demonstration, not a commercial offer. Payments, manufacturing, and delivery are fictional. No real goods or charges result from participation.",
      ],
      [
        "Create with kindness",
        "Create original characters and messages. Do not submit private information, abusive content, or someone else’s protected character design. Administrators may moderate content and suspend misuse.",
      ],
      [
        "Your creations",
        "Your finalized configuration stays fixed. Once assigned, a toy is not reassigned to another recipient, including cancelled assignments. The demonstration has no refund or financial transaction system.",
      ],
      [
        "Before production launch",
        "Commercial terms, privacy processes, manufacturing safety, payment integration, and shipping operations need separate implementation and review.",
      ],
    ],
  },
};
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <div className="section-wrap page-content info-content">
      <div className="page-heading">
        <span className="eyebrow">SOULTOY · {slug.toUpperCase()}</span>
        <h1>{page.title}</h1>
      </div>
      {page.sections.map(([h, p]) => (
        <section key={h}>
          <h2>{h}</h2>
          <p>{p}</p>
        </section>
      ))}
    </div>
  );
}
