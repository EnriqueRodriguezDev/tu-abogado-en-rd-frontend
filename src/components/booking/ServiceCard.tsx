import { Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ServiceCardProps {
    country: 'RD' | 'USA';
    onCountryChange: (country: 'RD' | 'USA') => void;
}

export const ServiceCard = ({ country, onCountryChange }: ServiceCardProps) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm p-6 mb-6 flex flex-col md:flex-row items-center justify-between border border-slate-100 dark:border-navy-700">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-12 h-12 rounded-full bg-gold-100 dark:bg-navy-700 flex items-center justify-center flex-shrink-0">
                    <Video className="w-6 h-6 text-gold-600" />
                </div>
                <div>
                    <h3 className="font-serif font-bold text-lg text-navy-900 dark:text-white">Videoconsulta</h3>
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('booking.duration')}: 30 min</p>
                        <span className="text-sm font-bold text-gold-600 bg-gold-50 dark:bg-navy-900 px-2 py-0.5 rounded-full border border-gold-100 dark:border-navy-700">
                            {country === 'RD' ? '$2,000 DOP' : '$100 USD'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="bg-slate-100 dark:bg-navy-900 rounded-lg p-1 flex items-center">
                    <button
                        onClick={() => onCountryChange('RD')}
                        className={`
                            px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                            ${country === 'RD'
                                ? 'bg-white dark:bg-navy-700 text-navy-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-navy-900 dark:hover:text-gray-300'}
                        `}
                    >
                        <span>🇩🇴</span> RD
                    </button>
                    <button
                        onClick={() => onCountryChange('USA')}
                        className={`
                            px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                            ${country === 'USA'
                                ? 'bg-white dark:bg-navy-700 text-navy-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-navy-900 dark:hover:text-gray-300'}
                        `}
                    >
                        <span>🇺🇸</span> USA
                    </button>
                </div>
            </div>
        </div>
    );
};
