import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';

interface RegisterScreenProps {
    onSwitchToLogin: () => void;
}

const RegisterScreen = ({ onSwitchToLogin }: RegisterScreenProps) => {
    const { register } = useDataContext();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const newUser = await register(name, email, password);
            if (!newUser) {
                setError('Bu e-posta adresi zaten kullanılıyor. Lütfen giriş yapın.');
            }
            // On successful registration, AppContent will automatically log in and switch views
        } catch (err) {
             setError('Kayıt sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
        } finally {
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Yeni Hesap Oluştur</h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Platforma kaydolun. İlk oluşturulan hesap Süper Admin yetkilerine sahip olacaktır.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="space-y-4">
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Ad Soyad"
                            disabled={isLoading}
                        />
                        <input
                            id="email-register"
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
                            id="password-register"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Şifre"
                            disabled={isLoading}
                        />
                         <input
                            id="confirm-password-register"
                            name="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Şifre Tekrar"
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
                            {isLoading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                        Zaten bir hesabınız var mı?{' '}
                        <button onClick={onSwitchToLogin} className="font-medium text-primary-600 hover:text-primary-500">
                            Giriş Yapın
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterScreen;