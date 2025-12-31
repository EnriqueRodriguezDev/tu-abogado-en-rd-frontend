
import { motion } from 'framer-motion';
import { ArrowRight, Video, Scale, Home as HomeIcon, Plane, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocalizedContent } from '../hooks/useLocalizedContent';

const Home = () => {
    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const { getLocalizedField } = useLocalizedContent<any>();

    const services = [
        {
            icon: Scale,
            title: 'Derecho Civil',
            title_en: 'Civil Law',
            description: 'Litigios y Resolución de Conflictos',
            description_en: 'Litigation and Dispute Resolution',
        },
        {
            icon: HomeIcon,
            title: 'Inmobiliario',
            title_en: 'Real Estate',
            description: 'Compra, Venta y Bienes Raíces',
            description_en: 'Buying, Selling and Real Estate',
        },
        {
            icon: Plane,
            title: 'Migratorio',
            title_en: 'Immigration',
            description: 'Residencia, Visados y Ciudadanía',
            description_en: 'Residency, Visas and Citizenship',
        },
        {
            icon: Users,
            title: 'Familia',
            title_en: 'Family Law',
            description: 'Divorcios, Herencias y Sucesiones',
            description_en: 'Divorces, Inheritances and Successions',
        },
    ];

    const articles = [
        {
            title: '¿Cómo hacer una declaración de herederos en RD?',
            title_en: 'How to make a declaration of heirs in DR?',
            date: '20 Oct, 2024',
            category: 'Derecho Civil',
            image: 'bg-green-900', // Placeholder
        },
        {
            title: 'Guía para obtener la residencia dominicana',
            title_en: 'Guide to obtaining Dominican residency',
            date: '15 Oct, 2024',
            category: 'Migración',
            image: 'bg-slate-200',
        }
    ];

    return (
        <div className="flex flex-col w-full overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative bg-navy-900 pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center sm:text-left min-h-[80vh] flex items-center">
                <div className="absolute inset-0 overflow-hidden">
                    {/* Abstract Background pattern can go here */}
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={fadeInUp}
                        className="flex flex-col items-center lg:items-start"
                    >
                        <span className="w-12 h-1 bg-gold-500 mb-6 block lg:ml-1"></span>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight">
                            Justicia y <span className="text-gold-500">Excelencia</span> Legal
                        </h1>
                        <p className="text-gray-300 text-lg sm:text-xl mb-10 max-w-2xl lg:mx-0 leading-relaxed font-light">
                            Abogados expertos en la República Dominicana. Asesoría integral para dominicanos en la diáspora y clientes internacionales.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Link to="/booking" className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
                                <Video className="w-5 h-5" />
                                Agendar videoconsulta
                            </Link>
                            <Link to="/servicios" className="btn-outline w-full sm:w-auto justify-center">
                                Ver nuestros servicios
                            </Link>
                        </div>
                    </motion.div>

                    {/* Hero Image/Visual could go here for Desktop */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="hidden lg:block relative"
                    >
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
                            {/* Using placeholder or public image 1 */}
                            <div className="absolute inset-0 bg-navy-800/20 mix-blend-multiply"></div>
                            {/* Try to use the first uploaded image if it fits, otherwise use a placeholder */}
                            <img src="/images/1.png" alt="Legal Team" className="object-cover w-full h-full" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <img
                                src="/images/2.png"
                                alt="Meeting"
                                className="rounded-lg shadow-xl w-full object-cover h-[400px]"
                                onError={(e) => {
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80";
                                }}
                            />
                            <div className="absolute bottom-6 left-6 right-6 bg-black/70 backdrop-blur-sm p-4 rounded text-white border-l-4 border-gold-500">
                                <p className="font-medium text-sm">Equipo con <span className="font-bold">más de 10 años de experiencia</span></p>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl lg:text-5xl font-serif font-bold text-navy-900 mb-6">Sobre Nosotros</h2>
                            <div className="w-16 h-1 bg-gold-500 mb-8"></div>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                TuAbogadoEnRD ofrece servicios legales de primer nivel. Nos especializamos en brindar soluciones jurídicas claras y efectivas, eliminando las barreras de distancia para nuestros clientes en el extranjero.
                            </p>
                            <div className="flex gap-6">
                                <div className="flex items-center gap-2 text-navy-800 font-medium">
                                    <div className="p-2 bg-gold-100 rounded-full text-gold-600">
                                        <Scale className="w-5 h-5" />
                                    </div>
                                    Ética Profesional
                                </div>
                                <div className="flex items-center gap-2 text-navy-800 font-medium">
                                    <div className="p-2 bg-gold-100 rounded-full text-gold-600">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    Trato Personalizado
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-gold-600 font-semibold tracking-wider text-sm uppercase">Áreas de Práctica</span>
                        <h2 className="text-3xl lg:text-5xl font-serif font-bold text-navy-900 mt-2">Nuestros Servicios</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map((service, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-transparent hover:border-gold-200 group">
                                <service.icon className="w-10 h-10 text-gold-500 mb-6 group-hover:scale-110 transition-transform duration-300" />
                                <h3 className="text-xl font-serif font-bold text-navy-900 mb-2">{getLocalizedField(service, 'title')}</h3>
                                <p className="text-gray-500 text-sm mb-4">{getLocalizedField(service, 'description')}</p>
                                <Link to="/servicios" className="inline-flex items-center text-gold-600 font-medium text-sm hover:text-gold-700">
                                    Ver detalles <ChevronRight className="w-4 h-4 ml-1" />
                                </Link>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Link to="/servicios" className="inline-flex items-center text-navy-700 font-semibold hover:text-navy-900 border-b border-navy-700 pb-1">
                            Ver todos los servicios <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-navy-900 text-white relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 top-0 opacity-10">
                    {/* Background pattern or image here */}
                </div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <Video className="w-16 h-16 text-gold-500 mx-auto mb-6 opacity-80" />
                    <h2 className="text-3xl lg:text-5xl font-serif font-bold mb-6">Asesoría Legal Sin Fronteras</h2>
                    <p className="text-gray-300 text-lg mb-10">
                        Reserve su sesión remota de 30 minutos con nuestros expertos desde su hogar en cualquier parte del mundo.
                    </p>

                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-600 overflow-hidden flex-shrink-0 border-2 border-gold-500">
                                <img src="/images/3.png" alt="Abogado" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Lic. Carlos Rodriguez</h4>
                                <p className="text-gold-400 text-sm">Consultor Civil & Comercial</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Próxima disponibilidad: Hoy, 15:00
                                </div>
                            </div>
                        </div>
                        <Link to="/booking" className="btn-primary w-full md:w-auto text-center shrink-0">
                            Reservar Ahora
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Articles - Simple Preview */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-left mb-10 border-l-4 border-gold-500 pl-4">
                        <span className="text-gold-600 text-sm font-semibold tracking-wider">BLOG JURÍDICO</span>
                        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-navy-900">Artículos Recientes</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {articles.map((article, idx) => (
                            <div key={idx} className="group cursor-pointer">
                                <div className={`h-64 w-full rounded-xl overflow-hidden mb-6 relative ${article.image}`}>
                                    {/* Placeholder Logic */}
                                    <div className="absolute inset-0 bg-navy-900/10 group-hover:bg-navy-900/0 transition-colors duration-300"></div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-gold-600 mb-2 uppercase tracking-wide">
                                    {article.category}
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-navy-900 mb-3 group-hover:text-gold-600 transition-colors">
                                    {getLocalizedField(article, 'title')}
                                </h3>
                                <p className="text-gray-500 text-sm flex items-center gap-2">
                                    {article.date}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;
