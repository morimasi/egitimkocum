import React, { useState } from 'react';
import Modal from './Modal';
import { useDataContext } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';

interface InviteStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const InviteStudentModal = ({ isOpen, onClose }: InviteStudentModalProps) => {
    const { inviteStudent } = useDataContext();
    const { addToast } = useUI();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            addToast("Lütfen tüm alanları doldurun.", "error");
            return;
        }
        setIsLoading(true);
        try {
            await inviteStudent(name, email);
            addToast(`${name} başarıyla davet edildi.`, "success");
            onClose();
        } catch (error: any) {
            console.error("Invitation failed:", error);
            addToast(error.message || "Davet gönderilirken bir hata oluştu.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Öğrenci Davet Et">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-500">
                    Öğrencinin bilgilerini girin. Öğrenci için otomatik olarak bir hesap oluşturulacak ve size bağlı bir sohbet başlatılacaktır.
                </p>
                <div>
                    <label htmlFor="student-name" className="block text-sm font-medium mb-1">Ad Soyad</label>
                    <input
                        id="student-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                        required
                        disabled={isLoading}
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
                        disabled={isLoading}
                    />
                </div>
                 <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" disabled={isLoading}>İptal</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50" disabled={isLoading}>
                        {isLoading ? 'Davet Gönderiliyor...' : 'Davet Et'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default InviteStudentModal;