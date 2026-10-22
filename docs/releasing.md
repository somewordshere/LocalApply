# Releasing

Every shipped version gets a folder under `releases/` and a git tag. Release folders are never changed after the fact; a fix ships as a new version.

```
releases/v0.1.0/
  localapply-0.1.0-firefox.zip     upload to addons.mozilla.org
  localapply-0.1.0-chrome.zip      upload to the Chrome Web Store
  localapply-0.1.0-sources.zip     Mozilla's reviewers rebuild the add-on from this
  RELEASE_NOTES.md                 the CHANGELOG section for this version
  SHA256SUMS.txt                   checksums of the three zips
```

## Version numbers

[Semantic Versioning](https://semver.org/), starting from 0.1.0:

- **patch** (0.1.0 → 0.1.1): bug fixes, new label phrases, site selector fixes;
- **minor** (0.1.1 → 0.2.0): new features, new profile fields, new languages or sites;
- **major** (→ 1.0.0): changes that need users to redo something, or the first "stable" release.

`package.json` is the only place the version lives; the manifest and zip names take it from there.

## Steps

1. Make sure the work is committed and `npm run check` passes.
2. In `CHANGELOG.md`, rename `## [Unreleased]` to `## [<version>] - <yyyy-mm-dd>` and add a fresh empty `## [Unreleased]` above it. Then tell users:
   - `WHATS-NEW.md`: a section `## <version> · <Month d, yyyy>` on top, with the visible changes in plain words (no file names or internals);
   - `README.md`: the version in **Current version**, the two build badges and the manual-installation links, and a new top row in **Recent releases**.
3. Bump the version:
   ```bash
   npm version minor --no-git-tag-version
   ```
4. If the UI changed, regenerate store images with `npm run store-assets` and review the listings in `store/`.
5. Commit: `git commit -am "Prepare v<version>"`.
6. Build the release:

   ```bash
   npm run release
   ```

   It stops if `releases/v<version>/` or the tag already exists, if the changelog has no section for the version, or if there are uncommitted changes. Then it runs the typecheck, ESLint, Prettier check, unit tests, the Chrome end-to-end test and Mozilla's linter; builds and zips both browsers and the sources; rebuilds the Firefox add-on from the source zip in a temporary folder and checks it is byte-identical; writes the release folder; commits it as `Release v<version>`; and creates the annotated tag `v<version>`. It never pushes.

   Options: `--skip-e2e`, `--skip-source-check`, `--no-git`, and `--trailer "Key: value"` to add trailer lines to the release commit.

7. Push when ready: `git push && git push --tags`.

## Upload

`store/README.md` maps every store form field to its file.

**Firefox** (addons.mozilla.org → Developer Hub → your add-on → Upload New Version): upload the Firefox zip, answer "Yes" to source code and upload the sources zip, paste `store/firefox/reviewer-notes.md` (with the version filled in) into Notes to reviewer and `RELEASE_NOTES.md` into Release notes.

**Chrome** (Chrome Web Store Developer Dashboard → your item → Package → Upload new package): upload the Chrome zip, update the store listing if it changed, submit for review.

## Checking a release folder

```bash
cd releases/v0.1.0
sha256sum -c SHA256SUMS.txt
```

On Windows without `sha256sum`: `Get-FileHash <file> -Algorithm SHA256` in PowerShell, and compare with the file.
