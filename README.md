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

The Docker targets come from the [`@nx/docker`](https://nx.dev/technologies/docker) plugin (configured in `nx.json`), which picks up `packages/backend/Dockerfile`. `backend:docker:build` depends on `build`, so Nx builds the plugins, `app` and `backend` first. The local image is called `packages-backend`.

To run the image locally:

```sh
yarn nx run backend:docker:run   # http://localhost:7007
```

## Releases

Releases use plain `nx release` with [Conventional Commits](https://www.conventionalcommits.org). All packages share one version (fixed release group), and `@nx/docker` versions and pushes the image to `ghcr.io/jbadeau/backstage`. Releases only run in GitHub Actions (`.github/workflows/ci.yml`):

| Branch                  | Command                                                            | Result                                                                    |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Protected (e.g. `main`) | `nx release --yes`                                                 | Version bump, `CHANGELOG.md`, tag `vX.Y.Z`, GitHub release, image `X.Y.Z` |
| Any other branch        | `nx release version --preid <branch>.<run>` + `nx release publish` | Prerelease image only, e.g. `0.2.0-feat-login.42.0` (no commit or tag)    |

A release (and image) only happens if the commits since the last tag call for a new version:

- `fix:` → patch
- `feat:` → minor
- `feat!:` or `BREAKING CHANGE:` → major
- `chore:`, `docs:`, `ci:` and similar release nothing

Only commits that change files in a released package count. While the version is `0.x`, Nx moves each bump down one level (minor becomes patch, major becomes minor).

When merging a feature branch, squash-merge or use a non-releasable merge message, so the change appears in the changelog only once.
