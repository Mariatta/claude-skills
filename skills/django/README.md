# django

House conventions for writing code in a Django codebase.

Each convention is written as a portable principle plus the specifics of one
reference build:

- **Code style** — match the project's formatters and emit code that already passes
  them. Covers the black/isort/djlint/flake8 stack and the `isort profile = black`
  trap.
- **Imports** — everything at module top. Circular imports get refactored, not moved
  inline, with the Django-specific escape hatches listed.
- **Docstrings** — triple-quoted first statement, not a stack of `#` comments.
- **Dependencies** — check for a maintained library before hand-rolling a pattern.
- **Tests** — coverage is a merge gate. New code arrives with its tests.
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
| `references/email.md` | The email pattern in full, with reference implementation |
| `references/deployment.md` | Boot contract, dev compose stack, Azure App Service gotchas |

## Reference build

secretcodes (`mariatta/secretcodes`), verified 2026-08-04. Python 3.13 and 3.14,
tooling run inside `docker compose run --rm web`, `make lint` / `make reformat` /
`make test` / `make check` as entry points.

## Using it elsewhere

Edit `profile.json` and read `ADAPTING.md`. The most common change by far is swapping
black, isort, and flake8 for ruff, which keeps djlint and removes the isort/black
profile trap entirely.

## Adding conventions

This skill is meant to grow. `ADAPTING.md` has the pattern: principle first,
reference-build specifics second, project values in `profile.json`, implementation
detail in `references/`.
