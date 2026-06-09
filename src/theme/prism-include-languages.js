import siteConfig from '@generated/docusaurus.config';

export default function prismIncludeLanguages(PrismObject) {
  const {
    themeConfig: {prism},
  } = siteConfig;
  const {additionalLanguages} = prism;
  // Prism components work on the Prism instance on the window, while prism-
  // react-renderer uses its own Prism instance. We temporarily mount the
  // instance onto window, import components to enhance it, then remove it to
  // avoid polluting global namespace.
  // You can mutate PrismObject: registering plugins, deleting languages... As
  // long as you don't re-assign it
  const PrismBefore = globalThis.Prism;
  globalThis.Prism = PrismObject;
  additionalLanguages.forEach((lang) => {
    if (lang === 'aleph') {
      PrismObject.languages.aleph = PrismObject.languages.extend('clike', {
        'string': {
          pattern: /(^|[^\\])'(?:[^'\\]|\\[\s\S])*'/,
          lookbehind: true,
          greedy: true
        },
        'class-name': [
          {
            // e.g. class Rectangle { ... }
            pattern: /(\bclass\s+)\w+/,
            lookbehind: true
          },
          {
            // e.g. attr Rectangle::height, def Rectangle::area() { ... }
            pattern: /(\b(?:def)\s+)\w+(?=\s*::)/,
            lookbehind: true
          }
        ],
        'keyword': /\b(?:after_all|after_each|auto|before_all|before_each|break|case|cases|catch|class|continue|def|default|else|finally|for|fun|global|if|include|options|return|switch|test|test_section|this|try|var|while)\b/,
        'number': [
          PrismObject.languages.cpp.number,
          /\b(?:Infinity|NaN)\b/
        ],
        'operator': />>=?|<<=?|\|\||&&|:[:=]?|--|\+\+|[=!<>+\-*/%|&^]=?|[?~]|`[^`\r\n]{1,4}`/,
      });

      PrismObject.languages.insertBefore('aleph', 'operator', {
        'parameter-type': {
          // e.g. def foo(int x, Vector y) {...}
          pattern: /([,(]\s*)\w+(?=\s+\w)/,
          lookbehind: true,
          alias: 'class-name'
        },
      });

      PrismObject.languages.insertBefore('aleph', 'string', {
        'string-interpolation': {
          pattern: /(^|[^\\])"(?:[^"$\\]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*"/,
          lookbehind: true,
          greedy: true,
          inside: {
            'interpolation': {
              pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/,
              lookbehind: true,
              inside: {
                'interpolation-expression': {
                  pattern: /(^\$\{)[\s\S]+(?=\}$)/,
                  lookbehind: true,
                  inside: PrismObject.languages.aleph
                },
                'interpolation-punctuation': {
                  pattern: /^\$\{|\}$/,
                  alias: 'punctuation'
                }
              }
            },
            'string': /[\s\S]+/
          }
        },
      });
    } else {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      require(`prismjs/components/prism-${lang}`);
    }
  });
  // Clean up and eventually restore former globalThis.Prism object (if any)
  delete globalThis.Prism;
  if (typeof PrismBefore !== 'undefined') {
    globalThis.Prism = PrismObject;
  }
}
