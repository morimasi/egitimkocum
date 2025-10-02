import React, { useState, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { ImageIcon } from '../components/Icons';

interface RegisterScreenProps {
    onSwitchToLogin: () => void;
}

export default function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
    const { register } = useDataContext();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            await register(name, email, profilePicture);
            // On successful registration, user is automatically logged in.
        } catch (err: any) {
             setIsLoading(false);
             if (err.message && err.message.includes('zaten kullanılıyor')) {
                setError('Bu e-posta adresi zaten kullanılıyor. Lütfen giriş yapın.');
            } else {
                 setError('Kayıt sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
            }
        }
    };

    return (
         <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
                 <div className="text-center">
                     <div className="flex items-center justify-center mb-4">
                        <div className="bg-primary-500 rounded-full p-3">
                             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v11.494m-9-5.747h18"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18a6 6 0 110-12 6 6 0 010 12z"></path></svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Yeni Hesap Oluştur</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Platforma kaydolun. İlk oluşturulan hesap Süper Admin yetkilerine sahip olacaktır.
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleRegister}>
                    <div className="flex flex-col items-center space-y-2">
                        <div 
                            className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-500"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Profil önizlemesi" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                                <ImageIcon className="w-10 h-10 text-slate-400" />
                            )}
                        </div>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-primary-500 hover:underline">
                            Profil Fotoğrafı Yükle
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                    <div className="space-y-4">
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 text-lg border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-500 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            className="w-full px-4 py-3 text-lg border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-500 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            className="w-full px-4 py-3 text-lg border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-500 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            className="w-full px-4 py-3 text-lg border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-500 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Şifre Tekrar"
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
                            {isLoading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm">
                    <p className="text-slate-600 dark:text-slate-400">
                        Zaten bir hesabınız var mı?{' '}
                        <button onClick={onSwitchToLogin} className="font-medium text-primary-600 hover:text-primary-500">
                            Giriş Yapın
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}