# One update, worked through: redis-py 6.4.0 to 8.1.0

A Django project with a Celery worker. Dependabot opened seven pull requests
in a week; this is the one that needed the full procedure, kept here as the
shape every major bump follows.

## What the bot said

The body quoted the 8.1.0 release notes: new commands, async maintenance
notifications, bug fixes. Nothing alarming, CI green, compatibility badge
present. Two majors had been skipped, and the body did not mention either.

## Reading the versions in between

```bash
gh api repos/redis/redis-py/releases/tags/v7.0.0 -q .body
gh api repos/redis/redis-py/releases/tags/v8.0.0 -q .body
```

7.0 was type hints and internal helpers. 8.0 was the real one:

- RESP3 became the wire protocol by default, with the old response shapes
  kept unless asked for.
- `socket_timeout` and `socket_connect_timeout` now default to five seconds,
  with a note that blocking commands such as `BRPOP` can hit the socket
  timeout first.
- Connection pools default to 100 connections and ten retries with jitter.
- Return type hints changed, a breaking change for type checkers only.

Two of those are defaults the broker path would feel if they reached it.

## How the project used it

```bash
grep -rn -i redis --exclude-dir=venv --exclude-dir=.git .
```

No `import redis` anywhere. The only use was `CELERY_BROKER_URL` in settings
and the compose service: redis reached the project through kombu. So the
question became kombu's, not the project's:

```bash
python -c "import importlib.metadata as m; print([r for r in m.requires('kombu') if 'redis' in r])"
# ['redis<9.0.0,>=6.4.0; extra == "redis"']
gh api repos/celery/kombu/releases/tags/v5.7.0 -q .body | grep -i redis
# chore(redis): support redis 8.x
```

Then the kombu source, for the two defaults: `kombu/transport/redis.py`
declares `socket_timeout = None` on the channel and passes it explicitly into
the connection parameters, so redis-py's new five-second default never
reaches the blocking read. It also reads the negotiated protocol, so RESP3 is
handled. That is the sentence the report needed.

## Running it

Installed 8.1.0 into the project venv with the other bumps of the week,
`pip check` clean, full suite with the coverage gate green. Then the part
the suite never exercises, because tests run Celery eagerly: a worker against
the compose Redis 7 on a spare database number.

```bash
celery -A project worker -l info --pool solo -n smoke@%h > worker.log 2>&1 &
celery -A project inspect ping -d smoke@$(hostname) -t 10
python -c "import django; django.setup(); from project.tasks import a_cheap_task; print(a_cheap_task.delay().id)"
```

Ping answered over pub/sub, two tasks delivered and acknowledged. The first
attempt with the default prefork pool failed inside billiard on macOS with
Python 3.14; the same failure on 6.4.0 showed it was the pool, not the bump,
and the solo pool was the right tool for a local smoke test.

## The thing nobody had written down

RESP3 by default means the client opens every connection with `HELLO`, a
command that arrived in Redis 6. A reviewer asked whether an old server
still connected. One minute with two throwaway containers:

```bash
docker run -d --rm --name r5 -p 6390:6379 redis:5-alpine
docker run -d --rm --name r6 -p 6391:6379 redis:6-alpine
python -c "import redis; print(redis.Redis(port=6391).ping())"   # True
python -c "import redis; print(redis.Redis(port=6390).ping())"
# ResponseError: unknown command `HELLO`, with args beginning with: `3`
```

Redis 5 is long out of support and every known deployment ran 7, but the
project's deployment guide named a Postgres minimum and no Redis minimum.
The bump added one. The changelog entry, written for the community apps that
build on the project's image, said the broker must be Redis 6 or newer and
why, pointed at the 7.0 and 8.0 notes, and sat beside the Django 6.0 entry
so the dependency changes read together. The deployment guide gained a
Broker section next to Database, stating the minimum once for every host.

## Landing it

Pushing the changelog commit to Dependabot's branch stopped the bot rebasing
it, and the branch conflicted with the default branch the same afternoon.
The repository allows a force push to that branch, so the right move was a
rebase; the tooling in use that day refused the force push, so the default
branch was merged in instead and the changelog conflict resolved by hand,
which the squash merge flattens. The 3.15 CI job then failed once on a test
that recomputed a timestamp-signed token after the email had been sent, a
flake the clock produces when it crosses a second between the two calls; a
rerun passed, and the flaky test went to the owner as a fix of its own. The
pull request is green and mergeable; the merge is the owner's.
