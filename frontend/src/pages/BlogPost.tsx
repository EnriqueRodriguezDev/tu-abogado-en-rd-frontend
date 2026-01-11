import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Calendar, ArrowLeft, Clock, Tag, Loader2, Facebook, Linkedin, Mail, CheckCircle } from 'lucide-react';
import BlogSubscribe from '../components/blog/BlogSubscribe';
import { useLocalizedContent } from '../hooks/useLocalizedContent';
import { type BlogPost as BlogPostType } from '../types';

const BlogPost = () => {
    const { slug } = useParams();
    const [post, setPost] = useState<BlogPostType | null>(null);
    const [loading, setLoading] = useState(true);
    const { getLocalizedField } = useLocalizedContent<BlogPostType>();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Definir la función DENTRO del efecto para evitar problemas de dependencias y estado
        const fetchPost = async () => {
            if (!slug) return;
            setLoading(true);

            // Try fetching by slug first
            let { data } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('slug', slug)
                .single();

            // Fallback: try by ID if slug fails
            if (!data) {
                const { data: byId } = await supabase
                    .from('blog_posts')
                    .select('*')
                    .eq('id', slug)
                    .single();
                data = byId;
            }

            if (data) setPost(data);
            setLoading(false);
        };

        fetchPost();
    }, [slug]); // Solo depende de slug

    const handleShare = (platform: 'whatsapp' | 'facebook' | 'linkedin' | 'email' | 'instagram') => {
        if (!post) return;
        const url = window.location.href;
        const title = getLocalizedField(post, 'title');

        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(title + '\n\n' + url)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'email':
                window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Check this out: ' + url)}`, '_self');
                break;
            case 'instagram':
                // Instagram doesn't have a direct web share link for posts, so we copy link
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
                break;
        }
    };

    const sanitizeHTML = (html: string) => {
        // Strict Regex Stripper for risky tags
        // Removes <script>, <iframe>, <object>, <embed>, <form>, <input>, <button> and on* attributes
        return html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "")
            .replace(/<object\b[^>]*>([\s\S]*?)<\/object>/gim, "")
            .replace(/<embed\b[^>]*>([\s\S]*?)<\/embed>/gim, "")
            .replace(/<form\b[^>]*>([\s\S]*?)<\/form>/gim, "")
            .replace(/on\w+="[^"]*"/gim, "") // Remove onEvent handlers
            .replace(/javascript:/gim, ""); // Remove javascript: protocol
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
            <Loader2 className="animate-spin text-gold-500 w-12 h-12" />
        </div>
    );

    if (!post) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white">
            <h1 className="text-4xl font-serif font-bold mb-4">Artículo no encontrado</h1>
            <Link to="/blog" className="text-gold-500 hover:underline">Volver al Blog</Link>
        </div>
    );

    return (
        <div className="bg-slate-50 dark:bg-navy-900 min-h-screen font-sans transition-colors duration-300 pb-20">
            {/* Minimal Header for Navigation */}
            <div className="bg-navy-900 text-white py-6">
                <div className="max-w-4xl mx-auto px-4">
                    <Link to="/blog" className="inline-flex items-center gap-2 text-gray-300 hover:text-gold-500 transition-colors">
                        <ArrowLeft size={20} /> Volver al Blog
                    </Link>
                </div>
            </div>

            {/* Hero Image */}
            <div className="w-full h-[400px] relative">
                <img
                    src={post.image_url || 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80'}
                    alt={getLocalizedField(post, 'title')}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/40 to-transparent"></div>

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
                    <div className="max-w-4xl mx-auto">
                        <span className="inline-block px-4 py-1.5 bg-gold-500 text-navy-900 font-bold rounded-full text-sm mb-4 uppercase tracking-wider">
                            {post.category}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                            {getLocalizedField(post, 'title')}
                        </h1>
                        <div className="flex flex-wrap gap-6 text-gray-300 text-sm md:text-base">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-gold-500" />
                                {new Date(post.created_at).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-gold-500" />
                                5 min de lectura
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
                <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-8 md:p-12 text-lg text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-navy-700">

                    {/* Content */}
                    <article className="prose prose-lg dark:prose-invert max-w-none">
                        <div
                            className="font-serif leading-loose text-justify [&>p]:mb-6 [&>ul]:list-disc [&>ul]:pl-5 [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:mt-8 [&>h3]:mb-4 [&>h3]:text-navy-900 [&>h3]:dark:text-white"
                            dangerouslySetInnerHTML={{ __html: sanitizeHTML(getLocalizedField(post, 'content')) }}
                        />
                    </article>

                    {/* Tags & Share */}
                    <div className="mt-12 pt-8 border-t border-gray-100 dark:border-navy-700 flex flex-col items-start gap-8">

                        {/* Tags */}
                        <div className="flex gap-3 flex-wrap">
                            {['Legal', 'RD', 'Actualidad'].map(tag => (
                                <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-navy-900 text-gray-600 dark:text-gray-400 rounded-lg text-sm">
                                    <Tag size={14} /> {tag}
                                </span>
                            ))}
                        </div>

                        {/* Social Share Buttons */}
                        <div className="w-full">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Compartir Artículo</h4>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => handleShare('whatsapp')} title="Compartir en WhatsApp" className="p-3 rounded-full bg-[#25D366] text-white hover:opacity-90 transition-all hover:-translate-y-1 shadow-sm">
                                    {/* Custom WhatsApp Icon for fidelity */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                </button>
                                <button onClick={() => handleShare('facebook')} title="Compartir en Facebook" className="p-3 rounded-full bg-[#1877F2] text-white hover:opacity-90 transition-all hover:-translate-y-1 shadow-sm">
                                    <Facebook size={20} />
                                </button>
                                <button onClick={() => handleShare('linkedin')} title="Compartir en LinkedIn" className="p-3 rounded-full bg-[#0A66C2] text-white hover:opacity-90 transition-all hover:-translate-y-1 shadow-sm">
                                    <Linkedin size={20} />
                                </button>
                                <button onClick={() => handleShare('email')} title="Compartir por Correo" className="p-3 rounded-full bg-gray-600 text-white hover:opacity-90 transition-all hover:-translate-y-1 shadow-sm">
                                    <Mail size={20} />
                                </button>
                                <button onClick={() => handleShare('instagram')} title="Copiar enlace (Instagram)" className="relative p-3 rounded-full bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4] text-white hover:opacity-90 transition-all hover:-translate-y-1 shadow-sm group">
                                    {copied ? <CheckCircle size={20} /> : <div className="p-[1px]"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></div>}
                                    {/* Tooltip for copy */}
                                    {copied && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                                            Enlace copiado
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Newsletter Box */}
                <div className="mt-12">
                    <BlogSubscribe />
                </div>
            </main>
        </div>
    );
};

export default BlogPost;