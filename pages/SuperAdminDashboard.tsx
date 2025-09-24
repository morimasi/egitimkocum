import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, UserRole } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';

const SuperAdminDashboard = () => {
    const { currentUser, users, updateUser, deleteUser, addUser } = useDataContext();
    const { addToast } = useUI();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleDelete = (userId: string) => {
        if (currentUser?.id === userId) {
            addToast("Kendinizi silemezsiniz.", "error");
            return;
        }
        if (window.confirm("Bu kullanıcıyı ve ilişkili tüm verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
            deleteUser(userId);
            addToast("Kullanıcı başarıyla silindi.", "success");
        }
    };
    
    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const UserEditModal = ({ user, onClose }: { user: User | null; onClose: () => void }) => {
        const [name, setName] = useState(user?.name || '');
        const [email, setEmail] = useState(user?.email || '');
        const [role, setRole] = useState(user?.role || UserRole.Student);
        const [isLoading, setIsLoading] = useState(false);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);
            const userData = { name, email, role, profilePicture: user?.profilePicture || `https://i.pravatar.cc/150?u=${email}` };
            
            // Simulate network delay
            setTimeout(() => {
                if (user) {
                    updateUser({ ...user, ...userData });
                    addToast("Kullanıcı başarıyla güncellendi.", "success");
                } else {
                    addUser(userData);
                    addToast("Kullanıcı başarıyla eklendi.", "success");
                }
                setIsLoading(false);
                onClose();
            }, 300);
        };

        return (
            <Modal isOpen={true} onClose={onClose} title={user ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Ad Soyad</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">E-posta</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Rol</label>
                        <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <option value={UserRole.Student}>Öğrenci</option>
                            <option value={UserRole.Coach}>Koç</option>
                            <option value={UserRole.SuperAdmin}>Süper Admin</option>
                        </select>
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

    const getRoleBadge = (role: UserRole) => {
        const styles = {
            [UserRole.Student]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
            [UserRole.Coach]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
            [UserRole.SuperAdmin]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        };
        const text = {
            [UserRole.Student]: 'Öğrenci',
            [UserRole.Coach]: 'Koç',
            [UserRole.SuperAdmin]: 'Süper Admin',
        };
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role]}`}>{text[role]}</span>;
    };

    return (
        <div className="space-y-6">
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
                    <button onClick={handleNew} className="w-full md:w-auto px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">
                        Yeni Kullanıcı Ekle
                    </button>
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
                                    <td className="py-3 px-4 text-center">{getRoleBadge(user.role)}</td>
                                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                                        <button onClick={() => handleEdit(user)} className="text-blue-500 hover:underline text-sm font-semibold">Düzenle</button>
                                        {currentUser?.id !== user.id && (
                                            <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:underline text-sm font-semibold">Sil</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isModalOpen && <UserEditModal user={editingUser} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default SuperAdminDashboard;