import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';

import { appConfig } from './app/app.config';
import { Widget } from './app/widget/widget';

(async () => {
  const app = await createApplication(appConfig);

  const element = createCustomElement(Widget, {
    injector: app.injector,
  });

  if (!customElements.get('user-management-widget')) {
    customElements.define(
      'user-management-widget',
      element,
    );
  }
})();