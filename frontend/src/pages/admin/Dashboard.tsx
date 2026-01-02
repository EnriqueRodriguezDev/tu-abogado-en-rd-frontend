import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
    Calendar, CheckCircle, Clock, DollarSign,
    MessageCircle, FileText, Loader2, Send, CreditCard, Image, Eye, XCircle, Search
} from 'lucide-react';
import { formatTime, generateWhatsAppLink } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';
import { AlertModal, ConfirmDialog, BaseModal } from '../../components/ui/Modal';
import { Tooltip } from '../../components/ui/Tooltip';
import type { Lawyer } from '../../types';

const Dashboard = () => {
    interface DashboardAppointment {
        id: string;
        date: string;
        time: string;
        client_name: string;
        client_phone: string;
        client_email: string;
        status: string;
        total_price: number;
        duration_minutes: number;
        meeting_type: string;
        appointment_code?: string;
        lawyer?: Lawyer;
        payments: {
            id: string;
            method: string;
            status: string;
            proof_url?: string;
            ncf_number?: string;
            ncf_type?: string;
            amount: number;
            currency: string;
        }[];
    }

    const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [alert, setAlert] = useState({ isOpen: false, title: '', message: '' });
    const [confirm, setConfirm] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: async () => { },
        isProcessing: false
    });
    const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                lawyer:lawyers(*),
                payments(
                    id,
                    method,
                    status,
                    proof_url,
                    ncf_number,
                    ncf_type,
                    amount,
                    currency
                )
            `)
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        if (data) setAppointments(data as any);
        setLoading(false);
    };

    const showAlert = (title: string, message: string) => {
        setAlert({ isOpen: true, title, message });
    };

    const handleResendEmail = async (apt: DashboardAppointment, payment: any) => {
        setConfirm({
            isOpen: true,
            title: 'Reenviar Confirmación',
            message: `¿Deseas reenviar el correo de confirmación a ${apt.client_name}?`,
            isProcessing: false,
            onConfirm: async () => {
                setConfirm(prev => ({ ...prev, isProcessing: true }));
                try {
                    await supabase.functions.invoke('send-booking-confirmation', {
                        body: {
                            appointment: apt,
                            payment: {
                                method: payment.method,
                                amount: payment.amount,
                                currency: 'USD',
                                ncf_number: payment.ncf_number
                            }
                        }
                    });
                    setConfirm(prev => ({ ...prev, isOpen: false }));
                    showAlert("Correo Enviado", "La confirmación ha sido reenviada correctamente.");
                } catch (e: any) {
                    setConfirm(prev => ({ ...prev, isOpen: false }));
                    showAlert("Error", "Error enviando correo: " + e.message);
                }
            }
        });
    };

    const handleViewInvoice = async (apt: DashboardAppointment, payment: any) => {
        try {
            // Fetch latest company settings
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
                payment: { ...payment, created_at: apt.date },
                appointment: apt as any,
                company
            });

            window.open(blobUrl, '_blank');
        } catch (error) {
            showAlert("Error", "No se pudo generar la factura.");
            console.error(error);
        }
    };

    const handleRejectPayment = async (apt: DashboardAppointment) => {
        setConfirm({
            isOpen: true,
            title: 'Rechazar Pago',
            message: `¿Estás seguro de rechazar el pago de ${apt.client_name}? Esta acción cancelará la cita.`,
            isProcessing: false,
            onConfirm: async () => {
                setConfirm(prev => ({ ...prev, isProcessing: true }));
                try {
                    // Update appointment status to cancelled
                    const { error: aptError } = await supabase
                        .from('appointments')
                        .update({ status: 'cancelled' })
                        .eq('id', apt.id);

                    if (aptError) throw aptError;

                    // Update payment status to rejected
                    if (apt.payments.length > 0) {
                        const { error: payError } = await supabase
                            .from('payments')
                            .update({ status: 'rejected' })
                            .eq('id', apt.payments[0].id);
                        if (payError) throw payError;
                    }

                    setConfirm(prev => ({ ...prev, isOpen: false }));
                    showAlert("Éxito", "Pago rechazado y cita cancelada.");
                    fetchData();
                } catch (error: any) {
                    console.error(error);
                    setConfirm(prev => ({ ...prev, isOpen: false }));
                    showAlert("Error", "No se pudo rechazar el pago.");
                }
            }
        });
    };

    const handleConfirmPayment = async (apptId: string) => {
        const apt = appointments.find(a => a.id === apptId);
        if (!apt) return;

        setConfirm({
            isOpen: true,
            title: 'Confirmar Pago',
            message: `¿Confirmar pago de ${apt.client_name} y generar el NCF correspondiente? Esta acción no se puede deshacer.`,
            isProcessing: false,
            onConfirm: async () => {
                setConfirm(prev => ({ ...prev, isProcessing: true }));
                try {
                    // Call RPC to get NCF
                    const { data: ncf, error: ncfError } = await supabase.rpc('get_next_ncf', { p_prefix: 'B02' });
                    if (ncfError) throw ncfError;

                    // Update Payment
                    const { data: payment } = await supabase.from('payments').select('id, amount, method, currency').eq('appointment_id', apptId).single();

                    if (payment) {
                        await supabase.from('payments').update({
                            status: 'confirmed',
                            ncf_number: ncf
                        }).eq('id', payment.id);

                        // Update Appointment
                        await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', apptId);

                        // Get updated appt
                        const { data: updatedAppt } = await supabase.from('appointments').select('*').eq('id', apptId).single();

                        // Send Email
                        await supabase.functions.invoke('send-booking-confirmation', {
                            body: {
                                appointment: updatedAppt,
                                payment: {
                                    method: payment.method,
                                    amount: payment.amount,
                                    currency: payment.currency,
                                    ncf_number: ncf
                                }
                            }
                        });

                        setConfirm(prev => ({ ...prev, isOpen: false }));
                        showAlert("Pago Confirmado", `El pago ha sido confirmado y se ha generado el NCF: ${ncf}`);
                        fetchData();
                    }

                } catch (e: any) {
                    setConfirm(prev => ({ ...prev, isOpen: false }));
                    showAlert("Error", 'Error al confirmar: ' + e.message);
                }
            }
        });
    };


    const stats = {
        income: appointments.reduce((acc, curr) => curr.status === 'confirmed' ? acc + curr.total_price : acc, 0),
        total: appointments.length,
        pending: appointments.filter(a => a.status === 'pending' || a.status === 'pending_payment').length
    };

    const filteredAppointments = appointments.filter(app => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'pending') {
            return app.status === 'pending' || app.status === 'pending_payment';
        }
        return app.status === filterStatus;
    }).filter(app => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const price = app.payments?.[0]?.amount?.toString() || '';
        return (
            app.client_name.toLowerCase().includes(term) ||
            app.client_email.toLowerCase().includes(term) ||
            app.appointment_code?.toLowerCase().includes(term) ||
            app.date.includes(term) ||
            price.includes(term)
        );
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-100 dark:border-navy-700 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Ingresos Totales</p>
                            <h3 className="text-3xl font-serif font-bold text-navy-900 dark:text-gold-500 mt-2">{stats.income.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-100 dark:border-navy-700 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Citas Totales</p>
                            <h3 className="text-3xl font-serif font-bold text-navy-900 dark:text-white mt-2">{stats.total}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                            <Calendar size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl border border-gray-100 dark:border-navy-700 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Pendientes</p>
                            <h3 className="text-3xl font-serif font-bold text-navy-900 dark:text-white mt-2">{stats.pending}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                            <Clock size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-navy-800 rounded-3xl border border-gray-100 dark:border-navy-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-navy-700 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="text-xl font-bold text-navy-900 dark:text-gold-500 flex items-center gap-2">
                        <FileText size={20} /> Citas Recientes
                    </h3>
                    <div className="flex gap-2 bg-gray-50 dark:bg-navy-900 p-1 rounded-xl">
                        <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === 'all' ? 'bg-white dark:bg-navy-700 shadow-sm text-navy-900 dark:text-white' : 'text-gray-500'}`}>Todos</button>
                        <button onClick={() => setFilterStatus('confirmed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === 'confirmed' ? 'bg-white dark:bg-navy-700 shadow-sm text-green-600' : 'text-gray-500'}`}>Confirmados</button>
                        <button onClick={() => setFilterStatus('pending')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === 'pending' ? 'bg-white dark:bg-navy-700 shadow-sm text-orange-600' : 'text-gray-500'}`}>Pendientes</button>
                    </div>
                </div>

                <div className="flex gap-4 p-6 w-full">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar (Nombre, Código, Fecha...)"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 w-100 shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-navy-900/50 text-gray-400 dark:text-gray-500 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-6">Fecha/Hora</th>
                                <th className="p-6">Cliente</th>
                                <th className="p-6">Abogado</th>
                                <th className="p-6">Servicio</th>
                                <th className="p-6">Pago / NCF</th>
                                <th className="p-6">Estado</th>
                                <th className="p-6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-navy-700">
                            {loading ? (
                                <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-gold-500" /></td></tr>
                            ) : filteredAppointments.map((apt) => (
                                <tr key={apt.id} className="hover:bg-gray-50 dark:hover:bg-navy-700/50 transition-colors group">
                                    <td className="p-6">
                                        <div className="font-bold text-navy-900 dark:text-white">{new Date(apt.date).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{formatTime(apt.time)}</div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <div className="font-bold text-navy-900 dark:text-white">{apt.client_name}</div>
                                                {apt.appointment_code && (
                                                    <Tooltip content="No. Cita">
                                                        <div className="text-xs font-mono text-gold-600 bg-gold-50 rounded w-fit mt-0.5">
                                                            {apt.appointment_code}
                                                        </div>
                                                    </Tooltip>
                                                )}
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Tooltip content="Contactar Cliente">
                                                        <a href={generateWhatsAppLink(apt.client_phone, apt.client_name, apt.date, apt.time)} target="_blank" className="text-xs text-green-600 flex items-center gap-1 hover:underline">
                                                            <MessageCircle size={12} /> {apt.client_phone}
                                                        </a>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        {apt.lawyer ? (
                                            <div onClick={() => setSelectedLawyer(apt.lawyer!)} className="flex items-center gap-3 cursor-pointer group/lawyer hover:bg-gray-100 p-2 rounded-lg transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-xs overflow-hidden border-2 border-transparent group-hover/lawyer:border-gold-500">
                                                    {apt.lawyer.image_url ? (
                                                        <img src={apt.lawyer.image_url} alt={apt.lawyer.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        apt.lawyer.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-navy-900 dark:text-white group-hover/lawyer:text-gold-600 transition-colors">{apt.lawyer.name}</div>
                                                    <div className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded w-fit">Ver Perfil</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic text-xs">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <div className="font-medium text-gray-600 dark:text-gray-300">Asesoría Legal</div>
                                        <div className="text-xs text-gray-400">{apt.duration_minutes} mins / {apt.meeting_type}</div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-navy-900 dark:text-gold-500">${apt.total_price}</span>
                                            <span className="text-xs bg-gray-100 dark:bg-navy-700 px-2 py-0.5 rounded text-gray-500 uppercase">{apt.payments[0]?.method}</span>
                                        </div>
                                        {apt.payments[0]?.ncf_number ? (
                                            <div className="flex flex-col mt-1 gap-1">
                                                <div className="text-xs text-gray-500 font-mono">NCF: {apt.payments[0].ncf_number}</div>
                                                {apt.payments[0].ncf_type?.startsWith('E') && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 w-fit">
                                                        e-CF
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-orange-400 italic mt-1">Sin NCF</div>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        {apt.status === 'confirmed' ? (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><CheckCircle size={12} /> Confirmado</span>
                                        ) : (
                                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><Clock size={12} /> Pendiente</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Action Buttons Logic */}

                                            {/* Confirm/Reject - Only if pending */}
                                            {apt.status === 'pending' && (
                                                <>
                                                    <Tooltip content="Confirmar Pago">
                                                        <button
                                                            onClick={() => handleConfirmPayment(apt.id)}
                                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:scale-110 transition-all"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip content="Rechazar Comprobante">
                                                        <button
                                                            onClick={() => handleRejectPayment(apt)}
                                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-110 transition-all"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </Tooltip>
                                                </>
                                            )}

                                            {/* View Proof (Transfer) */}
                                            {apt.payments[0]?.method === 'transfer' && apt.payments[0]?.proof_url && (
                                                <Tooltip content="Ver Comprobante">
                                                    <a
                                                        href={apt.payments[0].proof_url}
                                                        target="_blank"
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:scale-110 transition-all"
                                                    >
                                                        <Image size={18} />
                                                    </a>
                                                </Tooltip>
                                            )}

                                            {/* PayPal Transaction */}
                                            {apt.payments[0]?.method === 'paypal' && (
                                                <Tooltip content="Ver Transacción PayPal">
                                                    <a
                                                        href={`https://www.paypal.com/activity/payment/${apt.payments[0].status}`} // Mock link
                                                        target="_blank"
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:scale-110 transition-all"
                                                    >
                                                        <CreditCard size={18} />
                                                    </a>
                                                </Tooltip>
                                            )}

                                            {/* Internal Invoice View */}
                                            <Tooltip content="Ver Factura">
                                                <button
                                                    onClick={() => handleViewInvoice(apt, apt.payments[0])}
                                                    className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 hover:scale-110 transition-all"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </Tooltip>

                                            {/* Resend Email */}
                                            <Tooltip content="Reenviar Confirmación">
                                                <button
                                                    onClick={() => handleResendEmail(apt, apt.payments[0])}
                                                    className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 hover:scale-110 transition-all"
                                                >
                                                    <Send size={18} />
                                                </button>
                                            </Tooltip>

                                            <Tooltip content="Contactar por WhatsApp">
                                                <a
                                                    href={generateWhatsAppLink(apt.client_phone, apt.client_name, apt.date, apt.time)}
                                                    target="_blank"
                                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:scale-110 transition-all"
                                                >
                                                    <MessageCircle size={18} />
                                                </a>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AlertModal
                isOpen={alert.isOpen}
                onClose={() => setAlert({ ...alert, isOpen: false })}
                title={alert.title}
                message={alert.message}
            />

            <ConfirmDialog
                isOpen={confirm.isOpen}
                onClose={() => setConfirm({ ...confirm, isOpen: false })}
                onConfirm={confirm.onConfirm}
                title={confirm.title}
                message={confirm.message}
                isProcessing={confirm.isProcessing}
            />

            {/* Lawyer Detail Modal */}
            {selectedLawyer && (
                <BaseModal
                    isOpen={!!selectedLawyer}
                    onClose={() => setSelectedLawyer(null)}
                    title="Detalles del Abogado"
                    maxWidth="max-w-sm"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-gold-500 shadow-xl">
                            {selectedLawyer.image_url ? (
                                <img src={selectedLawyer.image_url} alt={selectedLawyer.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-navy-900 text-white font-bold text-3xl">
                                    {selectedLawyer.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-navy-900">{selectedLawyer.name}</h3>
                            <p className="text-gold-600 font-bold text-sm uppercase tracking-wider">Abogado Senior</p>
                        </div>

                        <div className="w-full bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm border border-gray-100">
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Email:</span>
                                <span className="font-medium text-navy-900">{selectedLawyer.email}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-500">Teléfono:</span>
                                <span className="font-medium text-navy-900">{selectedLawyer.phone}</span>
                            </div>
                            <div className="pt-2">
                                <span className="block text-gray-500 mb-1">Especialidades:</span>
                                <p className="font-medium text-navy-900">{selectedLawyer.specialties || 'General'}</p>
                            </div>
                        </div>
                    </div>
                </BaseModal>
            )}
        </div>
    );
};

export default Dashboard;
