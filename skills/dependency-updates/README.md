# dependency-updates

How to evaluate a dependency update before it merges: read every version between the old pin and the new one, find how the project actually uses the package, run the suite and the real service with the new version installed, and write down what a downstream user or a deployer now needs to know.

Loads on its own when Dependabot or Renovate pull requests are being gone
through, when a requirements or lockfile change is a major version, when a
CI failure appears on a bump branch, or when deciding whether a bump needs a
changelog entry.

- **A green check is not a verdict**: it proves the mocked test path with
  the new pin, not the production path or the versions skipped in between.
- **Read every major between the pins**: the bot's body quotes the newest
  release notes and truncates; the breaking changes live in the ones it
  skipped.
- **Find the real use**: directly, only through another library (redis
  through kombu, sqlparse through Django), or not at all. Each is a
  different check.
- **Run the real thing**: the suite with CI's environment, the tool itself
  when the bump is a tool, a live worker against a real broker when the
  tests run it eagerly, and the oldest server a deployment might run when a
  default handshake changed.
- **A control run before blame**: rerun a failure on the old version; a hung
  suite is usually a stopped database, and a flaky test is a fix of its own.
- **Write the minimum down**: a new handshake the old server lacks is a
  minimum version for the changelog and the deployment guide.
- **Merge on the owner's word**, in the repository's own style, security
  fixes first.

`references/redis-py-8.md` works one update through from the bot's body to
the merged changelog line.
