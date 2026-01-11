import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FileText, Send, Search, Loader2, Eye } from 'lucide-react';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';
import { Tooltip } from '../../components/ui/Tooltip';

const InvoicesManager = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchInvoices = async () => {
        setLoading(true);
        // Fetch payments with NCF and related appointment info
        const { data, error } = await supabase
            .from('payments')
            .select(`
                *,
                appointments (
                    client_name,
                    client_email,
                    date,
                    time,
                    meeting_type,
                    duration_minutes
                )
            `)
            .not('ncf_number', 'is', null) // Only fiscal ones
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        if (data) setPayments(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleViewInvoice = async (payment: any) => {
        try {
            // Fetch company settings logic...
            let company = {
                name: 'Tu Abogado En RD',
                rnc: '13XXXXXXX',
                address: 'Santo Domingo, RD',
                logoUrl: ''
            };

            const { data: settings } = await supabase.from('company_settings').select('*').limit(1).single();
            if (settings) {
                company = {
                    name: settings.razon_social,
                    rnc: settings.rnc,
                    address: settings.address,
                    logoUrl: settings.logo_url
                };
            }

            const blobUrl = await generateInvoicePDF({
                payment,
                appointment: payment.appointments,
                company
            });

            window.open(blobUrl, '_blank');
        } catch (error) {
            alert("Error generando factura");
            console.error(error);
        }
    };

    const handleResendEmail = async (payment: any) => {
        if (!confirm(`¿Reenviar correo a ${payment.appointments.client_email}?`)) return;
        try {
            await supabase.functions.invoke('send-booking-confirmation', {
                body: {
                    appointment: payment.appointments,
                    payment: {
                        method: payment.method,
                        amount: payment.amount,
                        currency: 'USD',
                        ncf_number: payment.ncf_number
                    }
                }
            });
            alert("Correo enviado.");
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    const filtered = payments.filter(p =>
        p.ncf_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.appointments?.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-serif font-bold text-navy-900 flex items-center gap-3">
                    <FileText className="text-gold-500" /> Facturas Fiscales
                </h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por NCF o Cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-gold-500 focus:border-gold-500 w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-navy-900 text-white uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">NCF</th>
                                <th className="p-4">Cliente / RNC</th>
                                <th className="p-4 text-right">Monto</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-gold-500" /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-gray-400">No hay facturas registradas.</td></tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm font-bold text-gray-700">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm font-mono text-navy-700">
                                            {p.ncf_number}
                                            <span className="block text-[10px] text-gray-400 mt-1 uppercase">{p.ncf_number.startsWith('B01') ? 'Crédito Fiscal' : 'Consumidor Final'}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-navy-900">{p.appointments?.client_name}</div>
                                            {p.rnc_client && <div className="text-xs text-gray-500 font-mono">RNC: {p.rnc_client}</div>}
                                            <div className="text-xs text-gray-400">{p.appointments?.client_email}</div>
                                        </td>
                                        <td className="p-4 text-right font-bold text-navy-900">
                                            ${p.amount.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Tooltip content="Ver Factura">
                                                    <button
                                                        onClick={() => handleViewInvoice(p)}
                                                        className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all font-bold"
                                                        title="Ver Factura"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip content="Reenviar Email">
                                                    <button
                                                        onClick={() => handleResendEmail(p)}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                                                        title="Reenviar Email"
                                                    >
                                                        <Send size={18} />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvoicesManager;
