import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, Loader2, ExternalLink, Video, ArrowRight } from 'lucide-react';
import type { Utility } from '../types';
import { BaseModal } from '../components/ui/Modal';

const Utilities = () => {
    const { t, i18n } = useTranslation();
    const [utilities, setUtilities] = useState<Utility[]>([]);
    const [filteredUtilities, setFilteredUtilities] = useState<Utility[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Modal State
    const [selectedUtility, setSelectedUtility] = useState<Utility | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isEn = i18n.language === 'en';

    useEffect(() => {
        const fetchUtilities = async () => {
            const { data, error } = await supabase
                .from('utilities')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching utilities:', error);
            } else {
                setUtilities(data as Utility[]);
                setFilteredUtilities(data as Utility[]);
            }
            setLoading(false);
        };

        fetchUtilities();
    }, []);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = utilities.filter(u => {
            const title = (u.title || '').toLowerCase();
            const desc = (u.description || '').toLowerCase();
            const titleEn = (u.title_en || '').toLowerCase();
            const descEn = (u.description_en || '').toLowerCase();

            return title.includes(lowerTerm) ||
                desc.includes(lowerTerm) ||
                (isEn && (titleEn.includes(lowerTerm) || descEn.includes(lowerTerm)));
        });
        setFilteredUtilities(filtered);
    }, [searchTerm, utilities, isEn]);

    const handleCardClick = (utility: Utility) => {
        setSelectedUtility(utility);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUtility(null);
    };

    const getLocalizedContent = (u: Utility | null) => {
        if (!u) return { title: '', description: '', link_text: '' };
        return {
            title: isEn ? (u.title_en || u.title) : u.title,
            description: isEn ? (u.description_en || u.description) : u.description,
            link_text: u.link_text || (isEn ? 'Open Tool' : 'Abrir Herramienta')
        };
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-navy-900 transition-colors duration-300 font-sans">
            {/* Header Section */}
            <div className="bg-navy-900 py-10 px-4 shadow-lg text-white">
                <div className="max-w-7xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">
                        {t('nav.utilities', 'Utility Tools')}
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                        {isEn
                            ? 'Explore our collection of legal tools and resources designed to simplify your processes.'
                            : 'Explore nuestra colección de herramientas y recursos legales diseñados para simplificar sus procesos.'}
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto relative mt-8">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-full leading-5 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:bg-white/20 focus:ring-0 sm:text-sm transition-all"
                            placeholder={isEn ? "Search utilities..." : "Buscar utilidades..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* List Layout (Horizontal Cards) */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
                    </div>
                ) : filteredUtilities.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                        <p>{isEn ? 'No utilities found.' : 'No se encontraron utilidades.'}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {filteredUtilities.map((item) => {
                            const content = getLocalizedContent(item);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleCardClick(item)}
                                    className="group flex flex-col md:flex-row bg-white dark:bg-navy-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-navy-700 h-auto md:h-64"
                                >
                                    {/* Image Section (Left) */}
                                    <div className="md:w-[35%] h-48 md:h-full relative overflow-hidden bg-gray-100 dark:bg-navy-900">
                                        <img
                                            src={item.image_url}
                                            alt={content.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                                    </div>

                                    {/* Content Section (Right) */}
                                    <div className="p-6 md:p-8 flex flex-col justify-center flex-1 relative">
                                        <h3 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-3 group-hover:text-[#C5A059] transition-colors">
                                            {content.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed text-base">
                                            {content.description}
                                        </p>

                                        <div className="mt-auto flex items-center text-[#C5A059] font-bold text-sm uppercase tracking-wide group/link">
                                            {isEn ? 'View Tool' : 'Ver Herramienta'}
                                            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedUtility && (
                <BaseModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={getLocalizedContent(selectedUtility).title}
                    maxWidth="max-w-2xl"
                >
                    <div className="space-y-6">
                        <div className="rounded-xl overflow-hidden aspect-video shadow-md border border-gray-100 dark:border-navy-700">
                            <img
                                src={selectedUtility.image_url}
                                alt={selectedUtility.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                                {getLocalizedContent(selectedUtility).description}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-navy-700">
                            {/* 1. Resource Button (Solid Navy) */}
                            {selectedUtility.link_url && (
                                <a
                                    href={selectedUtility.link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex justify-center items-center gap-2 px-6 py-4 bg-[#0B1C3E] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg active:scale-95 text-center"
                                >
                                    <ExternalLink size={20} />
                                    {getLocalizedContent(selectedUtility).link_text}
                                </a>
                            )}

                            {/* 2. Consultation Button (Solid Gold) */}
                            <button
                                onClick={() => navigate('/booking')}
                                className="flex-1 inline-flex justify-center items-center gap-2 px-6 py-4 bg-[#C5A059] text-[#0B1C3E] rounded-xl font-bold hover:bg-[#d6af63] transition-all shadow-lg shadow-gold-500/20 active:scale-95"
                            >
                                <Video size={20} />
                                {isEn ? "Book Consultation" : "Agendar Videoconsulta"}
                            </button>
                        </div>
                    </div>
                </BaseModal>
            )}
        </div>
    );
};

export default Utilities;
