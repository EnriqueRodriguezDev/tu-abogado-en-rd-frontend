import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Trash2, Edit, Image as ImageIcon, Loader2, Sparkles, Save, Globe } from 'lucide-react';
import { BaseModal, ConfirmDialog } from '../../components/ui/Modal';

interface Utility {
    id: string;
    created_at: string;
    title: string;
    description: string;
    image_url: string;
    is_active: boolean;
    title_en: string;
    description_en: string;
    link_url?: string;
    link_text?: string;
}

const UtilitiesManager = () => {
    const [utilities, setUtilities] = useState<Utility[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [titleEn, setTitleEn] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');

    const [formImage, setFormImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [translating, setTranslating] = useState(false);

    const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    useEffect(() => {
        fetchUtilities();
    }, []);

    useEffect(() => {
        if (formImage) {
            const objectUrl = URL.createObjectURL(formImage);
            setImagePreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [formImage]);

    const fetchUtilities = async () => {
        const { data, error } = await supabase
            .from('utilities')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching utilities:', error);
        if (data) setUtilities(data as Utility[]);
        setLoading(false);
    };

    const handleImageUpload = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('utilities-images').upload(fileName, file);

        if (uploadError) {
            alert('Error subiendo imagen: ' + uploadError.message);
            return null;
        }

        const { data } = supabase.storage.from('utilities-images').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const handleDelete = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Eliminar Utilidad',
            message: '¿Seguro que deseas eliminar esta utilidad? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                await supabase.from('utilities').delete().eq('id', id);
                fetchUtilities();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleTranslate = async () => {
        if (!title || !description) return alert('Ingrese título y descripción en español primero.');

        setTranslating(true);
        try {
            const { data, error } = await supabase.functions.invoke('ai-assistant', {
                body: {
                    mode: 'translate',
                    content: { title, description },
                    targetLang: 'en'
                }
            });

            if (error) throw error;

            if (data.result) {
                // Assuming result is the object { title: '...', description: '...' }
                if (data.result.title) setTitleEn(data.result.title);
                if (data.result.description) setDescriptionEn(data.result.description);
            }

        } catch (error) {
            console.error(error);
            alert('Error traduciendo contenido.');
        } finally {
            setTranslating(false);
        }
    };

    const handleSave = async () => {
        if (!title) return alert('El título es requerido.');

        setUploading(true);
        let imageUrl = '';

        if (formImage) {
            const url = await handleImageUpload(formImage);
            if (url) imageUrl = url;
            else {
                setUploading(false);
                return;
            }
        } else if (imagePreview && imagePreview.startsWith('http')) {
            imageUrl = imagePreview;
        } else if (editingId) {
            const existing = utilities.find(u => u.id === editingId);
            if (existing) imageUrl = existing.image_url || '';
        }

        const utilityData = {
            title,
            description,
            title_en: titleEn,
            description_en: descriptionEn,
            image_url: imageUrl,
            is_active: true,
            link_url: linkUrl,
            link_text: linkText
        };

        let error;

        if (editingId) {
            const { error: updateError } = await supabase.from('utilities').update(utilityData).eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('utilities').insert([utilityData]);
            error = insertError;
        }

        setUploading(false);

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            handleClose();
            fetchUtilities();
        }
    };

    const startEdit = (item: Utility) => {
        setEditingId(item.id);
        setTitle(item.title);
        setDescription(item.description || '');
        setTitleEn(item.title_en || '');
        setDescriptionEn(item.description_en || '');
        setLinkUrl(item.link_url || '');
        setLinkText(item.link_text || '');
        setImagePreview(item.image_url || null);
        setFormImage(null);
        setIsCreating(true);
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setTitle('');
        setDescription('');
        setTitleEn('');
        setDescriptionEn('');
        setLinkUrl('');
        setLinkText('');
        setFormImage(null);
        setImagePreview(null);
        setUploading(false);
    };

    const handleClose = () => {
        resetForm();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-gold-500">Gestión de Utilidades</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Administre las herramientas y utilidades visibles para sus clientes.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                >
                    <Plus size={20} />
                    Nueva Utilidad
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-gold-500" /></div>
                ) : utilities.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-navy-800 rounded-2xl p-6 shadow-sm border-l-4 border-navy-900 dark:border-gold-500 hover:shadow-md transition-all flex flex-col h-full group">
                        <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-navy-900">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon size={40} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button onClick={() => startEdit(item)} className="p-2 bg-white text-navy-900 rounded-full hover:bg-gold-500 transition-colors">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1">
                            <div>
                                <h4 className="text-xl font-bold text-navy-900 dark:text-white leading-tight">{item.title}</h4>
                                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mt-1">
                                    {item.description}
                                </p>
                            </div>

                            {(item.title_en || item.description_en) && (
                                <div className="pt-3 border-t border-gray-100 dark:border-navy-700">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-navy-700 text-gray-500 uppercase mb-1">
                                        <Globe size={10} /> English
                                    </span>
                                    <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.title_en || 'Untranslated Title'}</h5>
                                    <p className="text-gray-400 dark:text-gray-500 text-xs line-clamp-2">
                                        {item.description_en || 'No description translated.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {item.link_url && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-navy-700 flex justify-end">
                                <a
                                    href={item.link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-navy-900 dark:text-gold-500 flex items-center gap-1 hover:underline"
                                >
                                    {item.link_text || 'Ver Enlace'} <Globe size={12} />
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            <BaseModal
                isOpen={isCreating || !!editingId}
                onClose={handleClose}
                title={isCreating && !editingId ? 'Nueva Utilidad' : 'Editar Utilidad'}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button
                            onClick={handleClose}
                            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={uploading || translating}
                            className="px-6 py-3 rounded-xl bg-gold-500 text-navy-900 font-bold hover:bg-gold-600 shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                        >
                            {uploading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Guardar</>}
                        </button>
                    </>
                }
            >
                <div className="space-y-8">
                    {/* Image Upload */}
                    <div className="border-2 border-dashed border-gray-200 dark:border-navy-700 rounded-2xl h-48 flex flex-col items-center justify-center text-gray-400 dark:text-navy-600 bg-gray-50 dark:bg-navy-800 hover:border-gold-500 transition-colors cursor-pointer relative group overflow-hidden">
                        {imagePreview ? (
                            <div className="w-full h-full relative">
                                <img src={imagePreview} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">Cambiar Imagen</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <ImageIcon size={32} className="mb-2" />
                                <span className="text-sm font-semibold">Arrastra una imagen o haz click</span>
                            </>
                        )}
                        <input
                            type="file"
                            onChange={(e) => setFormImage(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            accept="image/*"
                        />
                    </div>

                    <div className="space-y-8">
                        {/* Group 1: Información Principal (Español) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-navy-900 dark:text-gold-500 font-bold border-b border-gray-200 dark:border-navy-700 pb-2">
                                <span className="text-lg">Información Principal (Español)</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-navy-900 dark:text-white">Título</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none font-medium"
                                        placeholder="Ej: Calculadora de Prestaciones"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-navy-900 dark:text-white">Descripción</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none resize-none"
                                        placeholder="Descripción corta de la utilidad..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Group 2: Traducción (English) */}
                        <div className="space-y-4 bg-gray-50 dark:bg-navy-900/50 p-4 rounded-xl border border-gray-100 dark:border-navy-800">
                            <div className="flex items-center justify-between text-navy-900 dark:text-gold-500 font-bold border-b border-gray-200 dark:border-navy-700 pb-2">
                                <span className="text-lg flex items-center gap-2"><Globe size={18} /> Traducción (English)</span>
                                <button
                                    onClick={handleTranslate}
                                    disabled={translating}
                                    className="text-xs bg-white dark:bg-navy-800 text-navy-900 border border-gray-200 dark:border-navy-700 font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                >
                                    {translating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                    Traducir con IA
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-navy-900 dark:text-white">Title (EN)</label>
                                    <input
                                        type="text"
                                        value={titleEn}
                                        onChange={(e) => setTitleEn(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none"
                                        placeholder="e.g. Benefits Calculator"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-navy-900 dark:text-white">Description (EN)</label>
                                    <textarea
                                        value={descriptionEn}
                                        onChange={(e) => setDescriptionEn(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none resize-none"
                                        placeholder="Short description in English..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Group 3: Configuración (Enlaces) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-navy-900 dark:text-gold-500 font-bold border-b border-gray-200 dark:border-navy-700 pb-2">
                                <span className="text-lg">Configuración del Enlace</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400">URL Destino</label>
                                    <input
                                        type="text"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none text-sm font-mono"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400">Texto del Botón</label>
                                    <input
                                        type="text"
                                        value={linkText}
                                        onChange={(e) => setLinkText(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none text-sm"
                                        placeholder="Ej: Ir a la Calculadora"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </BaseModal>

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default UtilitiesManager;
