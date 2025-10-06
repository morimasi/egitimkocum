import React, { useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, UserRole, Badge } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { StudentsIcon, AssignmentsIcon, EditIcon } from '../components/Icons';
import AddUserForm from '../components/AddStudentForm';
import EditUserModal from '../components/EditUserModal';

const getRoleLabel = (role: UserRole) => {
    switch (role) {
        case UserRole.SuperAdmin: return 'Süper Admin';
        case UserRole.Coach: return 'Koç';
        case UserRole.Student: return 'Öğrenci';
        case UserRole.Parent: return 'Veli';
        default: return 'Bilinmiyor';
    }
};

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
                <button onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Kaydet</button>
            </div>
        </Modal>
    );
};

export default function SuperAdminDashboard() {
    const { users, assignments, badges, deleteUser, seedDatabase } = useDataContext();
    const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [badgeToEdit, setBadgeToEdit] = useState<Badge | null>(null);
    const [isConfirmSeedOpen, setIsConfirmSeedOpen] = useState(false);

    const kpis = useMemo(() => ({
        totalUsers: users.length,
        totalCoaches: users.filter(u => u.role === UserRole.Coach).length,
        totalStudents: users.filter(u => u.role === UserRole.Student).length,
        totalAssignments: assignments.length,
    }), [users, assignments]);
    
    const allUsersData = useMemo(() => {
        const coachMap = new Map(users.filter(u => u.role === UserRole.Coach).map(c => [c.id, c.name]));
        return users
            .map(user => ({
                ...user,
                coachName: user.role === UserRole.Student && user.assignedCoachId ? coachMap.get(user.assignedCoachId) || 'Atanmamış' : undefined
            }))
            .sort((a, b) => { 
                const roleOrder = [UserRole.SuperAdmin, UserRole.Coach, UserRole.Student, UserRole.Parent];
                if (roleOrder.indexOf(a.role) !== roleOrder.indexOf(b.role)) {
                    return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
                }
                return a.name.localeCompare(b.name);
            });
    }, [users]);


    const handleUserDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };
    
    const handleConfirmSeed = () => {
        seedDatabase();
        setIsConfirmSeedOpen(false);
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Süper Admin Paneli</h1>
                <button onClick={() => setIsNewUserModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold">
                    + Yeni Kullanıcı Ekle
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Toplam Kullanıcı" value={kpis.totalUsers} icon={<StudentsIcon className="w-6 h-6 text-white"/>} color="bg-blue-500" />
                <KpiCard title="Toplam Koç" value={kpis.totalCoaches} icon={<StudentsIcon className="w-6 h-6 text-white"/>} color="bg-green-500" />
                <KpiCard title="Toplam Öğrenci" value={kpis.totalStudents} icon={<StudentsIcon className="w-6 h-6 text-white"/>} color="bg-purple-500" />
                <KpiCard title="Toplam Ödev" value={kpis.totalAssignments} icon={<AssignmentsIcon className="w-6 h-6 text-white"/>} color="bg-yellow-500" />
            </div>
            
             <Card title="Kullanıcı Yönetimi">
                <div className="overflow-x-auto max-h-[30rem]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Kullanıcı</th>
                                <th scope="col" className="px-4 py-3 hidden md:table-cell">E-posta</th>
                                <th scope="col" className="px-4 py-3">Rol</th>
                                <th scope="col" className="px-4 py-3 hidden lg:table-cell">Detay</th>
                                <th scope="col" className="px-4 py-3 text-right">Eylemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsersData.map(user => (
                                <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full" loading="lazy" />
                                            {user.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            user.role === UserRole.SuperAdmin ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                                            user.role === UserRole.Coach ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                                            user.role === UserRole.Student ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                                        }`}>{getRoleLabel(user.role)}</span>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">{user.role === UserRole.Student ? `Koç: ${user.coachName}` : '-'}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button onClick={() => setUserToEdit(user)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Düzenle</button>
                                        <button onClick={() => setUserToDelete(user)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Sil</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Rozet Yönetimi">
                     <div className="space-y-3 max-h-96 overflow-y-auto">
                        {badges.map(badge => (
                             <div key={badge.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-sm">{badge.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
                                </div>
                                <button onClick={() => setBadgeToEdit(badge)} className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><EditIcon className="w-4 h-4" /></button>
                             </div>
                        ))}
                    </div>
                </Card>
                <Card title="Platform Yönetimi">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <h4 className="font-semibold">Deneme Verileri</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Platformu test etmek için örnek verilerle doldurun.
                                <strong> Not:</strong> Bu işlem mevcut oturumdaki tüm verileri sıfırlar.
                            </p>
                        </div>
                        <button 
                            onClick={() => setIsConfirmSeedOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold w-full sm:w-auto flex-shrink-0"
                        >
                            Veri Ekle
                        </button>
                    </div>
                </Card>
            </div>
            
            {isNewUserModalOpen && <Modal isOpen={isNewUserModalOpen} onClose={() => setIsNewUserModalOpen(false)} title="Yeni Kullanıcı Ekle"><AddUserForm onClose={() => setIsNewUserModalOpen(false)}/></Modal>}
            {userToEdit && <EditUserModal user={userToEdit} onClose={() => setUserToEdit(null)} />}
            {userToDelete && <ConfirmationModal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} onConfirm={handleUserDelete} title="Kullanıcıyı Sil" message={`'${userToDelete.name}' adlı kullanıcıyı silmek istediğinizden emin misiniz?`} />}
            {badgeToEdit && <EditBadgeModal badge={badgeToEdit} onClose={() => setBadgeToEdit(null)} />}
            {isConfirmSeedOpen && (
                 <ConfirmationModal
                    isOpen={isConfirmSeedOpen}
                    onClose={() => setIsConfirmSeedOpen(false)}
                    onConfirm={handleConfirmSeed}
                    title="Veritabanını Sıfırla"
                    message="Bu işlem, tüm mevcut verileri silecek ve uygulamayı başlangıçtaki deneme verileriyle yeniden yükleyecektir. Emin misiniz?"
                    confirmText="Evet, Sıfırla"
                />
            )}
        </div>
    );
}