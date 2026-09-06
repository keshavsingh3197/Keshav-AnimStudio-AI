# P0 — Security remediation

**Why first:** `backend/AnimStudio.Api/appsettings.json` is tracked in git and contains a
live MongoDB Atlas SRV connection string, username and password. It has been in the
repository since commit `9ac6fa2` ("Phase 1 completed"). The file's own comment says the
value is a secret and must come from user-secrets — the comment is right and the value
next to it is the bug.

Removing it from the working tree does **not** un-publish it: it stays in git history.
The password has to be rotated.

---

## Actions

### A0.1 — Remove the credential from the tracked file
- Replace the `Mongo.ConnectionString` value with `""`.
- Keep `Mongo.Database`.

### A0.2 — Fail fast, with a useful message
- `AddAnimStudioInfrastructure` throws at startup when the connection string is blank,
  naming both supported sources:
  `dotnet user-secrets set "Mongo:ConnectionString" "..."` or `Mongo__ConnectionString`.
- Files: `backend/AnimStudio.Infrastructure/DependencyInjection.cs`.

### A0.3 — Rotate
- User action, not a code change: rotate the Atlas password, and if the cluster was
  publicly reachable, review Atlas access logs.
- Record in `SECURITY.md` that the previous credential is compromised and must not be
  reissued.

### A0.4 — Stop the next one
- `SECURITY.md`: what is a secret here (Mongo, AI provider keys, `Encryption__DataKey`),
  where each lives, and how to supply it locally.
- Optional pre-commit hook scanning staged files for `mongodb+srv://[^"]*:[^"@]*@`,
  `sk-[A-Za-z0-9]{20,}`, `AIza[0-9A-Za-z_-]{35}`, `gsk_[A-Za-z0-9]{20,}`.

---

## Acceptance
- `git grep -n 'mongodb+srv://.*:.*@'` returns nothing in the working tree.
- Starting the API with no configured connection string prints a clear, actionable error
  instead of a driver exception.
- `dotnet test` still passes.
