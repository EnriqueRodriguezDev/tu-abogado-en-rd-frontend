import { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isBefore,
    startOfToday,
    getDate
} from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { PaymentModal } from '../components/booking/PaymentModal';
import { ServiceCard } from '../components/booking/ServiceCard';
import { DoctorCard } from '../components/booking/DoctorCard';

const Booking = () => {
    const { t, i18n } = useTranslation();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // New State for logic
    const [country, setCountry] = useState<'RD' | 'USA'>('RD');
    const [consultationReason, setConsultationReason] = useState('');

    // Updated Time Slots: 9:30 AM to 8:00 PM
    const times = [
        '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
        '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM',
        '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
    ];

    const calendarLocale = i18n.language === 'en' ? enUS : es;
    const today = startOfToday();

    // Calendar Logic
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => {
        const result = subMonths(currentMonth, 1);
        // Allow going back to current month, but not before
        if (!isBefore(startOfMonth(result), startOfMonth(today))) {
            setCurrentMonth(result);
        }
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = i18n.language === 'en'
        ? ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
        : ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];

    const handleSuccess = () => {
        setIsModalOpen(false);
        setBookingSuccess(true);
    };

    if (bookingSuccess) {
        return (
            <div className="bg-slate-50 dark:bg-navy-900 min-h-screen py-20 px-4 flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-4">¡Reserva Confirmada!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Hemos enviado los detalles de tu videoconsulta a tu correo electrónico.
                    </p>
                    <button
                        onClick={() => setBookingSuccess(false)}
                        className="btn-primary w-full"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    // Determine disabled state for Prev button
    const isPrevDisabled = isSameMonth(currentMonth, today) || isBefore(currentMonth, today);

    return (
        <div className="bg-slate-50 dark:bg-navy-900 min-h-screen py-10 px-4 transition-colors duration-300">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-navy-900 dark:text-white mb-2">{t('booking.title')}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto">{t('booking.subtitle')}</p>
                </div>

                {/* 1. Service Card with Country Toggle */}
                <ServiceCard country={country} onCountryChange={setCountry} />

                {/* 2. Doctor Profile Card */}
                <DoctorCard />

                {/* 3. Calendar & Time Selection */}
                <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-navy-900 dark:text-white capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: calendarLocale })}
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={prevMonth}
                                disabled={isPrevDisabled}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-500" />
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-navy-700 rounded-full transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-y-4 gap-x-2 mb-8 text-center text-sm">
                        {weekDays.map(d => (
                            <span key={d} className="text-gray-400 font-medium text-xs uppercase tracking-wider">{d}</span>
                        ))}

                        {calendarDays.map((day) => {
                            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isPast = isBefore(day, today);
                            const isDisabled = !isCurrentMonth || isPast;

                            if (!isCurrentMonth) return <div key={day.toString()} />; // Empty slot for days outside month

                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(day)}
                                    disabled={isDisabled}
                                    className={`
                                        w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm transition-all duration-200
                                        ${isSelected ? 'bg-gold-500 text-white font-bold shadow-md transform scale-110' : ''}
                                        ${!isSelected && !isDisabled ? 'text-navy-900 dark:text-gray-300 hover:bg-gold-50 dark:hover:bg-navy-700' : ''}
                                        ${isDisabled ? 'text-gray-300 dark:text-navy-600 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {getDate(day)}
                                </button>
                            );
                        })}
                    </div>

                    {selectedDate && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-100 dark:border-navy-700 pt-6">
                            <h4 className="font-bold text-sm text-navy-900 dark:text-white mb-4">{t('booking.availableHours')}</h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {times.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        className={`
                     py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200 border
                     ${selectedTime === time
                                                ? 'bg-navy-900 text-gold-500 border-navy-900 font-bold shadow-md'
                                                : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-navy-600 hover:border-gold-500 hover:text-navy-900 dark:hover:text-white'}
                   `}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Consultation Reason Input */}
                {selectedTime && (
                    <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm p-6 mb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <label className="block font-bold text-navy-900 dark:text-white mb-2">
                            {t('booking.reason')}
                        </label>
                        <textarea
                            value={consultationReason}
                            onChange={(e) => setConsultationReason(e.target.value)}
                            maxLength={500}
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-navy-600 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none transition-all resize-none dark:bg-navy-900 dark:text-white text-sm"
                            placeholder={t('booking.reasonPlaceholder')}
                        />
                        <div className="text-right text-xs text-gray-400 mt-1">
                            {consultationReason.length}/500
                        </div>
                    </div>
                )}

                {/* 5. Sticky Footer Action */}
                {selectedTime && (
                    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-700 p-4 pb-6 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
                        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                            <div className="hidden sm:block">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">{t('booking.paymentInfo')}</p>
                                <p className="text-xl font-bold text-navy-900 dark:text-white">
                                    {country === 'RD' ? '$2,000 DOP' : '$100 USD'}
                                </p>
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto">
                                <button className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-navy-900 dark:text-white border border-slate-200 dark:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors">
                                    {t('booking.cancel')}
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    disabled={!consultationReason.trim()}
                                    className="flex-1 sm:flex-none btn-primary px-8 py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {t('booking.continue')} <ChevronRight size={18} className="ml-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}
                selectedTime={selectedTime || ''}
                amount={country === 'RD' ? 2000 : 100}
                currency={country === 'RD' ? 'DOP' : 'USD'}
                onSuccess={handleSuccess}
            />
        </div>
    );
};

export default Booking;
