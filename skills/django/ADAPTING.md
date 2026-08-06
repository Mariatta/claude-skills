# Adapting this skill to your Django project

`profile.json` ships as an **example profile**, shaped after a real Django project.
To run the skill on your own project you edit that file. The `SKILL.md` body is
written so the portable principles stand on their own; the profile is where
project-specific values live, and it is the only file most projects need to touch.

Most projects change **four things**: the formatter stack, the coverage threshold, the
email paths, and the Python versions. Sections 5 to 8 cover the rest of the profile,
which usually needs a smaller edit or none at all.

## 1. Formatter stack (the big one) — `profile.json` → `formatting`

The example profile runs black, isort, djlint, and flake8. The most common divergence
is a project on **ruff**. The convention does not change; only the tools do.

```json
"formatting": {
  "stack": ["ruff", "djlint"],
  "config_locations": {
    "ruff": "pyproject.toml [tool.ruff]",
    "djlint": "pyproject.toml [tool.djlint]"
  },
  "commands": { "check": "ruff format --check . && ruff check .", "fix": "ruff format . && ruff check --fix ." }
}
```

Two things to know when swapping:

- **djlint stays either way.** Ruff does not touch Django templates. Whatever formats
  your Python, templates still need djlint or an equivalent.
- **The isort/black profile trap evaporates.** `ruff format` and `ruff check --select I`
  are the same tool, so they cannot disagree about imports. Drop that line from your
  mental checklist, and from the convention if you are editing SKILL.md for a fork.

If your project has no formatter at all, the convention degrades to "match the
surrounding file's style" and you should say so in the profile rather than leaving the
stack list populated with tools that are not installed.

## 2. Coverage threshold — `profile.json` → `tests`

The example profile enforces 100% and treats it as a merge gate. Most projects do not.
Set `coverage_threshold` to whatever CI actually enforces, and set
`coverage_enforced_in_ci` to `false` if it is advisory.

The principle survives at any number: **match the threshold CI enforces, and never
lower it to make a change pass.** A project at 78% still gets the useful part, which
is that lowering the bar to land a feature is not an option available to Claude.

If your project uses Django's own test runner rather than pytest, update `runner`,
`command`, and drop `testpaths` and `speed_flags`.

## 3. Email — `profile.json` → `email`

If your project sends no email, set `"enabled": false` and the convention is skipped.

Otherwise the things that vary:

- `template_path` — where email templates live in your layout.
- `markdown_lib` and `markdown_extensions` — some projects use `markdown-it-py`,
  `mistune`, or `commonmark`. The pattern is identical; only the call changes.
- `wrapper` — some projects have one shared wrapper rather than one per email. That is
  fine and arguably better; note it here.
- `sanitizer_available` / `sanitizer_used_by_email_path` — whether a sanitizer exists
  and whether the email path uses it. Set both to `false`/`null` if your project has
  neither.

The two failure modes in `references/email.md` are things to **check**, not things
asserted about your code. Record the answers in the profile once you have looked, so
the next session does not have to re-derive them.

## 4. Python versions and runner — `profile.json`

`python_versions` and `runner` are cosmetic but they show up in commands. If your
project does not run tooling inside Docker, set `"runner": null` and drop the
`docker compose run --rm web` prefix from the command examples in SKILL.md.

## 5. Permissions — `profile.json` → `permissions`

The principle (gate on `has_perm`, never on a group name) is portable and should not
change. What changes is where the wrappers live and whether your project has a
documented deviation: an older design doc or a helper that checks groups directly and
would be followed by mistake. If there is none, delete `known_deviation` rather than
leaving a warning about a helper your codebase does not have.

Projects using a rules engine such as django-rules or django-guardian keep the same
principle, since both still resolve through the permission layer rather than group
names. Record the library in `gate_with` so the call shape is right.

## 6. Secrets — `profile.json` → `secrets`

Set `field_class` to whatever your project uses. Common alternatives to a hand-rolled
Fernet field are django-fernet-fields, django-encrypted-model-fields, and a cloud KMS
integration. The convention is unchanged: encryption lands in the same commit as the
field.

`human_storage` is where the human is told to keep the resulting secret. Set it to
whatever your team standardises on, and set it in the profile rather than in SKILL.md
so the advice cannot drift between the two.

## 7. Frontend — `profile.json` → `frontend`

`css_location` is the one value that always changes. The example profile assumes a hand-written
brand stylesheet; a Tailwind project instead compiles a stylesheet
from source and **commits the compiled output** so the image needs no Node. If your
project does that, say so here, and note the rebuild command, because a template
change that adds a class is silently missing from prod until the CSS is rebuilt.

`page_conventions` points at whatever the project uses for page-level UI rules. That is
typically a second, repo-local skill or doc living with the code it describes; this
skill deliberately does not restate it. If your project has no such document, set the
key to `null`.

## 8. Workflow and deployment — `profile.json` → `workflow`, `deployment`

`workflow` encodes how Claude should behave in a session rather than what the code
looks like. The two values worth checking: whether tooling runs through a container or
a local venv, and whether Claude may commit. The example profile says stage only.

`deployment` describes the target. The boot contract (migrate, then serve on `$PORT`,
static already collected) is portable across App Service, Fly, Render, and Cloud Run,
so usually only `target` and the workflow path change. `references/deployment.md` is
mostly Azure App Service specifics: if you deploy elsewhere, keep the boot contract
and the token-refresh warning, and replace the platform gotchas with your own as you
hit them.

## Adding your own conventions

The skill is designed to grow. To add one:

1. Add a `###` section under `## Conventions` in SKILL.md, written as a **principle
   first, project specifics second**, and keep the specifics down to a pointer at the
   profile key. That split is what makes the skill portable rather than a description
   of one repo.
2. If it has real implementation detail, put that in `references/<name>.md` and link
   it from SKILL.md with a line telling Claude when to read it.
3. Put any project-specific values in `profile.json` rather than inline in SKILL.md.
4. Write it so a person can follow it by hand. A convention that works only because
   an agent is reading it is not finished: state the rule, then the reason, in prose
   someone can act on without the agent. If you cannot explain it that way, the
   convention is not yet understood well enough to be written down.

Good candidates that are deliberately not covered yet: settings and environment
handling, migration review, admin conventions, and view/service layering.
