# SoulToy

**Create a little soul. Send it into the world.**

A persisted designer-toy exchange MVP: original procedural 3D studio, deterministic concept generation, optional external AI, simulated checkout, transactional matching, delivery management, secret reveal, digital collection, QR identities and administration.

## Local setup

Requires Node 22.12 or newer, npm, and MySQL 8.4 (or a compatible MariaDB server).

1. Install dependencies: **npm ci**
2. Copy **.env.example** to **.env**.
3. Set DATABASE_URL, a random BETTER_AUTH_SECRET of at least 32 characters, and a DEMO_PASSWORD of at least 10 characters. The two application URL variables should match your local origin.
4. Start the database: **docker compose up -d db**
5. Generate the client: **npm run db:generate**
6. Apply migrations: **npm run db:migrate**
7. Create the demonstration: **npm run db:seed**
8. Start the app: **npm run dev**
9. Open [SoulToy](http://localhost:3000).

Generate a session secret with:

    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Never reuse demo credentials for a public deployment. No payment keys or real address data are needed.

## This workspace

The application is configured on localhost:3000. Because Docker was unavailable on this machine, a separate MariaDB data directory was created at .runtime/mysql and bound to 127.0.0.1:3307 using the existing XAMPP executable. The existing XAMPP database was not touched.

If that local database process stops, start it from PowerShell:

    Start-Process -FilePath 'C:\xampp\mysql\bin\mysqld.exe' -ArgumentList '--no-defaults','--basedir=C:/xampp/mysql','--datadir=C:/Users/4-SIG/Documents/CODES/ToySoul/.runtime/mysql','--port=3307','--bind-address=127.0.0.1','--max-allowed-packet=16M' -WindowStyle Hidden

The generated demo password is in the ignored local .env file under DEMO_PASSWORD. Admin defaults to **admin@soultoy.local**. Participant emails are **alice@soultoy.local**, **yassine@soultoy.local**, **sara@soultoy.local**, **noor@soultoy.local**, **milo@soultoy.local**, and **aya@soultoy.local**. All use that same configurable demo password.

The seed is non-destructive and skips an already populated demo. It creates 12 toys, 3 waiting entries, completed and active rounds, drafts, payments, notifications and collections.

## Commands

| Command                         | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| npm run dev                     | Development server                               |
| npm run build                   | Prisma generation and production compilation     |
| npm start                       | Serve the production build                       |
| npm run typecheck               | Strict TypeScript validation                     |
| npm run test:prepare            | Create/migrate isolated soultoy_test database    |
| npm test                        | Unit, integration and database concurrency tests |
| npm run test:e2e:prepare        | Create/migrate isolated soultoy_e2e database     |
| npx playwright install chromium | Install the browser used for testing             |
| npm run test:e2e                | Full three-user UI exchange and mobile checks    |
| npm run db:migrate              | Apply versioned schema migrations                |
| npm run db:seed                 | Create demonstration records                     |

Test database preparation requires CREATE DATABASE permission. It never drops the main database. Tests preserve records with unique run identifiers. A failed test can leave waiting participants in the test database; finish or remove only those test records before a subsequent matching test.

## Product tour

- **/** — interactive 3D hero, process, original concepts and surprise story
- **/studio** — local/external concept generation, live 3D editing, autosave, undo/redo, export
- **/dashboard** — drafts, sent souls, waiting room, incoming mystery and collection
- **/checkout/:id** — explicit simulated successful/failed/cancelled payments and pool entry
- **/reveal/:matchId** — recipient-only confirmation, animated opening and secret reveal
- **/toy/:publicId** — permanent collectible identity with QR and enforced reveal policy
- **/admin** — real database statistics, moderation, matching, shipping and audit

## Docker deployment

Compose starts MySQL only so local development stays simple. The included Dockerfile builds the Next.js server:

    docker compose up -d db
    docker build -t soultoy .

For an application container, attach it to the Compose network, set DATABASE_URL to the db service hostname, and provide BETTER_AUTH_SECRET, BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL through your deployment secret system. Run migrations as a release step before starting the application. Build itself does not require a reachable database. Terminate HTTPS at your hosting platform; Better Auth uses secure cookies in production. Bind the development database only to loopback.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Matching algorithm](docs/MATCHING_ALGORITHM.md)
- [Concept generation](docs/AI_TOY_GENERATION.md)
- [API](docs/API.md)
- [Demo walkthrough](docs/DEMO_SCENARIO.md)
- [Roadmap and deliberate limits](docs/ROADMAP.md)

Payments, production and shipping are simulated. Default generation is a local deterministic engine, not a real AI model. Optional provider image generation, real commerce, email recovery and production operating policies remain outside this MVP.
