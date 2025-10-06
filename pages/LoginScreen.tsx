import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';

interface LoginScreenProps {
    onSwitchToRegister: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
    const { login } = useDataContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email);
            // On successful login, AppContent will automatically switch views
        } catch (err: any) {
             setError(err.message || 'Giriş sırasında bir hata oluştu.');
             setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-slate-800 dark:text-white">
                            <g className="animate-float-subtle">
                                <path d="M 20 50 C 20 25, 60 25, 60 50 C 60 75, 20 75, 20 50 Z" fill="#f2d5b1" stroke="currentColor" strokeWidth="2"/>
                                <rect x="22" y="38" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
                                <rect x="42" y="38" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
                                <line x1="40" y1="44" x2="42" y2="44" stroke="currentColor" strokeWidth="2.5"/>
                                <circle cx="31" cy="44" r="1.5" fill="currentColor"/>
                                <g transform="translate(51 44)">
                                    <g className="animate-wink">
                                        <circle cx="0" cy="0" r="1.5" fill="currentColor"/>
                                    </g>
                                </g>
                                <path d="M 35 60 Q 40 62, 45 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M 20 70 L 35 80 L 45 80 L 60 70 L 60 55 L 20 55 Z" className="fill-slate-700 dark:fill-slate-300"/>
                                <path d="M 40 70 L 45 80 L 35 80 Z" fill="#ffffff" stroke="currentColor" strokeWidth="1"/>
                            </g>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mahmut Hoca</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Giriş Yap</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className='space-y-4'>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-500 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="E-posta Adresi"
                            disabled={isLoading}
                        />
                         <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-500 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Şifre"
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed shadow-primary hover:shadow-lg transition-shadow"
                        >
                            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </div>
                </form>
                <div className="mt-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-semibold text-center text-slate-700 dark:text-slate-300 mb-2">Test Bilgileri</h3>
                    <p className="text-slate-500 dark:text-slate-400">Örnek kullanıcılar için şifre: `123456`</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400">
                        <li><span className="font-semibold text-slate-700 dark:text-slate-300">Mahmut Hoca (Süper Admin):</span> admin@egitim.com</li>
                        <li><span className="font-semibold text-slate-700 dark:text-slate-300">Koç:</span> ahmet.yilmaz@egitim.com</li>
                        <li><span className="font-semibold text-slate-700 dark:text-slate-300">Öğrenci:</span> leyla.kaya@mail.com</li>
                    </ul>
                </div>
                <div className="text-center text-sm">
                    <p className="text-slate-600 dark:text-slate-400">
                        Hesabınız yok mu?{' '}
                        <button onClick={onSwitchToRegister} className="font-medium text-primary-600 hover:text-primary-500">
                            Kayıt Olun
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}