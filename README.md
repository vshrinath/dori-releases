# dori-releases

Public distribution repo for the **Dori desktop app**. It hosts downloadable
installers and the Tauri auto-update manifest (`latest.json`). The source code
lives in the private `dori-engine` / `dori-portal` repos and is checked out here
at the release tag by [the build workflow](.github/workflows/release.yml).

This repo is public so that:
- the Tauri updater can fetch `latest.json` and download signed bundles without auth, and
- users can download installers directly from the Releases page.

## How a release happens

1. `pnpm -C dori-engine release` bumps the version and tags `dori-engine` + `dori-portal`.
2. Pushing the `v*` tag to `dori-engine` fires a `repository_dispatch` to this repo.
3. The workflow here checks out both repos at the tag, builds + signs the app,
   and publishes the release + `latest.json` to this repo.
4. The portal `/api/update` endpoint reads `latest.json`; installed apps update themselves.

A tag with a hyphen (e.g. `v1.7.0-beta.1`) is published as a **prerelease** and is
served to clients on the **beta** channel.

## Required secrets

**On `dori-releases` (this repo):**
- `BUILD_TOKEN` — PAT with read access to private `dori-engine` + `dori-portal` (Contents: read).
- `TAURI_PRIVATE_KEY` — minisign private key used to sign updates (the SAME key as before; matches the pubkey in `tauri.conf.json`).
- `TAURI_KEY_PASSWORD` — password for that key.

**On `dori-engine`:**
- `RELEASES_DISPATCH_TOKEN` — PAT that can fire `repository_dispatch` on `dori-releases` (Contents: write on dori-releases).

> The `TAURI_PRIVATE_KEY` must be the **same** key currently used, or existing
> installs will reject the update signature.
