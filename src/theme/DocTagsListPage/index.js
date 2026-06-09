import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
  translateTagsPageTitle,
} from '@docusaurus/theme-common';
import SearchMetadata from '@theme/SearchMetadata';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

function normalize(count, minCount, maxCount) {
  if (maxCount === minCount) return 0.5;
  return (
    (Math.log(count) - Math.log(minCount)) /
    (Math.log(maxCount) - Math.log(minCount))
  );
}

function getTagTier(value) {
  if (value < 0.25) return styles.tier1;
  if (value < 0.5) return styles.tier2;
  if (value < 0.75) return styles.tier3;
  return styles.tier4;
}

function TagCloud({ tags }) {
  const [filter, setFilter] = useState('');

  const { minCount, maxCount } = useMemo(() => {
    const counts = tags.map((t) => t.count);
    return { minCount: Math.min(...counts), maxCount: Math.max(...counts) };
  }, [tags]);

  const filteredTags = useMemo(() => {
    if (!filter) return tags;
    const lower = filter.toLowerCase();
    return tags.filter((t) => t.label.toLowerCase().includes(lower));
  }, [tags, filter]);

  return (
    <>
      <div className={styles.filterWrapper}>
        <input
          type="text"
          placeholder="Filter tags..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.filterInput}
        />
      </div>
      <div className={styles.cloudContainer}>
        {filteredTags.length === 0 && (
          <p className={styles.noResults}>No tags match your filter.</p>
        )}
        {filteredTags.map((tag) => {
          const value = normalize(tag.count, minCount, maxCount);
          const fontSize = 0.8 + value * 0.7;
          return (
            <Link
              key={tag.permalink}
              href={tag.permalink}
              className={clsx(styles.tagPill, getTagTier(value))}
              style={{ fontSize: `${fontSize}rem` }}
            >
              {tag.label}
              <span className={styles.tagCount}>{tag.count}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default function DocTagsListPage({ tags }) {
  const title = translateTagsPageTitle();
  return (
    <>
      <PageMetadata title={title} />
      <SearchMetadata tag="doc_tags_list" />
      <HtmlClassNameProvider
        className={clsx(ThemeClassNames.page.docsTagsListPage)}
      >
        <div className="container margin-vert--lg">
          <div className="row">
            <main className={clsx('col col--8 col--offset-2', styles.main)}>
              <Heading as="h1" className={styles.title}>
                {title}
              </Heading>
              <p className={styles.subtitle}>
                Topics from the{' '}
                <a
                  href="https://physh.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PhySH
                </a>{' '}
                taxonomy
              </p>
              <TagCloud tags={tags} />
            </main>
          </div>
        </div>
      </HtmlClassNameProvider>
    </>
  );
}
