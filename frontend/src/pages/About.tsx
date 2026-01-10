import { Shield, Award, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const About = () => {
    const { i18n } = useTranslation();
    const isEn = i18n.language === 'en';

    return (
        <div className="bg-slate-50 dark:bg-navy-900 min-h-screen transition-colors duration-300 font-sans">
            {/* Hero Section */}
            <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1505664194779-8beaceb93744?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                        alt="Law office background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 animate-in slide-in-from-bottom duration-700">
                        {isEn ? 'Committed to Justice and Your Peace of Mind' : 'Comprometidos con la Justicia y tu Tranquilidad'}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed animate-in slide-in-from-bottom duration-700 delay-100">
                        {isEn
                            ? 'Our mission is to provide high-quality legal solutions with a human and personalized approach.'
                            : 'Nuestra misión es brindar soluciones legales de alta calidad con un enfoque humano y personalizado.'}
                    </p>
                    <div className="pt-8 animate-in slide-in-from-bottom duration-700 delay-200">
                        <Link
                            to="/booking"
                            className="bg-gold-500 text-navy-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20"
                        >
                            {isEn ? 'Book Appointment Today' : 'Agenda tu cita hoy'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6 animate-in slide-in-from-left duration-700">
                        <div className="flex items-center gap-3">
                            <span className="w-12 h-1 bg-gold-500"></span>
                            <span className="text-gold-500 font-bold uppercase tracking-wider">{isEn ? 'Our Story' : 'Nuestra Historia'}</span>
                        </div>
                        <h2 className="text-4xl font-serif font-bold text-navy-900 dark:text-white">
                            {isEn ? 'More than attorneys, your strategic allies.' : 'Más que abogados, tus aliados estratégicos.'}
                        </h2>
                        <div className="text-gray-600 dark:text-gray-300 space-y-4 text-lg leading-relaxed">
                            <p>
                                {isEn
                                    ? 'Founded in 2024, TuAbogadoEnRD was born from a clear vision: to modernize access to legal services in the Dominican Republic. We observed that the traditional legal system was often complex, distant, and intimidating for many.'
                                    : 'Fundada en 2024, TuAbogadoEnRD nació de una visión clara: modernizar el acceso a servicios legales en la República Dominicana. Observamos que el sistema legal tradicional era a menudo complejo, distante e intimidante para muchos.'}
                            </p>
                            <p>
                                {isEn
                                    ? 'We decided to create a firm that combines legal excellence with technology and warmth. We understand that behind every case is a person, a family, or a business looking for security and results.'
                                    : 'Decidimos crear una firma que combine la excelencia jurídica con tecnología y calidez humana. Entendemos que detrás de cada caso hay una persona, una familia o un negocio buscando seguridad y resultados.'}
                            </p>
                        </div>
                    </div>
                    <div className="relative animate-in slide-in-from-right duration-700">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80"
                                alt="Meeting room"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-6 -left-6 bg-navy-900 p-8 rounded-xl shadow-xl max-w-xs hidden md:block">
                            <p className="text-gold-500 font-serif text-4xl font-bold mb-2">10+</p>
                            <p className="text-white text-sm">
                                {isEn ? 'Years of accumulated experience in various legal areas.' : 'Años de experiencia acumulada en diversas áreas legales.'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Grid */}
            <section className="py-24 px-4 bg-navy-50 dark:bg-navy-800/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-white mb-4">
                            {isEn ? 'Our Values' : 'Nuestros Valores'}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            {isEn ? 'The pillars that guide every action and decision we take.' : 'Los pilares que guían cada acción y decisión que tomamos.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-700 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-14 h-14 bg-navy-100 dark:bg-navy-800 rounded-xl flex items-center justify-center text-navy-900 dark:text-gold-500 mb-6">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-3">{isEn ? 'Integrity' : 'Integridad'}</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {isEn
                                    ? 'We act with total transparency and ethics. Your trust is our most valuable asset, and we protect it with honesty.'
                                    : 'Actuamos con total transparencia y ética. Tu confianza es nuestro activo más valioso y la protegemos con honestidad.'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-700 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-14 h-14 bg-navy-100 dark:bg-navy-800 rounded-xl flex items-center justify-center text-navy-900 dark:text-gold-500 mb-6">
                                <Award size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-3">{isEn ? 'Excellence' : 'Excelencia'}</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {isEn
                                    ? 'We strive for perfection in every detail. We constantly update ourselves to offer the best legal defense.'
                                    : 'Buscamos la perfección en cada detalle. Nos actualizamos constantemente para ofrecer la mejor defensa legal.'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-navy-700 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-14 h-14 bg-navy-100 dark:bg-navy-800 rounded-xl flex items-center justify-center text-navy-900 dark:text-gold-500 mb-6">
                                <Lightbulb size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-3">{isEn ? 'Innovation' : 'Innovación'}</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {isEn
                                    ? 'We leverage technology to simplify processes, reduce times, and improve communication with our clients.'
                                    : 'Aprovechamos la tecnología para simplificar procesos, reducir tiempos y mejorar la comunicación con nuestros clientes.'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section 
            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 justify-center">
                        <Users className="text-gold-500 w-6 h-6" />
                        <span className="text-gold-500 font-bold uppercase tracking-wider">{isEn ? 'Our Team' : 'Nuestro Equipo'}</span>
                    </div>
                    <h2 className="text-4xl font-serif font-bold text-navy-900 dark:text-white text-center mb-16">
                        {isEn ? 'Meet our leading attorneys' : 'Conoce a nuestros abogados líderes'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                        {/* Fake Lawyer 1 
                        <div className="bg-white dark:bg-navy-800 rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-navy-700 group">
                            <div className="h-80 overflow-hidden relative">
                                <img
                                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                                    alt="Lic. Carlos Rodriguez"
                                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="text-xl font-bold">Lic. Carlos Rodriguez</h3>
                                    <p className="text-gold-500 text-sm">Director General & Derecho Penal</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                                    {isEn
                                        ? 'Specialist in Criminal Law with over 15 years of experience litigating in high-profile cases. Committed to the passionate defense of his clients.'
                                        : 'Especialista en Derecho Penal con más de 15 años de experiencia litigando en casos de alto perfil. Comprometido con la defensa apasionada de sus clientes.'}
                                </p>
                            </div>
                        </div>

                        {/* Fake Lawyer 2 
                        <div className="bg-white dark:bg-navy-800 rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-navy-700 group">
                            <div className="h-80 overflow-hidden relative">
                                <img
                                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                                    alt="Lic. Ana Martinez"
                                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="text-xl font-bold">Lic. Ana Martinez</h3>
                                    <p className="text-gold-500 text-sm">Derecho Corporativo y Civil</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                                    {isEn
                                        ? 'Expert in Corporate Law and Contracts. She advises national and international companies on their establishment and operations in the DR.'
                                        : 'Experta en Derecho Corporativo y Contratos. Asesora a empresas nacionales e internacionales en su constitución y operaciones en RD.'}
                                </p>
                            </div>
                        </div>

                        {/* Fake Lawyer 3
                        <div className="bg-white dark:bg-navy-800 rounded-2xl overflow-hidden shadow-xl border border-gray-100 dark:border-navy-700 group">
                            <div className="h-80 overflow-hidden relative">
                                <img
                                    src="https://images.unsplash.com/photo-1556157382-97eda2d62296?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                                    alt="Lic. Miguel Santos"
                                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h3 className="text-xl font-bold">Lic. Miguel Santos</h3>
                                    <p className="text-gold-500 text-sm">Bienes Raíces e Inmigración</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                                    {isEn
                                        ? 'Focused on Real Estate and Migration Law. He facilitates the purchase of properties and residency processes for foreigners.'
                                        : 'Enfocado en Derecho Inmobiliario y Migratorio. Facilita la compra de propiedades y procesos de residencia para extranjeros.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>*/}
        </div>
    );
};

export default About;
