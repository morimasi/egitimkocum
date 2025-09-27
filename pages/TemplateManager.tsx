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
                        <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{templateToEdit ? "Kaydet" : "Oluştur"}</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default function TemplateManager() {
    const { templates, deleteTemplate } = useDataContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<AssignmentTemplate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<AssignmentTemplate | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTemplates = useMemo(() => {
        if (!searchTerm) return templates;
        return templates.filter(t => 
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [templates, searchTerm]);

    const groupedTemplates = useMemo(() => {
        return filteredTemplates.reduce((acc, template) => {
            const subject = template.title.split(':')[0] || 'Diğer';
            if (!acc[subject]) {
                acc[subject] = [];
            }
            acc[subject].push(template);
            return acc;
        }, {} as { [key: string]: AssignmentTemplate[] });
    }, [filteredTemplates]);

    const handleEdit = (template: AssignmentTemplate) => {
        setTemplateToEdit(template);
        setIsModalOpen(true);
    };
    
    const handleAddNew = () => {
        setTemplateToEdit(null);
        setIsModalOpen(true);
    };

    const handleDelete = () => {
        if (templateToDelete) {
            deleteTemplate(templateToDelete.id);
            setTemplateToDelete(null);
        }
    };
    
    return (
        <>
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="text-2xl font-bold">Ödev Şablonları</h1>
                    <div className="flex-1 flex flex-col md:flex-row justify-end gap-4 w-full">
                         <input
                            type="text"
                            placeholder="Şablonlarda ara..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 w-full md:w-auto"
                        />
                        <button onClick={handleAddNew} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold w-full md:w-auto">
                            + Yeni Şablon
                        </button>
                    </div>
                </div>

                {templates.length > 0 ? (
                    <div className="space-y-6">
                        {Object.entries(groupedTemplates).sort(([a], [b]) => a.localeCompare(b)).map(([subject, templates]) => (
                            <div key={subject}>
                                <h2 className="text-xl font-semibold border-b-2 border-primary-500 pb-1 mb-4">{subject}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {templates.map(template => (
                                        <Card key={template.id} className="flex flex-col">
                                            <div className="flex-grow">
                                                <h3 className="font-bold text-lg">{template.title.split(': ')[1] || template.title}</h3>
                                                <p className="text-sm text-gray-500 mt-2 line-clamp-3">{template.description}</p>
                                                {template.checklist && template.checklist.length > 0 && (
                                                    <ul className="text-sm list-disc list-inside mt-2 text-gray-600 dark:text-gray-400">
                                                        {template.checklist.slice(0, 2).map((item, i) => <li key={i}>{item.text}</li>)}
                                                        {template.checklist.length > 2 && <li className="italic">...ve daha fazlası</li>}
                                                    </ul>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-3 border-t dark:border-gray-700 flex justify-end gap-2">
                                                <button onClick={() => handleEdit(template)} className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" aria-label="Düzenle"><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => setTemplateToDelete(template)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Sil"><TrashIcon className="w-5 h-5"/></button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={<ClipboardListIcon className="w-10 h-10" />}
                        title="Henüz Şablon Yok"
                        description="Sık kullandığınız ödev türleri için şablonlar oluşturarak zaman kazanın."
                        action={{ label: "İlk Şablonu Oluştur", onClick: handleAddNew }}
                    />
                )}
            </Card>
            {(isModalOpen || templateToEdit) && <TemplateFormModal isOpen={true} onClose={() => { setIsModalOpen(false); setTemplateToEdit(null); }} templateToEdit={templateToEdit}/>}
            {templateToDelete && <ConfirmationModal isOpen={!!templateToDelete} onClose={() => setTemplateToDelete(null)} onConfirm={handleDelete} title="Şablonu Sil" message={`'${templateToDelete.title}' adlı şablonu silmek istediğinizden emin misiniz?`}/>}
        </>
    );
};