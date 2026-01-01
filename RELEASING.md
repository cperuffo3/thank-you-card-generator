# Releasing

This project uses [release-it](https://github.com/release-it/release-it) for automated versioning, changelog generation, and GitHub releases.

## Quick Start

```bash
# Patch release (1.0.0 → 1.0.1)
npm run release

# Minor release (1.0.0 → 1.1.0)
npm run release:minor

# Major release (1.0.0 → 2.0.0)
npm run release:major

# Dry run (see what would happen without making changes)
npm run release:dry
```

## What Happens During a Release

When you run `npm run release`, the following happens automatically:

1. **Pre-checks**: Runs linting to ensure code quality
2. **Version bump**: Updates `version` in `package.json`
3. **Changelog**: Updates `CHANGELOG.md` with changes since last release
4. **Formatting**: Runs Prettier to format any changed files
5. **Git commit**: Creates a commit with message `chore: release vX.X.X`
6. **Git tag**: Creates an annotated tag `vX.X.X`
7. **Git push**: Pushes commit and tag to GitHub
8. **GitHub release**: Creates a draft release on GitHub

After the tag is pushed, the GitHub Actions workflow automatically:

- Builds the app for macOS and Windows
- Uploads build artifacts to the draft release

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to automatically generate changelogs. Format your commits like this:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                   | Appears in Changelog     |
| ---------- | ----------------------------- | ------------------------ |
| `feat`     | New feature                   | Features                 |
| `fix`      | Bug fix                       | Bug Fixes                |
| `perf`     | Performance improvement       | Performance Improvements |
| `revert`   | Reverts a previous commit     | Reverts                  |
| `docs`     | Documentation only            | Documentation            |
| `style`    | Code style (formatting, etc.) | Styles                   |
| `refactor` | Code refactoring              | Code Refactoring         |
| `test`     | Adding/updating tests         | Tests                    |
| `build`    | Build system changes          | Build System             |
| `ci`       | CI/CD changes                 | CI/CD                    |
| `chore`    | Other changes                 | Hidden (not shown)       |

### Examples

```bash
# Feature
git commit -m "feat: add dark mode support"

# Bug fix
git commit -m "fix: resolve crash when loading empty CSV"

# Breaking change (add ! after type)
git commit -m "feat!: redesign settings page"

# With scope
git commit -m "feat(editor): add spell check"

# With body
git commit -m "fix: handle edge case in parser

The parser was failing when encountering empty rows.
This adds a null check before processing."
```

## Interactive Release

Running `npm run release` will prompt you interactively:

```
? Select increment (next version): (Use arrow keys)
❯ patch (1.0.1)
  minor (1.1.0)
  major (2.0.0)
  prepatch (1.0.1-0)
  preminor (1.1.0-0)
  premajor (2.0.0-0)
  Other, please specify...
```

You'll also be prompted to confirm:

- Committing the changelog
- Tagging the release
- Pushing to GitHub
- Creating a GitHub release

## Pre-release Versions

For beta or alpha releases:

```bash
# Create a prerelease (1.0.0 → 1.0.1-beta.0)
npx release-it --preRelease=beta

# Increment prerelease (1.0.1-beta.0 → 1.0.1-beta.1)
npx release-it --preRelease
```

## Configuration

Release-it is configured in [.release-it.json](.release-it.json):

- **Git**: Commits, tags, and pushes to `main` branch only
- **GitHub**: Creates draft releases with auto-generated notes
- **npm**: Publishing disabled (this is a private Electron app)
- **Hooks**: Runs lint before release, formats after version bump
- **Changelog**: Uses conventional-changelog with custom type mappings

## Requirements

Before releasing:

1. **Clean working directory**: All changes must be committed
2. **On main branch**: Releases can only be made from `main`
3. **Up to date**: Your branch must be in sync with remote
4. **Lint passes**: Code must pass ESLint checks

## Troubleshooting

### "Working directory is not clean"

Commit or stash your changes before releasing:

```bash
git add .
git commit -m "chore: prepare for release"
```

### "Not on main branch"

Switch to main before releasing:

```bash
git checkout main
git pull
```

### "GITHUB_TOKEN not set"

For CI releases, ensure `GITHUB_TOKEN` is available. For local releases, release-it will open your browser to authenticate.

### Dry Run

Always test with a dry run first if you're unsure:

```bash
npm run release:dry
```

This shows exactly what would happen without making any changes.
