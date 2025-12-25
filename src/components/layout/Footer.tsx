
import { Scale, Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-navy-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Scale className="h-8 w-8 text-gold-500" />
                            <span className="font-serif text-xl font-bold text-white">TuAbogadoEnRD</span>
                        </div>
                        <p className="text-sm leading-relaxed mb-4">
                            Expertos en soluciones legales en la República Dominicana. Compromiso, ética y resultados para proteger tus intereses.
                        </p>
                        <div className="flex space-x-4">
                            {[Facebook, Instagram, Linkedin].map((Icon, index) => (
                                <a key={index} href="#" className="text-gray-400 hover:text-gold-500 transition-colors">
                                    <Icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-white font-serif font-bold text-lg mb-4">Enlaces Rápidos</h3>
                        <ul className="space-y-2">
                            {['Inicio', 'Servicios', 'Blog', 'Contacto'].map((item) => (
                                <li key={item}>
                                    <Link to={item === 'Inicio' ? '/' : `/${item.toLowerCase()}`} className="text-sm hover:text-gold-500 transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-white font-serif font-bold text-lg mb-4">Áreas de Práctica</h3>
                        <ul className="space-y-2">
                            {['Derecho Civil', 'Inmobiliario', 'Migratorio', 'Familia', 'Comercial'].map((item) => (
                                <li key={item}>
                                    <Link to="/servicios" className="text-sm hover:text-gold-500 transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-serif font-bold text-lg mb-4">Contacto</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gold-500 flex-shrink-0" />
                                <span className="text-sm">Av. Winston Churchill esq. Andres Julio Aybar, Torre Acrópolis, Piso 12</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-gold-500 flex-shrink-0" />
                                <span className="text-sm">+1 (809) 555-1234</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-gold-500 flex-shrink-0" />
                                <span className="text-sm">info@tuabogadoenrd.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
                    <p>© {new Date().getFullYear()} TuAbogadoEnRD. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
