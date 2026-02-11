import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import vi from '../locales/vi.json'

// Get locale from localStorage or device language
const getInitialLocale = (): 'en' | 'vi' => {
    // Check localStorage first
    const stored = localStorage.getItem('lang')
    if (stored && (stored === 'en' || stored === 'vi')) {
        return stored
    }

    // Get device language
    const deviceLang = (navigator.language.split('-')[0] || 'en')
    
    // Map device language to supported locales
    const supportedLocales: { [key: string]: 'en' | 'vi' } = {
        'vi': 'vi',
        'en': 'en'
    }
    
    return supportedLocales[deviceLang] || 'en'
}

const i18n = createI18n({
    legacy: false, // Set to false to use Composition API
    locale: getInitialLocale(),
    fallbackLocale: 'en',
    messages: {
        en,
        vi
    }
})

// Save language preference when it changes
export const setLanguage = (lang: 'en' | 'vi') => {
    i18n.global.locale.value = lang
    localStorage.setItem('lang', lang)
}

export default i18n
