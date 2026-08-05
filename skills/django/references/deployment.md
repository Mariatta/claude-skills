# Deployment: portable container, one host-specific seam

## Why

The app should be able to change hosts without a rewrite. That holds as long as
exactly one thing knows the provider's name: the deploy workflow. The image, the
entrypoint, and the settings module stay generic.

The gotchas below were collected across two Django deployments to Azure App Service,
both running a container pulled from a registry, and both hitting the same walls in
the same order. `profile.json` → `deployment.reference_docs` points at whatever the
project has written down.

## The boot contract

One contract, and every host satisfies it:

1. The entrypoint runs `python manage.py migrate`.
2. It then execs gunicorn bound to `0.0.0.0:$PORT`.
3. Static files are already collected, served by whitenoise, so there is no separate
   static host to configure.

Anything a specific provider needs (resource names, app settings, credentials) lives
in `.github/workflows/deploy.yml` and nowhere else.

## Gotchas that cost real time

### Build for the right architecture

Build `--platform linux/amd64`. An arm64 image built on an Apple Silicon Mac starts
and dies with `exec format error`, and App Service reports that as a **container
start timeout**, which sends you looking at boot performance instead of the
architecture.

### `DEBUG` from an env var is a trap

`DEBUG="0"` and `DEBUG="False"` are both truthy strings. Parse the value explicitly,
or set the variable to the empty string in production. Getting this wrong ships debug
pages to production without any error to notice.

### Keep `SECRET_KEY` stable across deploys

Rotating it on every deploy logs everyone out and invalidates signed tokens. Reuse
the existing value; store it in 1Password.

### `.dockerignore` is mandatory

Without it, `.env`, `.venv`, and any `client_secret_*.json` land inside the image.
Write it in the same commit as the Dockerfile, not after the first build. The
`gitignore` skill's `references/templates.md` has a matching block.

### Registry and platform details

- GHCR tags must be lowercase. Use `${GITHUB_REPOSITORY,,}` in the workflow.
- URL-encode the database password inside `DATABASE_URL`. A password with `@` or `/`
  in it produces a parse error that reads like a network failure.
- Set `WEBSITES_PORT=8000` and `WEBSITES_CONTAINER_START_TIME_LIMIT=1800`.
- The real boot logs are in `*_default_docker.log`, not the app log stream. Almost
  every "the container will not start" hunt ends in that file.
- Match the managed Postgres **major version** to the source database before any
  dump and restore.
- Create the deploy service principal **once**. Re-running
  `az ad sp create-for-rbac` resets its password and breaks the stored credential.
- Behind the platform proxy, set `SECURE_PROXY_SSL_HEADER` and
  `CSRF_TRUSTED_ORIGINS`, or every POST fails CSRF while GETs look fine.

### Do not let a token refresh failure destroy the token

A refresh error handler that clears the stored `refresh_token` turns one transient
provider outage into permanent data loss, and it re-wipes freshly restored tokens on
every page load. Distinguish `invalid_grant` (the token really is dead, the user must
reconnect) from `invalid_client` and transient errors (the app's own credentials or
the network are wrong, the token is fine). Only the first justifies clearing
anything.

## Local dev stack

Postgres and Redis run in `docker compose`, never on the host, and each project picks
its own published host ports so several Django projects can run side by side. Record
the assignment in the project's own CLAUDE.md or README; the defaults collide by
construction.

Tests run against the compose database.

## Migrating data between hosts

Run the dump and restore from a container **inside** the target network rather than
over the public internet from a laptop. Reset the target schema first
(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`) so a partial earlier attempt
cannot leave half a schema behind, then `pg_dump | pg_restore`.

Before cutting over, verify the app boots against the new database and that
credentials copied across still work at the provider, not just that the rows arrived.