
import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, User } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';

const StudentSettings = () => {
    const { currentUser, updateUser } = useDataContext();
    const { addToast } = useUI();
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser) {
            updateUser({ ...currentUser, name, email });
            addToast("Profil başarıyla güncellendi.", "success");
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
        <div className="max-w-2xl mx-auto">
            <Card title="Profil Ayarları">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="flex flex-col items-center">
                        <img src={currentUser?.profilePicture} alt="Profile" className="w-24 h-24 rounded-full mb-4" />
                        <button type="button" className="text-sm text-primary-500 hover:underline">Fotoğrafı Değiştir</button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Ad Soyad</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">E-posta</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Kaydet</button>
                    </div>
                </form>
            </Card>

            <Card title="Bildirim Ayarları" className="mt-6">
                <div className="flex justify-between items-center">
                    <p>Yaklaşan ödevler için tarayıcı bildirimleri alın.</p>
                    <button onClick={requestNotificationPermission} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">İzin Ver</button>
                </div>
            </Card>
        </div>
    );
};

const CoachSettings = () => {
    const { users, addUser, updateUser, deleteUser, resetData } = useDataContext();
    const { addToast } = useUI();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };
    
    const handleDelete = (userId: string) => {
        if(window.confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) {
            deleteUser(userId);
            addToast("Kullanıcı silindi.", "success");
        }
    };

    const handleReset = () => {
        if(window.confirm("Tüm uygulama verilerini sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
            resetData();
            addToast("Uygulama verileri başarıyla sıfırlandı.", "success");
        }
    };

    const UserModal = ({ user, onClose }: { user: User | null, onClose: () => void }) => {
        const [name, setName] = useState(user?.name || '');
        const [email, setEmail] = useState(user?.email || '');
        const [role, setRole] = useState(user?.role || UserRole.Student);
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const userData = { name, email, role, profilePicture: user?.profilePicture || `https://i.pravatar.cc/150?u=${email}` };
            if(user) {
                updateUser({ ...user, ...userData });
                addToast("Kullanıcı güncellendi.", "success");
            } else {
                addUser(userData);
                addToast("Kullanıcı eklendi.", "success");
            }
            onClose();
        };

        return (
            <Modal isOpen={true} onClose={onClose} title={user ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium mb-1">Ad Soyad</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">E-posta</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Rol</label>
                         <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <option value={UserRole.Student}>Öğrenci</option>
                            <option value={UserRole.Coach}>Koç</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border">İptal</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Kaydet</button>
                    </div>
                </form>
            </Modal>
        );
    };

    return (
        <div className="space-y-6">
            <Card title="Kullanıcı Yönetimi" action={<button onClick={handleNew} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm">Yeni Kullanıcı</button>}>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="p-2">Ad Soyad</th>
                            <th className="p-2">E-posta</th>
                            <th className="p-2">Rol</th>
                            <th className="p-2">Eylemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b dark:border-gray-700">
                                <td className="p-2">{u.name}</td>
                                <td className="p-2">{u.email}</td>
                                <td className="p-2">{u.role === UserRole.Coach ? 'Koç' : 'Öğrenci'}</td>
                                <td className="p-2 space-x-2">
                                    <button onClick={() => handleEdit(u)} className="text-blue-500 hover:underline text-sm">Düzenle</button>
                                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:underline text-sm">Sil</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Card title="Tehlikeli Alan" className="border-red-500 border">
                 <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold">Uygulama Verilerini Sıfırla</h4>
                        <p className="text-sm text-gray-500">Bu işlem tüm kullanıcıları, ödevleri ve mesajları başlangıç durumuna döndürür.</p>
                    </div>
                    <button onClick={handleReset} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Verileri Sıfırla</button>
                </div>
            </Card>
            
            {isModalOpen && <UserModal user={editingUser} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

const Settings = () => {
    const { currentUser } = useDataContext();
    if (!currentUser) return null;
    return currentUser.role === UserRole.Coach ? <CoachSettings /> : <StudentSettings />;
};

export default Settings;
