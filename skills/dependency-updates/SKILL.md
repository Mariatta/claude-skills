---
name: dependency-updates
description: How to evaluate a dependency update and prove it compatible before it merges, whether Dependabot, Renovate or a person opened it, for a library, a tool, a GitHub Action or a base image. Use whenever asked to go through, review, verify, check, update or merge dependency bumps or bot pull requests, when a requirements or lockfile change is a major version, when a CI failure appears on a bump branch, or when deciding whether a bump needs a changelog entry or a minimum version in the docs. The steps: read every version between the old pin and the new one, find how the project actually uses the package, often only through another library, install the new versions and run pip check, the full suite, the changed tool itself and a live smoke test against the real service, probe the oldest server a deployment might run when a default handshake changed, separate environmental failures from regressions with a control run, write a changelog line when a downstream user imports the package, and merge on the owner's word.
---

# Evaluating dependency updates

A green check on a dependency bump says the test suite still passes with the
new pin. It does not say the package is used the way the tests exercise it,
that the versions skipped in between carry no behaviour change, or that the
production path (a broker, a storage client, a release workflow) still works.
This skill turns the badge into a decision. One update at a time, in the order
below, and every claim in the report comes from something run, not from the
release notes alone.

It applies to any update: a Dependabot or Renovate pull request, a bump a
person opened, or a `pip list --outdated` you are working through by hand.
Project specifics (the test command, the venv, the database, how browser
libraries are vendored) come from the project's own instructions and
developer docs, not from here. `references/redis-py-8.md` is one update
worked through end to end; read it when a major bump reaches a library the
code only uses through another one.


## 1. Know what you are looking at

List the updates, and for each one note the ecosystem (pip, npm,
GitHub Actions, Docker), the file it touches, and whether that file is in the
production image, the dev tooling or a workflow. In a fork with an `upstream`
remote, `gh pr list` can answer for the wrong repository: name it with `-R`.
For Renovate the author is `app/renovate`.

```bash
gh pr list -R OWNER/REPO --author app/dependabot \
  --json number,title,headRefName,mergeable,statusCheckRollup
```

A bump to something the project does not use (an inherited pin with no
import, a workflow that never runs) is still fine to merge, but the report
says so, because the owner may rather drop the pin.

**What the bot hides.** Dependabot opens at most five version-update pull
requests per ecosystem unless `open-pull-requests-limit` says otherwise. Five
open pip bumps means more are waiting, and some may be security fixes. The
audit tool on the requirements shows them:

```bash
pip-audit -r requirements.txt --progress-spinner off
```

Tell the owner what the next round holds.


## 2. Read every version between the pins, not only the newest

A bot's body quotes the newest version's notes and truncates. A bump from 6.4
to 8.1 skipped 7.0 and 8.0, and the breaking changes live there. Pull each
major's notes directly:

```bash
gh api repos/OWNER/REPO/releases/tags/vX.0.0 -q .body
```

Fall back to the repository's changelog file when releases are not annotated.
Note for each version:

- breaking changes, renamed or removed parameters, and changed defaults
  (connection timeouts, wire protocols, retry counts, handshakes),
- dropped Python, Node or framework versions against what CI runs,
- end-of-life or end-of-maintenance notices, which the owner wants to know
  even when the bump itself is harmless,
- security fixes, which raise the priority of merging.

For a GitHub Action, look for the Node runtime line ("requires Actions
Runner v2.327.1 or later"): fine on GitHub-hosted runners, a real check on
self-hosted ones. Also look for removed inputs and compare against every
`with:` block in the workflows.


## 3. Find how the project uses the package

```bash
grep -rn -i PACKAGE --exclude-dir=venv --exclude-dir=node_modules --exclude-dir=.git .
```

Three outcomes, each handled differently:

- **Used directly.** Read the call sites against the breaking changes. Any
  changed default the code relied on without naming is a finding.
- **Used only through another library.** Common: redis through kombu and
  Celery, sqlparse through Django, boto3 through django-storages. The
  question becomes whether that library supports the new major. Check its
  declared range and its release notes for the explicit support line:

  ```bash
  python -c "import importlib.metadata as m; print([r for r in m.requires('kombu') if 'redis' in r])"
  gh api repos/celery/kombu/releases/tags/vX.Y.Z -q .body | grep -i redis
  ```

  Then read how it passes the parameters whose defaults changed. The report
  needs a sentence like "kombu passes `socket_timeout=None` explicitly, so
  the new five-second default never reaches the blocking read".
- **Not used at all.** No import, settings entry, URL include or workflow
  step. Safe by construction; say so.


## 4. Install and run, locally, against the real thing

Install every bumped version of the round into the project's environment
(quote extras in zsh: `'PACKAGE[extra]==X.Y.Z'`), then:

1. **Conflicts.** `pip check`, or the ecosystem's equivalent, for the
   libraries that depend on the package.
2. **The suite.** The project's full test suite with its coverage gate, as
   its docs give the command, with the environment the project's CI uses.
   Run once with all the bumps installed; bisect a failure by reverting one
   pin.
3. **The tool itself.** When the bump is a tool (an auditor, a linter, a
   formatter), run it on the project. A tool that imports fine but cannot
   parse the project's files passes the suite and fails in CI.
4. **A live smoke test for what the tests mock away.** Tests run task queues
   eagerly and storage against a fake, so a broker or storage client bump is
   never exercised by them. Start the real thing against a real service, on
   a spare database or queue of a compose service already running locally,
   and read its log for the connect, the delivery and the acknowledgement.
5. **Every migration from nothing, for a framework bump.** A suite that
   runs with `--no-migrations` never applies a migration to an empty
   database, so a framework release that changes how schema operations are
   emitted (Django 6.0 stopped dropping columns with CASCADE) breaks a fresh
   install while every existing deployment, and CI, stays green. Create an
   empty database and run `manage.py migrate` against it; the check is a
   minute, and the first community that installs from scratch is the one
   that finds it otherwise.
6. **The oldest server a deployment might run.** A client library's new
   default can be a handshake the server has to understand. When a major
   changes a wire protocol or a default handshake, probe the oldest server
   version a deployment could plausibly have (a throwaway
   `docker run redis:5-alpine` takes a minute). A failure there is a minimum
   version nobody had written down: it goes in the changelog and in the
   deployment guide, where the other minimums live.

**A failure that is not the bump.** When something fails, rerun it with the
old version installed before blaming the new one; the control run is what
lets the report say "pre-existing" with evidence. Then restore the new
version. Two environmental shapes to recognise:

- A run that prints nothing for far longer than usual is the environment:
  check that the database the suite needs is answering before anything else.
  A stopped Docker Desktop leaves the suite waiting forever.
- A test that fails only outside CI often needs a variable CI's environment
  sets; a boot check that refuses to start without production variables is
  the common case.

**A CI failure on the bump branch after your own push may be a flake.** Read
the failing test before anything else. A test that recomputes a signed,
timestamped value after the code under test produced one fails whenever the
clock crosses a second between the two calls; rerun the failed job
(`gh run rerun RUN_ID --failed`) and report the flaky test as a fix of its own.

**GitHub Actions.** A bump to a workflow that runs on pull requests is
exercised by the pull request's own CI run: a green check there is the test.
A bump to a workflow that runs only on tags cannot be exercised before the
next release; say so, read its inputs against the removed-input list, and let
the next release be the test.


## 5. Decide, then land it the repository's way

Ask three questions before a major bump merges:

1. **Does a downstream user import this?** A library inside a published image
   or package that others build on gets a changelog line under the
   unreleased version, written for them: what changed, what to check before
   pinning the new version. A server process, a dev tool or a GitHub Action
   does not.
2. **Is a dependency holding it back?** When another library's newest
   release caps the bumped package, pin to the highest allowed version, tell
   the bot to ignore beyond it with the reason beside the rule, and say so
   in the pull request body.
3. **How does this repository merge?** Check the merge settings and the
   precedent (`git log --grep='^Bump'`). With squash merges that take the
   pull request's title and body, a plain bump merges as the bot wrote it.
   Rewrite the body only when the merge needs explaining: a major whose
   safety rests on an argument the reviewer cannot see in the diff, or a pin
   that stops short of what the bot proposed.

**Altering a bot's branch.** Once you push a commit to it, Dependabot stops
rebasing it, so it may conflict with the default branch soon after. Bring it
up to date the way the `git` skill's practice "Fix a bad base by rebasing,
not by merging main back in" says: `git fetch origin && git rebase
origin/main`, then `git push --force-with-lease`. Only when the forge really blocks a
non-fast-forward push to that branch, merge the default branch in and resolve
by hand; a squash merge flattens it. Either way, verify the branch afterwards:
its diff against the default branch should be exactly the pin plus your
additions.

**Merging is the owner's call.** Report the verdicts with a merge order,
security fixes first, and merge only on their explicit word for this round.
Leave an unmergeable or failing one open with a note on what blocks it, and
never tell the bot to ignore a version without the owner's word.


## 6. Report

Per update, one line of verdict with the reason, then the evidence that is
not visible in the diff: the breaking changes between the pins and why each
one does not reach this project, what was run and what it printed, what could
not be tested and when it will be. Close with what the next round holds and
any end-of-life notice found along the way.
