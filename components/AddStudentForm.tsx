import React, { useState, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { UserRole, User, AcademicTrack } from '../types';
import { ImageIcon } from './Icons';

const AddUserForm = ({ onClose }: { onClose: () => void }) => {
    const { addUser, uploadFile, users, currentUser } = useDataContext();
    const { addToast } = useUI();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Student);
    const [gradeLevel, setGradeLevel] = useState('');
    const [academicTrack, setAcademicTrack] = useState<AcademicTrack | ''>('');
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [assignedCoachId, setAssignedCoachId] = useState<string | null>(currentUser?.role === UserRole.Coach ? currentUser.id : '');
    const [isLoading, setIsLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const coaches = users.filter(u => u.role === UserRole.Coach);

    const academicTrackLabels: Record<AcademicTrack, string> = {
        [AcademicTrack.Sayisal]: 'Sayısal',
        [AcademicTrack.EsitAgirlik]: 'Eşit Ağırlık',
        [AcademicTrack.Sozel]: 'Sözel',
        [AcademicTrack.Dil]: 'Dil',
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePictureFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const isStudent = role === UserRole.Student;
        if (!name || !email) {
            addToast("Lütfen ad ve e-posta alanlarını doldurun.", "error");
            return;
        }
        if (isStudent && (!gradeLevel || !academicTrack)) {
             addToast("Öğrenciler için sınıf ve bölüm zorunludur.", "error");
            return;
        }
        if (currentUser?.role === UserRole.SuperAdmin && isStudent && !assignedCoachId) {
            addToast("Lütfen öğrenci için bir koç atayın.", "error");
            return;
        }

        setIsLoading(true);
        try {
            let profilePictureUrl = `https://i.pravatar.cc/150?u=${email}`;
            if (profilePictureFile) {
                profilePictureUrl = await uploadFile(profilePictureFile, `profile-pictures/${Date.now()}-${profilePictureFile.name}`);
            }
            
            const newUser: Omit<User, 'id'> = {
                name,
                email,
                role,
                profilePicture: profilePictureUrl,
                assignedCoachId: isStudent ? assignedCoachId : null,
                gradeLevel: isStudent ? gradeLevel : undefined,
                academicTrack: isStudent ? (academicTrack as AcademicTrack || undefined) : undefined,
            };

            await addUser(newUser);
            addToast("Kullanıcı başarıyla eklendi!", "success");
            onClose();
        } catch (error) {
            console.error(error);
            addToast("Kullanıcı eklenirken bir hata oluştu.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center space-y-2">
                <div 
                    className="relative w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-500"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="Profil önizlemesi" className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                    )}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-primary-500 hover:underline">
                    Fotoğraf Yükle
                </button>
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="student-name" className="block text-sm font-medium mb-1">Ad Soyad</label>
                    <input
                        id="student-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="student-email" className="block text-sm font-medium mb-1">E-posta</label>
                    <input
                        id="student-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                        required
                    />
                </div>
            </div>
            
            {currentUser?.role === UserRole.SuperAdmin && (
                 <div>
                    <label htmlFor="user-role" className="block text-sm font-medium mb-1">Rol</label>
                    <select
                        id="user-role"
                        value={role}
                        onChange={e => setRole(e.target.value as UserRole)}
                        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                        required
                    >
                        <option value={UserRole.Student}>Öğrenci</option>
                        <option value={UserRole.Coach}>Koç</option>
                    </select>
                </div>
            )}

            {role === UserRole.Student && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="grade-level" className="block text-sm font-medium mb-1">Sınıf</label>
                        <select
                            id="grade-level"
                            value={gradeLevel}
                            onChange={e => setGradeLevel(e.target.value)}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                            required
                        >
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
                        <select
                            id="academic-track"
                            value={academicTrack}
                            onChange={e => setAcademicTrack(e.target.value as AcademicTrack)}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                            required
                        >
                            <option value="" disabled>Bölüm seçin</option>
                            {Object.values(AcademicTrack).map(track => (
                                <option key={track} value={track}>{academicTrackLabels[track]}</option>
                             ))}
                        </select>
                    </div>
                </div>

                {currentUser?.role === UserRole.SuperAdmin && (
                     <div>
                        <label htmlFor="assigned-coach" className="block text-sm font-medium mb-1">Koç Ata</label>
                        <select
                            id="assigned-coach"
                            value={assignedCoachId || ''}
                            onChange={e => setAssignedCoachId(e.target.value)}
                            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                            required
                        >
                            <option value="" disabled>Bir koç seçin</option>
                            {coaches.map(coach => (
                                <option key={coach.id} value={coach.id}>{coach.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </>
            )}

            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" disabled={isLoading}>İptal</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50" disabled={isLoading}>
                    {isLoading ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
                </button>
            </div>
        </form>
    );
};
export default AddUserForm;