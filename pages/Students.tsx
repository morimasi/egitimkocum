import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Assignment, AssignmentStatus } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, MessagesIcon, SparklesIcon, AlertTriangleIcon, StudentsIcon as NoStudentsIcon } from '../components/Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { suggestStudentGoal } from '../services/geminiService';
import EmptyState from '../components/EmptyState';

const getStatusChip = (status: AssignmentStatus) => {
    const styles = {
        [AssignmentStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        [AssignmentStatus.Submitted]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        [AssignmentStatus.Graded]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    const text = {
        [AssignmentStatus.Pending]: 'Bekliyor',
        [AssignmentStatus.Submitted]: 'Teslim Edildi',
        [AssignmentStatus.Graded]: 'Notlandırıldı',
    };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>{text[status]}</span>;
};


const StudentDetailModal = ({ student, onClose }: { student: User | null; onClose: () => void; }) => {
    const { getAssignmentsForStudent, getGoalsForStudent, updateGoal, addGoal, updateStudentNotes } = useDataContext();
    const { addToast } = useUI();
    const [newGoalText, setNewGoalText] = useState('');
    const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [notes, setNotes] = useState(student?.notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const notesTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        setNotes(student?.notes || '');
    }, [student]);

    if (!student) return null;
    
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
        if (notesTimeoutRef.current) {
            clearTimeout(notesTimeoutRef.current);
        }
        notesTimeoutRef.current = window.setTimeout(() => {
            handleSaveNotes(e.target.value);
        }, 1500); // Auto-save after 1.5 seconds of inactivity
    };

    const handleSaveNotes = async (currentNotes: string) => {
        setIsSavingNotes(true);
        await updateStudentNotes(student.id, currentNotes);
        setIsSavingNotes(false);
        addToast("Notlar kaydedildi.", "success");
    };

    const assignments = getAssignmentsForStudent(student.id);
    const goals = getGoalsForStudent(student.id);
    const pendingCount = assignments.filter(a => a.status === AssignmentStatus.Pending).length;
    const submittedCount = assignments.filter(a => a.status === AssignmentStatus.Submitted).length;
    const gradedCount = assignments.filter(a => a.status === AssignmentStatus.Graded).length;
    const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    
    const averageGrade = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((acc, curr) => acc + curr.grade!, 0) / gradedAssignments.length)
        : 0;

    const gradeHistory = gradedAssignments
        .sort((a,b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime())
        .map((a, index) => ({
            name: `Ödev ${index + 1}`,
            "Not": a.grade,
        }));
        
    const handleAddGoal = () => {
        if (newGoalText.trim() === '') return;
        addGoal({
            studentId: student.id,
            text: newGoalText,
            isCompleted: false,
        });
        setNewGoalText('');
    };

    const handleSuggestGoal = async () => {
        setIsGeneratingGoal(true);
        const overdueAssignments = assignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
        try {
            const suggestion = await suggestStudentGoal(student.name, averageGrade, overdueAssignments);
            setNewGoalText(suggestion);
        } catch(e) {
            addToast("Hedef önerisi alınamadı.", "error");
        } finally {
            setIsGeneratingGoal(false);
        }
    };

    const renderAssignments = () => (
        <div className="animate-fade-in">
            <h4 className="font-semibold mb-2">Ödev Listesi</h4>
            <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {assignments.length > 0 ? assignments.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(a => (
                    <li key={a.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{a.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Teslim: {new Date(a.dueDate).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                           {getStatusChip(a.status)}
                           <p className="text-sm font-semibold w-12 text-center">Not: {a.grade ?? '-'}</p>
                        </div>
                    </li>
                )) : <p className="text-sm text-gray-500 text-center py-4">Bu öğrenciye atanmış ödev bulunmuyor.</p>}
            </ul>
        </div>
    );

    return (
        <Modal isOpen={!!student} onClose={onClose} title={`${student.name} - Performans Detayları`} size="lg">
            <div className="flex items-center space-x-4 mb-4 pb-4 border-b dark:border-gray-700">
                <img src={student.profilePicture} alt={student.name} className="w-20 h-20 rounded-full" />
                <div>
                    <h3 className="text-2xl font-bold">{student.name}</h3>
                    <p className="text-gray-500">{student.email}</p>
                </div>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('overview')} className={`${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Genel Bakış</button>
                    <button onClick={() => setActiveTab('assignments')} className={`${activeTab === 'assignments' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Ödevler</button>
                    <button onClick={() => setActiveTab('notes')} className={`${activeTab === 'notes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Notlar</button>
                </nav>
            </div>
            
            <div className="pt-6 space-y-6">
                {activeTab === 'overview' && (
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
                                     {goals.length > 0 ? goals.map(goal => (<li key={goal.id} className="flex items-center"><input type="checkbox" checked={goal.isCompleted} onChange={() => updateGoal({...goal, isCompleted: !goal.isCompleted})} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" /><label className={`ml-3 text-sm ${goal.isCompleted ? 'line-through text-gray-500' : ''}`}>{goal.text}</label></li>)) : <p className="text-sm text-gray-500">Bu öğrenci için henüz hedef belirlenmedi.</p>}
                                </ul>
                                <div className="flex gap-2"><input type="text" value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)} placeholder="Yeni hedef ekle..." className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" /><button onClick={handleAddGoal} className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Ekle</button></div>
                                <button onClick={handleSuggestGoal} disabled={isGeneratingGoal} className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50"><SparklesIcon className={`w-4 h-4 mr-1 ${isGeneratingGoal ? 'animate-spin' : ''}`} />{isGeneratingGoal ? 'Öneriliyor...' : '✨ Akıllı Hedef Öner'}</button>
                            </Card>
                        </div>
                    </div>
                )}
                {activeTab === 'assignments' && renderAssignments()}
                {activeTab === 'notes' && (
                    <div className="animate-fade-in">
                        <h4 className="font-semibold mb-2">Özel Notlar</h4>
                        <p className="text-xs text-gray-500 mb-2">Bu notlar sadece sizin tarafınızdan görülebilir ve otomatik olarak kaydedilir.</p>
                        <textarea value={notes} onChange={handleNotesChange} rows={12} className="w-full p-3 border rounded-md bg-yellow-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500" placeholder={`${student.name} hakkında notlar alın...`} />
                        <div className="text-right h-4 mt-1"><span className={`text-xs text-gray-400 transition-opacity ${isSavingNotes ? 'opacity-100' : 'opacity-0'}`}>Kaydediliyor...</span></div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const StudentCard = React.memo(({ student, onSelect }: { student: User; onSelect: (student: User) => void }) => {
    const { getAssignmentsForStudent } = useDataContext();
    
    const assignments = getAssignmentsForStudent(student.id);
    const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    const averageGrade = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((acc, curr) => acc + curr.grade!, 0) / gradedAssignments.length)
        : 0;

    const overdueCount = assignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
    const hasAlert = (averageGrade > 0 && averageGrade < 60) || overdueCount > 0;
    
    let alertTitle = '';
    if (overdueCount > 0) alertTitle += `${overdueCount} gecikmiş ödev. `;
    if (averageGrade > 0 && averageGrade < 60) alertTitle += `Not ortalaması: ${averageGrade}.`;
        
    return (
        <Card className="flex flex-col text-center items-center cursor-pointer relative transition-transform duration-300 hover:-translate-y-1" onClick={() => onSelect(student)}>
             {hasAlert && (
                 <div className="absolute top-4 right-4" title={alertTitle.trim()}>
                    <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />
                </div>
            )}
            <img src={student.profilePicture} alt={student.name} className="w-24 h-24 rounded-full -mt-12 border-4 border-white dark:border-gray-800" />
            <h4 className="text-xl font-bold mt-4">{student.name}</h4>
            <p className="text-sm text-gray-500">{student.email}</p>
            <div className="flex justify-around w-full mt-6 border-t dark:border-gray-700 pt-4">
                <div className="text-center">
                    <p className="font-bold text-lg">{assignments.length}</p>
                    <p className="text-xs text-gray-500">Toplam Ödev</p>
                </div>
                 <div className="text-center">
                    <p className="font-bold text-lg text-primary-500">{averageGrade}</p>
                    <p className="text-xs text-gray-500">Not Ort.</p>
                </div>
            </div>
        </Card>
    );
});

const Students = () => {
    const { students } = useDataContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

    const filteredStudents = useMemo(() => {
        return students.filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    return (
        <>
        <div className="space-y-6">
            <div className="flex justify-end">
                <input
                    type="text"
                    placeholder="Öğrenci ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 w-full sm:w-64"
                />
            </div>

            {students.length === 0 ? (
                 <EmptyState 
                    icon={<NoStudentsIcon className="w-10 h-10"/>}
                    title="Henüz Öğrenciniz Yok"
                    description="Yeni öğrenciler eklendiğinde burada görünecekler. Süper Admin panelinden yeni kullanıcılar oluşturabilirsiniz."
                 />
            ) : filteredStudents.length === 0 ? (
                 <EmptyState
                    icon={<NoStudentsIcon className="w-10 h-10"/>}
                    title="Öğrenci Bulunamadı"
                    description="Arama kriterlerinizi değiştirmeyi deneyin veya tüm öğrencileri görmek için aramayı temizleyin."
                 />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                    {filteredStudents.map(student => (
                        <StudentCard key={student.id} student={student} onSelect={setSelectedStudent} />
                    ))}
                </div>
            )}
        </div>
        {selectedStudent && <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
        </>
    );
};

export default Students;