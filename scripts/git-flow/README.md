# git-flow: ship

One command for the branch → commit → push → PR → merge → next branch loop. The folder is
self-contained: copy `scripts/git-flow/` into any GitHub repo and it works. Owner, repo, host and
default branch are read from the git remote, so there is nothing to configure.

| File | Use it from |
| --- | --- |
| `ship.cmd` | Windows: double-click, or `scripts\git-flow\ship.cmd -m "message"` |
| `ship.ps1` | PowerShell 5.1 or 7 (Windows, macOS, Linux) |
| `ship.sh` | bash: macOS, Linux, WSL, Git Bash |

## What one run does

1. **Gets you off the default branch.** On `master`/`main`, or on a detached HEAD, your work moves
   to a new branch. Uncommitted changes come along, and so do local commits made on the default
   branch by mistake (the default branch is then reset to the remote, and nothing is lost).
2. **Commits everything.** It shows `git status`, asks for a message (blank = timestamp) and asks
   before running `git add -A`. Pre-commit hooks still run; if one fails, nothing is pushed.
3. **Pushes and opens a PR**, or reuses the open PR for this branch. The PR body lists the commits
   followed by the repo's PR template, if there is one.
4. **Waits for the merge.** It opens the PR in your browser and checks it every 20 s. With
   `--merge squash` (or `merge`/`rebase`) it merges the PR itself as soon as GitHub allows it.
5. **Starts the next branch.** It checks out the default branch, pulls, deletes the merged local
   branch (only if it has nothing beyond the merged commit) and switches to a new branch.

Re-running is always safe. Ctrl+C while it waits, then run it again to pick up the same PR. On a
branch whose PR already merged, it skips straight to step 5.

## Examples

```bash
scripts/git-flow/ship.sh -m "Fix login redirect"           # full loop, manual merge in browser
scripts/git-flow/ship.sh -m "Bump deps" --merge squash -y  # hands-off
scripts/git-flow/ship.sh --no-wait                         # stop once the PR is open
scripts/git-flow/ship.sh --new                             # just get a fresh branch from latest main
scripts/git-flow/ship.sh --new --name fix-header           # ...with a chosen name
```

```powershell
.\scripts\git-flow\ship.ps1 -m "Fix login redirect"
.\scripts\git-flow\ship.ps1 -m "Bump deps" -Merge squash -Yes
.\scripts\git-flow\ship.ps1 -New -Style sequential -Prefix Anim
```

| bash | PowerShell | Meaning |
| --- | --- | --- |
| `-m, --message` | `-Message` / `-m` | Commit message and PR title |
| `--new` | `-New` | Only switch to a fresh branch from the updated default branch |
| `--name` | `-Name` | Name for the branch this run creates (must not exist) |
| `--style` | `-Style` | `nickname` (default, `brave-otter`), `sequential` (`work-001`), `date` (`20261101-1830`) |
| `--prefix` | `-Prefix` | Prefix such as `feature/` or `Anim` |
| `--merge` | `-Merge` | `none` (default), `squash`, `merge`, `rebase` |
| `--no-wait` | `-NoWait` | Stop after the PR is opened |
| `--no-browser` | `-NoBrowser` | Do not open the PR page |
| `--keep-branch` | `-KeepBranch` | Keep the local branch after the merge |
| `-y, --yes` | `-Yes` / `-y` | Do not ask before staging everything |
| `--poll` | `-PollSeconds` | Seconds between status checks |

## Branch names never collide

Every new name is checked against local branches **and** the live remote (`git ls-remote`).
Nicknames are re-rolled until one is free; dates get a `-2`, `-3` suffix. Sequential numbering
also reads PR history, so a number is never reused even after GitHub deletes merged branches.

## Per-repo defaults

Copy `ship.config.example` to `ship.config` in this folder and set what you need, for example
`BRANCH_STYLE=sequential` + `BRANCH_PREFIX=Anim` to keep an `Anim001, Anim002…` scheme. The
config file is plain `KEY=value`; it is parsed, never executed.

## Requirements and auth

- `git`, plus `curl` and either `jq` or Python for `ship.sh`. `ship.ps1` needs nothing extra.
- GitHub API access is found automatically, first match wins: the `GH_TOKEN`/`GITHUB_TOKEN`
  environment variable, `gh auth token` (GitHub CLI), or the login Git already uses for HTTPS
  (Git Credential Manager). The token is never printed. In bash it is passed to curl through
  stdin, so it doesn't appear in the process list.
- The `gh` CLI is **not** required.
- GitHub Enterprise works too; SSH host aliases from `~/.ssh/config` are treated as github.com
  unless you set `GITHUB_HOST`.
