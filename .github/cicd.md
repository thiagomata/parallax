# CI/CD Pipeline

This document describes the GitHub Actions workflow for building and deploying the Parallax documentation site.

## Overview

The CI/CD pipeline handles:
- Running tests and coverage on all pushes
- Deploying the main site when `main` is updated
- Deploying preview sites for feature and bugfix branches
- Cleaning up previews when branches are deleted

## Trigger Flow

```mermaid
flowchart TD
    A[Push to Repository] --> B{Which branch?}

    B -->|main| C[test-and-build]
    B -->|feature/*| C
    B -->|bugfix/*| C

    C --> D{Run tests}

    D -->|Pass| E{Which branch?}

    E -->|main| F[deploy: Build main + ALL branches]
    E -->|feature/bugfix| G[deploy: Build single preview]

    F --> H[Push to pages branch]
    G --> H

    D -->|Fail| I[Stop]

    style F fill:#90EE90
    style G fill:#90EE90
    style H fill:#87CEEB
```

## Branch Structure

The `pages` branch serves as the deployment target for GitHub Pages:

```
pages branch/
├── index.html          # Main site (built from main branch)
├── assets/             # Main site assets
├── docs/               # Main site docs
├── previews/           # Feature branch previews
│   ├── feature-xxx/
│   └── bugfix-yyy/
└── .github/            # Workflow files
```

## Job Details

### test-and-build

Runs on every push to:
- `main`
- `feature/*`
- `bugfix/*`

**Steps:**
1. Setup Node.js 20
2. Install dependencies
3. Run tests and coverage
4. Build project with appropriate base path
5. Upload build artifact

**Outputs:**
- `is_main`: true if push is to main branch
- `is_preview`: true if push is to feature/bugfix branch
- `base_path`: `/parallax/` for main, `/parallax/previews/<slug>/` for previews

### deploy

Triggers on push to `main`, `feature/*`, or `bugfix/*`.

**If push to `main`:**
1. Build main site with base path `/parallax/`
2. Fetch all feature/* and bugfix/* branches
3. Build each preview with base path `/parallax/previews/<slug>/`
4. Combine all builds into output
5. Push to `pages` branch

**If push to feature/bugfix:**
1. Clone existing `pages` branch
2. Add/update preview folder at `previews/<slug>/`
3. Push to `pages` branch

### prune-deleted-preview

Triggers on branch deletion (via `delete` event).

**Steps:**
1. Extract branch name from deleted ref
2. Clone `pages` branch
3. Remove corresponding folder at `previews/<slug>/`
4. Push changes to `pages` branch

## Base Paths

The site is served at `https://thiagomata.github.io/parallax/`:

| Branch | Base Path | Example URL |
|--------|-----------|-------------|
| main | `/parallax/` | https://thiagomata.github.io/parallax/ |
| feature/xxx | `/parallax/previews/feature-xxx/` | https://thiagomata.github.io/parallax/previews/feature-xxx/ |
| bugfix/yyy | `/parallax/previews/bugfix-yyy/` | https://thiagomata.github.io/parallax/previews/bugfix-yyy/ |

## Concurrency

The workflow uses concurrency groups to cancel in-progress runs for the same ref:
- Push to `main` cancels any in-progress `main` runs
- Push to `feature/xxx` cancels in-progress runs for that branch

This prevents conflicts when multiple pushes happen in quick succession.