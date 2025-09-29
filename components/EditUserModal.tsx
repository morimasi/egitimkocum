import React, { useState } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { UserRole, User, AcademicTrack } from '../types';
import Modal from './Modal';

interface EditUserModalProps {
    user: User;
    onClose: () => void;
}

const EditUserModal = ({ user, onClose }: EditUserModalProps) => {
    const { updateUser, users } = useDataContext();
    const { addToast } = useUI();

    const [name, setName] = useState(user.name);
    const [role, setRole] = useState<UserRole>(user.role);
    const [gradeLevel, setGradeLevel] = useState(user.gradeLevel || '');
    const [academicTrack, setAcademicTrack] = useState<AcademicTrack | ''>(user.academicTrack || '');
    const [assignedCoachId, setAssignedCoachId] = useState<string | null>(user.assignedCoachId || '');
    const [isLoading, setIsLoading] = useState(false);

    const coaches = users.filter(u => u.role === UserRole.Coach);

    const academicTrackLabels: Record<AcademicTrack, string> = {
        [AcademicTrack.Sayisal]: 'Sayısal',
        [AcademicTrack.EsitAgirlik]: 'Eşit Ağırlık',
        [AcademicTrack.Sozel]: 'Sözel',
        [AcademicTrack.Dil]: 'Dil',
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isStudent = role === UserRole.Student;
        if (isStudent && (!gradeLevel || !academicTrack || !assignedCoachId)) {
            addToast("Öğrenci için tüm alanlar zorunludur.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const updatedUserData: User = {
                ...user,
                name,
                role,
                assignedCoachId: isStudent ? assignedCoachId : null,
                gradeLevel: isStudent ? gradeLevel : undefined,
                academicTrack: isStudent ? (academicTrack as AcademicTrack) : undefined,
            };

            await updateUser(updatedUserData);
            addToast("Kullanıcı başarıyla güncellendi!", "success");
            onClose();
        } catch (error) {
            console.error(error);
            addToast("Kullanıcı güncellenirken bir hata oluştu.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`${user.name} Bilgilerini Düzenle`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="user-name" className="block text-sm font-medium mb-1">Ad Soyad</label>
                        <input id="user-name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label htmlFor="user-email" className="block text-sm font-medium mb-1">E-posta</label>
                        <input id="user-email" type="email" value={user.email} className="w-full p-2 border rounded-md bg-gray-200 dark:bg-gray-800 dark:border-gray-700" disabled />
                    </div>
                </div>

                <div>
                    <label htmlFor="user-role" className="block text-sm font-medium mb-1">Rol</label>
                    <select id="user-role" value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required>
                        <option value={UserRole.Student}>Öğrenci</option>
                        <option value={UserRole.Coach}>Koç</option>
                    </select>
                </div>

                {role === UserRole.Student && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="grade-level" className="block text-sm font-medium mb-1">Sınıf</label>
                                <select id="grade-level" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required>
                                    <option value="" disabled>Sınıf seçin</option>
                                    <option value="9">9. Sınıf</option>
                                    <option value="10">10. Sınıf</option>
                                    <option value="11">11. Sınıf</option>
                                    <option value="12">12. Sınıf</option>
                                    <option value="mezun">Mezun</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="academic-track" className="block text-sm font-medium mb-1">Bölüm</label>
                                <select id="academic-track" value={academicTrack} onChange={e => setAcademicTrack(e.target.value as AcademicTrack)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required>
                                    <option value="" disabled>Bölüm seçin</option>
                                    {Object.values(AcademicTrack).map(track => (
                                        <option key={track} value={track}>{academicTrackLabels[track]}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="assigned-coach" className="block text-sm font-medium mb-1">Koç Ata</label>
                            <select id="assigned-coach" value={assignedCoachId || ''} onChange={e => setAssignedCoachId(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required>
                                <option value="" disabled>Bir koç seçin</option>
                                {coaches.map(coach => (
                                    <option key={coach.id} value={coach.id}>{coach.name}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" disabled={isLoading}>İptal</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50" disabled={isLoading}>
                        {isLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditUserModal;