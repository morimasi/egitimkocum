

import React, { useState, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, User } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
// FIX: Import getInitialDataForSeeding to use in the setup wizard.
import { getInitialDataForSeeding } from '../contexts/DataContext';

const StudentSettings = () => {
    const { currentUser, updateUser, uploadFile } = useDataContext();
    const { addToast, startTour } = useUI();
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser) {
            updateUser({ ...currentUser, name, email });
            addToast("Profil başarıyla güncellendi.", "success");
        }
    };

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && currentUser) {
            setIsUploading(true);
            try {
                const newProfilePictureUrl = await uploadFile(file, `profile-pictures/${currentUser.id}`);
                await updateUser({ ...currentUser, profilePicture: newProfilePictureUrl });
                addToast("Profil fotoğrafı güncellendi.", "success");
            } catch (error) {
                addToast("Profil fotoğrafı güncellenirken bir hata oluştu.", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };
    
    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            addToast('Bu tarayıcı bildirimleri desteklemiyor.', 'error');
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            addToast('Bildirimlere izin verildi!', 'success');
             new Notification('Eğitim Koçu Platformu', {
                body: 'Artık yeni ödevler için bildirim alacaksınız.',
            });
        } else {
             addToast('Bildirimlere izin verilmedi.', 'info');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card title="Profil Ayarları">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <img src={currentUser?.profilePicture} alt="Profile" className="w-24 h-24 rounded-full mb-4" />
                            {isUploading && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">...</div>}
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleProfilePictureChange} className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-primary-500 hover:underline" disabled={isUploading}>
                            {isUploading ? 'Yükleniyor...' : 'Fotoğrafı Değiştir'}
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Ad Soyad</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">E-posta</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" disabled/>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Kaydet</button>
                    </div>
                </form>
            </Card>

            <Card title="Bildirim Ayarları">
                <div className="flex justify-between items-center">
                    <p>Yaklaşan ödevler için tarayıcı bildirimleri alın.</p>
                    <button onClick={requestNotificationPermission} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">İzin Ver</button>
                </div>
            </Card>
            
            <Card title="Yardım">
                <div className="flex justify-between items-center">
                    <p>Uygulama özelliklerini yeniden keşfedin.</p>
                    <button onClick={startTour} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Tanıtım Turunu Başlat</button>
                </div>
            </Card>
        </div>
    );
};

const CoachSettings = () => {
    // Coach-specific settings can be added here in the future.
    // For now, it will be similar to student settings for profile management.
    return (
        <StudentSettings /> // Re-using for profile, can be expanded
    );
};

// FIX: Replaced the broken `AdminSettings` with a version that opens a setup wizard in a modal to collect UIDs for seeding.
const AdminSettings = () => {
    const { addToast, startTour } = useUI();
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const SetupWizard = ({ onFinished }: { onFinished: () => void }) => {
        const { seedDatabase } = useDataContext();
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
                onFinished();
            } catch (error: any) {
                console.error(error);
                addToast(`Kurulum sırasında bir hata oluştu: ${error.message}`, "error");
            } finally {
                setIsLoading(false);
            }
        };
        
        return (
            <div className="space-y-6">
                <p className="text-gray-600 dark:text-gray-300">
                    Platformu demo verileriyle doldurmak ve tüm özellikleri test etmek için lütfen aşağıdaki adımları izleyin.
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
        );
    };
    
    return (
        <div className="space-y-6">
             <Card title="Yardım">
                <div className="flex justify-between items-center">
                    <p>Uygulama özelliklerini yeniden keşfedin.</p>
                    <button onClick={startTour} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Tanıtım Turunu Başlat</button>
                </div>
            </Card>

            <Card title="Veritabanı Yönetimi" className="border-orange-500 border">
                 <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold">Demo Verilerini Yükle</h4>
                        <p className="text-sm text-gray-500">Bu işlem tüm kullanıcıları, ödevleri ve mesajları başlangıç durumuna döndürür.</p>
                    </div>
                    <button onClick={() => setIsWizardOpen(true)} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
                        Veritabanını Doldur
                    </button>
                </div>
            </Card>
            {isWizardOpen && (
                <Modal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} title="🚀 Platform Kurulum Sihirbazı" size="lg">
                    <SetupWizard onFinished={() => setIsWizardOpen(false)} />
                </Modal>
            )}
        </div>
    );
};

const Settings = () => {
    const { currentUser } = useDataContext();
    if (!currentUser) return null;

    switch(currentUser.role) {
        case UserRole.SuperAdmin:
            return <AdminSettings />;
        case UserRole.Coach:
            return <CoachSettings />;
        case UserRole.Student:
            return <StudentSettings />;
        default:
            return null;
    }
};

export default Settings;