import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'es' : 'en';
        i18n.changeLanguage(newLang);
    };

    const currentFlag = i18n.language === 'en' 
        ? 'https://flagcdn.com/us.svg' 
        : 'https://flagcdn.com/do.svg';

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-500/30 hover:bg-white/10 transition-colors text-sm font-medium text-gray-300"
            aria-label="Switch language"
        >
            <img 
                src={currentFlag} 
                alt={i18n.language === 'en' ? 'USA flag' : 'Dominican Republic flag'} 
                className="w-5 h-5 rounded-full object-cover border border-white/20"
            />
            <span>{i18n.language === 'en' ? 'EN' : 'ES'}</span>
        </button>
    );
};
