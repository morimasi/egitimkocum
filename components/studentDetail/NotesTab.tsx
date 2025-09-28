import React, { useState, useRef, useEffect } from 'react';
import { useDataContext } from '../../contexts/DataContext';
import { User } from '../../types';

const NotesTab = ({ student }: { student: User }) => {
    const { updateStudentNotes } = useDataContext();
    const [notes, setNotes] = useState(student.notes || '');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const notesTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => { if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current); };
    }, []);

    useEffect(() => {
        setNotes(student.notes || '');
    }, [student.notes]);

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newNotes = e.target.value;
        setNotes(newNotes);
        setSaveStatus('saving');
        if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
        notesTimeoutRef.current = window.setTimeout(() => {
            updateStudentNotes(student.id, newNotes);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000); 
        }, 1500);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Özel Notlar</h4>
                <div className="text-right text-xs text-gray-400 dark:text-gray-500 h-4 transition-opacity duration-300">
                    {saveStatus === 'saving' && 'Kaydediliyor...'}
                    {saveStatus === 'saved' && <span className="text-green-500 font-semibold">Kaydedildi ✔</span>}
                </div>
            </div>
            <p className="text-xs text-gray-500 mb-2">Bu notlar sadece sizin tarafınızdan görülebilir.</p>
            <textarea value={notes} onChange={handleNotesChange} rows={12} className="w-full p-3 border rounded-md bg-yellow-50 dark:bg-gray-900/50 dark:border-gray-600 focus:ring-primary-500" placeholder={`${student.name} hakkında notlar alın...`} />
        </div>
    );
};
export default NotesTab;