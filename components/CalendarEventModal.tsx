import { useState } from 'react';
import Modal from './Modal';
import { useDataContext } from '../contexts/DataContext';

interface CalendarEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventDate: Date;
}

const CalendarEventModal = ({ isOpen, onClose, eventDate }: CalendarEventModalProps) => {
    const { addCalendarEvent, currentUser } = useDataContext();
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'personal' | 'study'>('study');
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('11:00');

    const colors: Record<typeof type, string> = {
        personal: 'bg-green-500',
        study: 'bg-indigo-500',
    };

    const handleSubmit = async () => {
        if (!title || !currentUser) return;
        await addCalendarEvent({
            userId: currentUser.id,
            title,
            date: eventDate.toISOString().split('T')[0],
            type,
            color: colors[type],
            startTime,
            endTime,
        });
        onClose();
    };

    const footer = (
        <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Etkinlik Ekle</button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${eventDate.toLocaleDateString('tr-TR')} için Etkinlik Ekle`} footer={footer}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="event-title" className="block text-sm font-medium mb-1">Başlık</label>
                    <input id="event-title" type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                    <label htmlFor="event-type" className="block text-sm font-medium mb-1">Tür</label>
                    <select id="event-type" value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                        <option value="study">Ders/Etüt</option>
                        <option value="personal">Kişisel</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start-time" className="block text-sm font-medium mb-1">Başlangıç</label>
                        <input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="end-time" className="block text-sm font-medium mb-1">Bitiş</label>
                        <input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CalendarEventModal;