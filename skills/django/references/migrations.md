# Migrations

Read this before squashing a branch's migrations, when a regenerated file collides
with one that merged while you worked, or when a migration has reached a database
it should never have reached.

The convention it serves is in `SKILL.md`: **one migration per pull request, and a
merged migration is never edited.** Project-specific values are in `profile.json`
→ `migrations`.

## Why a merged migration is frozen

The deploy applies migrations. By the time a migration is on the default branch it
has run against a real database, and that database now has the shape the file
described *at the moment it ran*.

Editing the file afterwards does not go back and change anything. It changes what a
database created *later* gets. So a fresh checkout, a new environment, and CI all
build one schema while production carries another, and nothing announces the split.
The failure surfaces later, somewhere unrelated, usually as a column that exists in
one place and not another.

This is why the fix for a wrong migration is **another migration**. It is reviewed,
it is deployed, and it moves every database from the shape they actually have to the
shape you want. That is the only mechanism that reaches them all.

## The squash, step by step

While a branch is open, its migrations are unreleased and may be replaced freely.

1. **List what the branch added**, rather than trusting memory. `git diff` on a path
   can quietly match nothing, so list the directory at both ends instead:

   ```bash
   git ls-tree --name-only origin/main -- <app>/migrations/ > /tmp/before
   git ls-tree --name-only HEAD        -- <app>/migrations/ > /tmp/after
   diff /tmp/before /tmp/after
   ```

2. **Rescue anything hand-written.** Open each file the branch added and copy out
   every `RunPython` and `RunSQL` step, `reverse_code` included. `makemigrations`
   regenerates schema operations only; a data migration that is not carried across
   by hand is simply lost, and its loss is invisible until the data is missing.

3. **Delete and regenerate.**

   ```bash
   rm <app>/migrations/00XX_*.py        # only the ones the branch added
   python manage.py makemigrations <app> -n <descriptive_name>
   ```

   Paste the rescued data steps back into the new file, in an order that makes sense
   against the schema operations around them.

4. **Check nothing is outstanding.**

   ```bash
   python manage.py makemigrations --check --dry-run   # "No changes detected"
   ```

5. **Migrate a database that has never seen this branch.** A `--reuse-db` test run
   proves nothing here, and a `--no-migrations` one proves less: both skip the very
   code under test.

   ```bash
   createdb <project>_migrationcheck
   DATABASE_URL=postgres://.../<project>_migrationcheck python manage.py migrate
   dropdb <project>_migrationcheck
   ```

   This is what catches a dependency on a migration that no longer exists, an
   operation ordered before the table it touches, and a data step that assumes rows
   a fresh database does not have.

## When a number collides

Someone merged a migration while the branch was open, and it took the number the
regenerated file wants.

Rebase onto the updated default branch, delete the branch's migration, and
regenerate it. The new file picks up the correct number and depends on the migration
that merged.

Never renumber by hand: the number is half of it, and `dependencies` is the other
half. A file called `0007_` that still depends on `0005_` builds a graph that works
on your machine and breaks on any database that applied the other `0006_` first. And
never edit the migration that merged to make room for yours.

## Squashing is not `squashmigrations`

Django's `squashmigrations` command compacts *released* history, many migrations into
one, for an app whose migration directory has grown unwieldy over years. It leaves a
replacement file that claims to stand in for the originals, and it needs a careful
rollout across environments that are at different points in that history.

What this document describes is different and much smaller: a branch regenerating its
own unreleased file before anyone else sees it. Reach for `squashmigrations` only
when the goal really is to compact released history, and treat that as its own
change, not as branch hygiene.

## Pull request environments: the trap

Some platforms deploy every pull request. If that environment shares a database with
anything that outlives the branch, **the branch's migrations are applied there** and
recorded in `django_migrations` as having run.

Then the branch squashes. The file that ran no longer exists, and that database is
now carrying a schema change whose migration is gone, with a row in the migrations
table naming a file nobody can produce.

Two ways out, in order of preference:

- **Stop applying migrations from pull request branches.** Turn the deployment off,
  or point it at a database that is thrown away with the branch. Record the decision
  where the next person will look, which is usually the deployment doc.
- **Repair forward.** Write a migration on the default branch that brings the schema
  to the intended state from whatever the stray one left behind, and delete the
  orphaned row from `django_migrations` in the same migration so the table matches
  the files again. It is a real change, reviewed and deployed like any other.

If the platform is the one applying migrations, the person merging cannot see this
happen. That is why `profile.json` → `migrations.pr_environments` exists: it records
whether the hazard is present in this project rather than leaving it to be
rediscovered.
