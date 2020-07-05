import Vue, { DirectiveOptions } from 'vue';

import 'normalize.css';
import ElementUI from 'element-ui';
import SvgIcon from 'vue-svgicon';

import './app/styles/element-variables.scss';
import './app/styles/index.scss';

import App from './app/app.vue';
import store from './app/store';
import { AppModule } from './app/store/modules/app';
import router from './app/router';
import i18n from './app/lang';
import './app/icons/components';
import './permission';
import './app/utils/error-log';
import './app/pwa/register-service-worker';
import * as directives from './app/directives';
import * as filters from './app/filters';

Vue.use(ElementUI, {
  size: AppModule.size, // Set element-ui default size
  i18n: (key: string, value: string) => i18n.t(key, value)
});

Vue.use(SvgIcon, {
  tagName: 'svg-icon',
  defaultWidth: '1em',
  defaultHeight: '1em'
});

// Register global directives
Object.keys(directives).forEach(key => {
  Vue.directive(key, (directives as { [key: string]: DirectiveOptions })[key]);
});

// Register global filter functions
Object.keys(filters).forEach(key => {
  Vue.filter(key, (filters as { [key: string]: Function })[key]);
});

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app');
