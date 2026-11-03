# [Backstage](https://backstage.io)

Backstage app built as a Yarn workspace monorepo, orchestrated with [Nx](https://nx.dev), tooling managed by [mise](https://mise.jdx.dev).

```
packages/app            Frontend app (bundled into the backend image)
packages/backend        Backend + Dockerfile
plugins/hello           Example frontend plugin (/hello)
plugins/hello-backend   Example backend plugin
```

## Prerequisites

- [mise](https://mise.jdx.dev/getting-started.html): installs the pinned Node and Yarn from `mise.toml`
- Docker (for building the image)

```sh
mise install
```

## Development

```sh
mise run init   # yarn install --immutable
mise run dev    # start app (http://localhost:3000) and backend (http://localhost:7007)
```

Checks (all run through Nx, cached in `.nx/cache`):

```sh
yarn lint:all        # ESLint
yarn tsc             # type-check; declarations go to dist-types/<package path>
yarn test            # Jest (single run with coverage, never watch mode)
yarn prettier:check  # formatting
```

Run a target for one project, or only for what changed:

```sh
yarn nx run backend:test
yarn nx affected -t lint test --base=origin/main
```

### Adding a plugin

```sh
yarn new
```

Then make the new package match the existing ones so Nx can run every target:

- `package.json` scripts: `tsc`, `lint:fix`, `prettier:check`, `prettier:fix`, and
  `"test": "backstage-cli package test --passWithNoTests --coverage"` (without `--coverage`, Jest starts in watch mode and never exits)
- `typescript` as a devDependency
- a `tsconfig.json` like `plugins/hello/tsconfig.json`, with `outDir` set to `../../dist-types/plugins/<name>`

No per-package Nx config file is needed. Targets are inferred from `package.json` scripts, and the defaults (caching, outputs, `dependsOn`) live in `nx.json`.

## Build

```sh
mise run build   # nx build of all projects, then the backend Docker image
```

This produces `backstage:<version>` and `backstage:latest` (set `IMAGE_NAME` to change the name). Nx builds `tsc`, then `app`, then `backend` before running `docker build`.

To run the image locally:

```sh
docker run --rm -p 7007:7007 backstage:latest
```

## Releases

Versions come from [Conventional Commits](https://www.conventionalcommits.org) through `nx release`. All packages share one version (fixed release group). Releases happen in GitHub Actions (`.github/workflows/ci.yml`):

| Branch                  | Result                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Protected (e.g. `main`) | Version bump, `CHANGELOG.md`, tag `vX.Y.Z`, GitHub release, image `ghcr.io/<owner>/backstage:X.Y.Z` + `latest` |
| Any other branch        | Prerelease image only, e.g. `0.2.0-feat-login.42.0` (no commit, tag or `latest`)                               |

An image is only published if the commits since the last tag call for a new version:

- `fix:` → patch
- `feat:` → minor
- `feat!:` or `BREAKING CHANGE:` → major
- `chore:`, `docs:` and similar publish nothing

While the version is `0.x`, Nx moves each bump down one level (minor becomes patch, major becomes minor).

Preview the next release locally:

```sh
yarn release:dry-run
```
