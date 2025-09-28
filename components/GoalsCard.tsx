import React, { useState } from 'react';
import Card from './Card';
import { useDataContext } from '../contexts/DataContext';
import { SparklesIcon, CheckIcon } from './Icons';
import { suggestStudentGoal } from '../services/geminiService';
import { useUI } from '../contexts/UIContext';
import { AssignmentStatus } from '../types';

const GoalsCard = () => {
    const { currentUser, getGoalsForStudent, updateGoal, addGoal, getAssignmentsForStudent } = useDataContext();
    const { addToast } = useUI();
    const [newGoalText, setNewGoalText] = useState('');
    const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);

    if (!currentUser) return null;

    const goals = getGoalsForStudent(currentUser.id);
    const assignments = getAssignmentsForStudent(currentUser.id);

    const handleAddGoal = () => {
        if (newGoalText.trim() === '') return;
        addGoal({
            studentId: currentUser.id,
            text: newGoalText,
            isCompleted: false,
        });
        setNewGoalText('');
    };

    const handleSuggestGoal = async () => {
        setIsGeneratingGoal(true);
        const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        const averageGrade = gradedAssignments.length > 0
            ? Math.round(gradedAssignments.reduce((acc, curr) => acc + curr.grade!, 0) / gradedAssignments.length)
            : 0;
        const overdueAssignments = assignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
        try {
            const suggestion = await suggestStudentGoal(currentUser.name, averageGrade, overdueAssignments);
            setNewGoalText(suggestion);
        } catch(e) {
            addToast("Hedef önerisi alınamadı.", "error");
        } finally {
            setIsGeneratingGoal(false);
        }
    };
    
    return (
         <Card title="Hedeflerim" id="student-goals-card">
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-3">
                 {goals.length > 0 ? goals.map(goal => (
                     <li key={goal.id} className="flex items-center group cursor-pointer" onClick={() => updateGoal({...goal, isCompleted: !goal.isCompleted})}>
                        <button
                            type="button"
                            role="checkbox"
                            aria-checked={goal.isCompleted}
                            className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 group-hover:border-primary-500 ${
                                goal.isCompleted
                                    ? 'bg-primary-500 border-primary-500'
                                    : 'bg-transparent border-gray-400 dark:border-gray-500'
                            }`}
                        >
                            {goal.isCompleted && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                        </button>
                        <label className={`ml-3 text-sm cursor-pointer ${goal.isCompleted ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{goal.text}</label>
                    </li>
                 )) : <p className="text-sm text-gray-500">Henüz bir hedef belirlemedin. Hadi ilk hedefini ekle!</p>}
            </ul>
            <div className="flex gap-2"><input type="text" value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)} placeholder="Yeni hedef ekle..." className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" onKeyDown={e => e.key === 'Enter' && handleAddGoal()} /><button onClick={handleAddGoal} className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Ekle</button></div>
            <button onClick={handleSuggestGoal} disabled={isGeneratingGoal} className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50"><SparklesIcon className={`w-4 h-4 mr-1 ${isGeneratingGoal ? 'animate-spin' : ''}`} />{isGeneratingGoal ? 'Öneriliyor...' : '✨ Akıllı Hedef Öner'}</button>
        </Card>
    );
}

export default GoalsCard;