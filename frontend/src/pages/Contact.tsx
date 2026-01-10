import { Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Contact = () => {
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder logic
    };

    return (
        <div className="pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-900 leading-tight">
                        {t('contact.title', 'Contáctanos')}
                    </h1>
                    <p className="text-gray-600 text-lg">
                        {t('contact.subtitle', 'Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.')}
                    </p>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center">
                                <Mail size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 font-bold uppercase">Email</p>
                                <a href="mailto:contacto@tuabogado.com.do" className="text-navy-900 font-bold hover:text-gold-600 transition-colors">
                                    contacto@tuabogado.com.do
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gold-50 text-gold-600 rounded-full flex items-center justify-center">
                                <Phone size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 font-bold uppercase">Teléfono</p>
                                <a href="tel:+18295550123" className="text-navy-900 font-bold hover:text-gold-600 transition-colors">
                                    +1 (829) 555-0123
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-navy-900 mb-1">Nombre Completo</label>
                            <input
                                type="text"
                                placeholder="Tu nombre"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-gold-500 focus:bg-white focus:ring-0 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-navy-900 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-gold-500 focus:bg-white focus:ring-0 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-navy-900 mb-1">Mensaje</label>
                            <textarea
                                rows={4}
                                placeholder="¿En qué podemos ayudarte?"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:border-gold-500 focus:bg-white focus:ring-0 transition-all font-medium resize-none"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 bg-navy-900 text-white rounded-xl font-bold text-lg hover:bg-navy-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Enviar Mensaje
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
