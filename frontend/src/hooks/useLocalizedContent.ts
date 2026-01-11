import { useTranslation } from 'react-i18next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useLocalizedContent = <T extends Record<string, any>>() => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    const getLocalizedField = (item: T, fieldName: string): string => {
        if (!item) return '';

        // If current language is English, try to get the English version
        if (currentLang === 'en') {
            const enField = `${fieldName}_en`;
            // Return English version if it exists and is not empty, otherwise fallback to Spanish
            if (enField in item && item[enField as keyof T] && String(item[enField as keyof T]).trim() !== '') {
                return String(item[enField as keyof T]);
            }
        }

        // Return Spanish version (default)
        return String(item[fieldName as keyof T] || '');
    };

    return { getLocalizedField, currentLang, t };
};
