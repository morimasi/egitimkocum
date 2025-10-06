import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataContext } from '../../contexts/DataContext';
import { useUI } from '../../contexts/UIContext';
import { suggestStudentGoal } from '../../services/geminiService';
import { User, AssignmentStatus, Goal } from '../../types';
import Card from '../Card';
import { SparklesIcon, CheckIcon } from '../Icons';

const OverviewTab = ({ student }: { student: User }) => {
    const { getAssignmentsForStudent, getGoalsForStudent, updateGoal, addGoal } = useDataContext();
    const { addToast } = useUI();
    const [newGoalText, setNewGoalText] = useState('');
    const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
    
    const assignments = useMemo(() => getAssignmentsForStudent(student.id), [getAssignmentsForStudent, student.id]);
    const goals = useMemo(() => getGoalsForStudent(student.id), [getGoalsForStudent, student.id]);
    
    const { pendingCount, submittedCount, gradedCount, averageGrade, gradeHistory } = useMemo(() => {
        const pending = assignments.filter(a => a.status === AssignmentStatus.Pending).length;
        const submitted = assignments.filter(a => a.status === AssignmentStatus.Submitted).length;
        const graded = assignments.filter(a => a.status === AssignmentStatus.Graded).length;
        const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        
        const avg = gradedAssignments.length > 0
            ? Math.round(gradedAssignments.reduce((acc, curr) => acc + curr.grade!, 0) / gradedAssignments.length)
            : 0;

        const history = gradedAssignments
            .sort((a,b) => new Date(a.gradedAt || a.submittedAt!).getTime() - new Date(b.gradedAt || b.submittedAt!).getTime())
            .map((a, index) => ({
                name: `Ödev ${index + 1}`,
                "Not": a.grade,
            }));

        return {
            pendingCount: pending,
            submittedCount: submitted,
            gradedCount: graded,
            averageGrade: avg,
            gradeHistory: history,
        };
    }, [assignments]);
        
    const handleAddGoal = () => {
        if (newGoalText.trim() === '') return;
        addGoal({ 
            studentId: student.id, 
            title: newGoalText, 
            description: '', 
            milestones: [], 
            isCompleted: false 
        });
        setNewGoalText('');
    };

    const handleSuggestGoal = async () => {
        setIsGeneratingGoal(true);
        const overdueAssignments = assignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
        try {
            const suggestion = await suggestStudentGoal(student.name, averageGrade, overdueAssignments);
            setNewGoalText(suggestion);
        } catch(e) { addToast("Hedef önerisi alınamadı.", "error"); }
        finally { setIsGeneratingGoal(false); }
    };
    
    const handleToggleGoal = (goal: Goal) => {
        const allMilestonesCompleted = goal.milestones.every(m => m.isCompleted);
        if (!goal.isCompleted && goal.milestones.length > 0 && !allMilestonesCompleted) {
             addToast("Hedefi tamamlamak için önce tüm kilometre taşlarını bitirmelisin.", "info");
             return;
        }
        updateGoal({...goal, isCompleted: !goal.isCompleted});
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"><p className="text-2xl font-bold">{assignments.length}</p><p className="text-sm text-gray-500">Toplam Ödev</p></div>
                 <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg"><p className="text-2xl font-bold text-green-600 dark:text-green-300">{averageGrade}</p><p className="text-sm text-green-700 dark:text-green-400">Not Ort.</p></div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg"><p className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">{pendingCount}</p><p className="text-sm text-yellow-700 dark:text-yellow-400">Bekleyen</p></div>
                 <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg"><p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{submittedCount + gradedCount}</p><p className="text-sm text-blue-700 dark:text-blue-400">Tamamlanan</p></div>
            </div>
            <div>
                <h4 className="font-semibold mb-2">Not Gelişim Grafiği</h4>
                 <Card><div style={{ width: '100%', height: 250 }}><ResponsiveContainer><LineChart data={gradeHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }}/><Line type="monotone" dataKey="Not" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer></div></Card>
            </div>
            <div>
                <h4 className="font-semibold mb-2">Hedefler</h4>
                <Card>
                    <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 mb-3">
                         {goals.length > 0 ? goals.map(goal => (
                             <li key={goal.id} className="flex items-center group cursor-pointer" onClick={() => handleToggleGoal(goal)}>
                                <button type="button" role="checkbox" aria-checked={goal.isCompleted} className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 group-hover:border-primary-500 ${goal.isCompleted ? 'bg-primary-500 border-primary-500' : 'bg-transparent border-gray-400 dark:border-gray-500'}`}>
                                    {goal.isCompleted && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                </button>
                                <label className={`ml-3 text-sm cursor-pointer ${goal.isCompleted ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{goal.title}</label>
                            </li>
                         )) : <p className="text-sm text-gray-500">Bu öğrenci için henüz hedef belirlenmedi.</p>}
                    </ul>
                    <div className="flex gap-2"><input type="text" value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)} placeholder="Yeni hedef ekle..." className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" onKeyDown={e => e.key === 'Enter' && handleAddGoal()} /><button onClick={handleAddGoal} className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Ekle</button></div>
                    <button onClick={handleSuggestGoal} disabled={isGeneratingGoal} className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50"><SparklesIcon className={`w-4 h-4 mr-1 ${isGeneratingGoal ? 'animate-spin' : ''}`} />{isGeneratingGoal ? 'Öneriliyor...' : '✨ Akıllı Hedef Öner'}</button>
                </Card>
            </div>
        </div>
    );
};
export default OverviewTab;