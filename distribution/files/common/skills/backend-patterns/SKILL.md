---
name: backend-patterns
description: Review or design Node.js, Express, Next.js API, database, cache, and service-layer code when backend boundaries and failure behavior matter.
---

# Backend patterns

- Keep transport, validation, domain logic, persistence, and external integrations separable.
- Validate at trust boundaries and return stable error contracts without leaking sensitive internals.
- Make retries, idempotency, transaction boundaries, timeouts, and partial failure explicit where relevant.
- Avoid unbounded queries, hidden N+1 access, and cache behavior without invalidation rules.
- Prefer repository-native observability and dependency injection patterns over new framework layers.
- Test authorization, invalid input, dependency failure, and concurrency-sensitive paths proportionally to risk.
