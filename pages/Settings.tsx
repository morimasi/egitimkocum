import React, { useState, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole } from '../types';
import Card from '../components/Card';
import { useUI } from '../contexts/UIContext';

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

const AdminSettings = () => {
    const { startTour } = useUI();
    
    return (
        <div className="space-y-6">
             <Card title="Yardım">
                <div className="flex justify-between items-center">
                    <p>Uygulama özelliklerini yeniden keşfedin.</p>
                    <button onClick={startTour} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Tanıtım Turunu Başlat</button>
                </div>
            </Card>

            <Card title="Uygulama Bilgisi">
                 <div className="text-center">
                    <h4 className="font-semibold">Uygulama Yerel Modda Çalışıyor</h4>
                    <p className="text-sm text-gray-500 mt-2">Bu uygulama şu anda sahte (mock) verilerle çalışmaktadır. Veritabanı bağlantısı yoktur ve yaptığınız değişiklikler sayfa yenilendiğinde sıfırlanacaktır.</p>
                </div>
            </Card>
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