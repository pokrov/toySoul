# Matching algorithm

1. Authenticate a non-suspended ADMIN and validate a bounded request key.
2. Begin a Read Committed transaction; acquire OperationLock(exchange) with FOR UPDATE.
3. Return the existing round if that request key has already succeeded.
4. Read waiting entries and revalidate ownership, READY design, PAID payment, no prior assignment, active user and unmoderated toy.
5. Require at least max(3, MIN_PARTICIPANTS) eligible participants.
6. Use a Fisher–Yates shuffle driven by Node crypto randomness.
7. Assign each participant's toy to the next participant, wrapping the last to the first.
8. Try up to 80 shuffles, retaining the cycle with fewest historical directed pairings; stop early at zero.
9. Write the exchange, every match, consumed queue entry, notifications and audit within the same transaction.

One cycle of length at least three guarantees one send and receive per participant, no self-assignment, no duplicated toy, and no direct reciprocal pair. Repeated-pair avoidance is best effort: a zero-repeat permutation may be impossible, and bounded random search is not an optimizer.

Concurrent distinct keys serialize. The winner consumes the queue. The next request sees the updated queue and rejects if fewer than three remain; no partial round is written. Concurrent identical keys return the same committed round. Unique indexes are the final backstop.

All participating writers take the same lock. This is essential: locking matching alone would not protect against simultaneous suspension or payment eligibility changes.

Tests cover 3, 4, 6 and 25 participants, duplicate rejection, past-pair avoidance, idempotency and actual concurrent database calls.
