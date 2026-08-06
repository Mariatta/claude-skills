---
name: django
description: House conventions for writing code in a Django codebase: formatter and linter compliance (black, isort, djlint, flake8), imports at module top with real refactors for circular imports, docstrings over comment blocks, maintained libraries over hand-rolled code, full test coverage as a merge gate, permission gating through has_perm, secrets encrypted at rest, templates with no inline style blocks, the single-Markdown-template email pattern that produces both plain-text and HTML parts, and a portable container boot contract for deployment. Use this whenever writing, editing, or reviewing Python, templates, tests, settings, or deployment config in a Django project, even when the request is just "add a view" or "fix this bug" and says nothing about style. Concrete tools, thresholds, and paths come from profile.json; read it before assuming this project uses the same stack.
---

# Django conventions

Follow these by default. A project's own `CLAUDE.md`, `AGENTS.md`, or an explicit
user instruction overrides them.

Each convention below states a **principle** that holds for any Django project,
then the **concrete values** for this one. Every concrete value (which formatters,
which threshold, which paths) comes from `profile.json`. Read it first; do not assume
the stack named here is the stack this project runs.

Adapting the skill to a different project is `profile.json` plus `ADAPTING.md`.

This skill is meant to grow. Each convention is self-contained. Add new ones under
`## Conventions`, and when a convention has real implementation detail, give it a
file under `references/` and link it from here.

## Conventions

### Code style: match the project's formatters, and emit code that already passes

**Principle.** Whatever formatters and linters a project runs, match them and emit
code that passes them on the first try. CI runs them in check mode and fails on any
diff, so unformatted code never merges. Hand-formatting around a formatter wastes a
review cycle and produces a diff the next `make reformat` will undo.

The one trap worth knowing regardless of project: if both isort and black run, isort
**must** use `profile = black`. Otherwise the two rewrite imports each other's way
and CI never converges.

**This project** (`profile.json` → `formatting`). The stack is black, isort,
djlint, flake8, checked by `make lint` and autofixed by `make reformat`, each running
inside `docker compose run --rm web`.

- **black** formats Python on its **defaults**. There is no `[tool.black]` block
  anywhere in the repo; do not add one. Write black-shaped code: no manual alignment,
  no fighting its line breaks.
- **isort** sorts imports with `profile = black`: stdlib, third-party, first-party,
  alphabetized, parenthesized multi-line imports with trailing commas.
- **djlint** formats and lints Django templates with `profile = "django"`. Formatting
  and linting run as **two separate commands**, not combined.
- **flake8** lints Python with `max-line-length = 100` but `E501` extended-ignored,
  so flake8 never fights black over length. Black's 88 governs in practice.
- `makemigrations --check` also runs in `make lint`, so a model change without a
  migration fails the build.

Config is deliberately split by tool. Do not consolidate it.

```ini
# setup.cfg
[flake8]
exclude = migrations, venv, .venv, staticroot, media, htmlcov, .state,
          __pycache__, .git, .idea, .vscode
max-line-length = 100
extend-ignore = E501

[isort]
profile = black
skip_gitignore = true
```

```toml
# pyproject.toml
[tool.djlint]
ignore = "H006,H021,H030,H031"
profile = "django"
custom_blocks = "switch"
line_break_after_multiline_tag = true
use_gitignore = true
extend_exclude = "htmlcov,venv,.venv,staticroot,.state,node_modules"
```

The commands, in order:

```bash
# make lint  (also what CI runs)
isort --check-only .
black --check .
djlint . --check          # formatting
djlint . --lint           # rules, separate invocation
flake8
python manage.py makemigrations --check --settings=<settings module>

# make reformat  (local autofix)
isort . && black .
djlint . --reformat
```

Run isort before black.

### Imports go at the top of the module

**Principle.** Every import belongs in the module's import block. An import buried
inside a function or a test method hides the module's real dependency graph, and it
is almost always there to paper over a circular import.

When an import is circular, **refactor it**. Do not move it inline and move on. The
circularity is telling you the module boundary is wrong, and inline imports convert a
visible design problem into an invisible one that the next person rediscovers.

Django gives you several ways to break a cycle properly, roughly in order of how often
they are the right answer:

- **String model references.** `ForeignKey("otherapp.Model")` and
  `related_name` strings never import anything.
- **`django.apps.apps.get_model()`** inside a function that genuinely runs after the
  app registry is ready, such as a migration or a management command.
- **Extract the shared piece.** If A and B both need something, it belongs in C. This
  is the fix that actually removes the cycle rather than deferring it.
- **`TYPE_CHECKING` guards** for imports needed only by annotations, paired with
  string annotations.
- **`AppConfig.ready()`** for signal registration, which is the single most common
  source of import cycles in Django projects.

Two inline imports are accepted, both because the import genuinely cannot happen at
module load:

- the guard inside `manage.py`
- an optional or heavy dependency behind a feature check

Test files follow the same rule as everything else. Imports at the top, not inside
the test method.

### Docstrings, not a stack of hash comments

**Principle.** What a function, method, or class does goes in a triple-quoted
docstring as its first statement. A block of `#` comments sitting under a `def` is
the wrong shape: a docstring is reachable from `help()`, `__doc__`, IDE tooltips, and
Sphinx, and hash comments are reachable from nowhere.

- Single line: `"""Short summary."""`
- Multi-line: summary line, blank line, details.
- `#` comments are for explaining one line or a short block **inside** a function
  body. A triple-quoted string floating mid-function is not a docstring, it is a
  no-op expression, and it is wrong.
- An `__init__.py` that "should be empty" gets a one-line module docstring
  (`"""Template tags."""`) instead. It stays effectively empty, and it documents
  itself.
- Existing hash-style function docs are fair game to upgrade while editing nearby
  code. Do not sweep the repo for them as a standalone change.

### Reach for a maintained library before writing your own

**Principle.** Before implementing a pattern by hand, spend two minutes checking PyPI
or awesome-django for a maintained package. Maintained means a release within roughly
two years and support for the Django version in use. Dependencies are cheap; custom
code is not, and its maintenance cost compounds.

Patterns that almost always already have a library: singletons, timezone fields,
encrypted fields, soft delete, state machines, JSON schema validation, task queues,
tenancy, audit logs, and impersonation.

- When a clean fit exists, use it, and delete the hand-rolled equivalent along with
  the tests that covered its internals. Keep one smoke test proving the integration
  works; do not test the library.
- When the ecosystem is abandoned or every option is awkward, say so openly and
  explain the trade-off. Rolling custom code is allowed; rolling it silently is not.

### Tests: coverage is a merge gate

**Principle.** Match whatever coverage threshold CI enforces, and never lower it to
make a change pass. Where the threshold is strict, **new code arrives with its tests
or it does not merge**, so writing the test is part of writing the change rather than
a follow-up.

**This project** (`profile.json` → `tests`). `make test` runs pytest with
`--cov-fail-under=100`, so anything below full coverage fails the build.

Practical consequences when adding code here:

- A new branch needs a test that exercises it. An untested `except` clause or an
  untested `if` fails the run.
- If a line genuinely cannot be tested, mark it explicitly rather than letting the
  whole suite fail, and say why in the review.
- Tests live under `tests/` (`testpaths` in `[tool.pytest.ini_options]`), with
  `DJANGO_SETTINGS_MODULE` already configured, so pytest needs no extra flags.
- `make test` uses `--reuse-db --no-migrations` for speed. After a schema change use
  `make test-rebuild`, which drops `--reuse-db` and builds a fresh test database.
  A confusing test failure right after a model change is usually a stale test DB.
- `make check` runs tests then lint.


### Permissions: gate on `has_perm`, never on group membership

**Principle.** Every "is this user allowed to do this" check goes through Django
permissions: `user.has_perm("app.codename")` in Python, `{% if perms.app.codename %}`
in templates. Never `user.groups.filter(name=...).exists()`.

Groups are the **grant vehicle** only. A permission is attached to a group and adding
a user to the group confers it, so the group is how access is handed out and
`has_perm` is how access is read. Reading group names hardcodes the grant mechanism
into every call site and silently ignores permissions granted any other way,
including directly on the user.

- A new app gets a `permissions.py` with thin named wrappers
  (`is_<app>_user(user)` returning a `has_perm` call) so call sites read well and the
  codename lives in one place.
- Gate the **action** and the **UI that offers it** with the same predicate. A
  hidden button is not access control, and a visible button that 403s is a bug.
- `AnonymousUser.has_perm()` always returns `False`, which is what makes this safe
  against template or form tampering on a public site.
- Object-level access is different and is fine as a data-model check: a
  `can_access_<thing>(user, obj)` helper testing `obj.owner_id` or
  `obj.collaborators.filter(user=user)` is membership in the data, not a group name.
- Keep read predicates free of side effects. If an action also spends something
  (a credit, a quota), that spend is a separate atomic call at write time, never
  inside the predicate, because predicates run on GETs.

**This project** (`profile.json` → `permissions`). Read `reference_impls` for the
existing `permissions.py` modules to copy the shape from. Check `known_deviation`
too: a project can carry a design doc or helper that checks groups directly, and
the profile names it so you do not follow it by accident. Grant-side helpers
(`grant_app_access` / `revoke_app_access` and similar) are unaffected: it is the
read path that must go through `has_perm`.

### Secrets are encrypted at rest from the first commit

**Principle.** A model field holding a secret (OAuth refresh token, API key,
credential) uses an encrypted field class in the same commit that introduces it.
"Plaintext for now, encrypt later" is never the plan: it creates plaintext rows that
then need a data migration, and the rows that leak are the ones written before the
follow-up landed.

- Reuse the project's existing encrypted field class rather than adding a second one.
- The encryption key is required in production. Deriving it from `SECRET_KEY` when
  `DEBUG` is true is an acceptable developer convenience; falling back to plaintext
  is not.
- Never signal production through a truthy string check on an env var. `DEBUG="0"`
  and `DEBUG="False"` are both truthy in Python, so parse the value explicitly.
- When work produces a secret the human has to keep, name the password manager the
  project has standardised on (`profile.json` → `secrets.human_storage`). Do not
  suggest a wiki, a notes app, or a repo file, even when older project docs do.

**This project** (`profile.json` → `secrets`). `field_class` names the encrypted
field to reuse and `key_env_var` the key it needs. Adding a second encrypted field
implementation alongside it is not an improvement.

### Templates: CSS in a stylesheet, page furniture from shared partials

**Principle.** New CSS rules go in an external stylesheet that the template links.
Do not add `<style>` blocks to templates. External CSS is cacheable, deduplicated
across pages, reviewable as a diff, and keeps templates readable.

- Append to the stylesheet the page already loads rather than starting a new one.
- Do not rip out pre-existing `<style>` blocks in unrelated templates as a side
  quest. Stop new ones from being added, and clean up any added in this session.
- A test asserting that CSS literal text appears in a response breaks when the rule
  moves to a file. Assert the stylesheet `<link>` is present instead, or drop the
  assertion when it is now redundant.

Repeated page furniture (a list header, a breadcrumb, a marketing hero) lives in one
shared partial that pages include with parameters, not copy-pasted markup. Copy-paste
is how five apps end up with five slightly different headers.

**This project** (`profile.json` → `frontend`). Rules go in the stylesheet named by
`css_location`. Page-level conventions (list headers, breadcrumb wording, the
landing-page hero) usually live in a project-local skill or doc rather than here:
`page_conventions` points at it. Read that before building a page, and follow it;
this skill deliberately does not restate per-project UI rules.

### Running commands and finishing a change

**Principle.** Use the project's real entry points, keep the local loop fast, and
leave the commit to the human.

- **Never chain through `source venv/bin/activate`.** Claude Code will not
  auto-approve `source`, because it evaluates its argument as shell code, so every
  such command stops for a permission prompt even when the downstream command is
  allowlisted. Call the venv binary directly (`./venv/bin/pytest`,
  `./venv/bin/python`) or run through the project's container command. Pass env vars
  inline (`SECRET_KEY=test ./venv/bin/pytest`) instead of activating first.
- **Run the tests after changing code. Do not run the formatters or linters as a
  local sanity pass.** The human runs reformat and lint on their own schedule, and
  unrequested formatting output is noise in a session. Fix an obvious syntax-level
  break in a file you just wrote; skip repo-wide passes.
- **Before a PR, lint must actually pass.** CI runs tests **and** lint, so a branch
  with unformatted code fails. When preparing a branch for review, run the autofix
  and then the check commands. One trap: the `Write` tool strips the trailing
  newline, so every newly created file trips black and flake8 `W292` until the
  formatter runs.
- **Stage, do not commit.** `git add` the specific files and describe what is
  staged. No `git commit`, `git push`, or `gh pr create` unless explicitly asked.
  Offering a commit message to copy is welcome; running the commit is not.

### Email: one Markdown template, both parts

**Principle.** An email body is written once, as Markdown, and rendered once. That
render becomes the `text/plain` part directly, and the same string converted to HTML
gets injected into a branded wrapper as the `text/html` alternative.

Never hardcode a body in Python. Never maintain parallel `.txt` and `.html` body
templates, because they drift, and the plain-text one is the one nobody notices has
gone stale.

The wrapper is a separate per-email HTML template whose only job is chrome. It
receives the rendered body and injects it. Body content never lives in the wrapper.

Full implementation, the exact call sequence, and two known caveats in this
project's implementation are in `references/email.md`. **Read it before writing or
changing any email code.**

### Deployment: a portable boot contract, one host-specific seam

**Principle.** The app ships as a container with one boot contract: the entrypoint
runs migrations and then serves on `$PORT`. Everything host-specific stays in the
deploy workflow. Nothing in the image, the settings module, or the entrypoint should
name the hosting provider, so moving hosts is a workflow change rather than a rewrite.

Dev services (Postgres, Redis) run in `docker compose` rather than on the host, and
each project publishes them on its **own** host ports. Several Django projects on one
laptop otherwise fight over 5432 and 6379.

The Azure App Service gotchas that cost real debugging time (amd64 builds, the truthy
`DEBUG` string, `WEBSITES_PORT`, where the real boot logs are, the one-shot service
principal) are in `references/deployment.md`. **Read it before touching a Dockerfile,
an entrypoint, or a deploy workflow.**

## Reference files

- `references/email.md` — the email pattern in full, with the reference
  implementation and its known issues.
- `references/deployment.md` — the container boot contract, the dev compose stack,
  and the Azure App Service gotchas.
