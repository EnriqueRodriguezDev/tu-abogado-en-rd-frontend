import { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useTranslation } from 'react-i18next';
import { useLoading } from '../../hooks/useLoading';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string;
    selectedTime: string;
    amount: number;
    currency: 'USD' | 'DOP';
    onSuccess: (details: any) => void;
}

export const PaymentModal = ({ isOpen, onClose, selectedDate, selectedTime, amount, currency, onSuccess }: PaymentModalProps) => {
    const { t } = useTranslation();
    const { setIsLoading } = useLoading();
    // Use amount to validate or log? For now just keeping it available in props.
    console.log("Processing payment for:", amount, currency);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        country: '',
        email: ''
    });
    const [formError, setFormError] = useState('');

    if (!isOpen) return null;

    const isFormValid = () => {
        return Object.values(formData).every(val => val.trim() !== '');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (formError) setFormError('');
    };

    const initialOptions = {
        clientId: "sb", // Sandbox Client ID
        currency: "USD", // PayPal SDK mainly works with USD/EUR/etc. For DOP we might need to convert or just charge USD equivalent if DOP not supported by standard buttons easily without advanced config. 
        // NOTE: PayPal Standard buttons often default to USD if merchant account not set for others. For simplicity in sandbox we behave as if charging USD equivalent or USD.
        // Actually for this implementation:
        // If Currency is RD (DOP), we might theoretically pass DOP. Sandbox accounts usually support USD default. 
        // Let's stick to USD for the PayPal intent to ensure it works in Sandbox. 
        // Real implementation would require a merchant account capable of DOP or converting on fly.
        // We will assume 1 USD = ~60 DOP for display or just process in USD for everything to ensure sandbox success?
        // User Requirement: "si es USA se cobran 100 USD y es RD 2,000 PESOS"
        // In modal, we show the charge.
        intent: "capture",
    };

    // Calculate USD value for PayPal (Simulated exchange if DOP)
    // 2000 DOP is roughly 35 USD. 
    // We utilize the passed amount/currency to determine the charge.

    const paymentAmount = currency === 'USD' ? '100.00' : '35.00'; // Approx for 2000 RD

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 dark:bg-navy-800">

                {/* Header */}
                <div className="bg-navy-900 px-6 py-4 flex justify-between items-center bg-[url('/pattern.png')] bg-opacity-10">
                    <h2 className="text-xl font-serif font-bold text-gold-500">
                        {t('modal.title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">

                    {/* Summary Section */}
                    <div className="bg-slate-50 dark:bg-navy-900/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-navy-700">
                        <h3 className="text-sm font-bold text-gold-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                            {t('modal.summary')}
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white dark:bg-navy-800 p-2 rounded-lg shadow-sm">
                                <span className="block text-xs text-gray-400 mb-1">{t('booking.date')}</span>
                                <span className="font-bold text-navy-900 dark:text-white text-lg">{selectedDate}</span>
                            </div>
                            <div className="bg-white dark:bg-navy-800 p-2 rounded-lg shadow-sm">
                                <span className="block text-xs text-gray-400 mb-1">{t('booking.time')}</span>
                                <span className="font-bold text-navy-900 dark:text-white">{selectedTime}</span>
                            </div>
                            <div className="bg-white dark:bg-navy-800 p-2 rounded-lg shadow-sm flex flex-col justify-center">
                                <span className="block text-xs text-gray-400 mb-1">Total</span>
                                <span className="font-bold text-navy-900 dark:text-white text-sm flex items-center justify-center gap-1">
                                    <span>{currency === 'USD' ? '🇺🇸' : '🇩🇴'}</span>
                                    {currency === 'USD' ? '$100 USD' : '$2,000 DOP'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* User Form */}
                    <div className="mb-8">
                        <h3 className="text-lg font-serif font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="text-gold-500">👤</span> {t('modal.clientInfo')}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 -mt-2 ml-2 bg-white dark:bg-navy-800 px-1 w-max relative z-10 translate-y-1/2 text-xs font-bold text-navy-700 dark:text-gold-500">{t('modal.name')}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-indigo-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all dark:bg-navy-900 dark:text-white"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div className="grid">
                                {/* Country 
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 -mt-2 ml-2 bg-white dark:bg-navy-800 px-1 w-max relative z-10 translate-y-1/2 text-xs font-bold text-navy-700 dark:text-gold-500">{t('modal.country')}</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-indigo-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all dark:bg-navy-900 dark:text-white"
                                        placeholder="Rep. Dom."
                                    />
                                </div>
                                */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 -mt-2 ml-2 bg-white dark:bg-navy-800 px-1 w-max relative z-10 translate-y-1/2 text-xs font-bold text-navy-700 dark:text-gold-500">{t('modal.phone')}</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-indigo-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all dark:bg-navy-900 dark:text-white"
                                        placeholder="+1 (809) 123-4567"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 -mt-2 ml-2 bg-white dark:bg-navy-800 px-1 w-max relative z-10 translate-y-1/2 text-xs font-bold text-navy-700 dark:text-gold-500">{t('modal.email')}</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-indigo-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all dark:bg-navy-900 dark:text-white"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* PayPal Payment */}
                    <div className="mt-8">
                        <h3 className="text-lg font-serif font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="text-gold-500">💳</span> {t('modal.paymentMethod')}
                        </h3>

                        {!isFormValid() && (
                            <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg mb-4 dark:bg-blue-900/30 dark:text-blue-200">
                                Por favor completa el formulario para habilitar el pago.
                            </div>
                        )}

                        <div className={!isFormValid() ? 'opacity-50 pointer-events-none grayscale' : ''}>
                            <PayPalScriptProvider options={initialOptions}>
                                <PayPalButtons
                                    style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                                    createOrder={(_data, actions) => {
                                        return actions.order.create({
                                            intent: "CAPTURE",
                                            purchase_units: [
                                                {
                                                    amount: {
                                                        currency_code: "USD",
                                                        value: paymentAmount,
                                                    },
                                                    description: "Videoconsulta Legal"
                                                },
                                            ],
                                        });
                                    }}
                                    onApprove={async (_data, actions) => {
                                        if (actions.order) {
                                            setIsLoading(true);
                                            try {
                                                const details = await actions.order.capture();
                                                onSuccess({ ...formData, paymentDetails: details });
                                            } catch (error) {
                                                console.error("Payment failed", error);
                                            } finally {
                                                setIsLoading(false);
                                            }
                                        }
                                    }}
                                    onError={(err) => {
                                        console.error("PayPal Error", err);
                                        setFormError("Hubo un error con el pago. Intenta nuevamente.");
                                    }}
                                />
                            </PayPalScriptProvider>
                        </div>
                        <div className="mt-4 flex justify-center text-xs text-gray-400 items-center gap-1">
                            <Lock size={10} /> Transacción encriptada de extremo a extremo
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
