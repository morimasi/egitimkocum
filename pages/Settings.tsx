import React, { useState, useRef, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, User, BadgeID } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { CheckCircleIcon, EditIcon, KeyIcon, LogoutIcon, AwardIcon, StarIcon, ZapIcon, RocketIcon, PlusCircleIcon, StudentsIcon, LibraryIcon, MegaphoneIcon, AlertTriangleIcon, TrophyIcon, FlameIcon } from '../components/Icons';
import ConfirmationModal from '../components/ConfirmationModal';

const EditProfileModal = ({ user, onClose }: { user: User; onClose: () => void }) => {
    const { updateUser, uploadFile } = useDataContext();
    const { addToast } = useUI();
    const [name, setName] = useState(user.name);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateUser({ ...user, name });
        addToast("Profil başarıyla güncellendi.", "success");
        onClose();
    };

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                // FIX: Removed the second argument from the uploadFile call
                const newProfilePictureUrl = await uploadFile(file);
                await updateUser({ ...user, profilePicture: newProfilePictureUrl });
                addToast("Profil fotoğrafı güncellendi.", "success");
            } catch (error) {
                addToast("Profil fotoğrafı güncellenirken bir hata oluştu.", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Profili Düzenle">
            <form onSubmit={handleUpdate} className="space-y-4">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <img src={user.profilePicture} alt="Profile" className="w-24 h-24 rounded-full mb-4" loading="lazy" />
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
                    <input type="email" value={user.email} className="w-full p-2 border rounded-md bg-gray-200 dark:bg-gray-800 dark:border-gray-700" disabled/>
                </div>
                 <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Kaydet</button>
                </div>
            </form>
        </Modal>
    );
};

const BadgeIcon = ({ badgeId }: { badgeId: BadgeID }) => {
    const icons: { [key in BadgeID]: React.ReactNode } = {
        [BadgeID.FirstAssignment]: <StarIcon className="w-8 h-8 text-yellow-500" />,
        [BadgeID.HighAchiever]: <RocketIcon className="w-8 h-8 text-blue-500" />,
        [BadgeID.PerfectScore]: <TrophyIcon className="w-8 h-8 text-amber-500" />,
        [BadgeID.GoalGetter]: <TrophyIcon className="w-8 h-8 text-green-500" />,
        [BadgeID.StreakStarter]: <FlameIcon className="w-8 h-8 text-orange-500" />,
        [BadgeID.StreakMaster]: <FlameIcon className="w-8 h-8 text-red-500" />,
        [BadgeID.OnTimeSubmissions]: <StarIcon className="w-8 h-8 text-indigo-500" />,
    };
    return <>{icons[badgeId] || <TrophyIcon className="w-8 h-8 text-gray-400" />}</>;
};

const StudentSettings = () => {
    const { currentUser, getAssignmentsForStudent, getGoalsForStudent, coach, logout, badges } = useDataContext();
    const { startTour, addToast } = useUI();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!currentUser) return null;

    const assignments = getAssignmentsForStudent(currentUser.id);
    const completedAssignments = assignments.filter(a => a.status === 'graded' || a.status === 'submitted');
    const gradedAssignments = assignments.filter(a => a.grade !== null);
    const avgGrade = gradedAssignments.length > 0 ? Math.round(gradedAssignments.reduce((sum, a) => sum + a.grade!, 0) / gradedAssignments.length) : 0;
    const goals = getGoalsForStudent(currentUser.id);
    const completedGoals = goals.filter(g => g.isCompleted);
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card className="text-center">
                    <img src={currentUser.profilePicture} alt="Profile" className="w-28 h-28 rounded-full mx-auto border-4 border-white dark:border-gray-800 shadow-lg -mt-16" loading="lazy" />
                    <h2 className="text-2xl font-bold mt-4">{currentUser.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                    <button onClick={() => setIsEditModalOpen(true)} className="mt-4 w-full px-4 py-2 bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-900 font-semibold flex items-center justify-center gap-2">
                        <EditIcon className="w-4 h-4" /> Profili Düzenle
                    </button>
                </Card>
                 <Card title="Hesap Yönetimi">
                     <div className="space-y-4">
                        <div className="flex justify-between items-center"><p>Şifrenizi değiştirin.</p><button onClick={() => addToast("Bu özellik yakında eklenecektir.", "info")} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"><KeyIcon className="w-4 h-4"/> Şifre Değiştir</button></div>
                        <div className="flex justify-between items-center"><p>Uygulama tanıtım turunu yeniden başlatın.</p><button onClick={startTour} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Turu Başlat</button></div>
                         <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700"><p>Oturumu güvenle kapatın.</p><button onClick={logout} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900 font-semibold"><LogoutIcon className="w-4 h-4"/> Çıkış Yap</button></div>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                 <Card title="İstatistiklerim">
                     <ul className="space-y-3 text-sm">
                        <li className="flex justify-between"><span>Atanmış Koç:</span> <span className="font-semibold">{coach?.name || 'Yok'}</span></li>
                        <li className="flex justify-between"><span>Tamamlanan Ödev:</span> <span className="font-semibold">{completedAssignments.length}</span></li>
                        <li className="flex justify-between"><span>Not Ortalaması:</span> <span className="font-semibold">{avgGrade}</span></li>
                        <li className="flex justify-between"><span>Tamamlanan Hedef:</span> <span className="font-semibold">{completedGoals.length}</span></li>
                    </ul>
                </Card>
                <Card title="Başarımlarım">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {badges.map(badge => {
                            const isEarned = currentUser.earnedBadgeIds?.includes(badge.id);
                            return (
                                <div key={badge.id} title={`${badge.name}: ${badge.description}`} className={`p-4 rounded-lg flex items-center gap-4 border ${isEarned ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-700' : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-60'}`}>
                                    <div className="flex-shrink-0">
                                        <BadgeIcon badgeId={badge.id} />
                                    </div>
                                    <div>
                                        <h5 className={`font-bold text-sm ${isEarned ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>{badge.name}</h5>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
            {isEditModalOpen && <EditProfileModal user={currentUser} onClose={() => setIsEditModalOpen(false)} />}
        </div>
    );
};

const CoachSettings = () => {
    const { currentUser, students, assignments, templates, logout } = useDataContext();
    const { startTour, addToast, setActivePage } = useUI();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!currentUser) return null;

    const gradedAssignments = assignments.filter(a => a.grade !== null);
    const avgGrade = gradedAssignments.length > 0 ? Math.round(gradedAssignments.reduce((sum, a) => sum + a.grade!, 0) / gradedAssignments.length) : 'N/A';

     const quickActions = useMemo(() => [
        {
            label: "Yeni Ödev Oluştur",
            icon: <PlusCircleIcon className="w-6 h-6 text-blue-500" />,
            action: () => setActivePage('assignments')
        },
        {
            label: "Duyuru Yap",
            icon: <MegaphoneIcon className="w-6 h-6 text-yellow-500" />,
            action: () => setActivePage('messages')
        },
        {
            label: "Öğrencileri Görüntüle",
            icon: <StudentsIcon className="w-6 h-6 text-green-500" />,
            action: () => setActivePage('students')
        },
        {
            label: "Kütüphaneyi Yönet",
            icon: <LibraryIcon className="w-6 h-6 text-purple-500" />,
            action: () => setActivePage('library')
        }
    ], [setActivePage]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card className="text-center">
                    <img src={currentUser.profilePicture} alt="Profile" className="w-28 h-28 rounded-full mx-auto border-4 border-white dark:border-gray-800 shadow-lg -mt-16" loading="lazy" />
                    <h2 className="text-2xl font-bold mt-4">{currentUser.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                    <button onClick={() => setIsEditModalOpen(true)} className="mt-4 w-full px-4 py-2 bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-900 font-semibold flex items-center justify-center gap-2">
                        <EditIcon className="w-4 h-4" /> Profili Düzenle
                    </button>
                </Card>
                <Card title="Koçluk İstatistikleri">
                     <ul className="space-y-3 text-sm">
                        <li className="flex justify-between"><span>Toplam Öğrenci:</span> <span className="font-semibold">{students.length}</span></li>
                        <li className="flex justify-between"><span>Notlandırılan Ödev:</span> <span className="font-semibold">{gradedAssignments.length}</span></li>
                        <li className="flex justify-between"><span>Genel Not Ortalaması:</span> <span className="font-semibold">{avgGrade}</span></li>
                        <li className="flex justify-between"><span>Ödev Şablonu:</span> <span className="font-semibold">{templates.length}</span></li>
                    </ul>
                </Card>
                 <Card title="Hesap Yönetimi">
                     <div className="space-y-4">
                        <div className="flex justify-between items-center"><p>Şifrenizi değiştirin.</p><button onClick={() => addToast("Bu özellik yakında eklenecektir.", "info")} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"><KeyIcon className="w-4 h-4"/> Şifre Değiştir</button></div>
                        <div className="flex justify-between items-center"><p>Uygulama tanıtım turunu yeniden başlatın.</p><button onClick={startTour} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Turu Başlat</button></div>
                        <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700"><p>Oturumu güvenle kapatın.</p><button onClick={logout} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900 font-semibold"><LogoutIcon className="w-4 h-4"/> Çıkış Yap</button></div>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card title="Hızlı Eylemler">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {quickActions.map(action => (
                            <button key={action.label} onClick={action.action} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center gap-2 transition-all transform hover:scale-105 active:bg-gray-200 dark:active:bg-gray-600">
                                {action.icon}
                                <span className="text-sm font-semibold text-center">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </Card>
                 <Card title="Ödev Şablonlarım">
                     {templates.length > 0 ? (
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {templates.map(template => (
                                <li key={template.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <h5 className="font-semibold text-sm">{template.title}</h5>
                                    <p className="text-xs text-gray-500 truncate">{template.description}</p>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-500">Henüz oluşturulmuş bir şablonunuz yok.</p>}
                </Card>
            </div>
            {isEditModalOpen && <EditProfileModal user={currentUser} onClose={() => setIsEditModalOpen(false)} />}
        </div>
    );
};

const AdminSettings = () => {
    return (
        <div className="space-y-6 max-w-2xl mx-auto pt-8">
             <Card title="Platform Ayarları">
                <div className="text-center">
                    <h4 className="font-semibold">Uygulama Bilgisi</h4>
                    <p className="text-sm text-gray-500 mt-2">
                        Bu uygulama canlı Firebase verileriyle çalışmaktadır. Yaptığınız tüm değişiklikler kalıcı olacaktır. Yönetimsel işlemler ve kullanıcı yönetimi için Süper Admin Paneli'ni kullanabilirsiniz.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default function Settings() {
    const { currentUser } = useDataContext();
    if (!currentUser) return null;
    
    const roleBasedSettings = {
        [UserRole.SuperAdmin]: <AdminSettings />,
        [UserRole.Coach]: <CoachSettings />,
        [UserRole.Student]: <StudentSettings />,
        [UserRole.Parent]: <CoachSettings />, // Parents can use a simplified version of coach settings for profile management
    };

    return (
         <div>
            {currentUser.role !== UserRole.SuperAdmin && <div className="h-32 bg-primary-600 dark:bg-primary-800 rounded-t-xl -mb-16"></div>}
            <div className="px-4 md:px-6 lg:px-8">
                {roleBasedSettings[currentUser.role] || null}
            </div>
        </div>
    );
}