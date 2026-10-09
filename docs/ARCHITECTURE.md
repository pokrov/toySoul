# SoulToy architecture

SoulToy is a single Next.js App Router application, with strict TypeScript, React 19, Tailwind 4, a shadcn-style Radix button primitive, Motion, Lucide, R3F/Drei and Zustand. Prisma 7 connects to MySQL 8 through its MariaDB driver adapter. Better Auth provides password hashing, database sessions, cookies and authentication CSRF handling. No microservices or paid external services are required.

## Boundaries

- src/lib/design.ts: bounded Zod configuration and deterministic local concepts.
- src/lib/generator.ts: provider interface, optional OpenAI-compatible adapter, validated fallback.
- src/lib/rules.ts: pure eligibility, permutation and lifecycle rules.
- src/lib/services.ts: ownership, locking, payments, matching, notifications, receipt and audit transactions.
- src/lib/http.ts: session lookup, current account/role checks, same-origin enforcement, bounded input and errors.
- src/app/api: small HTTP adapters; business rules live in services.
- src/components/toy-model.tsx: original procedural 3D geometry.
- src/lib/studio-store.ts: editable configuration and undo/redo history.

## Persistence and concurrency

All writes affecting pool eligibility acquire the OperationLock(exchange) row with SELECT FOR UPDATE in the same Prisma transaction. The row is created by migration, not only by seeding. This serializes matching with finalization, payment, joining, moderation and suspension. Matching re-reads current eligibility after acquiring the lock. It persists round, assignments, queue consumption, notifications and audit atomically.

This intentionally conservative lock is appropriate for an MVP with a single queue. At larger scale, partition pools and acquire locks in a defined order. API rate limits are in-memory and therefore intended for a single application instance; a distributed deployment needs a shared limiter.

## Surprise policy

Incoming dashboard records contain lifecycle and simulated shipment details only. They contain no toy ID, design, name, sender ID or message. Public toy pages show a mystery until receipt, except to the creator. After receipt, the design and creator pseudonym are public. The secret remains available only to the creator, actual recipient, and authorized moderators. Server rendering applies the same policy; hidden secrets are not merely obscured with CSS.

## Studio persistence

Both concept creation and manual editing produce the same validated Design. Drafts autosave after 1.2 seconds; saves are serialized in the client and use an optimistic design version in the server. A stale tab receives HTTP 409. Finalization waits for the last save and then locks the design. Export uses the real WebGL canvas. Browser environments without WebGL receive a clearly labelled illustrated fallback.

## Rendering

The main hero and studio use live procedural 3D with reusable geometry patterns, soft lighting, display pedestal, orbit/zoom and contact shadows. Gallery/collection previews use lightweight procedural SVG illustrations. Canvas exports are persisted as bounded PNG data assets. Each character supports one accessory in this MVP. Reduced motion respects both OS preference and a studio toggle.

## Integrations

Payments and shipment updates are explicitly simulated, with no card or address fields. Future payment webhook adapters should call the same server-side eligibility and state services, with independent provider verification. Real manufacturing, tracking, mail, password recovery, provider image generation and automatic matching remain future work.

## Verification environment

The local machine had no Docker installation. Its existing XAMPP MariaDB 10.4 executable was used with a new workspace-owned data directory and loopback port 3307. No existing XAMPP data directory was modified. Docker Compose targets MySQL 8.4. MySQL-container execution requires Docker and should be included in CI before deployment.

## Dependency policy

The lockfile captures the verified package set. Prisma uses stable 7.x instead of the npm latest tag that pointed to an 8.x release candidate during implementation. Overrides select patched transitive versions of MariaDB, Hono, mysql2, valibot and deepmerge-ts. Re-run tests when updating them.
