
import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';
import Card from '../components/Card';
import { User } from '../types';

const getRoleLabel = (role: string) => {
    switch (role) {
        case 'superadmin': return 'Süper Admin';
        case 'coach': return 'Koç';
        case 'student': return 'Öğrenci';
        case 'parent': return 'Veli';
        default: return role;
    }
};

const UserCard = ({ user, onLogin }: { user: User, onLogin: (email: string) => void }) => {
    return (
        <Card 
            className="text-center p-4 transition-all duration-300"
            onClick={() => onLogin(user.email)}
        >
            <img src={user.profilePicture} alt={user.name} className="w-20 h-20 rounded-full mx-auto mb-3" />
            <h3 className="font-bold">{user.name}</h3>
            <p className="text-sm text-slate-500">{getRoleLabel(user.role)}</p>
        </Card>
    );
};

export default function LoginScreen() {
    const { users, login } = useDataContext();
    const [isLoading, setIsLoading] = useState<string | null>(null); // store user id being loaded
    const [error, setError] = useState('');

    const handleLogin = async (email: string) => {
        const user = users.find(u => u.email === email);
        if (!user) return;

        setError('');
        setIsLoading(user.id);
        
        try {
            await login(email);
        } catch (err: any) {
            setError(err.message || 'Giriş sırasında bir hata oluştu.');
            setIsLoading(null);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-4xl p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
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
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Kullanıcı Seçimi</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Giriş yapmak için bir kullanıcı profili seçin.</p>
                </div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {users.map(user => (
                        <div key={user.id} className="relative">
                            <UserCard user={user} onLogin={handleLogin} />
                            {isLoading === user.id && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
