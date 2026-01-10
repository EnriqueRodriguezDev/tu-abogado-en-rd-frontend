import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Trash2, Image as ImageIcon, Loader2, Edit, X, Calendar, Type, FileText, ChevronDown, Sparkles, Globe } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const BlogManager = () => {
    interface BlogPost {
        id: string;
        created_at: string;
        title: string;
        content: string;
        // i18n
        title_en?: string;
        content_en?: string;
        category: string;
        image_url: string;
        slug: string;
        published: boolean;
    }

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    // English Fields
    const [titleEn, setTitleEn] = useState('');
    const [contentEn, setContentEn] = useState('');

    const [category, setCategory] = useState('Legal');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [activeTab, setActiveTab] = useState<'es' | 'en'>('es');
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        const { data } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setPosts(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const { data } = await supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (mounted) {
                if (data) setPosts(data);
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    // Clean up object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageUpload = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);

        if (uploadError) {
            alert('Error subiendo imagen: ' + uploadError.message);
            return null;
        }

        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImageFile(file);

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        } else {
            if (editingId) {
                // Determine what the original image was
                const currentPost = posts.find(p => p.id === editingId);
                setImagePreview(currentPost?.image_url || null);
            } else {
                setImagePreview(null);
            }
        }
    };

    const [aiLoading, setAiLoading] = useState<string | null>(null);

    const generateWithAI = useCallback(async (mode: string, context: string, currentContent?: string) => {
        setAiLoading(mode);
        try {
            const { data, error } = await supabase.functions.invoke('ai-assistant', {
                body: { mode, context, currentContent }
            });

            if (error) throw error;
            return data.result;
        } catch (err: unknown) {
            alert('Error IA: ' + (err as Error).message);
            return null;
        } finally {
            setAiLoading(null);
        }
    }, []);

    const handleAIContent = async () => {
        if (!title) return alert('Por favor escribe un título primero.');
        const generated = await generateWithAI('generate-blog-content', title);
        if (generated) setContent(generated);
    };

    const handleTranslate = useCallback(async (targetLang: 'es' | 'en') => {
        setTranslating(true);
        try {
            if (targetLang === 'en') {
                if (title && !titleEn) {
                    const res = await generateWithAI('translate-content', title);
                    if (res) setTitleEn(res);
                }
                if (content && !contentEn) {
                    const res = await generateWithAI('translate-content', content);
                    if (res) setContentEn(res);
                }
            } else {
                // Translate EN -> ES
                if (titleEn && !title) {
                    const res = await generateWithAI('translate-content', titleEn);
                    if (res) setTitle(res);
                }
                if (contentEn && !content) {
                    const res = await generateWithAI('translate-content', contentEn);
                    if (res) setContent(res);
                }
            }
        } catch (error) {
            console.error(error);
            alert('Error traduciendo contenido.');
        } finally {
            setTranslating(false);
        }
    }, [title, titleEn, content, contentEn, generateWithAI]);

    // Auto-trigger translation when switching tabs if content is missing
    useEffect(() => {
        if (activeTab === 'en') {
            if ((title && !titleEn) || (content && !contentEn)) {
                handleTranslate('en');
            }
        } else {
            // Switching to Spanish, if spanish is empty but english exists
            if ((titleEn && !title) || (contentEn && !content)) {
                handleTranslate('es');
            }
        }
    }, [activeTab, title, titleEn, content, contentEn, handleTranslate]);

    const handleAIImage = async () => {
        if (!title) return alert('Por favor escribe un título primero.');
        const prompt = await generateWithAI('generate-image-prompt', title);

        if (prompt) {
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=800&height=600&seed=${Math.random()}&model=flux`;
            setImagePreview(imageUrl);
            setImageFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        let finalTitleEn = titleEn;
        let finalContentEn = contentEn;

        // Ensure translation before save if missing
        if ((title && !titleEn) || (content && !contentEn)) {
            setTranslating(true);
            try {
                const promises = [];
                if (title && !titleEn) promises.push(generateWithAI('translate-content', title).then(res => { if (res) finalTitleEn = res; }));
                if (content && !contentEn) promises.push(generateWithAI('translate-content', content).then(res => { if (res) finalContentEn = res; }));
                await Promise.all(promises);
            } catch (e) {
                console.error("Auto-translation failed", e);
            } finally {
                setTranslating(false);
            }
        }

        let imageUrl = '';

        if (imageFile) {
            const url = await handleImageUpload(imageFile);
            if (url) imageUrl = url;
            else {
                setUploading(false); // Stop if upload failed
                return;
            }
        } else if (imagePreview && imagePreview.startsWith('http')) {
            // AI generated URL or existing URL - prioritizing AI which sets preview
            imageUrl = imagePreview;
        } else if (editingId) {
            // Keep existing image if no new file is selected and no AI url
            const existingPost = posts.find((p) => p.id === editingId);
            if (existingPost) imageUrl = existingPost.image_url;
        }

        const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const postData: Partial<BlogPost> = {
            title,
            slug,
            content,
            title_en: finalTitleEn,
            content_en: finalContentEn,
            category,
            published: true
        };

        if (imageUrl) postData.image_url = imageUrl;

        let error;
        let res;
        if (editingId) {
            res = await supabase.from('blog_posts').update(postData).eq('id', editingId);
            error = res.error;
        } else {
            res = await supabase.from('blog_posts').insert([postData]).select();
            error = res.error;
        }

        const targetId = editingId || (res.data && res.data[0]?.id);
        if (!error && targetId) {
            supabase.functions.invoke('send-newsletter', {
                body: { postId: targetId }
            });
        }

        if (error) {
            alert('Error al publicar: ' + error.message);
        } else {
            handleClose();
            fetchPosts();
        }
        setUploading(false);
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setTitleEn('');
        setContentEn('');
        setActiveTab('es');
        setCategory('Legal');
        setImageFile(null);
        setImagePreview(null);
        setEditingId(null);
    };

    const handleClose = () => {
        setShowForm(false);
        resetForm();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const startEdit = (post: BlogPost) => {
        setEditingId(post.id);
        setTitle(post.title);
        setContent(post.content || '');
        setTitleEn(post.title_en || '');
        setContentEn(post.content_en || '');
        setCategory(post.category);
        if (post.image_url) {
            setImagePreview(post.image_url);
        } else {
            setImagePreview(null);
        }
        setImageFile(null);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este artículo?')) return;
        await supabase.from('blog_posts').delete().eq('id', id);
        fetchPosts();
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'clean']
        ],
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-auto">
                    <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-gold-500">Gestión de Blog</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Crea, edita o elimina noticias y artículos legales.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full md:w-auto bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg order-last md:order-none h-12 md:h-auto"
                >
                    <Plus size={20} />
                    Crear Artículo
                </button>
            </div>

            {/* Mobile Card List (Visible on Mobile) */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold-500" size={32} /></div>
                ) : posts.map((post) => (
                    <div key={post.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 overflow-hidden flex flex-col mb-4">
                        {/* Image */}
                        <div className="h-48 bg-gray-100 dark:bg-navy-900 relative">
                            {post.image_url ? (
                                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-navy-700">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <div className="absolute top-3 left-3">
                                <span className="px-3 py-1 bg-navy-900/80 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wide border border-white/10">
                                    {post.category}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col gap-2">
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(post.created_at).toLocaleDateString()}
                            </div>
                            <h3 className="text-lg font-bold text-navy-900 dark:text-white leading-tight">{post.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                                {/* Strip HTML for summary */}
                                {post.content.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                            </p>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-5 pb-5 pt-0 flex gap-3">
                            <button
                                onClick={() => startEdit(post)}
                                className="flex-1 bg-navy-50 dark:bg-navy-700 text-navy-900 dark:text-white border border-navy-100 dark:border-navy-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-navy-100 dark:hover:bg-navy-600 transition-colors"
                            >
                                <Edit size={18} /> Editar
                            </button>
                            <button
                                onClick={() => handleDelete(post.id)}
                                className="w-14 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Posts Grid (Hidden on Mobile) */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="animate-spin text-gold-500" size={32} />
                    </div>
                ) : posts.map((post) => (
                    <article key={post.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 hover:shadow-md transition-all overflow-hidden group flex flex-col h-full relative">
                        {/* Actions Overlay */}
                        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => startEdit(post)} className="p-2 bg-white/90 dark:bg-navy-900/90 text-navy-900 dark:text-gold-500 rounded-lg hover:scale-110 transition-transform shadow-sm backdrop-blur-sm">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(post.id)} className="p-2 bg-white/90 dark:bg-navy-900/90 text-red-500 rounded-lg hover:scale-110 transition-transform shadow-sm backdrop-blur-sm">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="h-48 overflow-hidden relative bg-gray-100 dark:bg-navy-900">
                            {post.image_url ? (
                                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-navy-700">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <div className="absolute bottom-3 left-3">
                                <span className="px-3 py-1 bg-navy-900/80 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wide border border-white/10">
                                    {post.category}
                                </span>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(post.created_at).toLocaleDateString()}
                            </div>
                            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2 line-clamp-2 leading-tight">{post.title}</h3>
                            <div className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1 prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.content }} />
                        </div>
                    </article>
                ))}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200"
                    onClick={handleBackdropClick}
                >
                    <div className="bg-white dark:bg-navy-900 w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-navy-700" onClick={e => e.stopPropagation()}>

                        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-navy-800 flex justify-between items-center bg-gray-50 dark:bg-navy-900 flex-none pt-[env(safe-area-inset-top)] md:pt-6">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-navy-900 dark:text-gold-500">
                                    {editingId ? 'Editar Artículo' : 'Nuevo Artículo'}
                                </h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Comparte conocimiento legal.</p>
                            </div>

                            <div className="flex bg-gray-100 dark:bg-navy-800 rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab('es')}
                                    type="button"
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'es' ? 'bg-white dark:bg-navy-700 text-navy-900 dark:text-gold-500 shadow-sm' : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'}`}
                                >
                                    Español
                                </button>
                                <button
                                    onClick={() => setActiveTab('en')}
                                    type="button"
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'en' ? 'bg-white dark:bg-navy-700 text-navy-900 dark:text-gold-500 shadow-sm' : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'}`}
                                >
                                    English
                                    {translating && <Loader2 size={12} className="animate-spin" />}
                                </button>
                            </div>

                            <button onClick={handleClose} type="button" className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-navy-900 p-4 md:p-8">
                            <form id="blog-form" onSubmit={handleSubmit} className="space-y-6">
                                {activeTab === 'es' ? (
                                    <>
                                        <div>
                                            <label className="text-sm font-bold text-navy-900 dark:text-gold-500 mb-2 flex items-center gap-2">
                                                <Type size={16} /> Título del Artículo
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Entendiendo la Ley de Propiedad en RD"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-navy-800 border border-transparent dark:border-navy-700 rounded-xl p-4 text-lg font-bold text-navy-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-navy-900 dark:text-gold-500 mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <ImageIcon size={16} /> Imagen Destacada
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAIImage}
                                                    disabled={!!aiLoading}
                                                    className="text-xs font-bold text-navy-900 bg-gold-500/20 hover:bg-gold-500/40 dark:text-gold-500 dark:bg-navy-700 dark:hover:bg-navy-600 rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    {aiLoading === 'generate-image-prompt' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                    Generar con IA
                                                </button>
                                            </label>

                                            <div className="border-2 border-dashed border-gray-200 dark:border-navy-700 rounded-2xl h-56 relative overflow-hidden group hover:border-gold-500 dark:hover:border-gold-500 transition-colors bg-gray-50 dark:bg-navy-800">
                                                {imagePreview ? (
                                                    <div className="w-full h-full relative">
                                                        <img src={imagePreview} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">Cambiar Imagen</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-navy-500">
                                                        <div className="w-14 h-14 bg-white dark:bg-navy-700 rounded-full flex items-center justify-center shadow-lg mb-3 text-gold-500">
                                                            <ImageIcon size={28} />
                                                        </div>
                                                        <span className="text-sm font-bold text-navy-900 dark:text-white">Subir Imagen</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    onChange={handleImageSelect}
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    accept="image/*"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-bold text-navy-900 dark:text-gold-500 mb-2 block">Categoría</label>
                                                <div className="relative">
                                                    <select
                                                        value={category}
                                                        onChange={(e) => setCategory(e.target.value)}
                                                        className="w-full bg-gray-50 dark:bg-navy-800 border border-transparent dark:border-navy-700 rounded-xl p-3 appearance-none focus:ring-2 focus:ring-gold-500 outline-none text-navy-900 dark:text-white"
                                                    >
                                                        <option>Legal</option>
                                                        <option>Noticias</option>
                                                        <option>Consejos</option>
                                                        <option>Corporativo</option>
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                        <ChevronDown size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-navy-900 dark:text-gold-500 mb-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} /> Contenido
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAIContent}
                                                    disabled={!!aiLoading}
                                                    className="text-xs font-bold text-navy-900 bg-gold-500/20 hover:bg-gold-500/40 dark:text-gold-500 dark:bg-navy-700 dark:hover:bg-navy-600 rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    {aiLoading === 'generate-blog-content' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                    Redactar con IA
                                                </button>
                                            </label>
                                            <div className="h-80 md:h-96 mb-12">
                                                <ReactQuill
                                                    theme="snow"
                                                    value={content}
                                                    onChange={setContent}
                                                    modules={modules}
                                                    className="h-full bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* ENGLISH TAB */
                                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-2 flex items-start gap-3">
                                            <Globe className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                                            <div className="text-xs text-blue-700 dark:text-blue-300">
                                                <p className="font-bold mb-1">English Translation</p>
                                                <p>This will be generated automatically when you save if left empty. Or switch tabs to auto-trigger.</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-navy-900 dark:text-gold-500 mb-2 flex items-center justify-between">
                                                <span className="flex items-center gap-2"><Type size={16} /> Article Title (EN)</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTranslate('en')}
                                                    disabled={translating}
                                                    className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all disabled:opacity-50"
                                                >
                                                    {translating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                    Traducir Ahora
                                                </button>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g: Understanding Property Law"
                                                value={titleEn}
                                                onChange={(e) => setTitleEn(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-navy-800 border border-transparent dark:border-navy-700 rounded-xl p-4 text-lg font-bold text-navy-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-navy-900 dark:text-gold-500 mb-2 flex items-center gap-2">
                                                <FileText size={16} /> Content (EN)
                                            </label>
                                            <div className="h-80 md:h-96 mb-12 bg-white dark:bg-navy-800 text-navy-900 dark:text-white rounded-xl">
                                                <ReactQuill
                                                    theme="snow"
                                                    value={contentEn}
                                                    onChange={setContentEn}
                                                    modules={modules}
                                                    className="h-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-4 md:p-6 border-t border-gray-100 dark:border-navy-800 bg-gray-50 dark:bg-navy-900 flex gap-3 flex-none pb-[env(safe-area-inset-bottom)]">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-6 py-3.5 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors border border-gray-200 dark:border-navy-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="blog-form"
                                disabled={uploading}
                                className="flex-1 bg-gold-500 text-navy-900 px-8 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {uploading || translating ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        {translating ? 'Traduciendo...' : (editingId ? 'Guardar Cambios' : 'Publicar')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogManager;
