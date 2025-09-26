import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Assignment, AssignmentStatus, UserRole } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, MessagesIcon, SparklesIcon, AlertTriangleIcon, StudentsIcon as NoStudentsIcon, LibraryIcon, CheckIcon } from '../components/Icons';
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
    const { getAssignmentsForStudent, getGoalsForStudent, updateGoal, addGoal, updateStudentNotes, users } = useDataContext();
    const { addToast } = useUI();
    const [newGoalText, setNewGoalText] = useState('');
    const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [notes, setNotes] = useState(student?.notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    
    useEffect(() => {
        setNotes(student?.notes || '');
    }, [student]);

    useEffect(() => {
        if (!student) return;

        const handleSaveNotes = async () => {
            if (notes !== student.notes) {
                setIsSavingNotes(true);
                await updateStudentNotes(student.id, notes);
                setIsSavingNotes(false);
                addToast("Notlar otomatik kaydedildi.", "success");
            }
        };

        // Set a new timeout
        const timeoutId = window.setTimeout(() => {
            handleSaveNotes();
        }, 1500); // Auto-save after 1.5 seconds of inactivity

        // Cleanup function to clear the timeout when the component unmounts or dependencies change
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
            <div className="flex items-start space-x-4 mb-4 pb-4 border-b dark:border-gray-700">
                <img src={student.profilePicture} alt={student.name} className="w-20 h-20 rounded-full" />
                <div>
                    <h3 className="text-2xl font-bold">{student.name}</h3>
                    <p className="text-gray-500">{student.email}</p>
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
    const { getAssignmentsForStudent, users, findOrCreateConversation } = useDataContext();
    const { setActivePage, addToast } = useUI();

    const assignments = getAssignmentsForStudent(student.id);
    const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    const averageGrade: number | string = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((acc, curr) => acc + curr.grade!, 0) / gradedAssignments.length)
        : 'N/A';

    const overdueCount = assignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
    const hasAlert = (typeof averageGrade === 'number' && averageGrade > 0 && averageGrade < 60) || overdueCount > 0;
    
    let alertTitle = '';
    if (overdueCount > 0) alertTitle += `${overdueCount} gecikmiş ödev. `;
    if (typeof averageGrade === 'number' && averageGrade > 0 && averageGrade < 60) alertTitle += `Not ortalaması: ${averageGrade}.`;
    
    const assignedCoach = users.find(u => u.id === student.assignedCoachId);
        
    const pendingCount = assignments.filter(a => a.status === AssignmentStatus.Pending).length;
    const submittedCount = assignments.filter(a => a.status === AssignmentStatus.Submitted).length;
    const gradedCount = assignments.filter(a => a.status === AssignmentStatus.Graded).length;

    const handleSendMessage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const convId = await findOrCreateConversation(student.id);
        if (convId) {
            setActivePage('messages', { contactId: convId });
        }
    };

    const handleAssignResource = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActivePage('library');
        addToast(`${student.name} için bir kaynak seçip atayabilirsiniz.`, 'info');
    };

    const handleAssignTask = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActivePage('assignments', { studentId: student.id, openNewAssignmentModal: true });
    };

    return (
        <Card className="flex flex-col p-4 cursor-pointer transition-shadow duration-300 h-full hover:shadow-lg" onClick={() => onSelect(student)}>
            <div className="flex items-center gap-4 flex-grow">
                <img src={student.profilePicture} alt={student.name} className="w-16 h-16 rounded-full flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold truncate">{student.name}</h4>
                        {hasAlert && (
                            <div title={alertTitle.trim()}>
                                <AlertTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{student.email}</p>
                    <p className={`text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded-full ${assignedCoach ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>{assignedCoach?.name || 'Atanmamış'}</p>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t dark:border-gray-700">
                <div className="flex justify-around items-center">
                    <div className="text-center">
                        <p className="font-bold text-base">{assignments.length}</p>
                        <p className="text-xs text-gray-500">Ödev</p>
                    </div>
                     <div className="text-center">
                        <p className="font-bold text-base text-primary-500">{averageGrade}</p>
                        <p className="text-xs text-gray-500">Not Ort.</p>
                    </div>
                </div>
                <div className="flex justify-center gap-4 w-full mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                     <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300" title="Bekleyen Ödevler">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <span className="font-semibold">{pendingCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300" title="Teslim Edilmiş Ödevler">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="font-semibold">{submittedCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300" title="Notlandırılmış Ödevler">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="font-semibold">{gradedCount}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-around items-center mt-3 pt-3 border-t dark:border-gray-700">
                <button onClick={handleAssignTask} title="Ödev Ver" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-500 transition-colors">
                    <AssignmentsIcon className="w-5 h-5" />
                </button>
                <button onClick={handleAssignResource} title="Kaynak Gönder" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-500 transition-colors">
                    <LibraryIcon className="w-5 h-5" />
                </button>
                <button onClick={handleSendMessage} title="Mesaj At" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-500 transition-colors">
                    <MessagesIcon className="w-5 h-5" />
                </button>
            </div>
        </Card>
    );
});

const Students = () => {
    const { students, currentUser, users } = useDataContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [filterCoach, setFilterCoach] = useState('all');

    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
    const coaches = useMemo(() => users.filter(u => u.role === UserRole.Coach), [users]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            if (!isSuperAdmin) {
                return matchesSearch;
            }
            const matchesCoach = filterCoach === 'all' || 
                                (filterCoach === 'null' && !student.assignedCoachId) ||
                                student.assignedCoachId === filterCoach;
            return matchesSearch && matchesCoach;
        });
    }, [students, debouncedSearchTerm, isSuperAdmin, filterCoach]);
    
    const handleSelectStudent = useCallback((student: User) => {
        setSelectedStudent(student);
    }, []);

    return (
        <>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-end gap-4">
                {isSuperAdmin && (
                    <select
                        value={filterCoach}
                        onChange={e => setFilterCoach(e.target.value)}
                        className="p-2 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 w-full sm:w-auto"
                        aria-label="Koça göre filtrele"
                    >
                        <option value="all">Tüm Öğrenciler</option>
                        {coaches.map(coach => (
                            <option key={coach.id} value={coach.id}>{coach.name}</option>
                        ))}
                         <option value="null">Atanmamış Öğrenciler</option>
                    </select>
                )}
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
                    title={isSuperAdmin ? "Platformda Öğrenci Yok" : "Henüz Öğrenciniz Yok"}
                    description={isSuperAdmin ? "Süper Admin panelinden yeni kullanıcılar oluşturarak öğrenci ekleyebilirsiniz." : "Size yeni öğrenciler atandığında burada görünecekler."}
                 />
            ) : filteredStudents.length === 0 ? (
                 <EmptyState
                    icon={<NoStudentsIcon className="w-10 h-10"/>}
                    title="Öğrenci Bulunamadı"
                    description="Arama kriterlerinizi değiştirmeyi deneyin veya tüm öğrencileri görmek için aramayı temizleyin."
                 />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredStudents.map(student => (
                        <StudentCard key={student.id} student={student} onSelect={handleSelectStudent} />
                    ))}
                </div>
            )}
        </div>
        {selectedStudent && <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
        </>
    );
};

export default Students;