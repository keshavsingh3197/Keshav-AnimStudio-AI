#Requires -Version 5.1
<#
.SYNOPSIS
    Ship the current work as a GitHub pull request, wait for it to merge, then start a fresh branch.

.DESCRIPTION
    Repo-agnostic: owner, repo, host and default branch are read from the git remote, so this folder
    can be copied into any GitHub repository unchanged.

      1. Never works on the default branch: if you are on it (or on a detached HEAD), your work is
         moved to a new uniquely-named branch first.
      2. Stages everything, commits (pre-commit hooks still run), pushes with upstream tracking.
      3. Opens a pull request, or reuses the open one for this branch.
      4. Waits until the PR is merged (optionally merges it for you), then checks out the default
         branch, pulls, deletes the merged local branch and switches to a new branch.

    Safe to re-run at any point: an open PR is picked up again, and a branch whose PR is already
    merged is rotated straight away.

    GitHub auth, first match wins: GH_TOKEN / GITHUB_TOKEN, `gh auth token`, then the login Git
    already uses for HTTPS (Git Credential Manager). The token is never printed.

    Optional per-repo defaults live in ship.config next to this script (see ship.config.example).

.EXAMPLE
    .\ship.ps1 -m "Fix login redirect"
.EXAMPLE
    .\ship.ps1 -m "Bump deps" -Merge squash -Yes
.EXAMPLE
    .\ship.ps1 -New -Style sequential -Prefix Anim
#>
[CmdletBinding()]
param(
    # Commit message (also the PR title). Prompted for when omitted and there are changes.
    [Alias('m')][string]$Message,
    # Only move to a fresh branch from the latest default branch; no commit/PR.
    [switch]$New,
    # Explicit name for the branch this run creates.
    [string]$Name,
    [ValidateSet('nickname', 'sequential', 'date')][string]$Style,
    [string]$Prefix,
    # Merge the PR yourself once GitHub allows it. 'none' waits for a manual merge.
    [ValidateSet('none', 'squash', 'merge', 'rebase')][string]$Merge,
    # Stop after the PR is opened.
    [switch]$NoWait,
    [switch]$NoBrowser,
    # Keep the local branch after its PR is merged.
    [switch]$KeepBranch,
    # Do not ask for confirmation before staging everything.
    [Alias('y')][switch]$Yes,
    [ValidateRange(5, 3600)][int]$PollSeconds
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

# ---------------------------------------------------------------- output

function Write-Step([string]$Text) { Write-Host "==> $Text" -ForegroundColor Cyan }
function Write-Info([string]$Text) { Write-Host "    $Text" }
function Write-Warn([string]$Text) { Write-Host "[!] $Text" -ForegroundColor Yellow }
function Stop-Ship([string]$Text) {
    Write-Host "[x] $Text" -ForegroundColor Red
    exit 1
}

trap {
    Write-Host "[x] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------- git

# Runs git, returns trimmed stdout, stops the script on failure. stderr stays on the console so the
# user sees git's own messages (push progress, hook output).
function Invoke-Git {
    $ErrorActionPreference = 'Continue'
    $out = & git @args
    if ($LASTEXITCODE -ne 0) { Stop-Ship "git $($args -join ' ') failed (exit $LASTEXITCODE)." }
    if ($null -ne $out) { return (($out | Out-String).TrimEnd()) }
    return ''
}

# Runs git for a yes/no or best-effort answer: stderr hidden, $null on failure.
function Invoke-GitQuiet {
    $ErrorActionPreference = 'Continue'
    $out = & git @args 2>$null
    if ($LASTEXITCODE -ne 0) { return $null }
    if ($null -ne $out) { return (($out | Out-String).TrimEnd()) }
    return ''
}

function Test-Dirty { return [bool](Invoke-Git status --porcelain) }

# ---------------------------------------------------------------- config

function Read-ShipConfig([string]$Path) {
    $allowed = 'BRANCH_STYLE', 'BRANCH_PREFIX', 'BASE_BRANCH', 'REMOTE', 'MERGE_METHOD', 'POLL_SECONDS', 'DELETE_MERGED', 'OPEN_BROWSER', 'GITHUB_HOST'
    $cfg = @{}
    if (-not (Test-Path -LiteralPath $Path)) { return $cfg }
    foreach ($line in Get-Content -LiteralPath $Path) {
        $t = $line.Trim()
        if (-not $t -or $t.StartsWith('#')) { continue }
        $i = $t.IndexOf('=')
        if ($i -lt 1) { continue }
        $key = $t.Substring(0, $i).Trim().ToUpperInvariant()
        if ($allowed -notcontains $key) { Write-Warn "ship.config: ignoring unknown key '$key'."; continue }
        $cfg[$key] = $t.Substring($i + 1).Trim().Trim('"', "'")
    }
    return $cfg
}

function Get-Setting([string]$Cli, [string]$Key, [string]$Default) {
    if ($Cli) { return $Cli }
    if ($script:Config.ContainsKey($Key) -and $script:Config[$Key]) { return $script:Config[$Key] }
    return $Default
}

# ---------------------------------------------------------------- repo discovery

$repoRoot = Invoke-GitQuiet rev-parse --show-toplevel
if (-not $repoRoot) { $repoRoot = Invoke-GitQuiet -C $PSScriptRoot rev-parse --show-toplevel }
if (-not $repoRoot) { Stop-Ship 'Not inside a git repository (checked the current folder and the script folder).' }
Set-Location -LiteralPath $repoRoot

$script:Config = Read-ShipConfig (Join-Path $PSScriptRoot 'ship.config')

$BranchStyle = Get-Setting $Style 'BRANCH_STYLE' 'nickname'
if ('nickname', 'sequential', 'date' -notcontains $BranchStyle) { Stop-Ship "BRANCH_STYLE must be nickname, sequential or date (got '$BranchStyle')." }
$defaultPrefix = if ($BranchStyle -eq 'sequential') { 'work-' } else { '' }
if ($PSBoundParameters.ContainsKey('Prefix')) { $BranchPrefix = $Prefix } else { $BranchPrefix = Get-Setting '' 'BRANCH_PREFIX' $defaultPrefix }
$MergeMethod = Get-Setting $Merge 'MERGE_METHOD' 'none'
if ('none', 'squash', 'merge', 'rebase' -notcontains $MergeMethod) { Stop-Ship "MERGE_METHOD must be none, squash, merge or rebase (got '$MergeMethod')." }
$Poll = $PollSeconds
if (-not $Poll) {
    $configuredPoll = Get-Setting '' 'POLL_SECONDS' '20'
    if ($configuredPoll -notmatch '^\d{1,4}$') { Stop-Ship "POLL_SECONDS must be a number (got '$configuredPoll')." }
    $Poll = [int]$configuredPoll
}
if ($Poll -lt 5) { $Poll = 5 }
if (-not $KeepBranch -and (Get-Setting '' 'DELETE_MERGED' 'true') -eq 'false') { $KeepBranch = $true }
if (-not $NoBrowser -and (Get-Setting '' 'OPEN_BROWSER' 'true') -eq 'false') { $NoBrowser = $true }

$remotes = @((Invoke-Git remote) -split "`r?`n" | Where-Object { $_ })
if (-not $remotes) { Stop-Ship 'This repository has no git remote.' }
$Remote = Get-Setting '' 'REMOTE' ''
if (-not $Remote) { if ($remotes -contains 'origin') { $Remote = 'origin' } else { $Remote = $remotes[0] } }
if ($remotes -notcontains $Remote) { Stop-Ship "Remote '$Remote' does not exist." }

$remoteUrl = Invoke-Git remote get-url $Remote
if ($remoteUrl -match '^(?:https?|ssh|git)://(?:[^@/]+@)?([^/:]+)(?::\d+)?/(.+?)(?:\.git)?/?$') {
    $GitHost = $Matches[1]; $repoPath = $Matches[2]
} elseif ($remoteUrl -match '^(?:[^@/]+@)?([^:/]+):(.+?)(?:\.git)?/?$') {
    $GitHost = $Matches[1]; $repoPath = $Matches[2]
} else {
    Stop-Ship "Cannot parse remote URL '$remoteUrl'."
}
$segments = @($repoPath -split '/')
if ($segments.Count -ne 2) { Stop-Ship "Remote '$remoteUrl' does not look like a GitHub owner/repo URL." }
$Owner = $segments[0]; $Repo = $segments[1]
$configuredHost = Get-Setting '' 'GITHUB_HOST' ''
if ($configuredHost) {
    $GitHost = $configuredHost
} elseif ($GitHost -eq 'ssh.github.com' -or $GitHost -notmatch '\.') {
    # ssh.github.com is GitHub's port-443 endpoint; a dot-less host is an ~/.ssh/config alias.
    $GitHost = 'github.com'
}
$ApiBase = if ($GitHost -eq 'github.com') { 'https://api.github.com' } else { "https://$GitHost/api/v3" }

# ---------------------------------------------------------------- default branch

function Get-BaseBranch {
    $configured = Get-Setting '' 'BASE_BRANCH' ''
    if ($configured) { return $configured }
    # Ask the remote first: the local origin/HEAD is only set at clone time and goes stale.
    $symref = Invoke-GitQuiet ls-remote --symref $Remote HEAD
    if ($symref -match 'ref: refs/heads/(\S+)\s+HEAD') { return $Matches[1] }
    $ref = Invoke-GitQuiet symbolic-ref -q --short "refs/remotes/$Remote/HEAD"
    if ($ref) { return $ref.Substring($Remote.Length + 1) }
    foreach ($candidate in 'main', 'master') {
        if (Invoke-GitQuiet rev-parse -q --verify "refs/remotes/$Remote/$candidate") { return $candidate }
    }
    Stop-Ship "Cannot work out the default branch of '$Remote'. Set BASE_BRANCH in ship.config."
}

# ---------------------------------------------------------------- GitHub API

$script:Token = $null

function Get-GitHubToken {
    if ($script:Token) { return $script:Token }
    foreach ($var in 'GH_TOKEN', 'GITHUB_TOKEN') {
        $value = [Environment]::GetEnvironmentVariable($var)
        if ($value) { $script:Token = $value; return $value }
    }
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        $ErrorActionPreference = 'Continue'
        $value = & gh auth token --hostname $GitHost 2>$null
        if ($LASTEXITCODE -eq 0 -and $value) { $script:Token = ([string]$value).Trim(); return $script:Token }
    }
    # Ask git's credential helper. The request goes through a file: Windows PowerShell mangles text
    # piped into native commands and git then rejects it. The file holds only protocol and host.
    $previousPrompt = $env:GIT_TERMINAL_PROMPT
    $env:GIT_TERMINAL_PROMPT = '0'
    $request = [IO.Path]::GetTempFileName()
    try {
        [IO.File]::WriteAllText($request, "protocol=https`nhost=$GitHost`n`n")
        $ErrorActionPreference = 'Continue'
        if ($env:OS -eq 'Windows_NT') {
            $lines = & cmd.exe /d /c "git credential fill < `"$request`"" 2>$null
        } else {
            $lines = Get-Content -LiteralPath $request | & git credential fill 2>$null
        }
    } finally {
        $env:GIT_TERMINAL_PROMPT = $previousPrompt
        Remove-Item -LiteralPath $request -ErrorAction SilentlyContinue
    }
    foreach ($line in @($lines)) {
        if ($line -like 'password=*') { $script:Token = $line.Substring(9); return $script:Token }
    }
    Stop-Ship "No GitHub credentials for $GitHost. Set GH_TOKEN, run 'gh auth login', or push once over HTTPS so Git Credential Manager saves a login."
}

function Invoke-GitHub([string]$Method, [string]$Path, [hashtable]$Body) {
    $request = @{
        Method          = $Method
        Uri             = "$ApiBase/$Path"
        UseBasicParsing = $true
        Headers         = @{
            Authorization          = "Bearer $(Get-GitHubToken)"
            Accept                 = 'application/vnd.github+json'
            'X-GitHub-Api-Version' = '2022-11-28'
            'User-Agent'           = 'git-flow-ship'
        }
    }
    if ($Body) {
        $request.Body = [Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 5))
        $request.ContentType = 'application/json; charset=utf-8'
    }
    try {
        $result = Invoke-RestMethod @request
    } catch {
        $status = ''
        if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
        $detail = $_.Exception.Message
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            try { $detail = ($_.ErrorDetails.Message | ConvertFrom-Json).message } catch { $detail = $_.ErrorDetails.Message }
        }
        throw "GitHub API $Method $Path failed ($status): $detail"
    }
    # Assigning first then returning unrolls JSON arrays (Windows PowerShell returns them as one object).
    return $result
}

function Get-PullRequests([string]$Branch, [string]$State) {
    $head = [uri]::EscapeDataString("${Owner}:$Branch")
    return @(Invoke-GitHub GET "repos/$Owner/$Repo/pulls?head=$head&state=$State&per_page=100")
}

function Get-MergedPullRequest([string]$Branch) {
    foreach ($pr in (Get-PullRequests $Branch 'closed')) {
        if ($pr.merged_at) { return $pr }
    }
    return $null
}

# ---------------------------------------------------------------- branch names

$Adjectives = 'agile', 'amber', 'bold', 'brave', 'bright', 'calm', 'clever', 'cosmic', 'crisp', 'daring',
    'eager', 'fancy', 'fierce', 'gentle', 'golden', 'happy', 'jolly', 'keen', 'lucky', 'mellow',
    'mighty', 'nimble', 'noble', 'proud', 'quick', 'quiet', 'rapid', 'shiny', 'silent', 'sunny',
    'swift', 'tidy', 'vivid', 'witty', 'zesty'
$Animals = 'badger', 'bison', 'cobra', 'condor', 'cougar', 'dolphin', 'eagle', 'falcon', 'ferret', 'gecko',
    'heron', 'ibis', 'jaguar', 'koala', 'lemur', 'lynx', 'marten', 'narwhal', 'ocelot', 'otter',
    'panda', 'pelican', 'puffin', 'quokka', 'raven', 'salmon', 'tapir', 'tiger', 'toucan', 'walrus',
    'wombat', 'yak', 'zebra'

# Every branch name already in use locally or on the remote, so a new name can never collide.
function Get-TakenBranchNames {
    $taken = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    $local = Invoke-Git for-each-ref --format='%(refname:lstrip=2)' refs/heads
    foreach ($b in ($local -split "`r?`n")) { if ($b) { [void]$taken.Add($b) } }
    $remoteHeads = Invoke-GitQuiet ls-remote --heads $Remote
    if ($null -eq $remoteHeads) { Stop-Ship "Cannot list branches on '$Remote' (offline or no access)." }
    foreach ($line in ($remoteHeads -split "`r?`n")) {
        if ($line -match 'refs/heads/(.+)$') { [void]$taken.Add($Matches[1]) }
    }
    return , $taken
}

function Assert-NewBranchName([string]$Candidate) {
    if ($null -eq (Invoke-GitQuiet check-ref-format --branch $Candidate)) { Stop-Ship "'$Candidate' is not a valid branch name." }
    if ((Get-TakenBranchNames).Contains($Candidate)) { Stop-Ship "Branch '$Candidate' already exists locally or on '$Remote'." }
}

function New-BranchName {
    if ($script:Name) {
        $requested = $script:Name
        $script:Name = $null
        Assert-NewBranchName $requested
        return $requested
    }

    $taken = Get-TakenBranchNames
    switch ($BranchStyle) {
        'sequential' {
            # Merged branches are often deleted, so PR history also counts toward the next number.
            $names = New-Object System.Collections.Generic.List[string]
            foreach ($b in $taken) { $names.Add($b) }
            try {
                foreach ($pr in @(Invoke-GitHub GET "repos/$Owner/$Repo/pulls?state=all&per_page=100&sort=created&direction=desc")) {
                    $names.Add($pr.head.ref)
                }
            } catch {
                Write-Warn "Could not read PR history for numbering: $($_.Exception.Message)"
            }
            $pattern = '^' + [regex]::Escape($BranchPrefix) + '(\d+)$'
            $max = 0; $width = 3
            foreach ($b in $names) {
                if ($b -match $pattern) {
                    $n = [int64]$Matches[1]
                    if ($n -gt $max) { $max = $n }
                    if ($Matches[1].Length -gt $width) { $width = $Matches[1].Length }
                }
            }
            do {
                $max++
                $candidate = $BranchPrefix + $max.ToString().PadLeft($width, '0')
            } while ($taken.Contains($candidate))
            return $candidate
        }
        'date' {
            $stem = $BranchPrefix + (Get-Date -Format 'yyyyMMdd-HHmm')
            $candidate = $stem; $i = 2
            while ($taken.Contains($candidate)) { $candidate = "$stem-$i"; $i++ }
            return $candidate
        }
        default {
            for ($try = 0; $try -lt 30; $try++) {
                $candidate = '{0}{1}-{2}' -f $BranchPrefix, (Get-Random -InputObject $Adjectives), (Get-Random -InputObject $Animals)
                if (-not $taken.Contains($candidate)) { return $candidate }
            }
            do {
                $candidate = '{0}{1}-{2}-{3:x4}' -f $BranchPrefix, (Get-Random -InputObject $Adjectives), (Get-Random -InputObject $Animals), (Get-Random -Maximum 65536)
            } while ($taken.Contains($candidate))
            return $candidate
        }
    }
}

# ---------------------------------------------------------------- branch moves

# Moves to a new branch cut from the freshly pulled default branch, carrying any uncommitted work.
function Start-FreshBranch {
    $stashed = $false
    if (Test-Dirty) {
        Write-Step 'Stashing uncommitted changes to carry them over'
        Invoke-Git stash push --include-untracked -m 'git-flow ship: carry to new branch' | Out-Null
        $stashed = $true
    }
    Write-Step "Updating $Base"
    Invoke-Git checkout -q $Base | Out-Null
    Invoke-Git pull -q --ff-only $Remote $Base | Out-Null
    $newBranch = New-BranchName
    Invoke-Git checkout -q -b $newBranch | Out-Null
    if ($stashed) {
        $ErrorActionPreference = 'Continue'
        & git stash pop -q | Out-Host
        if ($LASTEXITCODE -ne 0) { Write-Warn "Your changes conflict with the latest $Base and are still in the stash. Resolve, then run: git stash drop" }
    }
    Write-Step "Now on new branch '$newBranch'"
    return $newBranch
}

# After a merge: fresh branch, then drop the merged one if it holds nothing beyond what was merged.
function Complete-MergedBranch([string]$Branch, [string]$MergedSha) {
    $localSha = Invoke-Git rev-parse "refs/heads/$Branch"
    $newBranch = Start-FreshBranch
    if ($KeepBranch) {
        Write-Info "Kept local branch '$Branch'."
    } elseif ($localSha -eq $MergedSha) {
        Invoke-Git branch -D $Branch | Out-Null
        Write-Info "Deleted merged local branch '$Branch'."
    } else {
        Write-Warn "Kept '$Branch': it has commits that were not part of the merged PR."
    }
    return $newBranch
}

function Open-Browser([string]$Url) {
    if ($NoBrowser) { return }
    try { Start-Process $Url } catch { Write-Info "Open it yourself: $Url" }
}

# ---------------------------------------------------------------- main

Write-Step "Repository $Owner/$Repo ($GitHost), remote '$Remote'"
Invoke-Git fetch -q --prune $Remote | Out-Null
$Base = Get-BaseBranch
Write-Info "Default branch: $Base"

$inProgress = foreach ($marker in 'MERGE_HEAD', 'rebase-merge', 'rebase-apply', 'CHERRY_PICK_HEAD') {
    if (Test-Path -LiteralPath (Join-Path (Invoke-Git rev-parse --git-dir) $marker)) { $marker }
}
if ($inProgress) { Stop-Ship 'A merge/rebase/cherry-pick is in progress. Finish or abort it first.' }
# Reject a bad -Name before anything is stashed or switched.
if ($Name) { Assert-NewBranchName $Name }

if ($New) {
    [void](Start-FreshBranch)
    exit 0
}

$current = Invoke-Git branch --show-current
if (-not $current) {
    $current = New-BranchName
    Write-Step "Detached HEAD: creating branch '$current' here"
    Invoke-Git checkout -q -b $current | Out-Null
} elseif ($current -eq $Base) {
    $ahead = [int](Invoke-Git rev-list --count "$Remote/$Base..HEAD")
    if ($ahead -gt 0) {
        $current = New-BranchName
        Write-Step "You have $ahead local commit(s) on ${Base}: moving them to new branch '$current'"
        Invoke-Git checkout -q -b $current | Out-Null
        Invoke-Git branch -f $Base "$Remote/$Base" | Out-Null
        Write-Info "$Base reset to $Remote/$Base (your commits are safe on '$current')."
    } elseif (Test-Dirty) {
        Write-Step "You are on ${Base}: moving your changes to a new branch"
        $current = Start-FreshBranch
    } else {
        Write-Step "Nothing to ship on $Base"
        [void](Start-FreshBranch)
        exit 0
    }
} else {
    # Re-run after a merge, or new edits on a branch whose PR already merged.
    $merged = Get-MergedPullRequest $current
    if ($merged) {
        $headSha = Invoke-Git rev-parse HEAD
        if ($merged.head.sha -eq $headSha) {
            Write-Step "PR #$($merged.number) for '$current' is already merged"
            $current = Complete-MergedBranch $current $merged.head.sha
            if (-not (Test-Dirty)) { exit 0 }
        } else {
            Write-Warn "'$current' already had PR #$($merged.number) merged; the new commits will go into a new PR from this branch."
        }
    }
}

if (Test-Dirty) {
    Write-Step 'Changes to commit:'
    & git status --short
    if (-not $Message) { $Message = (Read-Host 'Commit message (blank = timestamp)').Trim() }
    if (-not $Message) { $Message = "Update $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
    if (-not $Yes) {
        $answer = (Read-Host "Stage ALL of the above and commit to '$current'? [Y/n]").Trim()
        if ($answer -and $answer -notmatch '^(y|yes)$') { Stop-Ship 'Cancelled. Nothing was committed.' }
    }
    Invoke-Git add -A | Out-Null
    $ErrorActionPreference = 'Continue'
    & git commit -m $Message
    if ($LASTEXITCODE -ne 0) { Stop-Ship 'Commit failed (see the hook output above). Nothing was pushed.' }
    $ErrorActionPreference = 'Stop'
}

$openPr = @(Get-PullRequests $current 'open') | Select-Object -First 1
$ahead = [int](Invoke-Git rev-list --count "$Remote/$Base..HEAD")
if (-not $openPr -and $ahead -eq 0) {
    Write-Step "'$current' has no commits beyond $Base. Nothing to ship."
    exit 0
}

Write-Step "Pushing '$current' to $Remote"
Invoke-Git push -q -u $Remote $current | Out-Null

if ($openPr) {
    $pr = $openPr
    Write-Step "Updated existing PR #$($pr.number): $($pr.html_url)"
} else {
    $subjects = @((Invoke-Git log --reverse --format=%s "$Remote/$Base..HEAD") -split "`r?`n" | Where-Object { $_ })
    $title = if ($Message) { $Message } else { $subjects[0] }
    $body = "## Commits`n" + (($subjects | ForEach-Object { "- $_" }) -join "`n")
    foreach ($candidate in '.github/pull_request_template.md', '.github/PULL_REQUEST_TEMPLATE.md', 'pull_request_template.md', 'PULL_REQUEST_TEMPLATE.md', 'docs/pull_request_template.md') {
        if (Test-Path -LiteralPath $candidate) {
            $body += "`n`n" + (Get-Content -LiteralPath $candidate -Raw)
            break
        }
    }
    $pr = Invoke-GitHub POST "repos/$Owner/$Repo/pulls" @{ title = $title; head = $current; base = $Base; body = $body }
    Write-Step "Opened PR #$($pr.number): $($pr.html_url)"
}

if ($NoWait) { exit 0 }
if ($MergeMethod -eq 'none') { Open-Browser $pr.html_url }

Write-Step "Waiting for PR #$($pr.number) to be merged (checking every $Poll s; Ctrl+C is safe, re-run to resume)"
$lastNote = ''
while ($true) {
    $state = Invoke-GitHub GET "repos/$Owner/$Repo/pulls/$($pr.number)"
    if ($state.merged) { break }
    if ($state.state -eq 'closed') { Stop-Ship "PR #$($pr.number) was closed without merging. Staying on '$current'." }
    if ($MergeMethod -ne 'none' -and $state.mergeable -eq $true) {
        try {
            Invoke-GitHub PUT "repos/$Owner/$Repo/pulls/$($pr.number)/merge" @{ merge_method = $MergeMethod; sha = $state.head.sha } | Out-Null
            Write-Info "Merged with '$MergeMethod'."
            continue
        } catch {
            $note = "Not mergeable yet: $($_.Exception.Message)"
            if ($note -ne $lastNote) { Write-Info $note; $lastNote = $note }
        }
    }
    Start-Sleep -Seconds $Poll
}

Write-Step "PR #$($pr.number) merged"
$next = Complete-MergedBranch $current $state.head.sha
Write-Host ''
Write-Host "Done. Ready for the next change on '$next'." -ForegroundColor Green
