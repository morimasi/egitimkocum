import React, { useState, useEffect, useMemo } from 'react';
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


// Fix: Changed component export to a function declaration to solve lazy loading issue.
export default function SuperAdminDashboard() {
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

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [users, debouncedSearchTerm]);

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        setRoleChanges(prev => ({ ...prev, [userId]: newRole }));
    };

    const handleCoachChange = (studentId: string, newCoachId: string) => {
        setCoachChanges(prev => ({ ...prev, [studentId]: newCoachId === 'null' ? null : newCoachId }));
    };

    const handleSaveUser = async (user: User) => {
        setSavingStates(prev => ({ ...prev, [user.id]: true }));
        try {
            const updatedUser = {
                ...user,
                role: roleChanges[user.id] ?? user.role,
                assignedCoachId: coachChanges[user.id] !== undefined ? coachChanges[user.id] : user.assignedCoachId
            };
            await updateUser(updatedUser);
            addToast(`${user.name} başarıyla güncellendi.`, "success");
            
            // Clean up state
            setRoleChanges(prev => { const newState = { ...prev }; delete newState[user.id]; return newState; });
            setCoachChanges(prev => { const newState = { ...prev }; delete newState[user.id]; return newState; });

        } catch (error) {
            addToast("Kullanıcı güncellenirken bir hata oluştu.", "error");
        } finally {
            setSavingStates(prev => ({ ...prev, [user.id]: false }));
        }
    };

    const handleDeleteUser = (user: User) => {
        if (user.id === currentUser?.id) {
            addToast("Kendinizi silemezsiniz.", "error");
            return;
        }
        setConfirmationState({
            isOpen: true,
            title: "Kullanıcıyı Sil",
            message: `${user.name} adlı kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            onConfirm: async () => {
                await deleteUser(user.id);
                addToast(`${user.name} silindi.`, "success");
                setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            }
        });
    };

    const kpis = [
        { title: "Toplam Kullanıcı", value: users.length, icon: <StudentsIcon className="w-6 h-6 text-white"/>, color: "bg-blue-500" },
        { title: "Toplam Ödev", value: assignments.length, icon: <AssignmentsIcon className="w-6 h-6 text-white"/>, color: "bg-green-500" },
        { title: "Kütüphane Kaynakları", value: resources.length, icon: <LibraryIcon className="w-6 h-6 text-white"/>, color: "bg-purple-500" },
        { title: "Belirlenen Hedefler", value: goals.length, icon: <TargetIcon className="w-6 h-6 text-white"/>, color: "bg-yellow-500" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map(kpi => <KpiCard key={kpi.title} {...kpi} />)}
            </div>

            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold">Kullanıcı Yönetimi</h2>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                         <input
                            type="text"
                            placeholder="Kullanıcı ara (ad veya e-posta)..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 w-full md:w-64"
                        />
                        <button onClick={() => setIsNewUserModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold flex-shrink-0">
                            + Yeni Kullanıcı
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atanmış Koç</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full" src={user.profilePicture} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={roleChanges[user.id] || user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                            className="p-1 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                        >
                                            <option value={UserRole.Student}>Öğrenci</option>
                                            <option value={UserRole.Coach}>Koç</option>
                                            <option value={UserRole.SuperAdmin}>Süper Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.role === UserRole.Student && (
                                            <select
                                                value={coachChanges[user.id] !== undefined ? (coachChanges[user.id] || 'null') : (user.assignedCoachId || 'null')}
                                                onChange={(e) => handleCoachChange(user.id, e.target.value)}
                                                className="p-1 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                            >
                                                <option value="null">Atanmamış</option>
                                                {coaches.map(coach => <option key={coach.id} value={coach.id}>{coach.name}</option>)}
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {(roleChanges[user.id] || coachChanges[user.id] !== undefined) && (
                                            <button onClick={() => handleSaveUser(user)} className="text-primary-600 hover:text-primary-900" disabled={savingStates[user.id]}>
                                                {savingStates[user.id] ? 'Kaydediliyor...' : 'Kaydet'}
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-900 ml-4">Sil</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card title="Rozet Yönetimi">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {badges.map(badge => (
                        <div key={badge.id} className="p-3 border dark:border-gray-700 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TrophyIcon className="w-6 h-6 text-yellow-500" />
                                <div>
                                    <p className="font-semibold text-sm">{badge.name}</p>
                                    <p className="text-xs text-gray-500">{badge.description}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingBadge(badge)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <EditIcon className="w-4 h-4 text-gray-500"/>
                            </button>
                        </div>
                    ))}
                </div>
            </Card>

            {isNewUserModalOpen && <NewUserModal onClose={() => setIsNewUserModalOpen(false)} />}
            {editingBadge && <EditBadgeModal badge={editingBadge} onClose={() => setEditingBadge(null)} />}
            <ConfirmationModal
                isOpen={confirmationState.isOpen}
                onClose={() => setConfirmationState({ ...confirmationState, isOpen: false })}
                onConfirm={confirmationState.onConfirm}
                title={confirmationState.title}
                message={confirmationState.message}
                confirmText="Evet, Sil"
            />
        </div>
    );
};
