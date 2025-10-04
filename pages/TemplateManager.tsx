



import React, { useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { AssignmentTemplate, ChecklistItem } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { ClipboardListIcon, EditIcon, TrashIcon, XIcon, SparklesIcon } from '../components/Icons';
import EmptyState from '../components/EmptyState';
import ConfirmationModal from '../components/ConfirmationModal';
import { generateAiTemplate } from '../services/geminiService';

// Modal for adding/editing a template
const TemplateFormModal = ({ isOpen, onClose, templateToEdit }: { isOpen: boolean; onClose: () => void; templateToEdit: AssignmentTemplate | null; }) => {
    const { addTemplate, updateTemplate } = useDataContext();
    const { addToast } = useUI();
    const [title, setTitle] = useState(templateToEdit?.title || '');
    const [description, setDescription] = useState(templateToEdit?.description || '');
    const [checklist, setChecklist] = useState<Omit<ChecklistItem, 'id'|'isCompleted'>[]>(templateToEdit?.checklist || []);

    const [isGenerating, setIsGenerating] = useState(false);
    const [aiParams, setAiParams] = useState({ topic: '', level: 'AYT', duration: '1 Hafta' });

    const handleChecklistItemChange = (index: number, text: string) => {
        const newChecklist = [...checklist];
        newChecklist[index] = { ...newChecklist[index], text };
        setChecklist(newChecklist);
    };

    const addChecklistItem = () => {
        setChecklist([...checklist, { text: '' }]);
    };

    const removeChecklistItem = (index: number) => {
        setChecklist(checklist.filter((_, i) => i !== index));
    };

    const handleGenerateWithAi = async () => {
        if (!aiParams.topic) {
            addToast("Lütfen şablon için bir konu girin.", "error");
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateAiTemplate(aiParams.topic, aiParams.level, aiParams.duration);
            if (result) {
                setTitle(result.title);
                setDescription(result.description);
                setChecklist(result.checklist);
                addToast("Şablon taslağı başarıyla oluşturuldu!", "success");
            } else {
                throw new Error("AI'dan geçerli bir yanıt alınamadı.");
            }
        } catch (error) {
            console.error(error);
            addToast("Yapay zeka ile şablon oluşturulurken bir hata oluştu.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description) {
            addToast("Lütfen başlık ve açıklama alanlarını doldurun.", "error");
            return;
        }

        const templateData = { title, description, checklist: checklist.filter(item => item.text.trim() !== '') };
        
        if (templateToEdit) {
            await updateTemplate({ ...templateToEdit, ...templateData });
            addToast("Şablon başarıyla güncellendi.", "success");
        } else {
            await addTemplate(templateData);
            addToast("Şablon başarıyla oluşturuldu.", "success");
        }
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={templateToEdit ? "Şablonu Düzenle" : "Yeni Şablon Oluştur"}>
            <div className="space-y-4">
                <div className="p-4 border border-dashed border-primary-300 dark:border-primary-700 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                    <h4 className="font-semibold flex items-center mb-2"><SparklesIcon className="w-5 h-5 mr-2 text-primary-500"/> Yapay Zeka ile Şablon Oluştur</h4>
                    <div className="space-y-3">
                        <input type="text" value={aiParams.topic} onChange={e => setAiParams({...aiParams, topic: e.target.value})} placeholder="Ödev konusunu girin (örn: Logaritma)" className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"/>
                        <div className="grid grid-cols-2 gap-3">
                             <select value={aiParams.level} onChange={e => setAiParams({...aiParams, level: e.target.value})} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600">
                                <option>Başlangıç</option>
                                <option>Orta</option>
                                <option>İleri</option>
                                <option>TYT</option>
                                <option>AYT</option>
                            </select>
                             <select value={aiParams.duration} onChange={e => setAiParams({...aiParams, duration: e.target.value})} className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600">
                                <option>3 Gün</option>
                                <option>1 Hafta</option>
                                <option>2 Hafta</option>
                            </select>
                        </div>
                         <button type="button" onClick={handleGenerateWithAi} disabled={isGenerating} className="w-full px-4 py-2 flex items-center justify-center rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                            <SparklesIcon className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? 'Oluşturuluyor...' : 'Oluştur'}
                         </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t dark:border-gray-600">
                    <p className="text-sm text-center text-gray-500">...veya manuel olarak doldurun</p>
                    <div>
                        <label className="block text-sm font-medium mb-1">Şablon Başlığı</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Açıklama</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Kontrol Listesi</label>
                        <div className="space-y-2">
                            {checklist.map((item, index) => (
                                <div key={index} className="flex items-center">
                                    <input 
                                        type="text" 
                                        value={item.text} 
                                        onChange={(e) => handleChecklistItemChange(index, e.target.value)}
                                        placeholder={`Madde ${index + 1}`}
                                        className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600"/>
                                    <button type="button" onClick={() => removeChecklistItem(index)} className="ml-2 text-red-500 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addChecklistItem} className="mt-2 text-sm text-primary-600 font-semibold hover:text-primary-800">+ Madde Ekle</button>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray