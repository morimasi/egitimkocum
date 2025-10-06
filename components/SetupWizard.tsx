import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';
import Card from './Card';
import { SparklesIcon } from './Icons';

const SetupWizard = () => {
    const { seedDatabase } = useDataContext();
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            await seedDatabase();
            // The seedDatabase function reloads the page on success,
            // so we don't need to set isSeeding back to false.
        } catch (error) {
            // If it fails, the toast is shown by DataContext, and we allow the user to try again.
            setIsSeeding(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <Card className="text-center max-w-lg animate-fade-in">
                <div className="flex items-center justify-center mb-4">
                    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-slate-800 dark:text-white">
                        <g className="animate-float-subtle">
                            <path d="M 20 50 C 20 25, 60 25, 60 50 C 60 75, 20 75, 20 50 Z" fill="#f2d5b1" stroke="currentColor" strokeWidth="2"/>
                            <rect x="22" y="38" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
                            <rect x="42" y="38" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
                            <line x1="40" y1="44" x2="42" y2="44" stroke="currentColor" strokeWidth="2.5"/>
                            <circle cx="31" cy="44" r="1.5" fill="currentColor"/>
                            <g transform="translate(51 44)"><g className="animate-wink"><circle cx="0" cy="0" r="1.5" fill="currentColor"/></g></g>
                            <path d="M 35 60 Q 40 62, 45 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M 20 70 L 35 80 L 45 80 L 60 70 L 60 55 L 20 55 Z" className="fill-slate-700 dark:fill-slate-300"/>
                            <path d="M 40 70 L 45 80 L 35 80 Z" fill="#ffffff" stroke="currentColor" strokeWidth="1"/>
                        </g>
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mahmut Hoca Uygulamasına Hoş Geldiniz!</h1>
                <p className="mt-4 text-slate-600 dark:text-slate-300">
                    Uygulamayı kullanmaya başlamadan önce veritabanının kurulması gerekiyor. Bu işlem yaklaşık 30 saniye sürebilir. Lütfen butona tıklayarak kurulumu başlatın.
                </p>
                <button
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className="mt-6 w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
                >
                    <SparklesIcon className={`w-5 h-5 ${isSeeding ? 'animate-spin' : ''}`} />
                    {isSeeding ? 'Veritabanı Kuruluyor...' : 'Kurulumu Başlat'}
                </button>
            </Card>
        </div>
    );
};

export default SetupWizard;