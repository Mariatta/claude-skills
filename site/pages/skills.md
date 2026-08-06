---
title: "The skills"
eyebrow: "Read them"
lead: "Two so far, with more as I keep working alongside agents. Each is a set of house rules Claude applies on its own, written as prose you can follow by hand."
weight: 6
---

A skill is a folder of Markdown. Claude reads the `description` at the top of each
one and loads the whole file when what you are doing matches, so there is no command
to type and nothing to remember. [Installing](/install/) covers getting them onto your
machine.

Everything below is the exact file Claude loads, published as-is.

## django

How **I** like a Django codebase written, in eleven conventions. Each is stated as a
principle that holds anywhere, followed by a pointer to where a project keeps its own
values.

These are my preferences for my own projects, not Django community consensus and not
a style anyone else has to adopt. When I contribute to someone else's codebase, that
project's conventions take precedence: its `CLAUDE.md` or `AGENTS.md`, its existing
code, and whatever its maintainers ask for. The skill says so in its own opening
lines, so an agent that loads it defers too.

Take it and make it yours. [`profile.json`](/django-profile/) is where your stack goes,
which is usually the only file you need to touch, and every convention is
self-contained: delete the ones you disagree with, reword the ones you keep, add your
own. It is MIT licensed precisely so it can become your house style rather than mine.

Formatter and linter compliance · imports at module top, with real refactors for
circular imports · docstrings over comment blocks · maintained libraries over
hand-rolled code · coverage as a merge gate · permission gating through `has_perm` ·
secrets encrypted at rest · CSS in a stylesheet · session workflow · email as one
Markdown template · a portable container boot contract.

- [The conventions](/django/)
- [Adapting it to your project](/django-adapting/), which is one file to edit
- [profile.json](/django-profile/), every project-specific value in one place
- [The email pattern in full](/django-email/)
- [Deployment](/django-deployment/)

## gitignore

What never belongs in version control, and what to do when it already got there.

The always-ignore baseline led by environment and secret files · the files people
wrongly ignore, such as lockfiles and migrations · why `.gitignore` does not untrack
anything · why a committed secret gets rotated rather than merely deleted.

- [The rules](/gitignore/)
- [Paste-ready ignore blocks](/gitignore-templates/) for Python, Django, Node,
  Terraform, and `.dockerignore`

## Pointing an agent at one

The skills are written for an agent to load, so the useful question is where to send
yours.

**Best: install them.** `git clone` plus `./install.sh` and Claude Code picks the
right skill on its own, with nothing to remember and no URL to paste. See
[Installing](/install/).

**Without installing:** hand your agent the raw Markdown. Every skill file is served
verbatim, frontmatter and all, so reading it by URL gives the same text an installed
skill provides:

```
https://claude-skills.mariatta.ca/raw/django/SKILL.md
https://claude-skills.mariatta.ca/raw/gitignore/SKILL.md
```

Swap the filename for `ADAPTING.md`, `profile.json`, or anything under `references/`.
The rendered pages on this site are for people: they carry theme chrome and drop the
frontmatter that tells an agent when the skill applies, so send the raw file, not the
page.

**Or point at the whole site.** [`/llms.txt`](/llms.txt) lists every skill, what each
is for, and the raw URL of every file, which is the one address to give an agent that
should work out the rest itself.

## Adding one

The repo takes skills that apply across projects. Anything that describes one
codebase belongs in that codebase's own `.claude/skills/`, where it is versioned with
the code it describes.

Then write it so a person can follow it by hand: state the rule, then the reason. A
convention that works only because a machine is reading it is not finished.
