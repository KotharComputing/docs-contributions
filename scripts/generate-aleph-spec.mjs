import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function buildAlephSpecSections(markdown, source) {
  const withoutFrontMatter = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const lines = withoutFrontMatter.split(/\r?\n/);
  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line));
  if (titleIndex === -1) {
    throw new Error('Aleph spec is missing a top-level title');
  }

  const title = lines[titleIndex].replace(/^#\s+/, '').trim();
  const firstSectionIndex = lines.findIndex((line, index) => index > titleIndex && /^##\s+/.test(line));
  if (firstSectionIndex === -1) {
    throw new Error('Aleph spec is missing top-level sections');
  }

  const intro = lines.slice(titleIndex + 1, firstSectionIndex).join('\n').trim();
  const sections = [];
  let index = firstSectionIndex;

  while (index < lines.length) {
    const heading = lines[index];
    if (!/^##\s+/.test(heading)) {
      index += 1;
      continue;
    }

    const sectionTitle = heading.replace(/^##\s+/, '').trim();
    const nextSectionIndex = lines.findIndex((line, nextIndex) => nextIndex > index && /^##\s+/.test(line));
    const endIndex = nextSectionIndex === -1 ? lines.length : nextSectionIndex;
    let content = lines.slice(index + 1, endIndex).join('\n').trim();

    const id = sectionTitle
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (id === 'get-started' && intro) {
      content = `${intro}\n\n${content}`.trim();
    }

    sections.push({ id, title: sectionTitle, content });
    index = endIndex;
  }

  return { source, title, sections };
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = 'docs/aleph-101.md';
  const outputPath = path.join(root, 'static/kai/aleph-101-sections.json');
  const markdown = await readFile(path.join(root, source), 'utf8');
  const artifact = buildAlephSpecSections(markdown, source);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
