import Vue from 'vue'
import VueI18n from 'vue-i18n'

import moment from 'moment'

Vue.use(VueI18n)
function localLang() {
    let lang_local = navigator.language || navigator.userLanguage
    if(lang_local != 'en' || lang_local != "zh")lang_local = "en"
    lang_local = lang_local.substr(0, 2)
    return lang_local
}
const LKEY = 'localeLang'
const DEFAULT_LANG = localLang()
const locales = {
    en: require('./en.json'),
    zh: require('./zh.json')
}

export const i18n = new VueI18n({
    locale: DEFAULT_LANG,
    messages: locales,
    silentTranslationWarn: true
})

export const setup = function (lang) {
    if (lang === undefined) {
        // lang = window.localStorage.getItem(LKEY)
        lang = localLang()
        if (locales[lang] === undefined) {
            lang = DEFAULT_LANG
        }
    }
    window.localStorage.setItem(LKEY, lang)
    Object.keys(i18n.locale).forEach(lang => {
        document.body.classList.remove(`lang-${lang}`)
    })
    document.body.classList.add(`lang-${lang}`)
    document.body.setAttribute('lang', lang)
    Vue.config.lang = lang
    i18n.locale = lang
    if (lang == 'zh') {
        moment.locale('zh-cn')
    } else {
        moment.locale(lang)

    }
}

setup()

export default i18n