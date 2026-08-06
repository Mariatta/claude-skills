# gitignore

What never belongs in version control, and what to do when it already got there.

Loads on its own when a repository is being initialized, a `.gitignore` or
`.dockerignore` is being written, files are being staged, or a file holding
credentials is created.

- **Always ignore** — environment and secret files first, then virtualenvs, build
  output, caches, local databases, collected static and media, OS and editor cruft.
- **Do not ignore** — lockfiles, migrations, `.env.example`, and committed build
  artifacts that the production image depends on.
- **`.gitignore` does not untrack** — an already-tracked file keeps being tracked
  until `git rm --cached`, and it stays in every earlier commit regardless.
- **A committed secret gets rotated** — history rewriting is tidiness, not
  remediation, and it never comes first.
- **`.dockerignore` needs the same entries** — otherwise `COPY . .` bakes `.env`
  into a readable layer.

## Files

| File | What it is |
|---|---|
| `SKILL.md` | The rules |
| `references/templates.md` | Paste-ready blocks: baseline, Python, Django, Node, Terraform, `.dockerignore` |