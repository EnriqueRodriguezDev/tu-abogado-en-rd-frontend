import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DoctorCard = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm p-6 mb-6 border border-slate-100 dark:border-navy-700 text-center md:text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-20 bg-slate-50 dark:bg-navy-900/50"></div>

            <div className="relative pt-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-full border-4 border-white dark:border-navy-800 shadow-md overflow-hidden bg-slate-200">
                        <img src="/images/3.png" alt="Dr. Carlos Rodriguez" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-xl font-serif font-bold text-navy-900 dark:text-white mb-1">Dr. Carlos Rodriguez</h2>
                        <p className="text-gold-500 font-medium text-sm mb-2">{t('booking.specialist')}</p>

                        <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                            <Star className="w-4 h-4 fill-current text-yellow-400" />
                            <span className="text-sm font-bold text-gray-900 dark:text-white">4.9</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">(120 Reviews)</span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                            {t('booking.experience')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
