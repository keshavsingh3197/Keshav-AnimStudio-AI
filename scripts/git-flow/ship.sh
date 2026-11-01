#!/usr/bin/env bash
# Ship the current work as a GitHub pull request, wait for it to merge, then start a fresh branch.
#
# Repo-agnostic: owner, repo, host and default branch come from the git remote, so this folder can
# be copied into any GitHub repository unchanged. Same behaviour as ship.ps1; run with --help.
#
# Needs: git, curl, and jq or python (for reading GitHub's JSON).
# GitHub auth, first match wins: GH_TOKEN / GITHUB_TOKEN, `gh auth token`, then the login Git
# already uses for HTTPS (credential helper). The token is never printed or put on a command line.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ship.sh [options]

Commit everything, push, open (or reuse) a PR, wait for the merge, then switch to a fresh branch
cut from the updated default branch. Never commits on the default branch. Safe to re-run.

  -m, --message MSG     Commit message / PR title (prompted for when omitted)
      --new             Only move to a fresh branch from the latest default branch
      --name NAME       Explicit name for the branch this run creates
      --style STYLE     nickname (brave-otter) | sequential (work-001) | date (20261101-1830)
      --prefix PREFIX   Branch name prefix, e.g. feature/ or Anim
      --merge METHOD    none | squash | merge | rebase - merge the PR yourself once allowed
      --no-wait         Stop after the PR is opened
      --no-browser      Do not open the PR in a browser
      --keep-branch     Keep the local branch after its PR is merged
  -y, --yes             Do not ask before staging everything
      --poll SECONDS    How often to check the PR (default 20)
  -h, --help            Show this help

Per-repo defaults: ship.config next to this script (see ship.config.example).
EOF
}

# ---------------------------------------------------------------- output

if [ -t 1 ]; then C_STEP=$'\033[36m'; C_WARN=$'\033[33m'; C_ERR=$'\033[31m'; C_OK=$'\033[32m'; C_END=$'\033[0m'
else C_STEP=''; C_WARN=''; C_ERR=''; C_OK=''; C_END=''; fi
step() { printf '%s==> %s%s\n' "$C_STEP" "$1" "$C_END"; }
info() { printf '    %s\n' "$1"; }
warn() { printf '%s[!] %s%s\n' "$C_WARN" "$1" "$C_END" >&2; }
die()  { printf '%s[x] %s%s\n' "$C_ERR" "$1" "$C_END" >&2; exit 1; }

# ---------------------------------------------------------------- arguments

OPT_MESSAGE=''; OPT_NEW=0; OPT_NAME=''; OPT_STYLE=''; OPT_PREFIX=''; OPT_PREFIX_SET=0
OPT_MERGE=''; OPT_NO_WAIT=0; OPT_NO_BROWSER=0; OPT_KEEP=0; OPT_YES=0; OPT_POLL=''

need_value() { [ $# -ge 2 ] || die "Option $1 needs a value."; }
while [ $# -gt 0 ]; do
  case $1 in
    -m|--message) need_value "$@"; OPT_MESSAGE=$2; shift 2 ;;
    --new)        OPT_NEW=1; shift ;;
    --name)       need_value "$@"; OPT_NAME=$2; shift 2 ;;
    --style)      need_value "$@"; OPT_STYLE=$2; shift 2 ;;
    --prefix)     need_value "$@"; OPT_PREFIX=$2; OPT_PREFIX_SET=1; shift 2 ;;
    --merge)      need_value "$@"; OPT_MERGE=$2; shift 2 ;;
    --no-wait)    OPT_NO_WAIT=1; shift ;;
    --no-browser) OPT_NO_BROWSER=1; shift ;;
    --keep-branch) OPT_KEEP=1; shift ;;
    -y|--yes)     OPT_YES=1; shift ;;
    --poll)       need_value "$@"; OPT_POLL=$2; shift 2 ;;
    -h|--help)    usage; exit 0 ;;
    *)            usage >&2; die "Unknown option: $1" ;;
  esac
done

# ---------------------------------------------------------------- tools

command -v git >/dev/null 2>&1 || die 'git is not installed.'
command -v curl >/dev/null 2>&1 || die 'curl is not installed.'

JSON_TOOL=''
if command -v jq >/dev/null 2>&1; then
  JSON_TOOL=jq
else
  for py in python3 python; do
    # The Windows "python3" store alias exists but fails, so actually run it.
    if command -v "$py" >/dev/null 2>&1 && "$py" -c 'import json' >/dev/null 2>&1; then JSON_TOOL=$py; break; fi
  done
fi
[ -n "$JSON_TOOL" ] || die 'Need jq or python to read GitHub responses (or use ship.ps1 on Windows).'

# json_get JSON PATH - prints the value at a dotted path ("0.head.sha"); "#" prints the length.
# Missing values print as empty; booleans print as true/false.
json_get() {
  if [ "$JSON_TOOL" = jq ]; then
    local filter='.' seg
    if [ "$2" = '#' ]; then filter='length'
    else
      local IFS=.
      for seg in $2; do
        case $seg in *[!0-9]*) filter="$filter[\"$seg\"]" ;; *) filter="$filter[$seg]" ;; esac
      done
      filter="$filter | if . == null then \"\" else . end"
    fi
    printf '%s' "$1" | jq -r "$filter"
  else
    printf '%s' "$1" | "$JSON_TOOL" -c '
import json, sys
data = json.load(sys.stdin)
path = sys.argv[1]
if path == "#":
    print(len(data)); sys.exit()
for seg in path.split("."):
    if isinstance(data, list):
        i = int(seg); data = data[i] if i < len(data) else None
    elif isinstance(data, dict):
        data = data.get(seg)
    if data is None:
        break
print("" if data is None else str(data).lower() if isinstance(data, bool) else data)
' "$2"
  fi
}

json_str() {
  local s
  s=$(printf '%s' "$1" | tr -d '\000-\010\013\014\016-\037')
  s=${s//\\/\\\\}; s=${s//\"/\\\"}; s=${s//$'\n'/\\n}; s=${s//$'\r'/\\r}; s=${s//$'\t'/\\t}
  printf '"%s"' "$s"
}

# ---------------------------------------------------------------- repo discovery

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null) \
  || die 'Not inside a git repository (checked the current folder and the script folder).'
cd "$REPO_ROOT"

CFG_BRANCH_STYLE=''; CFG_BRANCH_PREFIX=''; CFG_BRANCH_PREFIX_SET=0; CFG_BASE_BRANCH=''; CFG_REMOTE=''
CFG_MERGE_METHOD=''; CFG_POLL_SECONDS=''; CFG_DELETE_MERGED=''; CFG_OPEN_BROWSER=''; CFG_GITHUB_HOST=''
if [ -f "$SCRIPT_DIR/ship.config" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    line=$(printf '%s' "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    case $line in ''|'#'*) continue ;; *=*) ;; *) continue ;; esac
    key=$(printf '%s' "${line%%=*}" | sed 's/[[:space:]]*$//' | tr '[:lower:]' '[:upper:]')
    val=$(printf '%s' "${line#*=}" | sed -e 's/^[[:space:]]*//' -e 's/^["'\'']//' -e 's/["'\'']$//')
    case $key in
      BRANCH_STYLE)  CFG_BRANCH_STYLE=$val ;;
      BRANCH_PREFIX) CFG_BRANCH_PREFIX=$val; CFG_BRANCH_PREFIX_SET=1 ;;
      BASE_BRANCH)   CFG_BASE_BRANCH=$val ;;
      REMOTE)        CFG_REMOTE=$val ;;
      MERGE_METHOD)  CFG_MERGE_METHOD=$val ;;
      POLL_SECONDS)  CFG_POLL_SECONDS=$val ;;
      DELETE_MERGED) CFG_DELETE_MERGED=$val ;;
      OPEN_BROWSER)  CFG_OPEN_BROWSER=$val ;;
      GITHUB_HOST)   CFG_GITHUB_HOST=$val ;;
      *) warn "ship.config: ignoring unknown key '$key'." ;;
    esac
  done < "$SCRIPT_DIR/ship.config"
fi

STYLE=${OPT_STYLE:-${CFG_BRANCH_STYLE:-nickname}}
case $STYLE in nickname|sequential|date) ;; *) die "Style must be nickname, sequential or date (got '$STYLE')." ;; esac
if [ "$OPT_PREFIX_SET" = 1 ]; then PREFIX=$OPT_PREFIX
elif [ "$CFG_BRANCH_PREFIX_SET" = 1 ]; then PREFIX=$CFG_BRANCH_PREFIX
elif [ "$STYLE" = sequential ]; then PREFIX='work-'
else PREFIX=''; fi
MERGE_METHOD=${OPT_MERGE:-${CFG_MERGE_METHOD:-none}}
case $MERGE_METHOD in none|squash|merge|rebase) ;; *) die "Merge method must be none, squash, merge or rebase (got '$MERGE_METHOD')." ;; esac
POLL=${OPT_POLL:-${CFG_POLL_SECONDS:-20}}
case $POLL in ''|*[!0-9]*) die "Poll interval must be a number of seconds (got '$POLL')." ;; esac
[ "$POLL" -ge 5 ] || POLL=5
[ "$CFG_DELETE_MERGED" = false ] && OPT_KEEP=1
[ "$CFG_OPEN_BROWSER" = false ] && OPT_NO_BROWSER=1

REMOTES=$(git remote)
[ -n "$REMOTES" ] || die 'This repository has no git remote.'
if [ -n "$CFG_REMOTE" ]; then REMOTE=$CFG_REMOTE
elif printf '%s\n' "$REMOTES" | grep -qx origin; then REMOTE=origin
else REMOTE=$(printf '%s\n' "$REMOTES" | head -n 1); fi
printf '%s\n' "$REMOTES" | grep -qxF "$REMOTE" || die "Remote '$REMOTE' does not exist."

REMOTE_URL=$(git remote get-url "$REMOTE")
url=${REMOTE_URL%/}; url=${url%.git}
case $url in
  *://*)
    rest=${url#*://}; rest=${rest#*@}
    GIT_HOST=${rest%%/*}; GIT_HOST=${GIT_HOST%%:*}; REPO_PATH=${rest#*/} ;;
  *:*)
    rest=${url#*@}
    GIT_HOST=${rest%%:*}; REPO_PATH=${rest#*:} ;;
  *) die "Cannot parse remote URL '$REMOTE_URL'." ;;
esac
case $REPO_PATH in */*/*|/*|*/|'') die "Remote '$REMOTE_URL' does not look like a GitHub owner/repo URL." ;; */*) ;; *) die "Remote '$REMOTE_URL' does not look like a GitHub owner/repo URL." ;; esac
OWNER=${REPO_PATH%%/*}; REPO=${REPO_PATH#*/}
if [ -n "$CFG_GITHUB_HOST" ]; then GIT_HOST=$CFG_GITHUB_HOST
else
  # ssh.github.com is GitHub's port-443 endpoint; a dot-less host is an ~/.ssh/config alias.
  case $GIT_HOST in ssh.github.com) GIT_HOST=github.com ;; *.*) ;; *) GIT_HOST=github.com ;; esac
fi
if [ "$GIT_HOST" = github.com ]; then API_BASE=https://api.github.com; else API_BASE="https://$GIT_HOST/api/v3"; fi

# ---------------------------------------------------------------- default branch

base_branch() {
  [ -n "$CFG_BASE_BRANCH" ] && { printf '%s' "$CFG_BASE_BRANCH"; return; }
  local ref
  # Ask the remote first: the local origin/HEAD is only set at clone time and goes stale.
  ref=$(git ls-remote --symref "$REMOTE" HEAD 2>/dev/null \
    | awk '$1 == "ref:" && $3 == "HEAD" { sub("^refs/heads/", "", $2); print $2 }' || true)
  [ -n "$ref" ] && { printf '%s' "$ref"; return; }
  ref=$(git symbolic-ref -q --short "refs/remotes/$REMOTE/HEAD" 2>/dev/null || true)
  [ -n "$ref" ] && { printf '%s' "${ref#"$REMOTE"/}"; return; }
  for candidate in main master; do
    git rev-parse -q --verify "refs/remotes/$REMOTE/$candidate" >/dev/null && { printf '%s' "$candidate"; return; }
  done
  die "Cannot work out the default branch of '$REMOTE'. Set BASE_BRANCH in ship.config."
}

# ---------------------------------------------------------------- GitHub API

TOKEN=''
github_token() {
  [ -n "$TOKEN" ] && return
  TOKEN=${GH_TOKEN:-${GITHUB_TOKEN:-}}
  if [ -z "$TOKEN" ] && command -v gh >/dev/null 2>&1; then
    TOKEN=$(gh auth token --hostname "$GIT_HOST" 2>/dev/null || true)
  fi
  if [ -z "$TOKEN" ]; then
    TOKEN=$(printf 'protocol=https\nhost=%s\n\n' "$GIT_HOST" \
      | GIT_TERMINAL_PROMPT=0 git credential fill 2>/dev/null | sed -n 's/^password=//p' | tr -d '\r' || true)
  fi
  [ -n "$TOKEN" ] || die "No GitHub credentials for $GIT_HOST. Set GH_TOKEN, run 'gh auth login', or push once over HTTPS so your credential helper saves a login."
}

# github_api METHOD PATH [JSON_BODY] - response in API_BODY, failure text in API_ERROR.
API_BODY=''; API_ERROR=''
github_api() {
  github_token
  local method=$1 path=$2 body=${3-} out code
  local args=(-sS --proto =https --tlsv1.2 -X "$method" -w '\n%{http_code}'
    -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' -H 'User-Agent: git-flow-ship')
  [ -n "$body" ] && args+=(-H 'Content-Type: application/json; charset=utf-8' --data-binary "$body")
  # The auth header goes through stdin so the token never shows in the process list.
  out=$(printf 'header = "Authorization: Bearer %s"\n' "$TOKEN" | curl "${args[@]}" --config - "$API_BASE/$path") \
    || { API_ERROR="GitHub API $method $path: network error"; return 1; }
  code=${out##*$'\n'}; API_BODY=${out%$'\n'*}
  if [ "$code" -ge 300 ] 2>/dev/null; then
    API_ERROR="GitHub API $method $path failed ($code): $(json_get "$API_BODY" message 2>/dev/null || true)"
    return 1
  fi
}

urlencode() {
  local s=$1 out='' c i
  for ((i = 0; i < ${#s}; i++)); do
    c=${s:i:1}
    case $c in [a-zA-Z0-9._~-]) out+=$c ;; *) out+=$(printf '%%%02X' "'$c") ;; esac
  done
  printf '%s' "$out"
}

# pulls_for BRANCH STATE - list of PRs whose head is OWNER:BRANCH, in API_BODY.
pulls_for() {
  github_api GET "repos/$OWNER/$REPO/pulls?head=$(urlencode "$OWNER:$1")&state=$2&per_page=100" || die "$API_ERROR"
}

# ---------------------------------------------------------------- branch names

ADJECTIVES=(agile amber bold brave bright calm clever cosmic crisp daring eager fancy fierce gentle golden
  happy jolly keen lucky mellow mighty nimble noble proud quick quiet rapid shiny silent sunny swift tidy
  vivid witty zesty)
ANIMALS=(badger bison cobra condor cougar dolphin eagle falcon ferret gecko heron ibis jaguar koala lemur
  lynx marten narwhal ocelot otter panda pelican puffin quokka raven salmon tapir tiger toucan walrus
  wombat yak zebra)

# Every branch name in use locally or on the remote, one per line.
taken_names() {
  git for-each-ref --format='%(refname:lstrip=2)' refs/heads
  local heads
  heads=$(git ls-remote --heads "$REMOTE") || die "Cannot list branches on '$REMOTE' (offline or no access)."
  printf '%s\n' "$heads" | sed -n 's#.*refs/heads/##p'
}
is_taken() { printf '%s\n' "$TAKEN" | grep -qixF -- "$1"; }

assert_new_branch_name() {
  git check-ref-format --branch "$1" >/dev/null 2>&1 || die "'$1' is not a valid branch name."
  TAKEN=$(taken_names)
  if is_taken "$1"; then die "Branch '$1' already exists locally or on '$REMOTE'."; fi
}

# Sets BRANCH_NAME to an unused name (--name is used once, for the first branch this run creates).
new_branch_name() {
  if [ -n "$OPT_NAME" ]; then
    BRANCH_NAME=$OPT_NAME; OPT_NAME=''
    assert_new_branch_name "$BRANCH_NAME"
    return
  fi
  TAKEN=$(taken_names)
  local candidate
  case $STYLE in
    sequential)
      # Merged branches are often deleted, so PR history also counts toward the next number.
      local names=$TAKEN n count i max=0 width=3 num
      if github_api GET "repos/$OWNER/$REPO/pulls?state=all&per_page=100&sort=created&direction=desc"; then
        count=$(json_get "$API_BODY" '#')
        for ((i = 0; i < count; i++)); do names="$names"$'\n'"$(json_get "$API_BODY" "$i.head.ref")"; done
      else
        warn "Could not read PR history for numbering: $API_ERROR"
      fi
      while IFS= read -r n; do
        case $n in "$PREFIX"*) num=${n#"$PREFIX"} ;; *) continue ;; esac
        case $num in ''|*[!0-9]*) continue ;; esac
        if [ ${#num} -gt $width ]; then width=${#num}; fi
        num=$((10#$num))
        if [ "$num" -gt "$max" ]; then max=$num; fi
      done <<< "$names"
      while :; do
        max=$((max + 1)); candidate=$(printf '%s%0*d' "$PREFIX" "$width" "$max")
        is_taken "$candidate" || break
      done ;;
    date)
      local stem i=2
      stem="$PREFIX$(date +%Y%m%d-%H%M)"; candidate=$stem
      while is_taken "$candidate"; do candidate="$stem-$i"; i=$((i + 1)); done ;;
    *)
      local try
      for ((try = 0; try < 30; try++)); do
        candidate="$PREFIX${ADJECTIVES[RANDOM % ${#ADJECTIVES[@]}]}-${ANIMALS[RANDOM % ${#ANIMALS[@]}]}"
        is_taken "$candidate" || break
      done
      while is_taken "$candidate"; do
        candidate="$PREFIX${ADJECTIVES[RANDOM % ${#ADJECTIVES[@]}]}-${ANIMALS[RANDOM % ${#ANIMALS[@]}]}-$(printf '%04x' $((RANDOM)))"
      done ;;
  esac
  BRANCH_NAME=$candidate
}

# ---------------------------------------------------------------- branch moves

is_dirty() { [ -n "$(git status --porcelain)" ]; }

# Moves to a new branch cut from the freshly pulled default branch, carrying uncommitted work.
# Sets NEW_BRANCH.
start_fresh_branch() {
  local stashed=0
  if is_dirty; then
    step 'Stashing uncommitted changes to carry them over'
    git stash push --include-untracked -m 'git-flow ship: carry to new branch' >/dev/null
    stashed=1
  fi
  step "Updating $BASE"
  git checkout -q "$BASE"
  git pull -q --ff-only "$REMOTE" "$BASE"
  new_branch_name; NEW_BRANCH=$BRANCH_NAME
  git checkout -q -b "$NEW_BRANCH"
  if [ "$stashed" = 1 ] && ! git stash pop -q; then
    warn "Your changes conflict with the latest $BASE and are still in the stash. Resolve, then run: git stash drop"
  fi
  step "Now on new branch '$NEW_BRANCH'"
}

# After a merge: fresh branch, then drop the merged one if it holds nothing beyond what was merged.
complete_merged_branch() {
  local branch=$1 merged_sha=$2 local_sha
  local_sha=$(git rev-parse "refs/heads/$branch")
  start_fresh_branch
  if [ "$OPT_KEEP" = 1 ]; then
    info "Kept local branch '$branch'."
  elif [ "$local_sha" = "$merged_sha" ]; then
    git branch -q -D "$branch"
    info "Deleted merged local branch '$branch'."
  else
    warn "Kept '$branch': it has commits that were not part of the merged PR."
  fi
}

open_browser() {
  [ "$OPT_NO_BROWSER" = 1 ] && return 0
  if command -v wslview >/dev/null 2>&1; then wslview "$1" >/dev/null 2>&1 &
  elif [ "$(uname -s)" = Darwin ]; then open "$1"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$1" >/dev/null 2>&1 &
  elif command -v cmd.exe >/dev/null 2>&1; then cmd.exe /c start "" "$1" >/dev/null 2>&1
  else info "Open it yourself: $1"; fi
}

# ---------------------------------------------------------------- main

step "Repository $OWNER/$REPO ($GIT_HOST), remote '$REMOTE'"
git fetch -q --prune "$REMOTE"
BASE=$(base_branch)
info "Default branch: $BASE"

GIT_DIR=$(git rev-parse --git-dir)
for marker in MERGE_HEAD rebase-merge rebase-apply CHERRY_PICK_HEAD; do
  if [ -e "$GIT_DIR/$marker" ]; then die 'A merge/rebase/cherry-pick is in progress. Finish or abort it first.'; fi
done
# Reject a bad --name before anything is stashed or switched.
if [ -n "$OPT_NAME" ]; then assert_new_branch_name "$OPT_NAME"; fi

if [ "$OPT_NEW" = 1 ]; then
  start_fresh_branch
  exit 0
fi

CURRENT=$(git branch --show-current)
if [ -z "$CURRENT" ]; then
  new_branch_name; CURRENT=$BRANCH_NAME
  step "Detached HEAD: creating branch '$CURRENT' here"
  git checkout -q -b "$CURRENT"
elif [ "$CURRENT" = "$BASE" ]; then
  AHEAD=$(git rev-list --count "$REMOTE/$BASE..HEAD")
  if [ "$AHEAD" -gt 0 ]; then
    new_branch_name; CURRENT=$BRANCH_NAME
    step "You have $AHEAD local commit(s) on $BASE: moving them to new branch '$CURRENT'"
    git checkout -q -b "$CURRENT"
    git branch -f "$BASE" "$REMOTE/$BASE"
    info "$BASE reset to $REMOTE/$BASE (your commits are safe on '$CURRENT')."
  elif is_dirty; then
    step "You are on $BASE: moving your changes to a new branch"
    start_fresh_branch; CURRENT=$NEW_BRANCH
  else
    step "Nothing to ship on $BASE"
    start_fresh_branch
    exit 0
  fi
else
  # Re-run after a merge, or new edits on a branch whose PR already merged.
  pulls_for "$CURRENT" closed
  count=$(json_get "$API_BODY" '#')
  for ((i = 0; i < count; i++)); do
    [ -n "$(json_get "$API_BODY" "$i.merged_at")" ] || continue
    merged_number=$(json_get "$API_BODY" "$i.number")
    merged_sha=$(json_get "$API_BODY" "$i.head.sha")
    if [ "$merged_sha" = "$(git rev-parse HEAD)" ]; then
      step "PR #$merged_number for '$CURRENT' is already merged"
      complete_merged_branch "$CURRENT" "$merged_sha"
      CURRENT=$NEW_BRANCH
      is_dirty || exit 0
    else
      warn "'$CURRENT' already had PR #$merged_number merged; the new commits will go into a new PR from this branch."
    fi
    break
  done
fi

if is_dirty; then
  step 'Changes to commit:'
  git status --short
  if [ -z "$OPT_MESSAGE" ]; then read -r -p 'Commit message (blank = timestamp): ' OPT_MESSAGE || true; fi
  [ -n "$OPT_MESSAGE" ] || OPT_MESSAGE="Update $(date '+%Y-%m-%d %H:%M')"
  if [ "$OPT_YES" != 1 ]; then
    read -r -p "Stage ALL of the above and commit to '$CURRENT'? [Y/n] " answer || answer=n
    case $answer in ''|[yY]|[yY][eE][sS]) ;; *) die 'Cancelled. Nothing was committed.' ;; esac
  fi
  git add -A
  git commit -m "$OPT_MESSAGE" || die 'Commit failed (see the hook output above). Nothing was pushed.'
fi

pulls_for "$CURRENT" open
PR_NUMBER=$(json_get "$API_BODY" 0.number)
PR_URL=$(json_get "$API_BODY" 0.html_url)
AHEAD=$(git rev-list --count "$REMOTE/$BASE..HEAD")
if [ -z "$PR_NUMBER" ] && [ "$AHEAD" -eq 0 ]; then
  step "'$CURRENT' has no commits beyond $BASE. Nothing to ship."
  exit 0
fi

step "Pushing '$CURRENT' to $REMOTE"
git push -q -u "$REMOTE" "$CURRENT"

if [ -n "$PR_NUMBER" ]; then
  step "Updated existing PR #$PR_NUMBER: $PR_URL"
else
  SUBJECTS=$(git log --reverse --format=%s "$REMOTE/$BASE..HEAD")
  TITLE=${OPT_MESSAGE:-$(printf '%s\n' "$SUBJECTS" | head -n 1)}
  BODY="## Commits"$'\n'"$(printf '%s\n' "$SUBJECTS" | sed 's/^/- /')"
  for candidate in .github/pull_request_template.md .github/PULL_REQUEST_TEMPLATE.md pull_request_template.md PULL_REQUEST_TEMPLATE.md docs/pull_request_template.md; do
    if [ -f "$candidate" ]; then BODY="$BODY"$'\n\n'"$(cat "$candidate")"; break; fi
  done
  github_api POST "repos/$OWNER/$REPO/pulls" \
    "{\"title\":$(json_str "$TITLE"),\"head\":$(json_str "$CURRENT"),\"base\":$(json_str "$BASE"),\"body\":$(json_str "$BODY")}" \
    || die "$API_ERROR"
  PR_NUMBER=$(json_get "$API_BODY" number)
  PR_URL=$(json_get "$API_BODY" html_url)
  step "Opened PR #$PR_NUMBER: $PR_URL"
fi

[ "$OPT_NO_WAIT" = 1 ] && exit 0
[ "$MERGE_METHOD" = none ] && open_browser "$PR_URL"

step "Waiting for PR #$PR_NUMBER to be merged (checking every ${POLL}s; Ctrl+C is safe, re-run to resume)"
last_note=''
while :; do
  github_api GET "repos/$OWNER/$REPO/pulls/$PR_NUMBER" || die "$API_ERROR"
  PR_JSON=$API_BODY
  if [ "$(json_get "$PR_JSON" merged)" = true ]; then break; fi
  if [ "$(json_get "$PR_JSON" state)" = closed ]; then die "PR #$PR_NUMBER was closed without merging. Staying on '$CURRENT'."; fi
  if [ "$MERGE_METHOD" != none ] && [ "$(json_get "$PR_JSON" mergeable)" = true ]; then
    if github_api PUT "repos/$OWNER/$REPO/pulls/$PR_NUMBER/merge" \
        "{\"merge_method\":$(json_str "$MERGE_METHOD"),\"sha\":$(json_str "$(json_get "$PR_JSON" head.sha)")}"; then
      info "Merged with '$MERGE_METHOD'."
      continue
    fi
    note="Not mergeable yet: $API_ERROR"
    if [ "$note" != "$last_note" ]; then info "$note"; last_note=$note; fi
  fi
  sleep "$POLL"
done

step "PR #$PR_NUMBER merged"
complete_merged_branch "$CURRENT" "$(json_get "$PR_JSON" head.sha)"
printf '\n%sDone. Ready for the next change on '\''%s'\''.%s\n' "$C_OK" "$NEW_BRANCH" "$C_END"
