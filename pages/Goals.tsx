import React, { useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Goal, ChecklistItem, User } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { TargetIcon, CheckIcon, SparklesIcon, XIcon, PlusCircleIcon, EditIcon, TrashIcon } from '../components/Icons';
import EmptyState from '../components/EmptyState';
import { generateGoalWithMilestones } from '../services/geminiService';
import ConfirmationModal from '../components/ConfirmationModal';

const GoalFormModal = ({ isOpen, onClose, goalToEdit, studentId }: { isOpen: boolean; onClose: () => void; goalToEdit: Goal | null; studentId: string }) => {
    const { addGoal, updateGoal } = useDataContext();
    const { addToast } = useUI();
    const [title, setTitle] = useState(goalToEdit?.title || '');
    const [description, setDescription] = useState(goalToEdit?.description || '');
    const [milestones, setMilestones] = useState<Omit<ChecklistItem, 'id'|'isCompleted'>[]>(goalToEdit?.milestones || []);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateWithAI = async () => {
        if (!title) {
            addToast("Lütfen önce bir hedef başlığı girin.", "error");
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateGoalWithMilestones(title);
            if (result) {
                setDescription(result.description);
                setMilestones(result.milestones);
                addToast("Yapay zeka ile hedef detayları oluşturuldu!", "success");
            }
        } catch (e) {
            addToast("Hedef detayları oluşturulurken bir hata oluştu.", "error");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleMilestoneChange = (index: number, text: string) => {
        const newMilestones = [...milestones];
        newMilestones[index] = { text };
        setMilestones(newMilestones);
    };

    const addMilestone = () => setMilestones([...milestones, { text: '' }]);
    const removeMilestone = (index: number) => setMilestones(milestones.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        if (!title) return;
        
        const goalData = {
            studentId,
            title,
            description,
            milestones: milestones.map((m, i) => ({ id: goalToEdit?.milestones[i]?.id || `m-${Date.now()}-${i}`, text: m.text, isCompleted: goalToEdit?.milestones[i]?.isCompleted || false })),
            isCompleted: goalToEdit?.isCompleted || false,
        };

        if (goalToEdit) {
            await updateGoal({ ...goalToEdit, ...goalData });
            addToast("Hedef güncellendi.", "success");
        } else {
            await addGoal(goalData);
            addToast("Hedef eklendi.", "success");
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={goalToEdit ? "Hedefi Düzenle" : "Yeni Hedef Oluştur"}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Hedef Başlığı</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                 <button type="button" onClick={handleGenerateWithAI} disabled={!title || isGenerating} className="flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50">
                    <SparklesIcon className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Oluşturuluyor...' : '✨ Açıklama ve Kilometre Taşlarını AI ile Doldur'}
                </button>
                 <div>
                    <label className="block text-sm font-medium mb-1">Açıklama</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Kilometre Taşları</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {milestones.map((m, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input type="text" value={m.text} onChange={e => handleMilestoneChange(i, e.target.value)} className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600" placeholder={`Adım ${i+1}`} />
                                <button onClick={() => removeMilestone(i)} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><XIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addMilestone} className="mt-2 text-sm text-primary-600 font-semibold hover:text-primary-800">+ Kilometre Taşı Ekle</button>
                </div>
            </div>
             <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600">İptal</button>
                <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Kaydet</button>
            </div>
        </Modal>
    );
};

const GoalCard = ({ goal, onEdit, onDelete, onToggleMilestone }: { goal: Goal, onEdit: (g: Goal) => void, onDelete: (g: Goal) => void, onToggleMilestone: (goalId: string, milestoneId: string) => void }) => {
    const progress = goal.milestones.length > 0 ? (goal.milestones.filter(m => m.isCompleted).length / goal.milestones.length) * 100 : (goal.isCompleted ? 100 : 0);
    return (
        <Card className={`transition-all ${goal.isCompleted ? 'opacity-60 bg-gray-50 dark:bg-gray-800/50' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className={`font-bold text-lg ${goal.isCompleted ? 'line-through' : ''}`}>{goal.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                </div>
                <div className="flex-shrink-0 flex gap-1">
                    <button onClick={() => onEdit(goal)} className="p-2 text-gray-400 hover:text-blue-500"><EditIcon className="w-4 h-4"/></button>
                    <button onClick={() => onDelete(goal)} className="p-2 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                </div>
            </div>
            <div className="mt-4">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                    <span>İlerleme</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            {goal.milestones.length > 0 && (
                <div className="mt-4 pt-3 border-t dark:border-gray-600">
                    <h4 className="text-sm font-semibold mb-2">Kilometre Taşları</h4>
                    <ul className="space-y-2">
                        {goal.milestones.map(m => (
                            <li key={m.id} onClick={() => onToggleMilestone(goal.id, m.id)} className="flex items-center group cursor-pointer">
                                 <div className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 group-hover:border-primary-500 ${m.isCompleted ? 'bg-primary-500 border-primary-500' : 'border-gray-400 dark:border-gray-500'}`}>
                                    {m.isCompleted && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className={`ml-3 text-sm ${m.isCompleted ? 'line-through text-gray-500' : ''}`}>{m.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Card>
    );
};


export default function Goals() {
    const { currentUser, students, getGoalsForStudent, updateGoal, deleteGoal } = useDataContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
    const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState(currentUser?.role === 'student' ? currentUser.id : 'all');

    const isCoach = currentUser?.role !== 'student';

    const goals = useMemo(() => {
        if (selectedStudentId === 'all' && isCoach) {
            return students.flatMap(s => getGoalsForStudent(s.id));
        }
        return getGoalsForStudent(selectedStudentId);
    }, [selectedStudentId, isCoach, students, getGoalsForStudent]);

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);

    const handleOpenModal = (goal: Goal | null) => {
        setGoalToEdit(goal);
        setIsModalOpen(true);
    };

    const handleToggleMilestone = (goalId: string, milestoneId: string) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        const updatedMilestones = goal.milestones.map(m => m.id === milestoneId ? {...m, isCompleted: !m.isCompleted } : m);
        updateGoal({...goal, milestones: updatedMilestones });
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold flex items-center gap-2"><TargetIcon className="w-8 h-8"/> Hedef Yönetimi</h1>
                    {isCoach ? (
                        <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <option value="all">Tüm Öğrenciler</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    ) : (
                         <button onClick={() => handleOpenModal(null)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5"/> Yeni Hedef Ekle
                        </button>
                    )}
                </div>
            </Card>

            {goals.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {goals.map(goal => (
                        <div key={goal.id}>
                            {isCoach && <p className="font-semibold mb-1 ml-1">{studentMap.get(goal.studentId)}</p>}
                            <GoalCard goal={goal} onEdit={handleOpenModal} onDelete={setGoalToDelete} onToggleMilestone={handleToggleMilestone} />
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState 
                    icon={<TargetIcon className="w-12 h-12"/>}
                    title="Henüz Hedef Belirlenmemiş"
                    description={isCoach ? (selectedStudentId === 'all' ? 'Öğrencileriniz için hedefler oluşturun.' : 'Bu öğrenci için bir hedef oluşturun.') : 'Kendin için yeni bir hedef oluşturarak yolculuğuna başla!'}
                    action={{ label: "Yeni Hedef Ekle", onClick: () => handleOpenModal(null) }}
                />
            )}
            
            {(isModalOpen || goalToEdit) && <GoalFormModal isOpen={true} onClose={() => { setIsModalOpen(false); setGoalToEdit(null); }} goalToEdit={goalToEdit} studentId={selectedStudentId} />}
            {goalToDelete && <ConfirmationModal isOpen={true} onClose={() => setGoalToDelete(null)} onConfirm={() => { if (goalToDelete) deleteGoal(goalToDelete.id); setGoalToDelete(null); }} title="Hedefi Sil" message={`'${goalToDelete.title}' hedefini silmek istediğinizden emin misiniz?`}/>}
        </div>
    );
}