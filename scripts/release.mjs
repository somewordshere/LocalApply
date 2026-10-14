// Builds a release into releases/v<version>/ and tags it in git.
//
//   npm run release                         full release
//   npm run release -- --skip-e2e           without the browser end-to-end test
//   npm run release -- --skip-source-check  without rebuilding from the source zip
//   npm run release -- --no-git             write the folder only; no commit or tag
//   npm run release -- --trailer "Key: value"   extra trailer line(s) for the release commit
//
// The version comes from package.json; bump it first with `npm version <patch|minor|major> --no-git-tag-version`.
// See docs/releasing.md.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { unzipSync } from 'fflate';

const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const trailers = args.flatMap((arg, i) => (arg === '--trailer' && args[i + 1] ? [args[i + 1]] : []));

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const tag = `v${version}`;
const releaseDir = join(root, 'releases', tag);
const useGit = !flag('--no-git');

function fail(message) {
  console.error(`\nRelease stopped: ${message}`);
  process.exit(1);
}

function run(command, commandArgs, options = {}) {
  console.log(`\n> ${command} ${commandArgs.join(' ')}`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.status !== 0) fail(`"${command} ${commandArgs.join(' ')}" failed`);
}

function git(...gitArgs) {
  const result = spawnSync('git', gitArgs, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) fail(`git ${gitArgs.join(' ')}: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

/** The CHANGELOG section for this version, without its heading. */
function releaseNotes() {
  const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
  const heading = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\](.*)$`, 'm').exec(changelog);
  if (!heading) fail(`CHANGELOG.md has no "## [${version}]" section. Move the Unreleased notes under it.`);
  const rest = changelog.slice(heading.index + heading[0].length);
  const next = rest.search(/^## \[/m);
  const body = (next === -1 ? rest : rest.slice(0, next)).trim();
  if (!body) fail(`the CHANGELOG section for ${version} is empty`);
  const date = /\d{4}-\d{2}-\d{2}/.exec(heading[1])?.[0];
  return { body, date };
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)).split('\\').join('/'))
    .sort();
}

/** Rebuilds the Firefox add-on from the source zip, as Mozilla's reviewers do, and compares the result. */
function checkSourceZip(sourcesZip, firefoxZip) {
  const work = mkdtempSync(join(tmpdir(), 'localapply-source-check-'));
  try {
    for (const [name, data] of Object.entries(unzipSync(readFileSync(sourcesZip)))) {
      if (name.endsWith('/')) continue;
      mkdirSync(dirname(join(work, name)), { recursive: true });
      writeFileSync(join(work, name), data);
    }
    run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: work });
    run('npm', ['run', 'build:firefox'], { cwd: work });
    const rebuilt = join(work, '.output/firefox-mv2');
    const shipped = unzipSync(readFileSync(firefoxZip));
    const shippedNames = Object.keys(shipped)
      .filter((n) => !n.endsWith('/'))
      .sort();
    const rebuiltNames = filesUnder(rebuilt);
    if (JSON.stringify(shippedNames) !== JSON.stringify(rebuiltNames)) {
      fail('the build from the source zip produces a different set of files than the Firefox package');
    }
    for (const name of shippedNames) {
      const a = createHash('sha256').update(shipped[name]).digest('hex');
      if (a !== sha256(join(rebuilt, name))) fail(`${name} differs when rebuilt from the source zip`);
    }
    console.log(`\nSource zip rebuilds to an identical Firefox package (${shippedNames.length} files).`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

// 1. Preconditions
console.log(`Releasing LocalApply ${version}`);
if (existsSync(releaseDir)) fail(`releases/${tag}/ already exists. Bump the version in package.json first.`);
const notes = releaseNotes();
if (useGit) {
  if (git('rev-parse', '--is-inside-work-tree') !== 'true') fail('not a git repository (use --no-git to skip git)');
  if (git('status', '--porcelain')) fail('the working tree has uncommitted changes. Commit them first.');
  if (git('tag', '--list', tag)) fail(`git tag ${tag} already exists`);
}

// 2. Checks
run('npm', ['run', 'typecheck']);
run('npm', ['run', 'lint']);
run('npm', ['run', 'format:check']);
run('npm', ['test']);
if (!flag('--skip-e2e')) run('npm', ['run', 'test:e2e']);
run('npm', ['run', 'lint:firefox']);

// 3. Packages
const outDir = join(root, '.output');
for (const name of existsSync(outDir) ? readdirSync(outDir) : []) {
  if (name.endsWith('.zip')) rmSync(join(outDir, name));
}
run('npm', ['run', 'package']);
const names = {
  firefox: `${pkg.name}-${version}-firefox.zip`,
  chrome: `${pkg.name}-${version}-chrome.zip`,
  sources: `${pkg.name}-${version}-sources.zip`,
};
for (const name of Object.values(names)) if (!existsSync(join(outDir, name))) fail(`expected .output/${name}`);
if (!flag('--skip-source-check')) checkSourceZip(join(outDir, names.sources), join(outDir, names.firefox));

// 4. Release folder
mkdirSync(releaseDir, { recursive: true });
for (const name of Object.values(names)) copyFileSync(join(outDir, name), join(releaseDir, name));
const date = notes.date ?? new Date().toISOString().slice(0, 10);
writeFileSync(join(releaseDir, 'RELEASE_NOTES.md'), `# LocalApply ${version}\n\nReleased ${date}.\n\n${notes.body}\n`);
const sums = Object.values(names)
  .map((name) => `${sha256(join(releaseDir, name))}  ${name}`)
  .join('\n');
writeFileSync(join(releaseDir, 'SHA256SUMS.txt'), `${sums}\n`);
console.log(`\nWrote releases/${tag}/:\n  ${readdirSync(releaseDir).join('\n  ')}`);

// 5. Git
if (useGit) {
  git('add', relative(root, releaseDir));
  git('commit', '-m', `Release ${tag}`, ...trailers.flatMap((t) => ['--trailer', t]));
  git('tag', '-a', tag, '-m', `LocalApply ${version}`);
  console.log(`\nCommitted and tagged ${tag}. Nothing was pushed.`);
}

console.log(`\nNext: upload the packages as described in store/README.md.`);
