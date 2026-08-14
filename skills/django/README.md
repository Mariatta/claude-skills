# django

House conventions for writing code in a Django codebase.

Each convention is written as a portable principle plus a pointer to where this
project's own values live (`profile.json`):

- **Code style** — match the project's formatters and emit code that already passes
  them. Covers the black/isort/djlint/flake8 stack and the `isort profile = black`
  trap.
- **Imports** — everything at module top. Circular imports get refactored, not moved
  inline, with the Django-specific escape hatches listed.
- **Docstrings** — triple-quoted first statement, not a stack of `#` comments.
- **Dependencies** — check for a maintained library before hand-rolling a pattern.
- **Tests** — coverage is a merge gate. New code arrives with its tests.
- **Queries** — an N+1 is caught at write time, not by a production alert. Fetch
  related data in `get_queryset`, annotate instead of counting per row, and pin the
  count with a test that fails when it scales with the fixture.
- **Permissions** — gate on `has_perm`, never on group membership. Groups only grant.
- **Secrets** — encrypted at rest in the same commit the field appears in.
- **Templates** — CSS in a stylesheet, repeated page furniture in shared partials.
- **Session workflow** — no `source venv/bin/activate`, run tests and leave lint to
  the human, stage changes but never commit.
- **Email** — one Markdown template rendered once, producing both the `text/plain` and
  `text/html` parts. Never parallel body templates.
- **Deployment** — a portable container boot contract with one host-specific seam.

## Files

| File | What it is |
|---|---|
| `SKILL.md` | The conventions |
| `profile.json` | Every project-specific choice, in one editable place |
| `ADAPTING.md` | What to change to run this on a different project |
| `references/queries.md` | Spotting an N+1 in a diff, the fix per relation direction, prefetch-cache traps, query-count tests, detection libraries |
| `references/email.md` | The email pattern in full, with reference implementation |
| `references/deployment.md` | Boot contract, dev compose stack, Azure App Service gotchas |

## The example profile

`profile.json` ships filled in for one plausible stack: Python 3.13 and 3.14, tooling
run inside `docker compose run --rm web`, `make lint` / `make reformat` / `make test`
/ `make check` as entry points, and 100% coverage enforced in CI.

## Using it on your project

Edit `profile.json` and read `ADAPTING.md`. The most common change by far is swapping
black, isort, and flake8 for ruff, which keeps djlint and removes the isort/black
profile trap entirely.

## Adding conventions

This skill is meant to grow. `ADAPTING.md` has the pattern: principle first,
reference-build specifics second, project values in `profile.json`, implementation
detail in `references/`.
