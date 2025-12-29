import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Loader2, Briefcase, Scale, Gavel, FileText, Shield, Users, Landmark, DollarSign } from 'lucide-react';

const ICON_MAP: any = {
    Briefcase, Scale, Gavel, FileText, Shield, Users, Landmark, DollarSign
};

const ServiceDetail = () => {
    interface Service {
        id: string;
        name: string;
        description: string;
        content: string;
        image_url: string;
        category: string;
        price_dop: number;
        price_usd: number;
        icon_name?: string;
        icon?: string;
    }

    const { slug } = useParams();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchService = async () => {
            setLoading(true);
            // By slug
            const { data } = await supabase
                .from('services')
                .select('*')
                .eq('slug', slug)
                .single();

            if (data) setService(data);
            setLoading(false);
        };

        if (slug) fetchService();
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
            <Loader2 className="animate-spin text-gold-500 w-12 h-12" />
        </div>
    );

    if (!service) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white">
            <h1 className="text-4xl font-serif font-bold mb-4">Servicio no encontrado</h1>
            <Link to="/servicios" className="text-gold-500 hover:underline">Ver todos los servicios</Link>
        </div>
    );

    return (
        <div className="bg-slate-50 dark:bg-navy-900 min-h-screen font-sans transition-colors duration-300 pb-20">
            {/* Minimal Header */}
            <div className="bg-navy-900 text-white py-6">
                <div className="max-w-4xl mx-auto px-4">
                    <Link to="/servicios" className="inline-flex items-center gap-2 text-gray-300 hover:text-gold-500 transition-colors">
                        <ArrowLeft size={20} /> Volver a Servicios
                    </Link>
                </div>
            </div>

            {/* Hero Section */}
            <div className="w-full h-[350px] relative">
                <img
                    src={service.image_url || 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80'}
                    alt={service.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/60 to-transparent"></div>

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
                    <div className="max-w-4xl mx-auto">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/20 text-blue-200 border border-blue-500/30 backdrop-blur-md font-bold rounded-full text-sm mb-4 uppercase tracking-wider">
                            {(() => {
                                const IconComp = (service.icon_name && ICON_MAP[service.icon_name]) || (service.icon && ICON_MAP[service.icon]) || Briefcase;
                                return <IconComp size={16} />;
                            })()}
                            {service.category || 'Servicio Legal'}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                            {service.name}
                        </h1>
                        <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
                            {service.description}
                        </p>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 -mt-10 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-8 text-lg text-gray-700 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-navy-700">
                        <h3 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-6">Detalles del Servicio</h3>
                        <div className="whitespace-pre-wrap font-sans">
                            {service.content || service.description}
                        </div>
                    </div>
                </div>

                {/* Sidebar Pricing & CTA */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-navy-700 sticky top-24">
                        <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-4">Inversión Estimada</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Precio RD$</span>
                                <span className="text-2xl font-bold text-navy-900 dark:text-white">
                                    {service.price_dop > 0 ? `RD$ ${service.price_dop.toLocaleString()}` : 'A Consultar'}
                                </span>
                            </div>
                            {service.price_usd > 0 && (
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-navy-700">
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">Precio USD</span>
                                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                        US$ {service.price_usd.toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <Link
                            to="/booking"
                            className="w-full btn-primary bg-gold-500 text-navy-900 font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20"
                        >
                            Agendar Cita
                        </Link>

                        <p className="text-xs text-center text-gray-400 mt-4 px-2">
                            * Los precios pueden variar según la complejidad del caso. Agenda una cita para evaluación.
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ServiceDetail;
