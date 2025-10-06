import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Assignment, AssignmentStatus, UserRole, AcademicTrack, Badge, BadgeID } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, MessagesIcon, SparklesIcon, StudentsIcon as NoStudentsIcon, LibraryIcon, TrashIcon, GridIcon, ListIcon, ArrowLeftIcon, XIcon, BrainCircuitIcon } from '../components/Icons';
import EmptyState from '../components/EmptyState';
import ConfirmationModal from '../components/ConfirmationModal';
import OverviewTab from '../components/studentDetail/OverviewTab';
import AssignmentsTab from '../components/studentDetail/AssignmentsTab';
import MotivationTab from '../components/studentDetail/MotivationTab';
import NotesTab from '../components/studentDetail/NotesTab';
import { suggestStudentGoal } from '../services/geminiService';
import InviteStudentModal from '../components/InviteStudentModal';
import AIReportModal from '../components/AIReportModal';

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

const StudentDetailModal = ({ student, onClose, onNavigate, canNavigate }: { 
    student: User | null; 
    onClose: () => void; 
    onNavigate?: (direction: 'next' | 'prev') => void;
    canNavigate?: { next: boolean, prev: boolean };
}) => {
    const { users } = useDataContext();
    const [activeTab, setActiveTab] = useState('overview');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        if (student) {
            setActiveTab('overview');
        }
    }, [student]);

    if (!student) return null;
    
    const assignedCoach = users.find(u => u.id === student.assignedCoachId);
    
    return (
        <Modal isOpen={!!student} onClose={onClose} title="" size="lg">
            <div className="flex items-start sm:items-center justify-between mb-4 pb-4 border-b dark:border-slate-700 flex-col sm:flex-row gap-4">
                <div className="flex items-start space-x-4">
                    <img src={student.profilePicture} alt={student.name} className="w-20 h-20 rounded-full" loading="lazy" />
                    <div>
                        <h3 className="text-2xl font-bold">{student.name}</h3>
                        <p className="text-slate-500">{student.email}</p>
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
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${assignedCoach ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200'}`}>
                                Koç: {assignedCoach?.name || 'Atanmamış'}
                            </span>
                        </div>
                    </div>
                </div>
                 <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="px-3 py-2 text-sm font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-900 flex items-center gap-2"
                        title="AI Raporu Oluştur"
                    >
                        <BrainCircuitIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">AI Raporu</span>
                    </button>
                    {onNavigate && (
                        <div className="flex items-center gap-1 border-l pl-2 ml-1 dark:border-slate-600">
                            <button onClick={() => onNavigate('prev')} disabled={!canNavigate?.prev} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"><ArrowLeftIcon className="w-5 h-5"/></button>
                            <button onClick={() => onNavigate('next')} disabled={!canNavigate?.next} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"><ArrowLeftIcon className="w-5 h-5 transform rotate-180"/></button>
                        </div>
                    )}
                </div>
            </div>
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('overview')} className={`${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Genel Bakış</button>
                    <button onClick={() => setActiveTab('assignments')} className={`${activeTab === 'assignments' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Ödevler</button>
                    <button onClick={() => setActiveTab('motivation')} className={`${activeTab === 'motivation' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Motivasyon</button>
                    <button onClick={() => setActiveTab('notes')} className={`${activeTab === 'notes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Notlar</button>
                </nav>
            </div>
            
            <div className="pt-6">
                {activeTab === 'overview' && <OverviewTab student={student} />}
                {activeTab === 'assignments' && <AssignmentsTab student={student} onClose={onClose}/>}
                {activeTab === 'motivation' && <MotivationTab student={student} />}
                {activeTab === 'notes' && <NotesTab student={student} />}
            </div>
            {isReportModalOpen && <AIReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} student={student} />}
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
            setActivePage('messages', { conversationId: convId });
        }
    };

    const handleAssignTask = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActivePage('assignments', { openNewAssignmentModal: true, preselectedStudentIds: [student.id] });
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
                className="absolute top-2 left-2 h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600 z-10"
                checked={isSelected}
                onChange={() => onToggleSelect(student.id)}
                aria-label={`Select student ${student.name}`}
            />
            <Card className={`flex flex-col p-0 cursor-pointer transition-shadow duration-300 h-full ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-slate-700/50' : ''}`} onClick={() => onSelect(student)}>
                <div className="flex flex-col items-center flex-grow p-3 text-center pt-6">
                    <div className="relative flex-shrink-0 mb-2">
                        <img src={student.profilePicture} alt={student.name} className="w-14 h-14 rounded-full" loading="lazy" />
                        <span className="absolute -bottom-1 -right-1 bg-primary-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800" title={`Seviye ${currentLevel}`}>{currentLevel}</span>
                        {overdueCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" title={`${overdueCount} gecikmiş ödev`}></span>
                        )}
                    </div>
                    <h4 className="text-sm font-bold leading-tight">{student.name}</h4>
                    <p className="text-xs text-slate-500 leading-tight">{student.email}</p>
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

                <div className="flex justify-around items-center w-full px-1 py-1 border-t dark:border-slate-700 mt-auto">
                    <button onClick={handleAssignTask} title="Ödev Ver" className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary-500 transition-colors">
                        <AssignmentsIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleSendMessage} title="Mesaj At" className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary-500 transition-colors">
                        <MessagesIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleAssignResource} title="Kaynak Ekle" className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary-500 transition-colors">
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
                <select value={selectedResourceId} onChange={e => setSelectedResourceId(e.target.value)} className="w-full p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                    <option value="" disabled>Bir kaynak seçin...</option>
                    {publicResources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
             <div className="flex justify-end pt-4 mt-4 border-t dark:border-slate-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">İptal</button>
                <button onClick={handleAssign} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700" disabled={!selectedResourceId}>Ata</button>
            </div>
        </Modal>
    );
};

export default function Students() {
    const { students, currentUser, users, addGoal, getAssignmentsForStudent, deleteUser, assignResourceToStudents } = useDataContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [selectedStudentIndex, setSelectedStudentIndex] = useState<number | null>(null);
    const [filterCoach, setFilterCoach] = useState('all');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [filterTrack, setFilterTrack] = useState<AcademicTrack | 'all'>('all');
    const { initialFilters, setInitialFilters, addToast, setActivePage } = useUI();
    const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
    const [isConfirmGoalModalOpen, setIsConfirmGoalModalOpen] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isAssignResourceModalOpen, setIsAssignResourceModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('studentViewMode') as 'grid' | 'list') || 'grid');
    const [sortConfig, setSortConfig] = useState<{ key: keyof (User & { avgGrade: number; overdueCount: number }); direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        localStorage.setItem('studentViewMode', viewMode);
    }, [viewMode]);

    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
    const coaches = useMemo(() => users.filter(u => u.role === UserRole.Coach), [users]);

    const academicTrackLabels: Record<AcademicTrack, string> = {
        [AcademicTrack.Sayisal]: 'Sayısal',
        [AcademicTrack.EsitAgirlik]: 'Eşit Ağırlık',
        [AcademicTrack.Sozel]: 'Sözel',
        [AcademicTrack.Dil]: 'Dil',
    };

    const studentsWithStats = useMemo(() => {
        return students.map(student => {
            const assignments = getAssignmentsForStudent(student.id);
            const overdueCount = assignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
            const graded = assignments.filter(a => a.grade !== null);
            const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 0;
            return { ...student, overdueCount, avgGrade };
        });
    }, [students, getAssignmentsForStudent]);

    const filteredStudents = useMemo(() => {
        return studentsWithStats
            .filter(student => {
                const matchesSearch = student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
                const matchesCoach = !isSuperAdmin || filterCoach === 'all' || 
                                    (filterCoach === 'null' && !student.assignedCoachId) ||
                                    student.assignedCoachId === filterCoach;
                const matchesTrack = filterTrack === 'all' || student.academicTrack === filterTrack;
                return matchesSearch && matchesCoach && matchesTrack;
            });
    }, [studentsWithStats, debouncedSearchTerm, isSuperAdmin, filterCoach, filterTrack]);

    const sortedAndGroupedStudents = useMemo(() => {
        const sorted = [...filteredStudents];
        if (sortConfig !== null) {
            sorted.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                
                if (valA == null && valB == null) return 0;
                if (valA == null) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valB == null) return sortConfig.direction === 'asc' ? 1 : -1;

                if (valA < valB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        if (viewMode === 'grid' && !sortConfig) {
             const gradeKeys = ['12', '11', '10', '9', 'mezun'];
             const groups = gradeKeys.reduce((acc, grade) => ({ ...acc, [grade]: [] }), {} as Record<string, typeof sorted>);
             groups['Diğer'] = [];

             sorted.sort((a, b) => a.name.localeCompare(b.name))
                 .forEach(student => {
                     const grade = student.gradeLevel;
                     if (grade && gradeKeys.includes(grade)) {
                         groups[grade].push(student);
                     } else {
                         groups['Diğer'].push(student);
                     }
                 });
             return { grouped: groups, flat: sorted };
        }
        
        return { grouped: null, flat: sorted };
    }, [filteredStudents, sortConfig, viewMode]);
    
    const flatStudentList = useMemo(() => sortedAndGroupedStudents.flat, [sortedAndGroupedStudents]);
    
    const selectedStudent = useMemo(() => 
        selectedStudentIndex !== null ? flatStudentList[selectedStudentIndex] : null,
        [selectedStudentIndex, flatStudentList]
    );

    const handleSelectStudent = useCallback((student: User) => {
        const index = flatStudentList.findIndex(s => s.id === student.id);
        if (index !== -1) {
            setSelectedStudentIndex(index);
        }
    }, [flatStudentList]);
    
    const handleNavigate = useCallback((direction: 'next' | 'prev') => {
        if (selectedStudentIndex === null) return;
        const newIndex = direction === 'next' ? selectedStudentIndex + 1 : selectedStudentIndex - 1;
        if (newIndex >= 0 && newIndex < flatStudentList.length) {
            setSelectedStudentIndex(newIndex);
        }
    }, [selectedStudentIndex, flatStudentList.length]);

    const navigationState = useMemo(() => ({
        prev: selectedStudentIndex !== null && selectedStudentIndex > 0,
        next: selectedStudentIndex !== null && selectedStudentIndex < flatStudentList.length - 1
    }), [selectedStudentIndex, flatStudentList.length]);

    useEffect(() => {
        if (initialFilters.studentId) {
            const studentToOpen = students.find(s => s.id === initialFilters.studentId);
            if (studentToOpen) {
                handleSelectStudent(studentToOpen);
            }
            setInitialFilters({});
        }
    }, [initialFilters, setInitialFilters, students, handleSelectStudent]);


    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);


    const gradeOrder: string[] = ['12', '11', '10', '9', 'mezun', 'Diğer'];

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
                        title: suggestion,
                        isCompleted: false,
                        description: "Bu hedef AI tarafından önerilmiştir. Detayları ve kilometre taşlarını hedefler sayfasından ekleyebilirsiniz.",
                        milestones: [],
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
    
    const handleToggleSelect = useCallback((studentId: string) => {
        setSelectedStudentIds(prev => 
            prev.includes(studentId) ? prev.filter(prevId => prevId !== studentId) : [...prev, studentId]
        );
    }, []);

    const handleSelectAll = () => {
        if (selectedStudentIds.length === filteredStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(filteredStudents.map(s => s.id));
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

    const handleBatchAssignTask = () => {
        setActivePage('assignments', { openNewAssignmentModal: true, preselectedStudentIds: selectedStudentIds });
    };
    
    const requestSort = (key: keyof (User & { avgGrade: number; overdueCount: number })) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
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
                        className="p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 w-full sm:w-auto flex-grow"
                    />
                     <div className="flex items-center flex-shrink-0">
                        <input
                            type="checkbox"
                            id="select-all"
                            className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600"
                            checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                            onChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="ml-2 text-sm">Tümünü Seç</label>
                    </div>
                 </div>
                <div className="flex gap-2 w-full sm:w-auto">
                     <div className="flex items-center bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}><GridIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}><ListIcon className="w-5 h-5"/></button>
                    </div>
                    <select
                        value={filterTrack}
                        onChange={e => setFilterTrack(e.target.value as any)}
                        className="p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 w-full"
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
                            className="p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 w-full"
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
                        onClick={() => setIsInviteModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 font-semibold flex-shrink-0"
                    >
                        + Öğrenci Davet Et
                    </button>
                </div>
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
            ) : viewMode === 'grid' ? (
                <div className="space-y-8">
                    {gradeOrder.map(grade => {
                        const studentGroup = sortedAndGroupedStudents.grouped?.[grade];
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
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                <tr>
                                    <th scope="col" className="p-4"><input type="checkbox" className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600" checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length} onChange={handleSelectAll}/></th>
                                    <th scope="col" className="px-4 py-3 cursor-pointer" onClick={() => requestSort('name')}>Öğrenci</th>
                                    <th scope="col" className="px-4 py-3 cursor-pointer hidden md:table-cell" onClick={() => requestSort('avgGrade')}>Not Ort.</th>
                                    <th scope="col" className="px-4 py-3 cursor-pointer hidden lg:table-cell" onClick={() => requestSort('overdueCount')}>Gecikmiş Ödev</th>
                                    <th scope="col" className="px-4 py-3 hidden md:table-cell">Seviye/Bölüm</th>
                                    <th scope="col" className="px-4 py-3">Eylemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndGroupedStudents.flat.map(student => (
                                    <tr key={student.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                        <td className="p-4"><input type="checkbox" className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600" checked={selectedStudentIds.includes(student.id)} onChange={() => handleToggleSelect(student.id)}/></td>
                                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap dark:text-white cursor-pointer" onClick={() => handleSelectStudent(student)}>
                                            <div className="flex items-center gap-3">
                                                <img src={student.profilePicture} alt={student.name} className="w-8 h-8 rounded-full" loading="lazy" />
                                                {student.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">{student.avgGrade}</td>
                                        <td className={`px-4 py-3 hidden lg:table-cell ${student.overdueCount > 0 ? 'text-red-500 font-semibold' : ''}`}>{student.overdueCount}</td>
                                        <td className="px-4 py-3 hidden md:table-cell">{student.gradeLevel || 'N/A'} / {getAcademicTrackLabel(student.academicTrack as AcademicTrack)}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => handleSelectStudent(student)} className="font-medium text-primary-600 dark:text-primary-500 hover:underline">Detaylar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>

        {selectedStudentIds.length > 0 && (
            <div className="fixed bottom-24 lg:bottom-10 right-10 z-40 animate-fade-in-right">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-4 flex items-center gap-4 border dark:border-slate-700">
                    <span className="text-sm font-semibold whitespace-nowrap">{selectedStudentIds.length} öğrenci seçildi</span>
                     <div className="flex items-center gap-2">
                        <button onClick={handleBatchAssignTask} className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 flex items-center gap-1.5" title="Toplu Ödev Ata">
                            <AssignmentsIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsAssignResourceModalOpen(true)} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1.5" title="Kaynak Ata">
                           <LibraryIcon className="w-4 h-4"/>
                        </button>
                        <button onClick={() => setIsConfirmDeleteOpen(true)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600" title="Seçilenleri Sil">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setSelectedStudentIds([])} className="p-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500" title="Seçimi Temizle">
                           <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudentIndex(null)} onNavigate={handleNavigate} canNavigate={navigationState} />
        {isInviteModalOpen && <InviteStudentModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />}
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
}