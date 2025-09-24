import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, UserRole } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { getInitialDataForSeeding } from '../contexts/DataContext';
import { functions, db } from '../services/firebase';

const SetupWizard = () => {
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
            // The component will unmount as isSeeded becomes true, no need to hide it manually
        } catch (error: any) {
            console.error(error);
            addToast(`Kurulum sırasında bir hata oluştu: ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card title="🚀 Platform Kurulum Sihirbazı" className="border-primary-500 border-2">
            <div className="space-y-6">
                <p className="text-gray-600 dark:text-gray-300">
                    Hoş geldiniz! Platformu demo verileriyle doldurmak ve tüm özellikleri test etmek için lütfen aşağıdaki adımları izleyin.
                </p>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Adım 1: Demo Kullanıcıları Oluşturun</h3>
                    <p className="text-sm text-gray-500 mb-3">Firebase projenizin **Authentication** bölümüne gidin ve aşağıdaki kullanıcıları **'password123'** şifresiyle manuel olarak ekleyin:</p>
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
    )
};


const SuperAdminDashboard = () => {
    const { currentUser, users, updateUser, deleteUser } = useDataContext();
    const { addToast } = useUI();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [roleChanges, setRoleChanges] = useState<Record<string, UserRole>>({});
    const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});


    // If only one user exists (the admin), show the setup wizard.
    const isSeeded = users.length > 1;

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleDeleteRequest = (user: User) => {
        if (currentUser?.id === user.id) {
            addToast("Kendinizi silemezsiniz.", "error");
            return;
        }
        setUserToDelete(user);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
            addToast("Kullanıcı başarıyla silindi. (Not: Firebase Auth kaydını konsoldan silmeniz gerekir)", "success");
        }
        setIsConfirmModalOpen(false);
        setUserToDelete(null);
    };

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        setRoleChanges(prev => ({ ...prev, [userId]: newRole }));
    };

    const handleSaveRole = async (user: User) => {
        const newRole = roleChanges[user.id];
        if (!newRole) return;

        setSavingStates(prev => ({ ...prev, [user.id]: true }));
        try {
            const setUserRole = functions.httpsCallable('setUserRole');
            await setUserRole({ userId: user.id, role: newRole });
            
            // On success, update the local state in DataContext to reflect the change immediately
            updateUser({ ...user, role: newRole });
            
            addToast(`'${user.name}' kullanıcısının rolü '${newRole}' olarak güncellendi.`, "success");
            
            // Clear the pending change for this user
            setRoleChanges(prev => {
                const newChanges = { ...prev };
                delete newChanges[user.id];
                return newChanges;
            });

        } catch (error: any) {
            console.error("Error updating role:", error);
            addToast(error.message || "Rol güncellenirken bir hata oluştu.", "error");
        } finally {
            setSavingStates(prev => ({ ...prev, [user.id]: false }));
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const UserEditModal = ({ user, onClose }: { user: User | null; onClose: () => void }) => {
        const [name, setName] = useState(user?.name || '');
        const [email, setEmail] = useState(user?.email || '');
        const [isLoading, setIsLoading] = useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);
            
            try {
                if (user && user.name !== name) {
                    await updateUser({ ...user, name });
                    addToast("Kullanıcı adı başarıyla güncellendi.", "success");
                }
                onClose();
            } catch (error) {
                 addToast("İşlem sırasında bir hata oluştu.", "error");
            } finally {
                setIsLoading(false);
            }
        };

        return (
            <Modal isOpen={true} onClose={onClose} title={"Kullanıcıyı Düzenle"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Ad Soyad</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">E-posta</label>
                        <input type="email" value={email}  className="w-full p-2 border rounded-md bg-gray-200 dark:bg-gray-800 dark:border-gray-600" required disabled/>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" disabled={isLoading}>İptal</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed" disabled={isLoading}>
                            {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </Modal>
        );
    };

    return (
        <div className="space-y-6">
            {!isSeeded ? <SetupWizard /> : (
                <>
                <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
                <Card>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <input
                            type="text"
                            placeholder="Kullanıcı ara (isim veya e-posta)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 w-full md:w-auto"
                        />
                         <p className="text-sm text-gray-500">
                           Yeni kullanıcı eklemek için Firebase Authentication panelini kullanın.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Kullanıcı</th>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 hidden md:table-cell">E-posta</th>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 text-center">Rol</th>
                                    <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 text-right">Eylemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center">
                                                <img src={user.profilePicture} alt={user.name} className="w-10 h-10 rounded-full mr-3" />
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{user.email}</td>
                                        <td className="py-3 px-4 text-center">
                                            <select 
                                                value={roleChanges[user.id] || user.role} 
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                className="p-1 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-xs"
                                                disabled={savingStates[user.id] || currentUser?.id === user.id}
                                            >
                                                <option value={UserRole.Student}>Öğrenci</option>
                                                <option value={UserRole.Coach}>Koç</option>
                                                <option value={UserRole.SuperAdmin}>Süper Admin</option>
                                            </select>
                                        </td>
                                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                                             <button 
                                                onClick={() => handleSaveRole(user)}
                                                className="text-green-600 hover:underline text-sm font-semibold disabled:text-gray-400 disabled:no-underline"
                                                disabled={!roleChanges[user.id] || savingStates[user.id]}
                                            >
                                                {savingStates[user.id] ? '...' : 'Kaydet'}
                                            </button>
                                            <button onClick={() => handleEdit(user)} className="text-blue-500 hover:underline text-sm font-semibold">Düzenle</button>
                                            {currentUser?.id !== user.id && (
                                                <button onClick={() => handleDeleteRequest(user)} className="text-red-500 hover:underline text-sm font-semibold">Sil</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                </>
            )}

            {isEditModalOpen && <UserEditModal user={editingUser} onClose={() => setIsEditModalOpen(false)} />}
            {isConfirmModalOpen && userToDelete && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Kullanıcıyı Sil"
                    message={`'${userToDelete.name}' adlı kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu kullanıcıya ait tüm ödevler ve mesajlar da silinecektir. Bu işlem geri alınamaz.`}
                    confirmText="Evet, Sil"
                />
            )}
        </div>
    );
};

export default SuperAdminDashboard;
