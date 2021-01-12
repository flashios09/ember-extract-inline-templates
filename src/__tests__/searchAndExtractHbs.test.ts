import { readFileSync } from "fs";
import { resolve } from "path";
import { searchAndExtractHbs } from "../index";

import { parse } from "babylon";

import { parseScriptFile } from "ember-meta-explorer";

const readFile = (path: any) => clean(readFileSync(resolve(__dirname, path), { encoding: "utf-8" }));

function clean(source: string): string {
  return source.replace(/(?:\\[rn]|[\r\n])/g, "\n");
}

const parsers = [
  {
    name: "Parser #1 (babylon)",
    parse(source: string) {
      return parse(source, { sourceType: "module", plugins: ["classProperties", "flow"] });
    },
  },
  {
    name: "Parser #2 (ember-meta-explorer)",
    parse(source: string) {
      return parseScriptFile(source);
    },
  },
];

parsers.forEach((parser) => {
  test(`${parser.name}: with single multiline tagged template`, () => {
    const component = readFile("./with-single-multiline-tagged-template/component.ts");
    const template = readFile("./with-single-multiline-tagged-template/template.hbs");

    expect(searchAndExtractHbs(component, { parse: parser.parse })).toBe(template);
  });

  test(`${parser.name}: with additional hbs tag sources`, () => {
    const component = readFile("./with-additional-hbs-tag-sources/custom-hbs-tag-sources-component-test.js");
    const template = readFile("./with-additional-hbs-tag-sources/template.hbs");

    expect(
      searchAndExtractHbs(component, {
        hbsTagSources: {
          "my-custom-hbs-source": "default",
          "another-custom-hbs-source": "handlebars",
        },
        parse: parser.parse
      }),
    ).toBe(template);
  });

  test(`${parser.name}: with both tagged *hbs\`template\`* and string literal *hbs('template')* formats`, () => {
    const component = readFile("./with-both-tagged-and-string-literal-formats/test-inline-precompile-test.js");
    const template = readFile("./with-both-tagged-and-string-literal-formats/template.hbs");

    expect(searchAndExtractHbs(component, { parse: parser.parse })).toBe(template);
  });

  test(`${parser.name}: with low-level glimmer api`, () => {
    const component = readFile("./with-glimmer-api/component.ts");
    const template = readFile("./with-glimmer-api/template.hbs");

    expect(searchAndExtractHbs(component, { parse: parser.parse })).toBe(template);
  });
});
