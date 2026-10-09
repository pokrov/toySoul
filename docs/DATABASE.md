# Database

Prisma's mysql datasource targets MySQL 8.4 in Compose. Checked-in migrations create all tables, indexes, foreign keys, the operation lock, and the no-self-assignment check constraint.

| Entity                           | Purpose and invariants                                                         |
| -------------------------------- | ------------------------------------------------------------------------------ |
| User                             | Unique email; public pseudonym; server-controlled role and suspension          |
| Account / Session / Verification | Better Auth credential hash and persistent session lifecycle                   |
| Toy                              | One creator; DRAFT or READY only; unique public identifier at finalization     |
| ToyDesign                        | One configuration per toy in application-created records; optimistic version   |
| ToyAsset                         | Optional persisted PNG canvas preview                                          |
| SecretMessage                    | One bounded secret per toy                                                     |
| Payment                          | One simulated payment per toy; owner, integer MAD total, status history        |
| ExchangePoolEntry                | Unique toy; nullable unique activeUserId prevents two waiting entries per user |
| Exchange                         | A round; globally unique idempotency request key                               |
| Match                            | Unique toy globally; unique sender and recipient per round; no self-assignment |
| Shipment                         | Unique match and simulated tracking identifier; city/country only              |
| CollectionEntry                  | Unique match and recipient ownership; persisted reveal timestamp               |
| Notification                     | Recipient, type, text, related entity, read state and timestamp                |
| AdminAuditLog                    | Administrator, action, entity and structured details                           |
| OperationLock                    | Stable row used for transactional serialization                                |

The pool is a queue, not an exchange-round entity. Consumed entries remain MATCHED, and activeUserId becomes null. New toys from previous participants can join later rounds.

## Lifecycle

MATCHED → PRODUCTION → SHIPPED → DELIVERED → RECEIVED → COMPLETED

Administrators advance the first three transitions. Only the assigned recipient can confirm receipt. Receipt, collection entry, RECEIVED and COMPLETED history events, notifications, and round completion are committed together. Admin cancellation is permitted only from MATCHED or PRODUCTION. Cancelled toys remain assigned and cannot be re-entered. A round with any cancellation becomes CANCELLED once all remaining assignments are terminal; it is never falsely marked COMPLETED.

Paid payments are immutable through the demo API. Failed/cancelled attempts can be retried. ToyStatus never contains payment, queue or shipment statuses.

## Cross-table rules

FKs and unique constraints enforce relationships and uniqueness. The service transaction enforces toy ownership, payment ownership, current suspension/moderation, paid/finalized eligibility and correct collection recipient. All administration changes that affect eligibility share the matching lock.

## Test databases

The test:prepare script creates soultoy_test; test:e2e:prepare creates soultoy_e2e using the host/credentials from DATABASE_URL. Preparation never drops databases. Its account needs CREATE DATABASE permission. In restricted environments, provision these two databases separately and apply migrations with their URLs.

## Existing-design deviations

The repository was empty; no existing UML, MLD or SQL documents were present. Secret content lives separately from design JSON. A user's name is their displayed creator pseudonym. A singleton lock and JSON status histories are deliberate MVP simplifications.
