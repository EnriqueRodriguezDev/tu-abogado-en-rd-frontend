import { Scale, Facebook, Instagram, Linkedin, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const Footer = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'existing'>('idle');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');

        // Call Edge Function
        const { data, error } = await supabase.functions.invoke('subscribe', {
            body: { email }
        });

        if (error) {
            console.error('Error subscribing:', error);
            return;
        }

        if (data?.message === 'Already subscribed') {
            setStatus('existing');
            setTimeout(() => setStatus('idle'), 3000);
            return;
        }

        setStatus('success');
        setEmail('');
        setTimeout(() => setStatus('idle'), 3000);
    };

    return (
        <footer className="bg-navy-900 text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <Scale className="text-gold-500 w-8 h-8" />
                            <span className="text-2xl font-serif font-bold tracking-tight">TuAbogadoEnRD</span>
                        </div>
                        <p className="text-gray-400 mb-8 max-w-sm leading-relaxed">
                            Soluciones legales expertas con un enfoque moderno. Protegiendo tus intereses con integridad y excelencia profesional.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="p-2 bg-navy-800 rounded-full hover:bg-gold-500 hover:text-navy-900 transition-all duration-300">
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-serif font-bold text-lg mb-6 text-gold-500">Enlaces Rápidos</h3>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link to="/booking" className="hover:text-white transition-colors">Videoconsultas</Link></li>
                            <li><Link to="/utilities" className="hover:text-white transition-colors">Utilidades</Link></li>
                            <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="font-serif font-bold text-lg mb-6 text-gold-500">Boletín Legal</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Suscríbete para recibir actualizaciones y consejos legales mensualmente.
                        </p>
                        <form onSubmit={handleSubscribe} className="relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                className="w-full bg-navy-800 border border-navy-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-gold-500 outline-none transition-all text-sm"
                            />
                            <button
                                type="submit"
                                disabled={status === 'loading' || status === 'success' || status === 'existing'}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gold-500 text-navy-900 rounded-md hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>
                        </form>
                        {status === 'success' && (
                            <div className="absolute top-full mt-2 w-full bg-green-500/10 border border-green-500 text-green-400 px-4 py-2 rounded-md text-xs font-medium animate-fade-in-up backdrop-blur-sm">
                                ¡Suscrito correctamente! Revisa tu correo.
                            </div>
                        )}
                        {status === 'existing' && (
                            <div className="absolute top-full mt-2 w-full bg-gold-500/10 border border-gold-500 text-gold-500 px-4 py-2 rounded-md text-xs font-medium animate-fade-in-up backdrop-blur-sm flex items-center gap-2">
                                <span className="text-lg">⚠️</span>
                                Este correo ya está suscrito a nuestro boletín.
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-navy-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                    <p>© 2024 TuAbogadoEnRD. Todos los derechos reservados.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacidad</Link>
                        <Link to="/legal/terms" className="hover:text-white transition-colors">Términos</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
