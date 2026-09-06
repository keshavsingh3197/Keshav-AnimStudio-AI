# Security notes for AnimStudio AI

## Secrets: what they are and where they live

| Secret | Configuration key | Where it belongs |
| --- | --- | --- |
| MongoDB connection string | `Mongo:ConnectionString` | user-secrets, or `Mongo__ConnectionString` |
| Object store credentials (when not `Local`) | `Storage:*` | user-secrets / environment |
| AI provider API keys | `Ai:Secrets:{providerId}` | user-secrets / `Ai__Secrets__groq`, or set through the admin API into the encrypted store |
| Credential-store data key | `Encryption:DataKey` | user-secrets, or `Encryption__DataKey` (only needed if keys are stored in the database rather than supplied by the host) |
| JWT signing key (P9) | `Jwt:SigningKey` | user-secrets, or `Jwt__SigningKey` |

Nothing in the table above may appear in `appsettings.json`, `appsettings.Development.json`,
a Dockerfile, a test fixture, a comment or a log line.

Local setup:

```bash
cd backend/AnimStudio.Api
dotnet user-secrets set "Mongo:ConnectionString" "mongodb://localhost:27017"
```

The API refuses to start without a connection string and tells you this, rather than
failing later with a driver timeout that looks like a network problem.

## Known exposure — rotate this credential

A live MongoDB Atlas SRV connection string, including its username and password, was
committed to `backend/AnimStudio.Api/appsettings.json` in commit `9ac6fa2`
("Phase 1 completed") and removed from the working tree afterwards.

**Removing it from the file does not remove it from git history.** Anyone with a clone of
this repository still has the password. Required actions:

1. Rotate the Atlas database user's password (or delete the user and create a new one).
2. Review the Atlas access log for connections you do not recognise.
3. Restrict the cluster's IP access list — a default of `0.0.0.0/0` turns a leaked
   password into an open database.
4. Do not reissue the old password.

Rewriting history (`git filter-repo`) is optional and only worth doing before the
repository is shared more widely; rotation is what actually closes the exposure.

## Preventing the next one

`.githooks/pre-commit` scans staged files for connection strings with inline credentials
and for common API-key shapes. It is not installed automatically — opt in with:

```bash
git config core.hooksPath .githooks
```

The hook is a backstop, not a control. The control is that secrets are read from
user-secrets and environment variables, and that configuration files ship empty.

## Reporting

Security issues in this repository: open a private issue or contact the repository owner
directly. Do not include a working credential or a reproduction that exfiltrates data in
a public report.
