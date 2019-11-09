import { readFileSync } from 'fs';
import { resolve } from 'path';
import { searchAndExtractHbs } from "../index";

const readFile = (path: any) => readFileSync(resolve(__dirname, path), { encoding: 'utf-8'});

test('with single multiline tagged template', () => {
  const component = readFile('./with-single-multiline-tagged-template/component.ts');
  const template = readFile('./with-single-multiline-tagged-template/template.hbs');

  expect(searchAndExtractHbs(component)).toBe(template);
});

test("with additional hbs tag sources", () => {
  const component = readFile('./with-additional-hbs-tag-sources/custom-hbs-tag-sources-component-test.js');
  const template = readFile('./with-additional-hbs-tag-sources/template.hbs');

  expect(searchAndExtractHbs(component, {
    hbsTagSources: {
      "my-custom-hbs-source": "default",
      "another-custom-hbs-source": "handlebars"
    }
  })).toBe(template);
});

test("with both tagged *hbs`template`* and string literal *hbs('template')* formats", () => {
  const component = readFile('./with-both-tagged-and-string-literal-formats/test-inline-precompile-test.js');
  const template = readFile('./with-both-tagged-and-string-literal-formats/template.hbs');

  expect(searchAndExtractHbs(component)).toBe(template);
});
