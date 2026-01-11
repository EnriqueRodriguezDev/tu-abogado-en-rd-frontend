import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'es' : 'en';
        i18n.changeLanguage(newLang);
    };

    const isEn = i18n.language === 'en';

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-600/30 hover:bg-white/10 transition-colors text-sm font-medium text-gray-300"
            aria-label="Switch language"
            title={isEn ? "Switch to Spanish" : "Cambiar a Inglés"}
        >
            <img
                src="https://flagcdn.com/do.svg"
                alt="Spanish"
                className={`w-5 h-5 rounded-full object-cover border border-white/20 transition-opacity duration-300 ${isEn ? 'opacity-40 grayscale' : 'opacity-100'}`}
            />
            <img
                src="https://flagcdn.com/us.svg"
                alt="English"
                className={`w-5 h-5 rounded-full object-cover border border-white/20 transition-opacity duration-300 ${!isEn ? 'opacity-40 grayscale' : 'opacity-100'}`}
            />
        </button>
    );
};
