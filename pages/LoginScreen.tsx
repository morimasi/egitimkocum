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
             setError('Kullanıcı bulunamadı veya şifre yanlış.');
             setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-primary-500 rounded-full p-3">
                             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v11.494m-9-5.747h18"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18a6 6 0 110-12 6 6 0 010 12z"></path></svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Eğitim Koçu Platformu</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Giriş Yap</p>
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
                            className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Şifre"
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
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