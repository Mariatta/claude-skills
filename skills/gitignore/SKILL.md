---
name: gitignore
description: What must never be committed to a git repository, and what to do when it already has been. Covers the always-ignore baseline (environment and secret files, OS and editor cruft, virtualenvs, build output, local databases and media, coverage and cache artifacts), the files people wrongly ignore (lockfiles, migrations, .env.example), the fact that .gitignore does not untrack an already-tracked file, and the rule that a committed secret must be rotated rather than merely deleted. Use whenever initializing a repository, writing or editing a .gitignore or .dockerignore, making a first commit, staging files, creating a file that holds credentials, explaining why something shows up in git status, or reacting to a secret that reached a commit.
---

# What never belongs in version control

The default is not "ignore what is noisy." The default is **a secret must never
reach a commit**, and everything else is housekeeping.

Two properties make this worth getting right the first time. A push is public the
moment it lands, and deleting a file in a later commit does not remove it from
history. So the cost of a mistake is not "fix the file", it is "rotate the
credential", and that cost falls on whoever wrote the file, not on whoever notices.

## The rule

Write `.gitignore` **in the same commit that creates the repository**, before the
first `git add`. Retrofitting it means the thing you were trying to keep out is
already in history.

When a project also ships a container image, `.dockerignore` needs the same entries
for the same reason: a `COPY . .` with no `.dockerignore` bakes `.env` into a layer
that anyone who can pull the image can read.

## Always ignore

**Secrets and environment.** The category that matters.

```gitignore
.env
.env.*
!.env.example
*.pem
*.key
*.p12
*.pfx
credentials.json
client_secret*.json
service-account*.json
secrets.yaml
.netrc
```

**Local state that is regenerated.** Virtualenvs (`venv/`, `.venv/`), dependency
directories (`node_modules/`), build output (`dist/`, `build/`, `*.egg-info/`),
caches (`__pycache__/`, `.pytest_cache/`, `.ruff_cache/`, `.mypy_cache/`), coverage
(`.coverage`, `htmlcov/`), local databases (`*.sqlite3`, `db.sqlite3`), collected
static and uploaded media (`staticroot/`, `media/`), and logs (`*.log`).

**Machine noise.** `.DS_Store`, `Thumbs.db`, `*.swp`, `.idea/`, `.vscode/`.

Editor and OS entries can go in your personal global ignore file instead, which
keeps other people's tooling out of your repo's config:

```bash
git config --global core.excludesFile ~/.config/git/ignore
```

Both work. Repo-level is more discoverable for collaborators; global is tidier. Put
project artifacts in the repo file either way.

Ready-to-paste blocks per ecosystem, including Django and Node, are in
`references/templates.md`.

## Do not ignore

Four things people ignore by mistake, each of which breaks something later:

- **Lockfiles.** `uv.lock`, `poetry.lock`, `package-lock.json`, `Cargo.lock`. They
  are how a build reproduces. Ignoring one means CI and production silently resolve
  different versions than you did. (A library that is published for others to
  consume is the one exception, and even then only for its own lockfile.)
- **Migrations.** Django and Rails migrations are source code and a schema change
  without its migration is an incomplete commit.
- **`.env.example`.** Track it, with placeholder values, so a new checkout can see
  which variables exist without learning it from a stack trace. Note the `!` line in
  the block above: the negation has to come after the `.env.*` pattern that would
  otherwise match it.
- **Committed compiled assets that the build image depends on.** If a project
  deliberately commits compiled CSS so the production image needs no Node, ignoring
  it breaks the deploy. Check before assuming build output is disposable.

## `.gitignore` does not untrack anything

The most common surprise. `.gitignore` governs **untracked** files. A file already
tracked by git keeps being tracked, and its future changes keep showing up, no
matter what the ignore file says.

```bash
git rm --cached path/to/file      # stop tracking, keep the file on disk
git rm -r --cached path/to/dir/
```

That removal is itself a commit, and the file stays in every commit before it.

Useful when something is not behaving as expected:

```bash
git check-ignore -v path/to/file   # which rule (and which line) matched
git status --ignored               # what is being ignored right now
git ls-files | grep -iE 'env|secret|credential|\.pem$'   # already tracked?
```

## When a secret has already been committed

Order matters, and the first step is the only one that is not optional.

1. **Rotate the credential.** Revoke it at the provider and issue a new one. Assume
   it is compromised the moment it is pushed: repositories are scraped
   continuously, forks and clones exist outside your control, and GitHub caches
   unreachable objects that remain fetchable by SHA.
2. **Remove it from the working tree** and commit that, so the current checkout is
   clean.
3. **Rewrite history only if it is worth it.** `git filter-repo` or BFG can purge
   the blob, but rewriting rewrites every SHA after it, so collaborators must
   re-clone. On a private repo with one author it is cheap; on a shared branch it
   is disruptive. Either way it is a tidiness measure, not a security measure, and
   it does nothing for the copies that already exist.

Never let step 3 stand in for step 1. History rewriting cannot un-leak a secret; it
only makes the leak harder to see.

## Before staging

Stage specific paths. `git add -A` and `git add .` are how untracked files that
nobody looked at end up in a commit, and they are how a stray `.env` from a
half-finished experiment gets swept in. Read `git status` first, and if something
unexpected is listed, find out what it is before staging it.

## Reference files

- `references/templates.md` — paste-ready blocks: universal baseline, Python and
  Django, Node and frontend, plus the matching `.dockerignore`.