// @ts-ignore
import { setComponentTemplate, precompileTemplate, createTemplate } from '@glimmer/core';


setComponentTemplate(
    precompileTemplate(
      { Foo: 42 },
      '<ChildComponent @firstName={{this.firstName}} @status={{this.status4}} />'
    )
);

setComponentTemplate(
    precompileTemplate(
      '<ChildComponent @firstName={{this.firstName}} @status={{this.status3}} />'
    )
);


setComponentTemplate(
    createTemplate(
      { Foo: 42 },
      '<ChildComponent @firstName={{this.firstName}} @status={{this.status0}} />'
    )
);


setComponentTemplate(
    createTemplate(
      `<ChildComponent @firstName={{this.firstName}} @status={{this.status1}} />`
    )
);