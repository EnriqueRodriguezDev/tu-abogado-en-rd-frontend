
import { motion } from 'framer-motion';
import { Video, Scale, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    return (
        <div className="flex flex-col w-full overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative bg-navy-900 pt-32 pb-24 px-4 sm:px-6 lg:px-8 text-center min-h-[90vh] flex flex-col items-center justify-center">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Subtle Background Effects */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50"></div>
                        <div className="absolute top-40 right-20 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl opacity-30"></div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={fadeInUp}
                        className="flex flex-col items-center"
                    >
                        {/* Headline */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white mb-6 leading-tight">
                            Asesoría jurídica en República Dominicana, <br />
                            <span className="text-white">estés donde estés.</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-gray-300 text-lg sm:text-xl mb-10 max-w-3xl leading-relaxed font-light">
                            Atención legal remota para dominicanos en el exterior y extranjeros que necesitan resolver asuntos legales en RD.
                        </p>

                        {/* CTA Button */}
                        <div className="mb-6">
                            <Link to="/booking" className="bg-gold-500 text-navy-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20">
                                Agenda tu consulta ahora
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <p className="text-gray-400 text-sm font-medium mb-16 opacity-80">
                            Videoconsulta legal • Atención profesional • Pago seguro
                        </p>

                        {/* Features Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl border-t border-white/10 pt-12">
                            <div className="flex flex-col items-center gap-3">
                                <Scale className="w-10 h-10 text-gold-500" />
                                <span className="text-white font-medium text-lg">Diversas áreas legales</span>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <Users className="w-10 h-10 text-blue-500" />
                                <span className="text-white font-medium text-lg">Abogado asignado según tu caso</span>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <Video className="w-10 h-10 text-green-500" />
                                <span className="text-white font-medium text-lg">Atención 100% en línea</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-serif font-bold text-navy-900 mb-16">¿Cómo funciona?</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-0.5 bg-gray-200 -z-0"></div>

                        {/* Step 1 */}
                        <div className="flex flex-col items-center relative z-10 group">
                            <div className="w-12 h-12 bg-navy-900 text-white rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">1</div>
                            <h3 className="text-xl font-bold text-navy-900">Agenda tu consulta</h3>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center relative z-10 group">
                            <div className="w-12 h-12 bg-navy-900 text-white rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">2</div>
                            <h3 className="text-xl font-bold text-navy-900">Habla con un abogado</h3>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center relative z-10 group">
                            <div className="w-12 h-12 bg-navy-900 text-white rounded-full flex items-center justify-center font-bold text-xl mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">3</div>
                            <h3 className="text-xl font-bold text-navy-900">Recibe orientación clara</h3>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;
