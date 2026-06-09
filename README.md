# Kothar Docs Contributions

This repository hosts a minimal Docusaurus instance used to preview external contributions to the Kothar documentation site at https://docs.kotharcomputing.com/. It is intentionally small and focused on the `docs/contributions` section so contributors can validate content before opening a pull request.

## How Contributions Work

1. Create or update content under `docs/contributions`.
2. Open a public GitHub pull request against this repository.
3. The Kothar team reviews and, if accepted, integrates the contribution into the official docs site.

## Contribution Rules

- Only create or modify content inside `docs/contributions`. Changes outside this folder will be refused.
- Use kebab-case for all file and folder names to keep URLs consistent.
- Use approved docs tags from `docs/tags.yml` when adding `tags` front matter. Unknown tags fail the build.
- You may use Docusaurus admonitions and inline LaTeX math.
- You may include images and `.figure` files produced by the Aleph Plotting module in the workshop.

## Docusaurus Basics

If you are new to Docusaurus, start with the official docs: https://docusaurus.io/docs. A few basics that help for this repo:

- Docs pages live in `docs/contributions` and are written in Markdown or MDX.
- The first heading (`# Title`) becomes the page title. Docusaurus uses that to build navigation.
- You can add front matter at the top of a file (between `---` lines) to set metadata like `title` or `sidebar_position`.
- You can add `tags` front matter, but each tag must exactly match a key in `docs/tags.yml`.
- Use relative links for local docs pages and place images in the same folder (or a subfolder) to keep paths simple.

## How To Open A Pull Request On GitHub

1. Fork this repository to your GitHub account.
2. Clone your fork locally and create a new branch:
   `git checkout -b my-contribution`
3. Make your changes under `docs/contributions`, then commit:
   `git add docs/contributions`
   `git commit -m "Add my contribution"`
4. Push your branch to your fork:
   `git push -u origin my-contribution`
5. Open a pull request on GitHub from your branch to this repository's `main` branch.
6. Fill in the PR description and submit. The team will review and leave feedback if needed.

## Local Preview (Standard Docusaurus Workflow)

1. Install dependencies:
   `npm install`
2. Start the dev server:
   `npm run start`
3. Build for production (optional):
   `npm run build`
4. Serve the production build (optional):
   `npm run serve`

The site will be available at http://localhost:3000/ by default.

## Dev Container / Codespaces

You can also open this repository in a VS Code Dev Container or GitHub Codespaces. The container uses Node 24 LTS, installs dependencies automatically with `npm ci`, and starts the Docusaurus preview on port 3000 when the workspace opens.

Before opening a pull request, still run the same validation checks used by CI:

1. Typecheck the site:
   `npm run typecheck`
2. Build the site:
   `npm run build`

## Repository Layout

- `docs/contributions`: The only folder for external content.
- `src/pages/index.tsx`: Landing page for contributors.

If you have questions about scope or formatting, open an issue or ask in your pull request.
