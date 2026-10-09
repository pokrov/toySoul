# HTTP API

JSON responses; errors use an error string property. Session cookies are provided by Better Auth. All application writes require the configured same-origin Origin header. Private responses use Cache-Control: no-store.

| Method   | Route              | Access / operation                                                        |
| -------- | ------------------ | ------------------------------------------------------------------------- |
| GET/POST | /api/auth/*        | Better Auth sign-up, sign-in, sign-out and sessions                       |
| POST     | /api/generate      | Signed in; prompt, mood, optional color → three concepts + provider label |
| POST     | /api/toys          | Owner; optional id/version, config, secret, preview; saves draft          |
| GET      | /api/toys/:id      | Owner-only complete editable record                                       |
| POST     | /api/toys/:id      | action: finalize → public identity and pending payment                    |
| POST     | /api/toys/:id      | action: pay, status: PAID/FAILED/CANCELLED → simulated result             |
| POST     | /api/toys/:id      | action: join → enters eligible toy into pool                              |
| GET      | /api/dashboard     | Owned toys, sent progress, redacted incoming, collection, notices         |
| GET      | /api/notifications | Current user's latest 50 notices                                          |
| POST     | /api/notifications | Optional id; marks one owned notice or all owned notices read             |
| POST     | /api/matches/:id   | status; admin sequence or recipient RECEIVED                              |
| GET      | /api/admin         | ADMIN only: operations, queue, matches, notifications, audit              |
| POST     | /api/admin         | action: match, requestKey → atomic idempotent round                       |
| POST     | /api/admin         | action: suspend, id, value → participant suspension                       |
| POST     | /api/admin         | action: moderate, id, value, optional name/story/secret → holds/edits toy |

Common status codes: 400 invalid input/state; 401 no session; 403 role/origin/suspension failure; 404 inaccessible record; 409 uniqueness or stale version; 413 oversized body; 429 request limit; 500 unexpected failure without internal details.

There is no endpoint that returns an unrevealed incoming design to its recipient. Public /toy/:publicId is a server-rendered page with the surprise policy applied before serialization.
