# Remaining work before a public launch

This MVP prioritizes the complete persisted exchange. Deliberate scope boundaries:

- Real payments, refunds, manufacturing, shipping and address storage are absent.
- External AI structured concepts have an adapter and deterministic fallback, but need live provider verification with operator credentials.
- Optional AI concept illustration generation is not implemented.
- One original character family has three body shapes; archetype influences features. Separate sculpted mesh families are future work.
- One accessory per toy; attachment collision avoidance across simultaneous accessories is future work.
- Gallery uses illustrated procedural previews; the studio is real 3D. Studio PNGs can be exported and persisted.
- Email/password sessions are implemented; password recovery, email verification/delivery, social sign-in and self-deletion are future work.
- In-memory rate limits suit one server. Shared limiting, paginated administration and partitioned locks are needed at scale.
- Simple abuse checks and human moderation exist; comprehensive multilingual moderation is future work.
- Browser tests target Chromium. Expand Safari/Firefox, screen-reader and low-end GPU coverage.
- Compose targets MySQL 8.4. Executed local tests use isolated MariaDB 10.4 because Docker is unavailable. Add MySQL 8 container CI.
- Add observability, backups, recovery drills, retention controls and operator contact details.
- Cancelled assignments are terminal and never reassigned. Replacement/refund policy must precede real commerce.
