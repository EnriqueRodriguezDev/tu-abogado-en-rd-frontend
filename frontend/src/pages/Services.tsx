import { Scale, Home as HomeIcon, Plane, Users, Briefcase, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { type Service } from '../types';
import { useLocalizedContent } from '../hooks/useLocalizedContent';

import { useNavigate } from 'react-router-dom';

const Services = () => {
    const [services, setServices] = useState<Service[]>([]);
    const { getLocalizedField } = useLocalizedContent<Service>();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Icon Mapping
    const iconMap: Record<string, any> = {
        Scale, Home: HomeIcon, Plane, Users, Briefcase, FileText
    };

    useEffect(() => {
        const fetchServices = async () => {
            const { data } = await supabase
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: true });

            if (data) setServices(data);
            setLoading(false);
        };
        fetchServices();
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="bg-navy-900 text-white py-20 text-center">
                <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4 text-white">Áreas de Práctica</h1>
                <p className="text-gray-300 max-w-2xl mx-auto px-4">
                    Ofrecemos asesoría legal integral con los más altos estándares de calidad y ética profesional.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                {/* Accreditation Banner */}
                <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-12 text-center max-w-3xl mx-auto flex items-center justify-center gap-3 shadow-sm">
                    <Briefcase className="text-gold-600" size={24} />
                    <p className="text-navy-900 font-medium">
                        {useLocalizedContent<any>().t('services.accreditation')}
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center"><div className="animate-spin w-8 h-8 rounded-full border-4 border-gold-500 border-t-transparent"></div></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 cursor-pointer">
                        {services.filter(s => s.is_visible !== false).map((service, index) => { // Default to visible if null/undefined
                            const iconKey = service.icon_name || service.icon || 'Scale';
                            const IconComponent = iconMap[iconKey] || Scale;
                            return (
                                <div key={index} className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border-t-4 border-gold-500 flex flex-col h-full">
                                    <IconComponent className="w-12 h-12 text-navy-900 mb-6" />
                                    <h3 className="text-2xl font-serif font-bold text-navy-900 mb-4">{getLocalizedField(service, 'name')}</h3>
                                    <p className="text-gray-600 leading-relaxed flex-1">
                                        {getLocalizedField(service, 'description')}
                                    </p>

                                    <div className="mt-6 space-y-4">
                                        {(Number(service.price_dop) > 0 || Number(service.price_usd) > 0) && (
                                            <div className="pt-4 border-t border-gray-100 flex justify-between text-sm font-bold text-gold-600">
                                                <span>RD$ {service.price_dop}</span>
                                                <span>USD$ {service.price_usd}</span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => navigate('/booking', { state: { serviceId: service.id } })}
                                            className="w-full py-3 bg-navy-900 text-white rounded-lg font-bold hover:bg-gold-500 hover:text-navy-900 transition-colors shadow-md flex items-center justify-center gap-2 group"
                                        >
                                            <Briefcase size={18} />
                                            <span>Agendar Videoconsulta</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Services;
