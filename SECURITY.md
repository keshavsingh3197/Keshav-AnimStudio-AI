# Security Policy for AnimStudio AI

We take the security of AnimStudio AI seriously. This document outlines our security policies, how to report vulnerabilities, and guidelines for managing secrets and credentials during local development and production deployments.

---

## Reporting a Vulnerability

If you discover a security vulnerability in this repository, please **do not open a public issue**. Instead, please report it responsibly:

- **Email**: Send details to [keshavsingh3197@gmail.com](mailto:keshavsingh3197@gmail.com)
- **GitHub**: Use the [Private Security Advisory](https://github.com/keshavsingh3197/Keshav-AnimStudio-AI/security/advisories/new) feature on GitHub.

Please include:
1. Description of the vulnerability.
2. Steps to reproduce the issue (proof-of-concept scripts, HTTP requests, etc.).
3. Potential impact and attack vectors.
4. Suggested remediation if available.

We will acknowledge receipt of your report within 48 hours and work with you to remediate and coordinate public disclosure once patched.

---

## Secrets & Configuration Management

**Never commit passwords, API keys, private tokens, or database connection strings to source control.**

| Secret | Configuration Key | Where It Belongs |
| --- | --- | --- |
| **Database Connection String** | `Mongo:ConnectionString` or `SqlServer:ConnectionString` | .NET User Secrets or environment variable (`Mongo__ConnectionString` / `SqlServer__ConnectionString`) |
| **Object Store Credentials** | `Storage:*` | .NET User Secrets or environment variable |
| **AI Provider API Keys** | `Ai:Secrets:{providerId}` | .NET User Secrets, environment variables (e.g., `Ai__Secrets__groq`), or Admin API |
| **Credential-Store Data Key** | `Encryption:DataKey` | .NET User Secrets or `Encryption__DataKey` |

All configuration files (`appsettings.json`, `appsettings.Development.json`) ship with empty secret values by default.

### Setting Up Secrets Locally

Run from `backend/AnimStudio.Api`:

```bash
# For MongoDB:
dotnet user-secrets set "Mongo:ConnectionString" "mongodb://localhost:27017"

# Or for SQL Server:
dotnet user-secrets set "SqlServer:ConnectionString" "Server=localhost;Database=AnimStudioDb;Trusted_Connection=True;TrustServerCertificate=True;"

# Optional: Add an AI Provider Key (e.g. Groq):
dotnet user-secrets set "Ai:Secrets:groq" "your_groq_api_key_here"
```

---

## Secret Scanning & Pre-Commit Hook

We provide a pre-commit hook in `.githooks/pre-commit` that scans staged files for common API key formats (OpenAI, Google, Groq, Hugging Face, GitHub PATs) and connection strings with inline passwords.

To enable the hook locally:

```bash
git config core.hooksPath .githooks
```

---

## Sanitization Status

The Git history of this repository has been comprehensively rewritten and verified with `git-filter-repo`. All historic credentials and connection strings have been permanently eradicated.
