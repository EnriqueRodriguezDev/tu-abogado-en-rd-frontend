import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import { LEGAL_CONTENT } from '../data/legalText';
import { useTranslation } from 'react-i18next';
import { Scale, ShieldCheck, RefreshCw, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Legal = () => {
    const { section } = useParams<{ section: string }>();
    const { i18n } = useTranslation();
    const location = useLocation();

    // Default to 'terms' if no section provided
    const activeSection = section || 'terms';

    // Determine language (default to 'es' if not 'en')
    const lang = i18n.language.startsWith('en') ? 'en' : 'es';

    // Validate section matches available keys
    const validSections = ['terms', 'privacy', 'refunds'];
    if (!validSections.includes(activeSection)) {
        return <Navigate to="/legal/terms" replace />;
    }

    const content = LEGAL_CONTENT[lang][activeSection as keyof typeof LEGAL_CONTENT['es']];

    const menuItems = [
        {
            key: 'terms',
            label: lang === 'en' ? 'Terms & Conditions' : 'Términos y Condiciones',
            icon: Scale
        },
        {
            key: 'privacy',
            label: lang === 'en' ? 'Privacy Policy' : 'Política de Privacidad',
            icon: ShieldCheck
        },
        {
            key: 'refunds',
            label: lang === 'en' ? 'Refund Policy' : 'Política de Devoluciones',
            icon: RefreshCw
        },
    ];

    return (
        <div className="bg-gray-50 min-h-screen pt-32 pb-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-8">
                    <h1 className="text-4xl lg:text-5xl font-serif font-bold text-navy-900 mb-4">
                        {lang === 'en' ? 'Legal Information' : 'Información Legal'}
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg font-light">
                        {lang === 'en'
                            ? 'Transparecy and clarity in all our services.'
                            : 'Transparencia y claridad en todos nuestros servicios.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Sidebar Navigation */}
                    <div className="md:col-span-4 lg:col-span-3">
                        <nav className="flex flex-col space-y-3 sticky top-32">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.key}
                                    to={`/legal/${item.key}`}
                                    className={`flex items-center gap-4 p-4 rounded-xl text-sm font-medium transition-all duration-300 group border ${activeSection === item.key
                                        ? 'bg-navy-900 text-white border-navy-900 shadow-xl scale-[1.02]'
                                        : 'bg-white text-gray-600 border-gray-100 hover:border-gold-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg transition-colors ${activeSection === item.key ? 'bg-white/10' : 'bg-gray-50 group-hover:bg-gold-50'}`}>
                                        <item.icon size={20} className={activeSection === item.key ? 'text-gold-500' : 'text-gray-400 group-hover:text-gold-600'} />
                                    </div>
                                    <span className={activeSection === item.key ? 'font-bold' : ''}>{item.label}</span>
                                    {activeSection === item.key && <ChevronRight size={16} className="ml-auto text-gold-500 animate-pulse" />}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Content Paper */}
                    <div className="md:col-span-8 lg:col-span-9">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100"
                        >
                            <div className="border-b border-gray-100 pb-0 mb-0">
                                <span className="text-gold-500 font-bold tracking-widest text-xs uppercase mb-2 block">
                                    {lang === 'en' ? 'Leagl Document' : 'Documento Legal'}
                                </span>
                                <h2 className="text-3xl font-serif font-bold text-navy-900">
                                    {content.title}
                                </h2>
                            </div>

                            <div className="prose prose-lg prose-slate max-w-none text-gray-600 font-sans">
                                <div
                                    className="leading-loose text-justify whitespace-pre-line space-y-6 legal-content"
                                    dangerouslySetInnerHTML={{ __html: content.content }}
                                />
                            </div>

                            <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                <span>ID: {activeSection.toUpperCase()}-2026-V1</span>
                                <span className="italic">
                                    {lang === 'en' ? 'Last updated: January 2026' : 'Última actualización: Enero 2026'}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Legal;
