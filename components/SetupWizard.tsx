import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { getInitialDataForSeeding } from '../contexts/DataContext';
import Card from './Card';

interface SetupWizardProps {
    onFinished?: () => void;
    title?: string;
    description?: string;
}

const SetupWizard = ({ onFinished, title, description }: SetupWizardProps) => {
    const { seedDatabase } = useDataContext();
    const { addToast } = useUI();
    const [uids, setUids] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    
    const demoUsersToCreate = getInitialDataForSeeding().initialUsers;

    const handleUidChange = (email: string, uid: string) => {
        setUids(prev => ({ ...prev, [email]: uid }));
    };

    const handleCompleteSetup = async () => {
        const missingUids = demoUsersToCreate.filter(user => !uids[user.email] || uids[user.email].trim() === '');
        if (missingUids.length > 0) {
            addToast(`Lütfen ${missingUids.map(u => u.name).join(', ')} için UID'leri girin.`, "error");
            return;
        }

        setIsLoading(true);
        try {
            await seedDatabase(uids);
            addToast("Kurulum başarıyla tamamlandı! Veritabanı demo verileriyle dolduruldu.", "success");
            if (onFinished) {
                onFinished();
            }
        } catch (error: any) {
            console.error(error);
            addToast(`Kurulum sırasında bir hata oluştu: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card title={title || "🚀 Platform Kurulum Sihirbazı"} className="border-primary-500 border-2">
            <div className="space-y-6">
                <p className="text-gray-600 dark:text-gray-300">
                    {description || "Hoş geldiniz! Platformu demo verileriyle doldurmak ve tüm özellikleri test etmek için lütfen aşağıdaki adımları izleyin."}
                </p>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Adım 1: Demo Kullanıcıları Oluşturun</h3>
                    <p className="text-sm text-gray-500 mb-3">Firebase projenizin **Authentication** bölümüne gidin ve aşağıdaki kullanıcıları **'password123'** şifresiyle manuel olarak ekleyin (eğer mevcut değillerse):</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {demoUsersToCreate.map(user => (
                            <li key={user.email}><strong>{user.name} ({user.role}):</strong> <code>{user.email}</code></li>
                        ))}
                    </ul>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                     <h3 className="font-semibold text-lg mb-2">Adım 2: Kullanıcı UID'lerini Girin</h3>
                     <p className="text-sm text-gray-500 mb-4">Authentication panelinde oluşturduğunuz her kullanıcının yanındaki "User UID" değerini kopyalayıp aşağıdaki ilgili alana yapıştırın.</p>
                     <div className="space-y-3">
                        {demoUsersToCreate.map(user => (
                            <div key={user.email}>
                                <label className="block text-sm font-medium mb-1">{user.name}</label>
                                <input
                                    type="text"
                                    placeholder={`${user.email} için UID`}
                                    value={uids[user.email] || ''}
                                    onChange={(e) => handleUidChange(user.email, e.target.value)}
                                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 font-mono text-xs"
                                />
                            </div>
                        ))}
                     </div>
                </div>

                <div>
                     <button onClick={handleCompleteSetup} className="w-full px-4 py-3 rounded-md bg-primary-600 text-white hover:bg-primary-700 font-bold text-lg" disabled={isLoading}>
                        {isLoading ? 'Kurulum Yapılıyor...' : 'Kurulumu Tamamla'}
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default SetupWizard;
