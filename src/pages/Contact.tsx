
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
    return (
        <div className="bg-white min-h-screen">
            <div className="bg-navy-900 text-white py-20 text-center">
                <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4">Contáctanos</h1>
                <p className="text-gray-300 max-w-2xl mx-auto px-4">
                    Estamos aquí para escucharte. Agenda una consulta o envíanos un mensaje.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                    {/* Contact Form */}
                    <div className="bg-slate-50 p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-2xl font-serif font-bold text-navy-900 mb-6">Envíanos un Mensaje</h2>
                        <form className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                                <input type="text" className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="Juan Pérez" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                                <input type="email" className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="juan@ejemplo.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Asunto</label>
                                <select className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all bg-white">
                                    <option>Consulta General</option>
                                    <option>Derecho Civil</option>
                                    <option>Inmobiliario</option>
                                    <option>Migratorio</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                                <textarea rows={4} className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" placeholder="Describe brevemente tu caso..."></textarea>
                            </div>
                            <button type="submit" className="w-full btn-primary flex justify-center items-center gap-2">
                                <Send className="w-4 h-4" /> Enviar Mensaje
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-12">
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-navy-900 mb-6">Información de Contacto</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-navy-100 rounded-lg text-navy-900">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-navy-900">Oficina Principal</h4>
                                        <p className="text-gray-600">Av. Winston Churchill esq. Andres Julio Aybar,<br />Torre Acrópolis, Piso 12.<br />Santo Domingo, República Dominicana</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-navy-100 rounded-lg text-navy-900">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-navy-900">Teléfono</h4>
                                        <p className="text-gray-600">+1 (809) 555-1234</p>
                                        <p className="text-sm text-gray-400">Lunes a Viernes, 9am - 6pm</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-navy-100 rounded-lg text-navy-900">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-navy-900">Correo</h4>
                                        <p className="text-gray-600">info@tuabogadoenrd.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map Placeholder */}
                        <div className="bg-gray-200 rounded-xl h-64 w-full flex items-center justify-center text-gray-500">
                            <span className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Mapa de Google</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
