import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Scale, Video, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { t } = useTranslation();

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const navigation = [
        { name: 'Inicio', href: '/', key: 'home' },
        { name: 'Nosotros', href: '/about', key: 'about' },
        { name: 'Servicios', href: '/services', key: 'services' },
        { name: 'Utilidades', href: '/utilities', key: 'utilities' },
        { name: 'Blog', href: '/blog', key: 'blog' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-navy-900 text-white shadow-lg sticky top-0 z-50 pt-safe transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2" onClick={() => setIsOpen(false)}>
                            <Scale className="h-8 w-8 text-gold-500" />
                            <div className="flex flex-col">
                                <span className="font-serif text-xl font-bold tracking-wide leading-none">TuAbogadoEnRD</span>
                                <span className="text-[10px] text-gray-300 uppercase tracking-wider">Asesoría Legal Dominicana</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`${isActive(item.href) ? 'text-gold-500' : 'text-gray-300 hover:text-white'
                                    } px-3 py-2 text-sm font-medium transition-colors duration-200`}
                            >
                                {t(`nav.${item.key}`)}
                            </Link>
                        ))}

                        <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
                            <ThemeToggle />
                            <LanguageSwitcher />
                        </div>

                        <Link
                            to="/booking"
                            className="bg-gold-500 text-white px-5 py-2.5 rounded-md font-bold hover:bg-gold-600 flex items-center gap-2 transition-transform active:scale-95 shadow-lg"
                        >
                            <Video size={18} />
                            {t('nav.videoCons')}
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center gap-4 md:hidden">
                        <button
                            onClick={() => setIsOpen(true)}
                            className="inline-flex items-center justify-center p-2 rounded-full text-gold-500 hover:bg-white/10 focus:outline-none min-h-[44px] min-w-[44px]"
                            aria-label="Open menu"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer (Overlay) */}
            <div
                className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />

                {/* Drawer Panel */}
                <div
                    className={`absolute top-0 right-0 w-[80%] max-w-sm h-[100dvh] bg-navy-900 shadow-2xl transform transition-transform duration-300 ease-out border-l border-white/10 flex flex-col pt-safe pb-safe ${isOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <span className="font-serif text-lg font-bold text-gold-500">Menú</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 -mr-2 text-gray-400 hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                        {/* Navigation Links */}
                        <div className="space-y-2">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`${isActive(item.href)
                                        ? 'text-gold-500 bg-white/5'
                                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                                        } group flex items-center justify-between px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 min-h-[50px]`}
                                >
                                    {t(`nav.${item.key}`)}
                                    <ArrowRight size={16} className={`opacity-0 -translate-x-2 transition-all duration-200 ${isActive(item.href) ? 'opacity-100 translate-x-0' : 'group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                </Link>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between text-gray-300">
                                <span className="text-sm font-medium">Configuración</span>
                                <div className="flex items-center gap-3">
                                    <ThemeToggle />
                                    <LanguageSwitcher />
                                </div>
                            </div>

                            <Link
                                to="/booking"
                                onClick={() => setIsOpen(false)}
                                className="w-full bg-gold-500 text-white px-4 py-4 rounded-xl font-bold hover:bg-gold-600 flex items-center justify-center gap-2 shadow-lg min-h-[50px]"
                            >
                                <Video size={20} />
                                {t('nav.videoCons')}
                            </Link>
                        </div>
                    </div>

                    {/* Drawer Footer */}
                    <div className="p-6 text-center text-xs text-gray-500 border-t border-white/10">
                        &copy; 2024 TuAbogadoEnRD
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
