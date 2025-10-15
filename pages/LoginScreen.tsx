

import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';


interface LoginScreenProps {
    onSwitchToRegister: () => void;
}

export default function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
    const { login, isApiLoading } = useDataContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (err: any) {
            // Hata artık apiService interceptor tarafından yakalanıp toast ile gösteriliyor.
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
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
                                <g transform="translate(51 44)"><g className="animate-wink"><circle cx="0" cy="0" r="1.5" fill="currentColor"/></g></g>
                                <path d="M 35 60 Q 40 62, 45 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M 20 70 L 35 80 L 45 80 L 60 70 L 60 55 L 20 55 Z" className="fill-slate-700 dark:fill-slate-300"/>
                                <path d="M 40 70 L 45 80 L 35 80 Z" fill="#ffffff" stroke="currentColor" strokeWidth="1"/>
                            </g>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Giriş Yap</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Hesabınıza erişmek için giriş yapın.</p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-3 text-lg border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-500 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="E-posta Adresi"
                        disabled={isApiLoading}
                    />
                    <input
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 text-lg border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-500 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Şifre"
                        disabled={isApiLoading}
                    />
                    
                    <div>
                        <button
                            type="submit"
                            disabled={isApiLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
                        >
                            {isApiLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </div>
                </form>
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