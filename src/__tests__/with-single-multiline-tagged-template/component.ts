// @ts-ignore
import GlimmerComponent from '@glimmer/component';
// @ts-ignore
import hbs from 'ember-cli-htmlbars-inline-precompile';

const template = hbs`
  <div class="input {{this.type}}">
    <label>{{yield}}</label>
    <input type={{this.type}} value={{this.value}}>
  </div>
`;

interface IComponentArgs {
  type: string;
  value?: any;
}

class MyInputComponent extends GlimmerComponent<IComponentArgs> {
  type: string = 'text';
};

// @ts-ignore
export default Ember._setComponentTemplate(template, MyInputComponent);