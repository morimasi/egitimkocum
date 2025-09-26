import React, { useState, useEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, UserRole, AssignmentStatus, Badge } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { StudentsIcon, AssignmentsIcon, LibraryIcon, TargetIcon, TrophyIcon, EditIcon } from '../components/Icons';

const KpiCard = React.memo(({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
    <Card className="flex items-center">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </Card>
));

const NewUserModal = ({ onClose }: { onClose: () => void }) => {
    const { addUser, users } = useDataContext();
    const { addToast } = useUI();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Student);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(users.some(u => u.email === email)) {
            addToast("Bu e-posta adresi zaten kullanımda.", "error");
            return;
        }
        setIsLoading(true);
        try {
            await addUser({ 
                name, 
                email, 
                role, 
                profilePicture: `https://i.pravatar.cc/150?u=${email}` 
            });
            addToast("Kullanıcı başarıyla oluşturuldu.", "success");
            onClose();
        } catch (error) {
             addToast("Kullanıcı oluşturulurken bir hata oluştu.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Kullanıcı Ekle">
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
                    <label className="block text-sm font-medium mb-1">Şifre (Geçici)</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required/>
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
                        {isLoading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const EditBadgeModal = ({ badge, onClose }: { badge: Badge; onClose: () => void }) => {
    const { updateBadge } = useDataContext();
    const { addToast } = useUI();
    const [name, setName] = useState(badge.name);
    const [description, setDescription] = useState(badge.description);

    const handleSave = async () => {
        await updateBadge({ ...badge, name, description });
        addToast("Rozet güncellendi.", "success");
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Rozeti Düzenle">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Rozet Adı</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Açıklama</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600">İptal</button>
                <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded-md">Kaydet</button>
            </div>
        </Modal>
    );
};


const SuperAdminDashboard = () => {
    const { currentUser, users, updateUser, deleteUser, assignments, resources, goals, badges } = useDataContext();
    const { addToast } = useUI();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [roleChanges, setRoleChanges] = useState<Record<string, UserRole>>({});
    const [coachChanges, setCoachChanges] = useState<Record<string, string | null>>({});
    const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
    const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);


    // Confirmation Modal State
    const [confirmationState, setConfirmationState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const coaches = users.filter(u => u.role === UserRole.Coach);
    const students = users.filter(u => u.role === UserRole.Student);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    const handleDeleteRequest = (user: User) => {
        if (currentUser?.id === user.id) {
            addToast("Kendinizi silemezsiniz.", "error");
            return;
        }
        setConfirmationState({
            isOpen: true,
            title: "Kullanıcıyı Sil",
            message: `'${user.name}' adlı kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu kullanıcıya ait tüm veriler de silinecektir. Bu işlem geri alınamaz.`,
            onConfirm: () => handleConfirmDelete(user.id),
        });
    };

    const handleConfirmDelete = (userId: string) => {
        deleteUser(userId);
        addToast("Kullanıcı başarıyla silindi.", "success");
    };

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        setRoleChanges(prev => ({ ...prev, [userId]: newRole }));
    };

    const handleCoachChange = (studentId: string, coachId: string) => {
        setCoachChanges(prev => ({ ...prev, [studentId]: coachId === '' ? null : coachId }));
    };

    const handleSaveRoleRequest = (user: User) => {
        const newRole = roleChanges[user.id];
        if (!newRole) return;
        setConfirmationState({
            isOpen: true,
            title: "Rol Değişikliğini Onayla",
            message: `'${user.name}' kullanıcısının rolünü '${newRole}' olarak değiştirmek istediğinizden emin misiniz?`,
            onConfirm: () => handleSaveRole(user, newRole),
        });
    };
    
    const handleSaveCoachRequest = (user: User) => {
        const newCoachId = coachChanges[user.id];
        if (newCoachId === undefined) return;
        const coachName = coaches.find(c => c.id === newCoachId)?.name || 'atanmamış';
        setConfirmationState({
            isOpen: true,
            title: "Koç Atamasını Onayla",
            message: `'${user.name}' kullanıcısını '${coachName}' olarak atamak istediğinizden emin misiniz?`,
            onConfirm: () => handleSaveCoachAssignment(user, newCoachId),
        });
    };

    const handleSaveRole = async (user: User, newRole: UserRole) => {
        setSavingStates(prev => ({ ...prev, [user.id]: true }));
        try {
            await updateUser({ ...user, role: newRole });
            addToast(`Rol güncellendi.`, "success");
            setRoleChanges(prev => {
                const newChanges = { ...prev };
                delete newChanges[user.id];
                return newChanges;
            });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Rol güncellenirken bir hata oluştu.";
            addToast(message, "error");
        } finally {
            setSavingStates(prev => ({ ...prev, [user.id]: false }));
        }
    };
    
    const handleSaveCoachAssignment = async (user: User, newCoachId: string | null) => {
        setSavingStates(prev => ({...prev, [user.id]: true}));
        try {
            await updateUser({...user, assignedCoachId: newCoachId});
            addToast(`Koç ataması güncellendi.`, "success");
            setCoachChanges(prev => {
                const newChanges = {...prev};
                delete newChanges[user.id];
                return newChanges;
            });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : "Koç atanırken bir hata oluştu.";
            addToast(message, "error");
        } finally {
             setSavingStates(prev => ({ ...prev, [user.id]: false }));
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Süper Admin Paneli</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <KpiCard title="Toplam Koç" value={coaches.length} icon={<StudentsIcon className="w-6 h-6 text-green-800" />} color="bg-green-200" />
                <KpiCard title="Toplam Öğrenci" value={students.length} icon={<StudentsIcon className="w-6 h-6 text-yellow-800" />} color="bg-yellow-200" />
                <KpiCard title="Toplam Ödev" value={assignments.length} icon={<AssignmentsIcon className="w-6 h-6 text-indigo-800" />} color="bg-indigo-200" />
                <KpiCard title="Kaynak Sayısı" value={resources.length} icon={<LibraryIcon className="w-6 h-6 text-purple-800" />} color="bg-purple-200" />
                <KpiCard title="Hedef Sayısı" value={goals.length} icon={<TargetIcon className="w-6 h-6 text-teal-800" />} color="bg-teal-200" />
                <KpiCard title="Rozet Sayısı" value={badges.length} icon={<TrophyIcon className="w-6 h-6 text-amber-800" />} color="bg-amber-200" />
            </div>

            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold">Kullanıcı Yönetimi</h2>
                    <div className="flex-1 flex justify-end gap-4 w-full">
                         <input
                            type="text"
                            placeholder="Kullanıcı ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 w-full md:w-auto"
                        />
                        <button onClick={() => setIsNewUserModalOpen(true)} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 whitespace-nowrap">
                            Yeni Kullanıcı Ekle
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Kullanıcı</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Rol</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Atanmış Koç</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 text-right">Eylemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full mr-3" />
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                         <div className="flex items-center gap-2">
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
                                            {roleChanges[user.id] && (
                                                 <button 
                                                    onClick={() => handleSaveRoleRequest(user)}
                                                    className="text-green-600 hover:underline text-xs font-semibold disabled:text-gray-400 disabled:no-underline"
                                                    disabled={savingStates[user.id]}
                                                >
                                                    {savingStates[user.id] ? '...' : 'Kaydet'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                     <td className="py-3 px-4">
                                        {(roleChanges[user.id] || user.role) === UserRole.Student ? (
                                             <div className="flex items-center gap-2">
                                                <select
                                                    value={coachChanges[user.id] !== undefined ? coachChanges[user.id] ?? '' : user.assignedCoachId ?? ''}
                                                    onChange={(e) => handleCoachChange(user.id, e.target.value)}
                                                    className="p-1 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-xs"
                                                    disabled={savingStates[user.id]}
                                                >
                                                    <option value="">Atanmamış</option>
                                                    {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                {coachChanges[user.id] !== undefined && (
                                                     <button 
                                                        onClick={() => handleSaveCoachRequest(user)}
                                                        className="text-green-600 hover:underline text-xs font-semibold disabled:text-gray-400 disabled:no-underline"
                                                        disabled={savingStates[user.id]}
                                                    >
                                                        {savingStates[user.id] ? '...' : 'Kaydet'}
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
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

            <Card>
                <h2 className="text-xl font-bold mb-4">Oyunlaştırma Yönetimi</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Rozet Adı</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Açıklama</th>
                                <th className="py-3 px-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 text-right">Eylemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {badges.map(badge => (
                                <tr key={badge.id} className="border-b border-gray-200 dark:border-gray-700">
                                    <td className="py-3 px-4 font-medium">{badge.name}</td>
                                    <td className="py-3 px-4 text-gray-500">{badge.description}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button onClick={() => setEditingBadge(badge)} className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isNewUserModalOpen && <NewUserModal onClose={() => setIsNewUserModalOpen(false)} />}
            {editingBadge && <EditBadgeModal badge={editingBadge} onClose={() => setEditingBadge(null)} />}
            {confirmationState.isOpen && (
                <ConfirmationModal
                    isOpen={confirmationState.isOpen}
                    onClose={() => setConfirmationState({ ...confirmationState, isOpen: false })}
                    onConfirm={confirmationState.onConfirm}
                    title={confirmationState.title}
                    message={confirmationState.message}
                    confirmText="Evet, Onayla"
                />
            )}
        </div>
    );
};

export default SuperAdminDashboard;