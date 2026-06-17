import fs from 'node:fs/promises';
import path from 'node:path';
import type { LoadContext, Plugin } from '@docusaurus/types';

const KOTHAR_SPARK_API_BASE = 'https://api.kotharcomputing.com/v1/sparks';

type SparkFile = {
  path: string;
  sizeBytes: number;
};

type Spark = {
  id: string;
  url: string;
  ownerDisplayName: string;
  description: string;
  createdAt: string;
  fileCount: number;
  totalBytes: number;
  files: SparkFile[];
};

export default function kotharSparksPlugin(
  context: LoadContext,
): Plugin<unknown> {
  return {
    name: 'kothar-sparks',
    async loadContent() {
      const sparkIds = new Set<string>();
      const roots = ['docs', 'changelog', 'src/pages'];
      const sparkPattern =
        /<KotharSpark\b[^>]*\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\}|\{"([^"]+)"\}|\{'([^']+)'\})/g;

      for (const root of roots) {
        const rootPath = path.join(context.siteDir, root);
        const pending = [rootPath];

        while (pending.length > 0) {
          const currentPath = pending.pop();
          if (!currentPath) continue;

          let entries;
          try {
            entries = await fs.readdir(currentPath, { withFileTypes: true });
          } catch (error) {
            if (
              error &&
              typeof error === 'object' &&
              'code' in error &&
              error.code === 'ENOENT'
            ) {
              continue;
            }
            throw error;
          }

          for (const entry of entries) {
            const entryPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
              pending.push(entryPath);
              continue;
            }

            if (!/\.(?:md|mdx|jsx?|tsx?)$/.test(entry.name)) {
              continue;
            }

            const content = await fs.readFile(entryPath, 'utf8');
            sparkPattern.lastIndex = 0;
            for (
              let match = sparkPattern.exec(content);
              match;
              match = sparkPattern.exec(content)
            ) {
              const id = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5];
              if (id) {
                sparkIds.add(id);
              }
            }
          }
        }
      }

      const sparksById: Record<string, Spark> = {};

      for (const id of sparkIds) {
        const response = await fetch(
          `${KOTHAR_SPARK_API_BASE}/${encodeURIComponent(id)}`,
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch Kothar spark "${id}": HTTP ${response.status} ${response.statusText}`,
          );
        }

        const spark = await response.json();
        if (
          !spark ||
          typeof spark !== 'object' ||
          spark.id !== id ||
          typeof spark.url !== 'string' ||
          typeof spark.ownerDisplayName !== 'string' ||
          typeof spark.description !== 'string' ||
          typeof spark.createdAt !== 'string' ||
          typeof spark.fileCount !== 'number' ||
          typeof spark.totalBytes !== 'number' ||
          !Array.isArray(spark.files) ||
          spark.files.some((file: unknown) => {
            if (!file || typeof file !== 'object') {
              return true;
            }
            const sparkFile = file as Partial<SparkFile>;
            return (
              typeof sparkFile.path !== 'string' ||
              typeof sparkFile.sizeBytes !== 'number'
            );
          })
        ) {
          throw new Error(`Invalid Kothar spark API response for "${id}".`);
        }

        sparksById[id] = spark as Spark;
      }

      return { sparksById };
    },
    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },
  };
}
