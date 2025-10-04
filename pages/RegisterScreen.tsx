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