
import { Scale, Home as HomeIcon, Plane, Users, Briefcase, FileText } from 'lucide-react';

const Services = () => {
    const services = [
        {
            icon: Scale,
            title: 'Derecho Civil',
            description: 'Asesoría en contratos, responsabilidad civil, daños y perjuicios, y resolución de disputas mediante litigio o arbitraje.',
        },
        {
            icon: HomeIcon,
            title: 'Derecho Inmobiliario',
            description: 'Expertos en depuración de títulos, transferencias, hipotecas, deslindes y litigios de tierras en toda la República Dominicana.',
        },
        {
            icon: Plane,
            title: 'Derecho Migratorio',
            description: 'Gestión de residencias, permisos de trabajo, naturalización y visados para extranjeros que deseen establecerse en el país.',
        },
        {
            icon: Users,
            title: 'Derecho de Familia',
            description: 'Manejo sensible de divorcios, guarda y custodia, pensiones alimenticias, adopciones y procesos de interdicción.',
        },
        {
            icon: Briefcase,
            title: 'Derecho Corporativo',
            description: 'Constitución de empresas, reestructuraciones, fusiones, y asesoría legal permanente para negocios nacionales e internacionales.',
        },
        {
            icon: FileText,
            title: 'Sucesiones y Herencias',
            description: 'Planificación patrimonial, redacción de testamentos y procesos de determinación de herederos.',
        }
    ];

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="bg-navy-900 text-white py-20 text-center">
                <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4">Áreas de Práctica</h1>
                <p className="text-gray-300 max-w-2xl mx-auto px-4">
                    Ofrecemos asesoría legal integral con los más altos estándares de calidad y ética profesional.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <div key={index} className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border-t-4 border-gold-500">
                            <service.icon className="w-12 h-12 text-navy-900 mb-6" />
                            <h3 className="text-2xl font-serif font-bold text-navy-900 mb-4">{service.title}</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {service.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Services;
