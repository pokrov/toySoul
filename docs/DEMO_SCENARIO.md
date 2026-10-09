# Demonstration walkthrough

Seed first with npm run db:seed. All demo accounts use DEMO_PASSWORD in your local .env. Admin email is configurable with DEMO_ADMIN_EMAIL; default admin@soultoy.local. Participants: alice@soultoy.local, yassine@soultoy.local, sara@soultoy.local, noor@soultoy.local, milo@soultoy.local and aya@soultoy.local.

## Quick seeded tour

1. Open the homepage; drag the live Moonwhisp model.
2. Sign in as Alice. Her collection already contains a received soul and her next toy is waiting.
3. Visit Studio, describe “A lonely little purple creature that collects stars,” and generate three concepts.
4. Customize its body, face and accessory; inspect it from behind. Enter Lumi and a kind secret. Save a draft, reload it from My Studio, then finalize.
5. Try a failed demo payment, then success. Alice already has a waiting entry, so her second entry is correctly rejected until the current round is matched.
6. In a separate browser profile, sign in as admin. The pool contains Alice, Yassine and Sara. Run Matching.
7. Open Shipments and advance each new match through production, shipping and delivery.
8. Sign in as each recipient. Incoming Mystery shows progress without its design. Confirm receipt and open the box.
9. Observe the revealed character, pseudonym, story, secret, permanent collection and digital QR identity.
10. Return to admin: the round becomes COMPLETED only after all recipients confirm.

No real charge, product or shipment is produced.

## Automated clean three-user demonstration

    npm run test:e2e:prepare
    npx playwright install chromium
    npm run test:e2e

Playwright starts a separate Next.js instance on port 3001 against soultoy_e2e. It registers three new users through the UI, generates and edits toys, saves/finalizes, simulates payment, joins the pool, runs admin matching/shipping, and confirms each reveal through the browser. It checks distinct toys/recipients, ownership, CSRF, pre-reveal secrecy, idempotent matching replay, notifications and collections. A second test checks mobile landing and studio.

The test-results directory contains desktop studio/reveal and full-page mobile captures. HTML results are in playwright-report. Database concurrency with distinct matching request keys is additionally tested in Vitest.
