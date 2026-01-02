import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Users, Plus, Edit2, Trash2, Camera, Mail, Phone, Clock, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import type { Lawyer } from '../../types';

const LawyersManager = () => {
    const [lawyers, setLawyers] = useState<Lawyer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Lawyer>>({
        name: '',
        email: '',
        phone: '',
        specialties: '',
        reminder_minutes_before: 20,
        is_active: true,
        image_url: undefined
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchLawyers();
    }, []);

    const fetchLawyers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('lawyers')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setLawyers(data);
        if (error) console.error("Error fetching lawyers:", error);
        setLoading(false);
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) return;
            setUploading(true);

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `lawyer_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: data.publicUrl });
        } catch (error: any) {
            alert('Error subiendo imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingId) {
                const { error } = await supabase.from('lawyers').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('lawyers').insert([payload]);
                if (error) throw error;
            }
            setShowModal(false);
            fetchLawyers();
            resetForm();
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este abogado?")) return;
        const { error } = await supabase.from('lawyers').delete().eq('id', id);
        if (error) alert("Error al eliminar");
        else fetchLawyers();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            specialties: '',
            reminder_minutes_before: 20,
            is_active: true,
            image_url: undefined
        });
        setEditingId(null);
    };

    const handleEdit = (lawyer: Lawyer) => {
        setFormData(lawyer);
        setEditingId(lawyer.id);
        setShowModal(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif font-bold text-navy-900 flex items-center gap-3">
                    <Users className="text-gold-500" /> Equipo Legal
                </h1>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-navy-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-navy-800 flex items-center gap-2 shadow-lg transition-all"
                >
                    <Plus size={20} /> Agregar Abogado
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-gold-500" size={32} /></div>
                ) : lawyers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400">No hay abogados registrados.</div>
                ) : (
                    lawyers.map(lawyer => (
                        <div key={lawyer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-navy-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-all group-hover:bg-gold-50"></div>

                            <div className="relative z-10">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                                        {lawyer.image_url ? (
                                            <img src={lawyer.image_url} alt={lawyer.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-navy-900 text-white font-bold text-xl">
                                                {lawyer.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-navy-900 leading-tight mb-1">{lawyer.name}</h3>
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${lawyer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {lawyer.is_active ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                            {lawyer.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-6">
                                    <div className="flex items-center gap-2"><Mail size={14} className="text-gold-500" /> {lawyer.email}</div>
                                    <div className="flex items-center gap-2"><Phone size={14} className="text-gold-500" /> {lawyer.phone}</div>
                                    <div className="flex items-start gap-2">
                                        <div className="mt-0.5"><Clock size={14} className="text-gold-500" /></div>
                                        <span className="line-clamp-2">{lawyer.specialties || 'Sin especialidades'}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                                    <button onClick={() => handleEdit(lawyer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(lawyer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-navy-900">{editingId ? 'Editar Abogado' : 'Nuevo Abogado'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Photo Upload */}
                            <div className="flex justify-center mb-6">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-gold-500 transition-colors">
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="text-gray-400 group-hover:text-gold-500" size={32} />
                                        )}
                                    </div>
                                    <input type="file" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                    {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin text-gold-500" /></div>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-gold-500 outline-none" placeholder="Lic. Juan Pérez" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-gold-500 outline-none" placeholder="juan@bufete.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                                    <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-gold-500 outline-none" placeholder="(809) 555-0101" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Recordatorio (min)</label>
                                    <input type="number" required value={formData.reminder_minutes_before} onChange={e => setFormData({ ...formData, reminder_minutes_before: parseInt(e.target.value) })} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-gold-500 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Áreas de Práctica / Especialidades</label>
                                <textarea required value={formData.specialties} onChange={e => setFormData({ ...formData, specialties: e.target.value })} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-gold-500 outline-none" rows={3} placeholder="Divorcios, Herencias, Derecho Corporativo..." />
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                                <div className={`w-10 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${formData.is_active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                                <span className="font-bold text-sm text-gray-700">Abogado Activo</span>
                            </div>

                            <button type="submit" disabled={saving || uploading} className="w-full bg-gold-500 text-navy-900 py-4 rounded-xl font-bold hover:bg-gold-400 transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                                {saving ? <Loader2 className="animate-spin" /> : (editingId ? 'Actualizar Abogado' : 'Guardar Abogado')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LawyersManager;
