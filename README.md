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
- You may embed Kothar Sparks for artifacts readers should be able to view and import into their own workspace.

## Docusaurus Basics

If you are new to Docusaurus, start with the official docs: https://docusaurus.io/docs. A few basics that help for this repo:

- Docs pages live in `docs/contributions` and are written in Markdown or MDX.
- The first heading (`# Title`) becomes the page title. Docusaurus uses that to build navigation.
- You can add front matter at the top of a file (between `---` lines) to set metadata like `title` or `sidebar_position`.
- You can add `tags` front matter, but each tag must exactly match a key in `docs/tags.yml`.
- Use relative links for local docs pages and place images in the same folder (or a subfolder) to keep paths simple.

## Kothar Sparks

Use a Kothar Spark when you want to share artifacts that readers can easily view and import into their own workspace. Good candidates include source files, runnable examples, generated artifacts, notebooks, datasets, and supplemental project files.

Small code snippets that explain a concept should stay directly in the page. Use a spark when the artifact is something readers should open as a file, inspect as a bundle, or import into their own workspace.

Embed a spark in any Markdown or MDX contribution page with the `KotharSpark` component:

```mdx
<KotharSpark id="spk_unn2jta1kx0mnkd1" />
```

Replace the ID with the spark you want to share. The rendered card links to the hosted spark and shows its description, owner, creation date, file count, total size, and up to 10 file names.

The production build fetches spark metadata when you run `npm run build`. Invalid, private, or inaccessible spark IDs fail the build, so run the build before opening a pull request.

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

You can also open this repository in a VS Code Dev Container or GitHub Codespaces. The container uses Node 24 LTS, installs dependencies automatically with `npm ci`, and starts the Docusaurus preview on port 3000.

### Start In VS Code

1. Install Docker Desktop or another Docker-compatible runtime.
2. Install the VS Code Dev Containers extension.
3. Open this repository in VS Code.
4. Run `Dev Containers: Reopen in Container` from the Command Palette.
5. Wait for the container to install dependencies and start Docusaurus.

The first launch can take a few minutes because the container runs `npm ci` before `npm run start`. When startup finishes, VS Code should open the forwarded preview automatically. If it does not, open http://localhost:3000/.

You can watch startup progress in the VS Code Dev Containers output, or in Docker logs. The site is ready when the logs include:

```text
[SUCCESS] Docusaurus website is running at: http://localhost:3000/
```

If the browser opens before the first page responds, wait a little longer for the client build to finish and refresh.

### Start From The CLI

You can use the same container without opening VS Code if you have Docker and the Dev Containers CLI installed:

```sh
npm install -g @devcontainers/cli
devcontainer up --workspace-folder .
```

If port 3000 is already in use on your machine, choose a different host port:

```sh
KOTHAR_DOCS_HOST_PORT=3001 devcontainer up --workspace-folder .
```

The `devcontainer up` command prints a `containerId` when the container starts. Use that ID to follow the Docusaurus startup logs:

```sh
docker logs -f <containerId>
```

The CLI does not use VS Code's port forwarding, so the container publishes Docusaurus directly to `127.0.0.1:3000` by default, or to the `KOTHAR_DOCS_HOST_PORT` value if you set one. You can confirm the host port mapping with:

```sh
docker port <containerId> 3000/tcp
```

After the logs show the Docusaurus success message, open http://localhost:3000/, or the custom `KOTHAR_DOCS_HOST_PORT` URL if you changed it, such as http://localhost:3001/. If the first request hangs, wait a little longer for the client build to finish and refresh.

To run commands inside the container:

```sh
devcontainer exec --workspace-folder . npm run typecheck
devcontainer exec --workspace-folder . npm run build
```

### Stop The Dev Container

In VS Code, run `Dev Containers: Reopen Folder Locally` or close the remote window. The container is configured to stop when the devcontainer session shuts down.

From the CLI, stop the compose project from the repository root:

```sh
docker compose -f .devcontainer/docker-compose.yml -p docs-contributions_devcontainer down
```

If you only have the `containerId`, you can also stop that container directly:

```sh
docker stop <containerId>
```

Before opening a pull request, still run the same validation checks used by CI:

1. Typecheck the site:
   `npm run typecheck`
2. Build the site:
   `npm run build`

## Repository Layout

- `docs/contributions`: The only folder for external content.
- `src/pages/index.tsx`: Landing page for contributors.

If you have questions about scope or formatting, open an issue or ask in your pull request.
