import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type * as OpenApiPlugin from 'docusaurus-plugin-openapi-docs';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkAutolinker } from '@kasisoft/remark-autolinker';
import remarkFigure from './src/remark/figure';

const htmlEntityMap: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&(lt|gt|amp|quot|#39);/g, (match) => htmlEntityMap[match] ?? match)
    .replace(/&#(x?[0-9a-fA-F]+);/g, (match, code) => {
      const radix = code.startsWith('x') ? 16 : 10;
      const parsed = parseInt(code.replace(/^x/i, ''), radix);
      return Number.isNaN(parsed) ? match : String.fromCharCode(parsed);
    });

const decodeSidebarItems = (items: any[]): any[] =>
  items.map((item) => {
    if (item.type === 'category') {
      return {
        ...item,
        label: item.label ? decodeHtmlEntities(item.label) : item.label,
        items: Array.isArray(item.items) ? decodeSidebarItems(item.items) : item.items,
      };
    }

    if (item.type === 'doc' || item.type === 'link') {
      return {
        ...item,
        label: item.label ? decodeHtmlEntities(item.label) : item.label,
      };
    }

    return item;
  });

const config: Config = {
  title: 'Kothar Docs (CONTRIBUTIONS)',
  favicon: 'img/favicon.ico',
  url: 'http://localhost',
  baseUrl: '/',
  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  trailingSlash: false,

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          sidebarItemsGenerator: async (args) => {
            const items = await args.defaultSidebarItemsGenerator(args);
            return decodeSidebarItems(items);
          },
          beforeDefaultRemarkPlugins: [remarkFigure],
          remarkPlugins: [
            remarkMath,
            [
              remarkAutolinker,
              {
                caseInsensitive: false,
                links: [],
              },
            ],
          ],
          rehypePlugins: [rehypeKatex],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    // Replace with your project's social card
    // image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: 'Kothar Docs',
      logo: {
        alt: 'Kothar Computing Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'contributions',
          label: 'Contributions',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Copyright © ${new Date().getFullYear()} Kothar Computing, Inc.`,
    },
    prism: {
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['aleph'],
    },
  } satisfies Preset.ThemeConfig,

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
      type: 'text/css',
      integrity: 'sha256-cXvJrnhTth8PdkVd3fDs1PUnp4P0LeKsJGhImcHEYlg=',
      crossorigin: 'anonymous',
    },
  ],

  plugins: [
     [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'api',
        docsPluginId: 'api',
        config: {
          api: {
            specPath: 'https://api.kotharcomputing.com/openapi.json',
            outputDir: 'api',
            sidebarOptions: {
              groupPathsBy: 'tag',
            },
          } satisfies OpenApiPlugin.Options,
          alephLanguageServer: {
            specPath: 'https://aleph.kotharcomputing.com/openapi.json',
            outputDir: 'api/aleph-language-server',
            sidebarOptions: {
              groupPathsBy: 'tag',
            },
          } satisfies OpenApiPlugin.Options,
        },
      },
    ],
  ],
};

export default config;
