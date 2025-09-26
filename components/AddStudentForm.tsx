import React, { useState, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { UserRole, User } from '../types';
import { ImageIcon } from './Icons';

const AddStudentForm = ({ onClose }: { onClose: () => void }) => {
    const { addUser, uploadFile, users, currentUser } = useDataContext();
    const { addToast } = useUI();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [assignedCoachId, setAssignedCoachId] = useState<string | null>(currentUser?.role === UserRole.Coach ? currentUser.id : '');
    const [isLoading, setIsLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const coaches = users.filter(u => u.role === UserRole.Coach);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePictureFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            // @FIX: Corrected typo from `readDataAsURL` to `readAsDataURL`.
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            addToast("Ad ve e-posta alanları zorunludur.", "error");
            return;
        }
        if (currentUser?.role === UserRole.SuperAdmin && !assignedCoachId) {
            addToast("Lütfen bir koç atayın.", "error");
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
                role: UserRole.Student,
                profilePicture: profilePictureUrl,
                assignedCoachId,
            };

            await addUser(newUser);
            addToast("Öğrenci başarıyla eklendi!", "success");
            onClose();
        } catch (error) {
            console.error(error);
            addToast("Öğrenci eklenirken bir hata oluştu.", "error");
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
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" disabled={isLoading}>İptal</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50" disabled={isLoading}>
                    {isLoading ? 'Ekleniyor...' : 'Öğrenci Ekle'}
                </button>
            </div>
        </form>
    );
};
export default AddStudentForm;