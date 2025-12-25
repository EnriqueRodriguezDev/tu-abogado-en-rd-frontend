import { Search, ChevronRight, Calendar, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog = () => {
    const articles = [
        {
            id: 1,
            title: '¿Cómo hacer una declaración de herederos en RD?',
            excerpt: 'Guía completa sobre qué es, los plazos legales, documentos necesarios y dónde tramitar este importante proceso sucesoral.',
            date: '20 Oct, 2024',
            category: 'Derecho Civil',
            author: 'Lic. Carlos Rodriguez',
            color: 'bg-green-100',
        },
        {
            id: 2,
            title: 'Requisitos para solicitar el divorcio en República Dominicana',
            excerpt: 'Todo lo que necesitas saber sobre las causales, el proceso de mutuo consentimiento y los tiempos estimados de resolución.',
            date: '18 Oct, 2024',
            category: 'Derecho de Familia',
            author: 'Lic. Ana Perez',
            color: 'bg-blue-100',
        },
        {
            id: 3,
            title: 'Guía para obtener la residencia dominicana',
            excerpt: 'Pasos detallados para extranjeros que desean regularizar su estatus migratorio en el país por razones laborales o de retiro.',
            date: '15 Oct, 2024',
            category: 'Migración',
            author: 'Lic. Miguel Diaz',
            color: 'bg-orange-100',
        },
        {
            id: 4,
            title: '10 pasos para comprar un apartamento en RD',
            excerpt: 'Evita estafas y asegura tu inversión con esta lista de verificación legal antes de firmar cualquier contrato de promesa de venta.',
            date: '10 Oct, 2024',
            category: 'Inmobiliario',
            author: 'Lic. Carlos Rodriguez',
            color: 'bg-purple-100',
        }
    ];

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="bg-navy-900 text-white py-20 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-6">Blog Jurídico</h1>
                    <p className="text-gray-300 max-w-2xl mx-auto px-4 mb-8">
                        Información legal clara y actualizada para dominicanos, la diáspora y extranjeros.
                    </p>

                    <div className="max-w-xl mx-auto px-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Busca un tema legal..."
                                className="w-full py-3 pl-12 pr-4 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-500 shadow-xl"
                            />
                            <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Main Content */}
                    <div className="lg:w-2/3">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-serif font-bold text-navy-900">Artículos Recientes</h2>
                            <button className="text-gold-600 text-sm font-semibold hover:text-gold-700">VER TODOS</button>
                        </div>

                        <div className="grid gap-8">
                            {articles.map((article) => (
                                <article key={article.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row">
                                    <div className={`sm:w-1/3 min-h-[200px] ${article.color}`}>
                                        {/* Placeholder for image */}
                                    </div>
                                    <div className="p-6 sm:w-2/3 flex flex-col justify-center">
                                        <div className="flex items-center gap-3 text-xs font-semibold text-gold-600 mb-2 uppercase tracking-wide">
                                            <span>{article.category}</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.date}</span>
                                        </div>
                                        <h3 className="text-xl font-serif font-bold text-navy-900 mb-3 hover:text-gold-600 transition-colors cursor-pointer">
                                            {article.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{article.excerpt}</p>
                                        <Link to="#" className="inline-flex items-center text-gold-600 font-medium text-sm hover:text-gold-700">
                                            Leer más <ChevronRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:w-1/3 space-y-8">
                        {/* Categories Widget */}
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="border-l-4 border-gold-500 pl-3 mb-6">
                                <h3 className="font-serif font-bold text-lg text-navy-900">Categorías</h3>
                            </div>
                            <ul className="space-y-3">
                                {['Derecho Civil', 'Inmobiliario', 'Migración', 'Familia', 'Laboral', 'Comercial'].map(cat => (
                                    <li key={cat} className="flex justify-between items-center group cursor-pointer text-gray-600 hover:text-gold-600">
                                        <span>{cat}</span>
                                        <span className="bg-gray-100 group-hover:bg-gold-100 group-hover:text-gold-700 px-2 py-1 rounded-full text-xs transition-colors">
                                            {Math.floor(Math.random() * 12) + 1}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Newsletter Widget */}
                        <div className="bg-navy-50 p-6 rounded-xl border border-navy-100 text-center">
                            <Mail className="w-10 h-10 text-gold-500 mx-auto mb-4" />
                            <h3 className="font-serif font-bold text-lg text-navy-900 mb-2">Suscríbete al boletín</h3>
                            <p className="text-sm text-gray-600 mb-4">Recibe nuestras últimas noticias y artículos legales directamente en tu email.</p>
                            <input type="email" placeholder="correo@ejemplo.com" className="w-full px-4 py-2 rounded-md border border-gray-300 mb-3 text-sm" />
                            <button className="w-full btn-primary text-sm py-2">Suscribirse</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Blog;
