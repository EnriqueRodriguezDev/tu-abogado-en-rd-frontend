import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FileText, Plus, AlertTriangle, AlertCircle, CheckCircle, Trash2, Edit2, Loader2, X } from 'lucide-react';
import type { TaxSequence } from '../../types';
import { Tooltip } from '../../components/ui/Tooltip';

const NCFManager = () => {
    const [sequences, setSequences] = useState<TaxSequence[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<TaxSequence>>({
        prefix: 'B02', // Default to Consumer
        description: 'Consumidor Final',
        current_value: 1,
        end_value: 100,
        expiration_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        status: 'active'
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchSequences();
    }, []);

    const fetchSequences = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tax_sequences')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setSequences(data);
        if (error) console.error("Error fetching sequences:", error);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...formData };
            if (editingId) {
                const { error } = await supabase.from('tax_sequences').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('tax_sequences').insert([payload]);
                if (error) throw error;
            }
            setShowModal(false);
            fetchSequences();
            setFormData({
                prefix: 'B02',
                description: 'Consumidor Final',
                current_value: 1,
                end_value: 100,
                expiration_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                status: 'active'
            });
            setEditingId(null);
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (seq: TaxSequence) => {
        setFormData(seq);
        setEditingId(seq.id);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta secuencia?")) return;
        const { error } = await supabase.from('tax_sequences').delete().eq('id', id);
        if (error) alert("Error al eliminar");
        else fetchSequences();
    };

    const getHealthStatus = (seq: TaxSequence) => {
        // Condition 1: Exhausted
        if (seq.current_value >= seq.end_value) {
            return { color: 'bg-red-100 text-red-800 border border-red-200', icon: AlertCircle, label: 'AGOTADO' };
        }

        // Condition 2: Warning (>= 90%)
        const usage = (seq.current_value / seq.end_value) * 100;
        if (usage >= 90) {
            return { color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', icon: AlertTriangle, label: 'CASI AGOTADO' };
        }

        // Condition 3: Active
        if (seq.status === 'active') {
            return { color: 'bg-green-100 text-green-800 border border-green-200', icon: CheckCircle, label: 'ACTIVO' };
        }

        // Condition 4: Inactive (Default)
        return { color: 'bg-gray-100 text-gray-800 border border-gray-200', icon: Loader2, label: 'INACTIVO' };
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif font-bold text-navy-900 flex items-center gap-3">
                    <FileText className="text-gold-500" /> Gestión de NCF
                </h1>
                <button
                    onClick={() => { setEditingId(null); setShowModal(true); }}
                    className="bg-navy-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-navy-800 flex items-center gap-2 shadow-lg transition-all"
                >
                    <Plus size={20} /> Nueva Secuencia
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-navy-900 text-white uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Prefijo</th>
                                <th className="p-4">Descripción</th>
                                <th className="p-4">Rango Actual / Límite</th>
                                <th className="p-4">Vencimiento</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-gold-500" /></td></tr>
                            ) : sequences.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-gray-400">No hay secuencias registradas.</td></tr>
                            ) : (
                                sequences.map((seq) => {
                                    const health = getHealthStatus(seq);
                                    return (
                                        <tr key={seq.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-mono font-bold text-navy-900">{seq.prefix}</td>
                                            <td className="p-4 text-gray-600">{seq.description}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-navy-900">{seq.current_value}</span>
                                                    <span className="text-gray-400">/</span>
                                                    <span className="text-gray-500">{seq.end_value}</span>
                                                </div>
                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${((seq.current_value / seq.end_value) * 100) > 90 ? 'bg-orange-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min((seq.current_value / seq.end_value) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600">{new Date(seq.expiration_date).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${health.color}`}>
                                                    <health.icon size={12} /> {health.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Tooltip content="Editar">
                                                        <button onClick={() => handleEdit(seq)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Edit2 size={18} />
                                                        </button>
                                                    </Tooltip>

                                                    <Tooltip content="Eliminar">
                                                        <button onClick={() => handleDelete(seq.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-navy-900">{editingId ? 'Editar Secuencia' : 'Nueva Secuencia Fiscal'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Prefijo (Serie)</label>
                                    <input required value={formData.prefix} onChange={e => setFormData({ ...formData, prefix: e.target.value })} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-gold-500" placeholder="B02" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Vencimiento</label>
                                    <input required type="date" value={formData.expiration_date} onChange={e => setFormData({ ...formData, expiration_date: e.target.value })} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-gold-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                                <input required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-gold-500" placeholder="Consumidor Final" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Valor Actual</label>
                                    <input required type="number" value={formData.current_value} onChange={e => setFormData({ ...formData, current_value: parseInt(e.target.value) })} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-gold-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Valor Final (Límite)</label>
                                    <input required type="number" value={formData.end_value} onChange={e => setFormData({ ...formData, end_value: parseInt(e.target.value) })} className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-gold-500" />
                                </div>
                            </div>

                            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <p>Esta secuencia se asociará automáticamente a la empresa configurada.</p>
                            </div>

                            <button type="submit" disabled={saving} className="w-full bg-gold-500 text-navy-900 py-4 rounded-xl font-bold hover:bg-gold-400 transition-colors flex justify-center items-center gap-2">
                                {saving ? <Loader2 className="animate-spin" /> : 'Guardar Secuencia'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NCFManager;
