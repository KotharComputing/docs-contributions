const fs = require('fs');
const path = require('path');

const FIGURE_EXT = '.figure';

const toPosixPath = (value) => value.split(path.sep).join('/');

function isFigureImage(node) {
  if (!node || node.type !== 'image' || typeof node.url !== 'string') {
    return false;
  }
  return node.url.toLowerCase().endsWith(FIGURE_EXT);
}

function resolveFigurePath(url, filePath) {
  if (url.startsWith('@site/')) {
    return path.join(process.cwd(), url.replace('@site/', ''));
  }
  if (path.isAbsolute(url)) {
    return path.join(process.cwd(), 'static', url.replace(/^\//, ''));
  }
  return path.join(path.dirname(filePath), url);
}

function requireAttributeValue(requirePath) {
  return {
    type: 'mdxJsxAttributeValueExpression',
    value: `require("${requirePath}").default`,
    data: {
      estree: {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'MemberExpression',
              object: {
                type: 'CallExpression',
                callee: {
                  type: 'Identifier',
                  name: 'require',
                },
                arguments: [
                  {
                    type: 'Literal',
                    value: requirePath,
                    raw: `"${requirePath}"`,
                  },
                ],
                optional: false,
              },
              property: {
                type: 'Identifier',
                name: 'default',
              },
              computed: false,
              optional: false,
            },
          },
        ],
        sourceType: 'module',
        comments: [],
      },
    },
  };
}

function buildFigureNode({ url, alt, title, filePath }) {
  const resolvedPath = resolveFigurePath(url, filePath);
  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  let relativePath = path.relative(path.dirname(filePath), resolvedPath);
  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`;
  }
  relativePath = toPosixPath(relativePath);

  return {
    type: 'mdxJsxFlowElement',
    name: 'Figure',
    attributes: [
      {
        type: 'mdxJsxAttribute',
        name: 'src',
        value: requireAttributeValue(relativePath),
      },
      ...(alt ? [{ type: 'mdxJsxAttribute', name: 'alt', value: alt }] : []),
      ...(title
        ? [{ type: 'mdxJsxAttribute', name: 'title', value: title }]
        : []),
    ],
    children: [],
  };
}

module.exports = function remarkFigure() {
  // async transformer + dynamic import() for ESM-only unist-util-visit-parents v6
  return async (tree, vfile) => {
    const filePath = vfile.path || '';

    const { visitParents } = await import('unist-util-visit-parents');

    visitParents(tree, 'image', (node, ancestors) => {
      if (!isFigureImage(node)) {
        return;
      }

      const figureNode = buildFigureNode({
        url: node.url,
        alt: node.alt,
        title: node.title,
        filePath,
      });

      if (!figureNode) {
        return;
      }

      const parent = ancestors[ancestors.length - 1];
      const grandparent = ancestors[ancestors.length - 2];

      if (
        parent &&
        parent.type === 'paragraph' &&
        grandparent &&
        Array.isArray(grandparent.children)
      ) {
        const index = grandparent.children.indexOf(parent);
        if (index !== -1) {
          grandparent.children[index] = figureNode;
          return;
        }
      }

      node.type = 'mdxJsxTextElement';
      node.name = figureNode.name;
      node.attributes = figureNode.attributes;
      node.children = figureNode.children;
    });
  };
};
