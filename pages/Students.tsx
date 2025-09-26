import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Assignment, AssignmentStatus, UserRole, AcademicTrack, Badge, BadgeID, Resource } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, MessagesIcon, SparklesIcon, AlertTriangleIcon, StudentsIcon as NoStudentsIcon, LibraryIcon, CheckIcon, FlameIcon, TrophyIcon, TrashIcon } from '../components/Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { suggestStudentGoal } from '../services/geminiService';
import EmptyState from '../components/EmptyState';
import AddStudentForm from '../components/AddStudentForm';
import ConfirmationModal from '../components/ConfirmationModal';

// Helper function to get display name for academic track
const getAcademicTrackLabel = (track: AcademicTrack): string => {
    switch (track) {
        case AcademicTrack.Sayisal: return 'Sayısal';
        case AcademicTrack.EsitAgirlik: return 'Eşit Ağırlık';
        case AcademicTrack.Sozel: return 'Sözel';
        case AcademicTrack.Dil: return 'Dil';
        default: return '';
    }
};

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
    const { getAssignmentsForStudent, getGoalsForStudent, updateGoal, addGoal, updateStudentNotes, users, badges } = useDataContext();
    const { addToast, setActivePage } = useUI();
    const [newGoalText, setNewGoalText] = useState('');
    const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [notes, setNotes] = useState(student?.notes || '');
    
    useEffect(() => {
        setNotes(student?.notes || '');
        // When modal opens for a new student, reset to the overview tab
        setActiveTab('overview');
    }, [student]);

    useEffect(() => {
        if (!student) return;

        const timeoutId = setTimeout(() => {
            if (notes !== student.notes) {
                updateStudentNotes(student.id, notes);
                addToast("Notlar otomatik kaydedildi.", "info");
            }
        }, 1500);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [notes, student, updateStudentNotes, addToast]);


    if (!student) return null;
    
    const assignedCoach = users.find(u => u.id === student.assignedCoachId);
    
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
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
    
    const xpToNextLevel = (level: number) => (level * level) * 100;
    const currentLevel = useMemo(() => student.xp ? Math.floor(Math.sqrt(student.xp / 100)) + 1 : 1, [student.xp]);
    const xpForCurrentLevel = useMemo(() => xpToNextLevel(currentLevel - 1), [currentLevel]);
    const xpForNextLevel = useMemo(() => xpToNextLevel(currentLevel), [currentLevel]);
    const levelProgress = useMemo(() => {
        const totalXpForLevel = xpForNextLevel - xpForCurrentLevel;
        const currentXpInLevel = (student.xp || 0) - xpForCurrentLevel;
        return totalXpForLevel > 0 ? (currentXpInLevel / totalXpForLevel) * 100 : 0;
    }, [student.xp, xpForCurrentLevel, xpForNextLevel]);

    return (
        <Modal isOpen={!!student} onClose={onClose} title={`${student.name} - Performans Detayları`} size="lg">
            <div className="flex items-start space-x-4 mb-4 pb-4 border-b dark:border-gray-700">
                <img src={student.profilePicture} alt={student.name} className="w-20 h-20 rounded-full" />
                <div>
                    <h3 className="text-2xl font-bold">{student.name}</h3>
                    <p className="text-gray-500">{student.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {student.gradeLevel && (
                             <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                                {student.gradeLevel === 'mezun' ? 'Mezun' : `${student.gradeLevel}. Sınıf`}
                            </span>
                        )}
                         {student.academicTrack && (
                             <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                                {getAcademicTrackLabel(student.academicTrack)}
                            </span>
                        )}
                    </div>
                    <div className="mt-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${assignedCoach ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                            Koç: {assignedCoach?.name || 'Atanmamış'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('overview')} className={`${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Genel Bakış</button>
                    <button onClick={() => setActiveTab('assignments')} className={`${activeTab === 'assignments' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Ödevler</button>
                    <button onClick={() => setActiveTab('motivation')} className={`${activeTab === 'motivation' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Motivasyon</button>
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
                                     )) : <p className="text-sm text-gray-500">Bu öğrenci için henüz hedef belirlenmedi.</p>}
                                </ul>
                                <div className="flex gap-2"><input type="text" value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)} placeholder="Yeni hedef ekle..." className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" /><button onClick={handleAddGoal} className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Ekle</button></div>
                                <button onClick={handleSuggestGoal} disabled={isGeneratingGoal} className="mt-2 flex items-center text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50"><SparklesIcon className={`w-4 h-4 mr-1 ${isGeneratingGoal ? 'animate-spin' : ''}`} />{isGeneratingGoal ? 'Öneriliyor...' : '✨ Akıllı Hedef Öner'}</button>
                            </Card>
                        </div>
                    </div>
                )}
                {activeTab === 'assignments' && (
                    <div className="animate-fade-in">
                        <h4 className="font-semibold mb-2">Ödev Listesi</h4>
                        <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {assignments.length > 0 ? assignments.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(a => (
                                <li key={a.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { onClose(); setActivePage('assignments', { assignmentId: a.id }); }}>
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
                )}
                 {activeTab === 'motivation' && (
                    <div className="animate-fade-in space-y-4">
                        <Card>
                            <h4 className="font-semibold mb-2">Seviye ve Tecrübe Puanı (XP)</h4>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex flex-col items-center justify-center font-bold">
                                    <span className="text-xs">SEVİYE</span>
                                    <span className="text-3xl">{currentLevel}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{student.xp || 0} XP</span>
                                        <span className="text-gray-500">{xpForNextLevel} XP</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                        <div className="bg-primary-500 h-4 rounded-full" style={{ width: `${levelProgress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card title="Kazanılan Rozetler">
                            <div className="flex flex-wrap gap-4">
                                {badges.map(badge => {
                                    const isEarned = student.earnedBadgeIds?.includes(badge.id);
                                    return (
                                        <div key={badge.id} title={`${badge.name}: ${badge.description}`} className={`text-center transition-opacity ${!isEarned && 'opacity-30'}`}>
                                            <div className={`p-3 rounded-full ${isEarned ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                                <TrophyIcon className={`w-8 h-8 ${isEarned ? 'text-yellow-500' : 'text-gray-400'}`} />
                                            </div>
                                            <p className="text-xs mt-1 w-20 truncate">{badge.name}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                )}
                {activeTab === 'notes' && (
                    <div className="animate-fade-in">
                        <h4 className="font-semibold mb-2">Özel Notlar</h4>
                        <p className="text-xs text-gray-500 mb-2">Bu notlar sadece sizin tarafınızdan görülebilir ve otomatik olarak kaydedilir.</p>
                        <textarea value={notes} onChange={handleNotesChange} rows={12} className="w-full p-3 border rounded-md bg-yellow-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500" placeholder={`${student.name} hakkında notlar alın...`} />
                    </div>
                )}
            </div>
        </Modal>
    );
};

const StudentCard = ({ student, onSelect, onToggleSelect, isSelected }: { 
    student: User; 
    onSelect: (student: User) => void;
    onToggleSelect: (studentId: string) => void;
    isSelected: boolean;
}) => {
    const { getAssignmentsForStudent, findOrCreateConversation } = useDataContext();
    const { setActivePage, addToast } = useUI();

    const assignments = getAssignmentsForStudent(student.id);
    const overdueCount = assignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
    
    const handleSendMessage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const convId = await findOrCreateConversation(student.id);
        if (convId) {
            setActivePage('messages', { contactId: convId });
        }
    };

    const handleAssignTask = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActivePage('assignments', { studentId: student.id, openNewAssignmentModal: true });
    };

    const handleAssignResource = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActivePage('library');
        addToast(`${student.name} için bir kaynak seçin.`, 'info');
    };
    
    const currentLevel = useMemo(() => student.xp ? Math.floor(Math.sqrt(student.xp / 100)) + 1 : 1, [student.xp]);

    return (
        <div className="relative">
             <input
                type="checkbox"
                className="absolute top-2 left-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 z-10"
                checked={isSelected}
                onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect(student.id);
                }}
                aria-label={`Select student ${student.name}`}
            />
            <Card className={`flex flex-col p-0 cursor-pointer transition-shadow duration-300 h-full ${isSelected ? 'ring-2 ring-primary-500' : ''}`} onClick={() => onSelect(student)}>
                <div className="flex flex-col items-center flex-grow p-3 text-center pt-6">
                    <div className="relative flex-shrink-0 mb-2">
                        <img src={student.profilePicture} alt={student.name} className="w-14 h-14 rounded-full" />
                        <span className="absolute -bottom-1 -right-1 bg-primary-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800" title={`Seviye ${currentLevel}`}>{currentLevel}</span>
                        {overdueCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" title={`${overdueCount} gecikmiş ödev`}></span>
                        )}
                    </div>
                    <h4 className="text-sm font-bold leading-tight">{student.name}</h4>
                    <p className="text-xs text-gray-500 leading-tight">{student.email}</p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {student.gradeLevel && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 whitespace-nowrap">
                                {student.gradeLevel === 'mezun' ? 'Mezun' : `${student.gradeLevel}. Sınıf`}
                            </span>
                        )}
                        {student.academicTrack && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 whitespace-nowrap">
                                {getAcademicTrackLabel(student.academicTrack)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-around items-center w-full px-1 py-1 border-t dark:border-gray-700 mt-auto">
                    <button onClick={handleAssignTask} title="Ödev Ver" className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-500 transition-colors">
                        <AssignmentsIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleSendMessage} title="Mesaj At" className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-500 transition-colors">
                        <MessagesIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleAssignResource} title="Kaynak Ekle" className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-500 transition-colors">
                        <LibraryIcon className="w-4 h-4" />
                    </button>
                </div>
            </Card>
        </div>
    );
};
const MemoizedStudentCard = React.memo(StudentCard);

const AssignResourceToStudentsModal = ({ isOpen, onClose, onAssign, studentCount }: { isOpen: boolean, onClose: () => void, onAssign: (resourceId: string) => void, studentCount: number }) => {
    const { resources } = useDataContext();
    const [selectedResourceId, setSelectedResourceId] = useState<string>('');
    
    const publicResources = resources.filter(r => r.isPublic);

    const handleAssign = () => {
        if (selectedResourceId) {
            onAssign(selectedResourceId);
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Kaynak Ata (${studentCount} Öğrenci)`}>
            <div className="space-y-4">
                <p>Seçilen öğrencilere atanacak bir kütüphane kaynağı seçin.</p>
                <select value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    <option value="" disabled>Bir kaynak seçin...</option>
                    {publicResources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
             <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                <button onClick={handleAssign} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700" disabled={!selectedResourceId}>Ata</button>
            </div>
        </Modal>
    );
};

// Fix: Changed component export to a function declaration to solve lazy loading issue.
export default function Students() {
    const { students, currentUser, users, addGoal, getAssignmentsForStudent, deleteUser, assignResourceToStudents } = useDataContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [filterCoach, setFilterCoach] = useState('all');
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [filterTrack, setFilterTrack] = useState<AcademicTrack | 'all'>('all');
    const { initialFilters, setInitialFilters, addToast } = useUI();
    const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
    const [isConfirmGoalModalOpen, setIsConfirmGoalModalOpen] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isAssignResourceModalOpen, setIsAssignResourceModalOpen] = useState(false);


    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
    const coaches = useMemo(() => users.filter(u => u.role === UserRole.Coach), [users]);

    useEffect(() => {
        if (initialFilters.studentId) {
            const studentToOpen = students.find(s => s.id === initialFilters.studentId);
            if (studentToOpen) {
                setSelectedStudent(studentToOpen);
            }
            setInitialFilters({});
        }
    }, [initialFilters, setInitialFilters, students]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    const academicTrackLabels: Record<AcademicTrack, string> = {
        [AcademicTrack.Sayisal]: 'Sayısal',
        [AcademicTrack.EsitAgirlik]: 'Eşit Ağırlık',
        [AcademicTrack.Sozel]: 'Sözel',
        [AcademicTrack.Dil]: 'Dil',
    };

    const groupedStudents = useMemo(() => {
        const gradeKeys = ['9', '10', '11', '12', 'mezun'];
        const groups: Record<string, User[]> = gradeKeys.reduce((acc, grade) => ({ ...acc, [grade]: [] }), {});
        groups['Diğer'] = [];

        students
            .filter(student => {
                const matchesSearch = student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
                const matchesCoach = !isSuperAdmin || filterCoach === 'all' || 
                                    (filterCoach === 'null' && !student.assignedCoachId) ||
                                    student.assignedCoachId === filterCoach;
                const matchesTrack = filterTrack === 'all' || student.academicTrack === filterTrack;
                return matchesSearch && matchesCoach && matchesTrack;
            })
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(student => {
                const grade = student.gradeLevel;
                if (grade && gradeKeys.includes(grade)) {
                    groups[grade].push(student);
                } else {
                    groups['Diğer'].push(student);
                }
            });

        return groups;
    }, [students, debouncedSearchTerm, isSuperAdmin, filterCoach, filterTrack]);
    
    const visibleStudents = useMemo(() => Object.values(groupedStudents).flat(), [groupedStudents]);

    const gradeOrder: (keyof typeof groupedStudents)[] = ['12', '11', '10', '9', 'mezun', 'Diğer'];

    const handleSelectStudent = useCallback((student: User) => {
        setSelectedStudent(student);
    }, []);

    const handleGenerateAllGoals = async () => {
        setIsGeneratingGoals(true);
        try {
            const goalPromises = students.map(async (student) => {
                const studentAssignments = getAssignmentsForStudent(student.id);
                const gradedAssignments = studentAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
                const averageGrade = gradedAssignments.length > 0
                    ? Math.round(gradedAssignments.reduce((acc, curr) => acc + curr.grade!, 0) / gradedAssignments.length)
                    : 0;
                const overdueAssignments = studentAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;

                const suggestion = await suggestStudentGoal(student.name, averageGrade, overdueAssignments);
                
                if (suggestion) {
                    await addGoal({
                        studentId: student.id,
                        text: suggestion,
                        isCompleted: false,
                    });
                }
            });

            await Promise.all(goalPromises);
            addToast("Tüm öğrenciler için yeni hedefler başarıyla oluşturuldu.", "success");

        } catch (error) {
            console.error("Error generating goals for all students:", error);
            addToast("Hedefler oluşturulurken bir hata oluştu.", "error");
        } finally {
            setIsGeneratingGoals(false);
        }
    };
    
    const handleToggleSelect = (studentId: string) => {
        setSelectedStudentIds(prev => 
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedStudentIds.length === visibleStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(visibleStudents.map(s => s.id));
        }
    };

    const handleBatchDelete = async () => {
        const promises = selectedStudentIds.map(id => deleteUser(id));
        await Promise.all(promises);
        addToast(`${selectedStudentIds.length} öğrenci başarıyla silindi.`, "success");
        setSelectedStudentIds([]);
    };
    
    const handleBatchAssignResource = async (resourceId: string) => {
        await assignResourceToStudents(resourceId, selectedStudentIds);
        addToast(`Kaynak ${selectedStudentIds.length} öğrenciye atandı.`, "success");
        setSelectedStudentIds([]);
    };

    return (
        <>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 flex-wrap">
                 <div className="flex items-center gap-2 flex-grow w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Öğrenci ara..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 w-full sm:w-auto flex-grow"
                    />
                     <div className="flex items-center flex-shrink-0">
                        <input
                            type="checkbox"
                            id="select-all"
                            className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                            checked={visibleStudents.length > 0 && selectedStudentIds.length === visibleStudents.length}
                            onChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="ml-2 text-sm">Tümünü Seç</label>
                    </div>
                 </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select
                        value={filterTrack}
                        onChange={e => setFilterTrack(e.target.value as any)}
                        className="p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 w-full"
                        aria-label="Bölüme göre filtrele"
                    >
                        <option value="all">Tüm Bölümler</option>
                        {Object.entries(academicTrackLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    {isSuperAdmin && (
                        <select
                            value={filterCoach}
                            onChange={e => setFilterCoach(e.target.value)}
                            className="p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 w-full"
                            aria-label="Koça göre filtrele"
                        >
                            <option value="all">Tüm Koçlar</option>
                            {coaches.map(coach => (
                                <option key={coach.id} value={coach.id}>{coach.name}</option>
                            ))}
                            <option value="null">Atanmamış</option>
                        </select>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setIsConfirmGoalModalOpen(true)}
                        disabled={isGeneratingGoals}
                        className="w-full sm:w-auto px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 font-semibold flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50"
                    >
                        <SparklesIcon className="w-5 h-5"/>
                        {isGeneratingGoals ? 'Oluşturuluyor...' : 'Tümüne Hedef Ata'}
                    </button>
                    <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 font-semibold flex-shrink-0"
                    >
                        + Yeni Öğrenci Ekle
                    </button>
                </div>
            </div>

            {students.length === 0 ? (
                 <EmptyState 
                    icon={<NoStudentsIcon className="w-10 h-10"/>}
                    title={isSuperAdmin ? "Platformda Öğrenci Yok" : "Henüz Öğrenciniz Yok"}
                    description={isSuperAdmin ? "Süper Admin panelinden yeni kullanıcılar oluşturarak öğrenci ekleyebilirsiniz." : "Size yeni öğrenciler atandığında burada görünecekler."}
                 />
            ) : Object.values(groupedStudents).every(group => group.length === 0) ? (
                 <EmptyState
                    icon={<NoStudentsIcon className="w-10 h-10"/>}
                    title="Öğrenci Bulunamadı"
                    description="Arama kriterlerinizi değiştirmeyi deneyin veya tüm öğrencileri görmek için aramayı temizleyin."
                 />
            ) : (
                <div className="space-y-8">
                    {gradeOrder.map(grade => {
                        const studentGroup = groupedStudents[grade];
                        if (studentGroup && studentGroup.length > 0) {
                            const gradeLabel = grade === 'mezun' ? 'Mezunlar' : grade === 'Diğer' ? 'Diğer' : `${grade}. Sınıf`;
                            return (
                                <section key={grade}>
                                    <h2 className="text-xl font-bold border-b-2 border-primary-500 pb-2 mb-4">{gradeLabel}</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {studentGroup.map(student => (
                                            <MemoizedStudentCard 
                                                key={student.id} 
                                                student={student} 
                                                onSelect={handleSelectStudent}
                                                isSelected={selectedStudentIds.includes(student.id)}
                                                onToggleSelect={handleToggleSelect}
                                            />
                                        ))}
                                    </div>
                                </section>
                            );
                        }
                        return null;
                    })}
                </div>
            )}
        </div>

        {selectedStudentIds.length > 0 && (
            <div className="fixed bottom-24 lg:bottom-10 right-10 z-40 animate-fade-in-right">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 flex items-center gap-4 border dark:border-gray-700">
                    <span className="text-sm font-semibold">{selectedStudentIds.length} öğrenci seçildi</span>
                    <button onClick={() => setIsAssignResourceModalOpen(true)} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1.5">
                       <LibraryIcon className="w-4 h-4"/> Kaynak Ata
                    </button>
                    <button onClick={() => setIsConfirmDeleteOpen(true)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
        
        {selectedStudent && <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
        {isAddStudentModalOpen && (
            <Modal isOpen={isAddStudentModalOpen} onClose={() => setIsAddStudentModalOpen(false)} title="Yeni Öğrenci Ekle">
                <AddStudentForm onClose={() => setIsAddStudentModalOpen(false)} />
            </Modal>
        )}
        {isConfirmGoalModalOpen && (
            <ConfirmationModal
                isOpen={isConfirmGoalModalOpen}
                onClose={() => setIsConfirmGoalModalOpen(false)}
                onConfirm={() => {
                    setIsConfirmGoalModalOpen(false);
                    handleGenerateAllGoals();
                }}
                title="Tüm Öğrencilere Hedef Ata"
                message="Bu işlem, tüm öğrenciler için mevcut performans verilerine göre yapay zeka destekli yeni hedefler oluşturup atayacaktır. Devam etmek istediğinizden emin misiniz?"
                confirmText="Evet, Ata"
            />
        )}
         {isConfirmDeleteOpen && (
            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleBatchDelete}
                title="Öğrencileri Sil"
                message={`${selectedStudentIds.length} öğrenciyi ve onlara ait tüm verileri kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
            />
        )}
        {isAssignResourceModalOpen && (
            <AssignResourceToStudentsModal
                isOpen={isAssignResourceModalOpen}
                onClose={() => setIsAssignResourceModalOpen(false)}
                onAssign={handleBatchAssignResource}
                studentCount={selectedStudentIds.length}
            />
        )}
        </>
    );
};
