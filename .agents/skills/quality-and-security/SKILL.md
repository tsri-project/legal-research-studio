---
name: quality-and-security
description: Validate legal research app correctness, security, data isolation, import/export and release readiness. Use for QA, API changes, persistence or security reviews.
---

# Quality and security validation
1. Read AGENTS.md and current tests; identify the changed trust boundary.
2. Verify shared validation rejects invalid shapes, duplicate IDs, invalid links, oversized records and formula-injection CSV values.
3. Verify Worker behavior for missing/expired/wrong-audience JWTs, spoofed headers, foreign origins and unsupported methods. Never use unsigned JWT decoding as authentication.
4. Verify owner isolation for reads and writes and CAS revision conflicts. Use two real Access identities for release acceptance; mocks alone do not prove deployed isolation.
5. Exercise create/edit/delete and reload persistence, import rejection without data loss, backup restoration, and browser quota errors.
6. Run npm run check and Worker dry-run packaging. After database changes, apply migrations to local D1 and exercise the actual API, including stale revision writes.
7. Record observed results and untested boundaries. Distinguish automated unit tests, local integration tests and live acceptance tests.
8. Treat full document storage, team permissions, audit history, encrypted local storage, malware scanning and AI grounding as separate capabilities until implemented and verified.
