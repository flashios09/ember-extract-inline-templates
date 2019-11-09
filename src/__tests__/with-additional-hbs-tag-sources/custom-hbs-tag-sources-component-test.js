import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs as h } from 'ember-cli-htmlbars';
import hbs from 'my-custom-hbs-source';
import { handlebars } from 'another-custom-hbs-source';

module('Integration | Component | custom-hbs-tag-sources-component', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<CustomHbsTagSourcesComponent />`);

    assert.equal(this.element.textContent.trim(), '');

    // Template block usage:
    await render(handlebars`
      <CustomHbsTagSourcesComponent>
        template block text
      </CustomHbsTagSourcesComponent>
    `);

    assert.equal(this.element.textContent.trim(), 'template block text');

    await render(h`<HbsTagSourcesComponent />`);

    assert.equal(this.element.textContent.trim(), '');
  });
});
