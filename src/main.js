import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import PBWebUI from 'pbweb-ui'
import '../theme/index.css'
import "./assets/main.css"
import i18n from './locales'
import VueLazyLoad from 'vue-lazyload'
import VueClipboard from "vue-clipboard2"
import AsyncComputed from 'vue-async-computed'

Vue.use(AsyncComputed)
Vue.use(VueClipboard)
Vue.use(VueLazyLoad, {
  preload: 1,
  loading: require('./assets/image/loading.png'),
  error: require('./assets/image/loading.png')
})

Vue.use(ElementUI)
Vue.use(PBWebUI)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')