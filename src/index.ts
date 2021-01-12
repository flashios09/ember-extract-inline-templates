import traverse from 'babel-traverse';
import { File as ASTFile, ImportDeclaration, ImportDefaultSpecifier, ImportSpecifier, Node } from 'babel-types';

interface IHbsTagSources { [key: string]: string | string[]; }

interface ISearchAndExtractHbsOptions {
  hbsTagSources?: IHbsTagSources;
  parse: (source: string) => ASTFile | never
}

interface IGetTemplateNodesOptions extends ISearchAndExtractHbsOptions {
  sortByStartKey?: boolean;
}

interface ITemplateNode extends Node {
  template: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export const defaultHbsTagSources: IHbsTagSources = {
  "ember-cli-htmlbars": "hbs",
  "htmlbars-inline-precompile": "default",
  "ember-cli-htmlbars-inline-precompile": "default",
  "@glimmerx/component": "hbs",
  "@glimmer/core": ["createTemplate", "precompileTemplate"]
};

/**
 * Search and extract ember inline templates using the `import declarations`.
 *
 * Extract both **Tagged Template** *hbs\`my tagged template\`* and **Literal String** *hbs('my literal string')*:
 * ```js
 * import hbs from 'htmlbars-inline-precompile';
 *
 * const taggedTemplate = hbs`tagged template`; // valid
 * const fromFunctionCall = hbs('template from function call'); // valid
 * const fromFunctionCallWithArgs = hbs('from function call with args', { moduleId: 'layout.hbs' }); // valid
 * ```
 *
 * ### Options:
 *
 * - `hbsTagSources` - [Optional] The **additional** hbs tag sources used in the import declaration(s), e.g.:
 * ```js
 * {
 *   "hbs-source-with-default-export": "default", // import hbs from 'hbs-source-with-default-export';
 *   "hbs-source-with-named-export" : "handlebars", // import { handlebars } from 'hbs-source-wth-named-export';
 *   "hbs-source-with-renamed-export": "hbs" // import { hbs as h } from 'hbs-source-with-renamed-export';
 * }
 * ```
 *
 * - `babylonPlugins` - [Optional] The **additional** babylon plugins to use, e.g. `[ 'typescipt', 'jsx' ]`, see:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/babylon/index.d.ts#L45.
 *
 * ### Example
 *
 * from:
 * ```ts
 * import GlimmerComponent from '@glimmer/component';
 * import hbs from 'ember-cli-htmlbars-inline-precompile';
 *
 * const template = hbs`
 *   <button
 *     type={{this.type}}
 *   >
 *     {{yield}}
 *   </button>
 * `;
 *
 * class MyButtonComponent extends GlimmerComponent {
 *   type: string = 'button';
 * };
 *
 * export default Ember._setComponentTemplate(template, MyButtonComponent);
 * ```
 * to:
 * ```hbs
 *
 *
 *
 *   <button
 *     type={{this.type}}
 *   >
 *     {{yield}}
 *   </button>
 *
 * ```
 *
 * @param {string} source The script(js/ts) file content.
 * @param {IOptions} options The passed options.
 * @returns {(string | never)} The converted to hbs source.
 * @throws {SyntaxError} Will throw an error if invalid source(ts/js) is passed or a **missing plugin**, e.g. `flow`
 * plugin for **typescript syntax**.
 */
export function searchAndExtractHbs(source: string, options: ISearchAndExtractHbsOptions): string | never {
  const templateNodes: ITemplateNode[] = getTemplateNodes(source, options);
  // no inline template(s) found !
  if (templateNodes.length === 0) {
    return '';
  }

  const hbsSource: string = _toHbsSource(templateNodes);

  return hbsSource;
}

/**
 * Parse the source(js/ts file content) and get only the template nodes array.
 *
 * Template nodes are **TaggedTemplateExpression**, **StringLiteral** and **TemplateLiteral**.
 *
 * ### Options:
 *
 * - `hbsTagSources` - [Optional] The **additional** hbs tag sources used in the import declaration(s), e.g.:
 * ```js
 * {
 *   "hbs-source-with-default-export": "default", // import hbs from 'hbs-source-with-default-export';
 *   "hbs-source-with-named-export" : "handlebars", // import { handlebars } from 'hbs-source-wth-named-export';
 *   "hbs-source-with-renamed-export": "hbs" // import { hbs as h } from 'hbs-source-with-renamed-export';
 * }
 * ```
 *
 * - `parse` - [Optional] parser function.
 *
 * - `sortByStartKey` - [Optional] The extracted template nodes from the **ast** will not be ordered by their original
 * position in the source, so we can sort them using the `start` key, `false` by default.
 *
 * ### Example
 *
 * from:
 * ```js
 * import hbs from 'ember-cli-htmlbars-inline-precompile';
 *
 * const taggedTemplate = hbs`my tagged template`; // `TaggedTemplateExpression` node
 * const stringLiteralTemplate = hbs('my string literal template'); // `StringLiteral` node
 * const templateLiteralTemplate = hbs(`my template literal template`); // `TemplateLiteral` node
 * ```
 * to:
 * ```js
 * [
 *   {
 *     template: 'my tagged template',
 *     startLine: 4,
 *     startColumn: 27,
 *     endLine: 4,
 *     endColumn: 45,
 *     type: 'TemplateElement',
 *     start: 85,
 *     end: 103,
 *     loc: SourceLocation { start: [Position], end: [Position] },
 *     value: { raw: 'my tagged template', cooked: 'my tagged template' },
 *     tail: true
 *   },
 *   {
 *     template: 'my string literal template',
 *     startLine: 5,
 *     startColumn: 35,
 *     endLine: 5,
 *     endColumn: 62,
 *     type: 'StringLiteral',
 *     start: 140,
 *     end: 168,
 *     loc: SourceLocation { start: [Position], end: [Position] },
 *     extra: {
 *       rawValue: 'my string literal template',
 *       raw: "'my string literal template'"
 *     },
 *     value: 'my string literal template'
 *   },
 *   {
 *     template: 'my template literal template',
 *     startLine: 6,
 *     startColumn: 37,
 *     endLine: 6,
 *     endColumn: 65,
 *     type: 'TemplateElement',
 *     start: 208,
 *     end: 236,
 *     loc: SourceLocation { start: [Position], end: [Position] },
 *     value: {
 *       raw: 'my template literal template',
 *       cooked: 'my template literal template'
 *     },
 *     tail: true
 *   }
 * ]
 * ```
 *
 * @param {string} source The script(js/ts) file content.
 * @param {IGetTemplateNodesOptions} options The passed options.
 * @returns {ITemplateNode[]} The extracted template nodes array.
 * @throws {SyntaxError} Will throw an error if invalid source(ts/js) is passed or a **missing plugin**, e.g. `flow`
 * plugin for **typescript syntax**.
 */
export function getTemplateNodes(source: string, options: IGetTemplateNodesOptions): ITemplateNode[] {
  const hbsTagSources = (options.hbsTagSources)
    ? { ...defaultHbsTagSources, ...options.hbsTagSources }
    : defaultHbsTagSources;
  const sortByStartKey = options.sortByStartKey || false;

  // (!) parse can throw an error(e.g. `SyntaxError: Unexpected token ...`) depending on the passed source
  // IDK how to deal with it !!!
  const AST: ASTFile = _getAST(source, options);
  const hbsTags: false | string[] = _getHbsTags(AST, hbsTagSources);

  // the script doesn't have import declaration(s) or none of the import declaration is a valid hbs tag !
  if (hbsTags === false) {
    return [];
  }

  const templateNodes: ITemplateNode[] = _getTemplateNodes(AST, hbsTags, sortByStartKey);

  return templateNodes;
}

/**
 * A wrapper of `babylon.parse(...)` with predefined config.
 *
 * @param {string} source The script(js/ts) file content.
 * @returns {(ASTFile | never)} The parsed **AST**.
 * @throws {SyntaxError} Will throw an error if invalid source(ts/js) is passed or a **missing plugin**, e.g. `flow`
 * plugin for **typescript syntax**.
 */
function _getAST(source: string, options: IGetTemplateNodesOptions): ASTFile | never {
  if (typeof options.parse !== 'function') {
    throw new Error('ember-extract-inline-template: parse is required function');
  }
  const AST = options.parse(source);
  return AST;
}

/**
 * Traverse the AST and get the template nodes.
 *
 * @param {File} AST The converted source file to AST.
 * @param {string[]} hbsTags The extracted hbs tags array from the import declarations, e.g. `['hbs', 'handlebars']`.
 * @param {boolean} [sortByStartKey=false] The extracted template nodes from the **ast** will not be ordered by their
 * original position in the source, so we can sort them using the `start` key, `false` by default.
 * @returns {ITemplateNode[]} The template nodes array.
 */
function _getTemplateNodes(AST: ASTFile, hbsTags: string[], sortByStartKey: boolean = false): ITemplateNode[] {
  let templateNodes: ITemplateNode[] = [];

  // (!) MUTATION: `traverse` function will mutate the `templateNodes` array !!!
  traverse(AST, {
    TaggedTemplateExpression({ node }) {
      const tag = node.tag || false;

      if (tag && tag.type === "Identifier" && hbsTags.includes(tag.name)) {
        const innerNode = node.quasi.quasis[0];

        templateNodes = [...templateNodes, {
          template: innerNode.value.raw,
          startLine: innerNode.loc.start.line,
          startColumn: innerNode.loc.start.column,
          endLine: innerNode.loc.end.line,
          endColumn: innerNode.loc.end.column,
          ...innerNode
        }];
      }
    },

    CallExpression({ node }) {
      const callee = node.callee;

      node.arguments.forEach((argument) => {
        if (
          callee.type === "Identifier" &&
          hbsTags.includes(callee.name) &&
          ["StringLiteral", "TemplateLiteral"].includes(argument.type)
        ) {
          switch (argument.type) {
            case "StringLiteral":
              templateNodes = [...templateNodes, {
                template: argument.value,
                startLine: argument.loc.start.line,
                // (!) the `startColumn` for `StringLiteral` will start counting from the single/double quote(`'|"`) char
                // not from the first template char, so we have to increment it to have the correct indentation !
                startColumn: argument.loc.start.column + 1,
                endLine: argument.loc.end.line,
                endColumn: argument.loc.end.column,
                ...argument
              }];
              break;
            case "TemplateLiteral":
              templateNodes = [...templateNodes, {
                template: argument.quasis[0].value.raw,
                startLine: argument.quasis[0].loc.start.line,
                startColumn: argument.quasis[0].loc.start.column,
                endLine: argument.quasis[0].loc.end.line,
                endColumn: argument.quasis[0].loc.end.column,
                ...argument.quasis[0]
              }];
              break;
          }
        }
      });

    },
  });

  if (sortByStartKey) {
    const sortedTemplateNodes = _sortTemplateNodesByStartKey(templateNodes);

    return sortedTemplateNodes;
  }

  return templateNodes;
}

/**
 * Get the hbs tags from the AST Import Declarations `import hbs from 'source'`.
 *
 * @param {File} AST The converted source file to AST.
 * @param {IHbsTagSources} hbsTagSources Valid Hbs tag sources used to compare and extract tags from import declarations
 * e.g `{ 'ember-cli-htmlbars': 'hbs', 'htmlbars-inline-precompile': 'default' }`.
 * @returns {(string[] | false)} The list of hbs tags if found, `false` if the script file doesn't have import
 * declarations or none of the import declarations is a valid source of a hbs tag.
 */
function _getHbsTags(AST: ASTFile, hbsTagSources: IHbsTagSources): string[] | false {
  const importDeclarationNodes = AST.program.body.filter((node) => {
    return node.type === 'ImportDeclaration';
  }) as ImportDeclaration[];

  if (importDeclarationNodes.length === 0) {
    return false;
  }

  const hbsTagSourcesKeys: string[] = Object.keys(hbsTagSources);
  const hbsTags: string[] = importDeclarationNodes.reduce((acc: string[], node: ImportDeclaration) => {
    // e.g. `ember-cli-htmlbars`, `htmlbars-inline-precompile`
    const nodeSourceValue = node.source.value;

    if (hbsTagSourcesKeys.includes(nodeSourceValue)) {
      // e.g `default`, `hbs`, `handlebars`, `h` ...
      const wantedSourceSpecifier = hbsTagSources[nodeSourceValue];

      if (wantedSourceSpecifier === 'default') {
        const importDefaultSpecifiers = node.specifiers as ImportDefaultSpecifier[];
        const [ defaultSpecifier ] = importDefaultSpecifiers.filter((specifier: ImportDefaultSpecifier) => {
          return specifier.type === 'ImportDefaultSpecifier'
        });

        if (defaultSpecifier) {
          const defaultTagName: string = defaultSpecifier.local.name;
          acc = [...acc, defaultTagName];

          return acc;
        }
      }

      const importSpecifiers = node.specifiers as ImportSpecifier[];
      const specifiers = importSpecifiers.filter((specifier: ImportSpecifier) => {
        if (Array.isArray(wantedSourceSpecifier)) {
          return wantedSourceSpecifier.includes(specifier.imported.name);
        }

        return specifier.imported.name === wantedSourceSpecifier;
      });
      if (specifiers.length) {
        specifiers.forEach((specifier) => {
          const localTagName: string = specifier.local.name;
          acc = [...acc, localTagName];
        });

        return acc;
      }
    }

    return acc;
  }, []);

  return (hbsTags.length > 0) ? hbsTags : false;
}

/**
 * Sort the templates by `start` key(the position from where it starts) to have the correct order during the drawing.
 *
 * @param {ITemplateNode[]} templateNodes Inline templates nodes.
 * @returns {ITemplateNode[]} The sorted inline templates nodes.
 */
function _sortTemplateNodesByStartKey(templateNodes: ITemplateNode[]): ITemplateNode[] {
  // (!) we don't need to sort if we have 0 or uniq template
  if (templateNodes.length < 2) {
    return templateNodes;
  }

  const compareFunction = (a: ITemplateNode, b: ITemplateNode) => {
    if (a.start < b.start) {
      return -1;
    }

    if (a.start > b.start) {
      return 1;
    }

    return 0;
  };
  const sortedTemplateNodes = templateNodes.slice(0).sort(compareFunction);

  return sortedTemplateNodes;
}

/**
 * Convert the inline templates nodes to hbs source(string).
 *
 * @param {ITemplateNode[]} templateNodes The inline templates nodes.
 * @returns {string} The final hbs source.
 */
function _toHbsSource(templateNodes: ITemplateNode[]): string {
  let lastParsedLine = 1;
  const sortedTemplateNodes = _sortTemplateNodesByStartKey(templateNodes);
  const output = sortedTemplateNodes.reduce((acc: string, node: ITemplateNode): string => {
    const verticalGap = (lastParsedLine < node.startLine) ? '\n'.repeat(node.startLine - lastParsedLine) : '';
    const indentation = (node.startColumn > 1 && !node.template.startsWith('\n')) ? ' '.repeat(node.startColumn) : '';
    // We have to remove the trailing whitespace(s) after the last new line `\n` for **mutliline inline template(s)**
    // otherwise, we will have trailing whitespace lint error !!
    const rightTrimmedTemplate = node.template.replace(/(\n)[ ]+$/, (fullmatch, newLine) => newLine);

    lastParsedLine = node.endLine;
    acc += verticalGap + indentation + rightTrimmedTemplate;

    return acc;
  }, '');

  return output;
}