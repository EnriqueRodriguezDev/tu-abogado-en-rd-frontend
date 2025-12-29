import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'es' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1 rounded-full border border-gold-500/30 hover:bg-white/10 transition-colors text-sm font-medium text-gray-300"
        >
            <span className="text-lg leading-none">
                {i18n.language === 'en' ? '🇺🇸' : '🇩🇴'}
            </span>
            <span>{i18n.language === 'en' ? 'EN' : 'ES'}</span>
        </button>
    );
};
