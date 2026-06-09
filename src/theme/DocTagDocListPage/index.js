import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import katex from 'katex';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
  usePluralForm,
} from '@docusaurus/theme-common';
import { translate } from '@docusaurus/Translate';
import SearchMetadata from '@theme/SearchMetadata';
import Unlisted from '@theme/ContentVisibility/Unlisted';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const mathPattern = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/g;

function stripMathDelimiters(value) {
  if (value.startsWith('$$')) {
    return value.slice(2, -2).trim();
  }
  if (value.startsWith('$')) {
    return value.slice(1, -1).trim();
  }
  return value.slice(2, -2).trim();
}

function renderMathSegment(value, key) {
  try {
    return (
      <span
        key={key}
        className={styles.cardMath}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(stripMathDelimiters(value), {
            displayMode: false,
            throwOnError: true,
          }),
        }}
      />
    );
  } catch {
    return value;
  }
}

function CardDescription({ children }) {
  const parts = [];
  let lastIndex = 0;

  for (const match of children.matchAll(mathPattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(children.slice(lastIndex, index));
    }
    parts.push(renderMathSegment(match[0], parts.length));
    lastIndex = index + match[0].length;
  }

  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  return <p className={styles.cardDescription}>{parts}</p>;
}

function useNDocsTaggedPlural() {
  const { selectMessage } = usePluralForm();
  return (count) =>
    selectMessage(
      count,
      translate(
        {
          id: 'theme.docs.tagDocListPageTitle.nDocsTagged',
          description:
            'Pluralized label for "{count} docs tagged". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',
          message: 'One doc tagged|{count} docs tagged',
        },
        { count },
      ),
    );
}

function DocCard({ doc }) {
  return (
    <Link to={doc.permalink} className={styles.card}>
      <span className={styles.cardTitle}>
        {doc.title}
      </span>
      {doc.description && (
        <CardDescription>{doc.description}</CardDescription>
      )}
    </Link>
  );
}

export default function DocTagDocListPage({ tag }) {
  const nDocsTaggedPlural = useNDocsTaggedPlural();
  const title = translate(
    {
      id: 'theme.docs.tagDocListPageTitle',
      description: 'The title of the page for a docs tag',
      message: '{nDocsTagged} with "{tagName}"',
    },
    { nDocsTagged: nDocsTaggedPlural(tag.count), tagName: tag.label },
  );

  return (
    <>
      <PageMetadata title={title} description={tag.description} />
      <SearchMetadata tag="doc_tag_doc_list" />
      <HtmlClassNameProvider
        className={clsx(ThemeClassNames.page.docsTagDocListPage)}
      >
        <div className="container margin-vert--lg">
          <div className="row">
            <main className={clsx('col col--8 col--offset-2', styles.main)}>
              {tag.unlisted && <Unlisted />}
              <Link href={tag.allTagsPath} className={styles.backLink}>
                ← All tags
              </Link>
              <header className={styles.header}>
                <Heading as="h1" className={styles.tagName}>
                  {tag.label}
                </Heading>
                <span className={styles.countBadge}>{tag.count}</span>
              </header>
              {tag.description && (
                <p className={styles.description}>{tag.description}</p>
              )}
              <section className={styles.grid}>
                {tag.items.map((doc) => (
                  <DocCard key={doc.id} doc={doc} />
                ))}
              </section>
            </main>
          </div>
        </div>
      </HtmlClassNameProvider>
    </>
  );
}
