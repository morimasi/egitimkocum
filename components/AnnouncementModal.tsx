


import { useState } from 'react';
import Modal from './Modal';
import { useDataContext } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { NotificationPriority } from '../types';

const AnnouncementModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { currentUser, sendMessage } = useDataContext();
    const { addToast } = useUI();
    const [announcementText, setAnnouncementText] = useState('');
    const [priority, setPriority] = useState<NotificationPriority>(NotificationPriority.High);

    const handleSendAnnouncement = () => {
        if (!announcementText.trim() || !currentUser) return;
        sendMessage({
            senderId: currentUser.id,
            conversationId: 'conv-announcements',
            text: announcementText,
            type: 'announcement',
            priority: priority,
        });
        addToast("Duyuru başarıyla gönderildi.", "success");
        setAnnouncementText('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Duyuru Yap">
            <div className="space-y-4">
                <p className="text-sm text-gray-500">Bu mesaj tüm öğrencilerinize gönderilecektir.</p>
                <textarea
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    rows={5}
                    placeholder="Duyurunuzu buraya yazın..."
                    className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                ></textarea>
                 <div>
                    <label className="block text-sm font-medium mb-1">Önem Düzeyi</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as NotificationPriority)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <option value={NotificationPriority.High}>Yüksek</option>
                        <option value={NotificationPriority.Critical}>Kritik</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                <button onClick={handleSendAnnouncement} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Gönder</button>
            </div>
        </Modal>
    );
};

export default AnnouncementModal;