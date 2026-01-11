import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Cookie as CookieIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const lang: 'es' | 'en' = i18n.language?.startsWith('en') ? 'en' : 'es';

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            // Small delay for animation
            setTimeout(() => setIsVisible(true), 1000);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    const handleViewPolicy = () => {
        navigate('/legal/privacy');
    };

    if (!isVisible) return null;

    const text = {
        es: {
            message: "Utilizamos cookies para asegurar la mejor experiencia. Al navegar, aceptas nuestra ",
            link: "Política de Privacidad",
            accept: "Aceptar",
            view: "Ver Política"
        },
        en: {
            message: "We use cookies to ensure the best experience. By browsing, you accept our ",
            link: "Privacy Policy",
            accept: "Accept",
            view: "View Policy"
        }
    };

    const t = text[lang];

    return (
        <div className="fixed bottom-0 left-0 right-0 w-full z-50 p-4 animate-in slide-in-from-bottom duration-700">
            <div className="max-w-7xl mx-auto bg-navy-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6">

                <div className="flex items-center gap-4 text-center md:text-left flex-1">
                    <div className="p-3 bg-white/10 rounded-full hidden md:block flex-shrink-0">
                        <CookieIcon className="text-gold-500" size={24} />
                    </div>
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed text-justify flex-1">
                        {t.message}
                        <button onClick={handleViewPolicy} className="text-gold-500 font-semibold hover:text-white underline transition-colors inline">
                            {t.link}
                        </button>.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-shrink-0">
                    <button
                        onClick={handleAccept}
                        className="flex-1 md:flex-none px-8 py-3 bg-gold-500 hover:bg-gold-600 text-navy-900 text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-gold-500/20 active:scale-95 whitespace-nowrap"
                    >
                        {t.accept}
                    </button>
                    <button
                        onClick={handleViewPolicy}
                        className="px-4 py-3 text-white underline hover:text-gold-500 text-sm font-medium transition-colors whitespace-nowrap"
                    >
                        {t.view}
                    </button>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white md:hidden"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
