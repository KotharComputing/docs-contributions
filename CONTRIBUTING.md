# Contributing to Kothar Docs Contributions

Thanks for helping improve Kothar documentation.

## Scope

External contributions in this repository must only modify files under `docs/contributions/`.

## Quick Start

1. Fork this repository on GitHub.
2. Clone your fork and create a branch:
   `git checkout -b my-contribution`
3. Create or edit docs under `docs/contributions/`.
4. Run checks locally:
   `npm install`
   `npm run build`
5. Commit and push:
   `git add docs/contributions`
   `git commit -m "Add contribution: <topic>"`
   `git push -u origin my-contribution`
6. Open a pull request to `main`.

## Required Rules

- Only files under `docs/contributions/` can be changed.
- File and folder names inside `docs/contributions/` must be `kebab-case`.
- Tags in page front matter must match approved labels in `docs/tags.yml`.
- Pull requests must pass CI (including Docusaurus build and link checks).

## Content Template

Use this as a starting point for new pages:

```md
---
author:
  - Your Name
---

# Your Title

A short intro that explains what this page helps the reader do.

## Section

Explain one concept at a time with concrete examples.

:::note
Use admonitions for warnings, tips, and key details.
:::

<Authors heading="Documentation Contributors" />
```

## Supported Content

- Markdown / MDX pages
- Docusaurus admonitions
- Inline and block LaTeX math
- Images and `.figure` files used by this docs site
- Approved docs tags from `docs/tags.yml`

## Review Expectations

PRs are reviewed by the Kothar team. Clear structure, concise writing, and runnable instructions increase merge speed.
