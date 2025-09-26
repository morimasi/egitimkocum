

import React, { useEffect, useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, AssignmentStatus, User, Assignment } from '../types';
import Card from '../components/Card';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, StudentsIcon, AlertTriangleIcon, SparklesIcon, MegaphoneIcon, MessagesIcon, PlusCircleIcon, LibraryIcon, TargetIcon, TrendingUpIcon } from '../components/Icons';
import { DashboardSkeleton, SkeletonText } from '../components/SkeletonLoader';
import { generateStudentFocusSuggestion, generatePersonalCoachSummary } from '../services/geminiService';
import AnnouncementModal from '../components/AnnouncementModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';


const AnnouncementsCard = React.memo(({className = ''}: {className?: string}) => {
    const { messages, coach } = useDataContext();
    const { setActivePage } = useUI();
    const announcements = useMemo(() => messages
        .filter(m => m.type === 'announcement')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3), [messages]);

    if (announcements.length === 0) {
        return null;
    }

    return (
        <Card title="Son Duyurular" className={`h-full ${className}`}>
             <ul className="space-y-3">
                {announcements.map(msg => (
                     <li key={msg.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg flex items-start space-x-3 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900" onClick={() => setActivePage('messages', {contactId: 'conv-announcements'})}>
                        <div className="flex-shrink-0 pt-1">
                            <MegaphoneIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{msg.text}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {coach?.name} - {new Date(msg.timestamp).toLocaleString('tr-TR')}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    );
});

// --- Student Dashboard Components ---

const StudentWelcomeHeader = React.memo(() => {
    const { currentUser, getAssignmentsForStudent } = useDataContext();
    const [suggestion, setSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const currentLevel = useMemo(() => currentUser?.xp ? Math.floor(Math.sqrt(currentUser.xp / 100)) + 1 : 1, [currentUser?.xp]);

    const handleGenerateSuggestion = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const assignments = getAssignmentsForStudent(currentUser.id);
        const result = await generateStudentFocusSuggestion(currentUser.name, assignments);
        setSuggestion(result);
        setIsLoading(false);
    };


    return (
        <Card variant="gradient" className="animate-fade-in" icon={<SparklesIcon />}>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-white">Hoş geldin, {currentUser?.name}!</h1>
                    <p className="text-sm text-white/80">Seviye: {currentLevel} | XP: {currentUser?.xp || 0}</p>
                </div>
                 <button onClick={handleGenerateSuggestion} className="px-3 py-1.5 text-sm font-semibold bg-white/20 hover:bg-white/30 rounded-full transition-colors flex-shrink-0">
                    ✨ Günlük Tavsiyeni Al
                </button>
            </div>
             <div className="mt-3 text-white/90 bg-white/10 p-3 rounded-md min-h-[40px] flex items-center text-sm">
                 {isLoading ? (
                    <SkeletonText className="h-5 w-3/4 bg-white/30" />
                ) : suggestion ? (
                    <p>{suggestion}</p>
                ) : (
                   <p className="opacity-80">Güne motive başlamak için günlük tavsiyeni al!</p>
                )}
            </div>
        </Card>
    );
});

const StudentStatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
    <Card className={`relative overflow-hidden`}>
         <div className={`absolute -top-2 -right-2 text-6xl opacity-10 ${color}`}>
            {icon}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </Card>
);

const ProgressOverview = React.memo(() => {
    const { currentUser, getAssignmentsForStudent, getGoalsForStudent } = useDataContext();
    if(!currentUser) return null;

    const assignments = getAssignmentsForStudent(currentUser.id);
    const completionRate = assignments.length > 0 ? (assignments.filter(a => a.status !== AssignmentStatus.Pending).length / assignments.length) * 100 : 0;
    
    const goals = getGoalsForStudent(currentUser.id);
    const goalsRate = goals.length > 0 ? (goals.filter(g => g.isCompleted).length / goals.length) * 100 : 0;
    
    return (
        <Card title="Genel İlerleme Durumu">
            <div className="space-y-4">
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ödev Tamamlama</span>
                        <span className="text-sm font-bold text-primary-500">{completionRate.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${completionRate}%` }}></div>
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hedefler</span>
                        <span className="text-sm font-bold text-yellow-500">{goalsRate.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${goalsRate}%` }}></div>
                    </div>
                </div>
            </div>
        </Card>
    );
});


const ToDoTabs = React.memo(() => {
    const { currentUser, getAssignmentsForStudent, getGoalsForStudent, updateGoal } = useDataContext();
    const { setActivePage } = useUI();
    const [activeTab, setActiveTab] = useState('assignments');

    if(!currentUser) return null;

    const upcomingAssignments = getAssignmentsForStudent(currentUser.id)
        .filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) > new Date())
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 4);
        
    const goals = getGoalsForStudent(currentUser.id).slice(0, 5);
     const handleToggleGoal = (goalId: string) => {
        const goal = goals.find(g => g.id === goalId);
        if(goal) updateGoal({...goal, isCompleted: !goal.isCompleted});
    };

    return (
        <Card className="flex flex-col h-full">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('assignments')} className={`${activeTab === 'assignments' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Yaklaşan Ödevler</button>
                    <button onClick={() => setActiveTab('goals')} className={`${activeTab === 'goals' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Hedeflerim</button>
                </nav>
            </div>
            <div className="p-6 flex-grow">
                {activeTab === 'assignments' ? (
                    <ul className="space-y-3">
                        {upcomingAssignments.length > 0 ? upcomingAssignments.map(a => {
                             const dueDate = new Date(a.dueDate);
                             const now = new Date();
                             const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                             const isUrgent = diffDays <= 2;
                            return (
                                <li key={a.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{a.title}</p>
                                        <p className={`text-sm ${isUrgent ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>Son teslim: {dueDate.toLocaleDateString('tr-TR')}</p>
                                    </div>
                                    <button onClick={() => setActivePage('assignments', { assignmentId: a.id })} className="text-sm font-semibold text-primary-500 hover:underline">Detay</button>
                                </li>
                            )
                        }) : (
                             <p className="text-center text-gray-500 py-8">Harika iş! Yaklaşan bir ödevin yok.</p>
                        )}
                    </ul>
                ) : (
                    <ul className="space-y-3">
                        {goals.length > 0 ? goals.map(goal => (
                            <li key={goal.id} className="flex items-center">
                                <input type="checkbox" id={`goal-${goal.id}`} checked={goal.isCompleted} onChange={() => handleToggleGoal(goal.id)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                                <label htmlFor={`goal-${goal.id}`} className={`ml-3 text-sm ${goal.isCompleted ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{goal.text}</label>
                            </li>
                        )) : (
                            <p className="text-sm text-gray-500 text-center py-8">Henüz bir hedef belirlemedin.</p>
                        )}
                    </ul>
                )}
            </div>
        </Card>
    );
});


const StudentDashboard = () => {
    const { currentUser, getAssignmentsForStudent, getGoalsForStudent } = useDataContext();
    if (!currentUser) return null;
    
    const assignments = getAssignmentsForStudent(currentUser.id);
    const goals = getGoalsForStudent(currentUser.id);

    const stats = useMemo(() => {
        const graded = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        return {
            pending: assignments.filter(a => a.status === AssignmentStatus.Pending).length,
            avgGrade: graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 'N/A',
            goalsCompleted: goals.filter(g => g.isCompleted).length
        };
    }, [assignments, goals]);
    
    return (
        <div className="space-y-6">
            <StudentWelcomeHeader />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StudentStatCard title="Bekleyen Ödev" value={stats.pending} icon={<AssignmentsIcon/>} color="text-yellow-500"/>
                <StudentStatCard title="Not Ortalaması" value={stats.avgGrade} icon={<TrendingUpIcon/>} color="text-green-500"/>
                <StudentStatCard title="Tamamlanan Hedef" value={stats.goalsCompleted} icon={<TargetIcon/>} color="text-blue-500"/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                    <ToDoTabs />
                </div>
                <div className="lg:col-span-5 space-y-6">
                    <ProgressOverview />
                    <AnnouncementsCard />
                </div>
            </div>
        </div>
    );
};


// --- Coach Dashboard Components ---

const CoachWelcomeHeader = React.memo(() => {
    const { currentUser, students, assignments } = useDataContext();
    const [insights, setInsights] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateInsights = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const result = await generatePersonalCoachSummary(currentUser.name, students, assignments);
        setInsights(result);
        setIsLoading(false);
    };

    return (
        <Card variant="gradient" className="animate-fade-in" icon={<SparklesIcon />}>
             <h1 className="text-2xl font-bold text-white">Merhaba, {currentUser?.name}!</h1>
             <p className="mt-1 text-white/80">Haftalık koçluk özetini ve tavsiyelerini görmek için butona tıkla.</p>
             <div className="mt-3 p-3 bg-white/10 rounded-lg text-sm min-h-[72px]">
                {isLoading ? (
                    <SkeletonText className="h-full w-full bg-white/20" />
                ) : insights ? (
                    <p className="whitespace-pre-wrap">{insights}</p>
                ) : (
                    <button onClick={handleGenerateInsights} className="px-3 py-1.5 text-sm font-semibold bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                        ✨ Haftalık Özeti Oluştur
                    </button>
                )}
             </div>
        </Card>
    );
});

const StatCard = React.memo(({ title, value, icon, onClick }: { title: string, value: string | number, icon: React.ReactNode, onClick?: () => void }) => (
    <Card className="flex items-start justify-between p-5 transition-transform hover:-translate-y-1" onClick={onClick}>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-primary-500">
            {icon}
        </div>
    </Card>
));

const QuickActionsCard = ({ onAnnounceClick }: { onAnnounceClick: () => void }) => {
    const { setActivePage } = useUI();
    const actions = [
        { label: "Yeni Ödev", icon: <PlusCircleIcon className="w-6 h-6"/>, action: () => setActivePage('assignments', { openNewAssignmentModal: true }) },
        { label: "Duyuru Yap", icon: <MegaphoneIcon className="w-6 h-6"/>, action: onAnnounceClick },
        { label: "Kütüphane", icon: <LibraryIcon className="w-6 h-6"/>, action: () => setActivePage('library') },
        { label: "Öğrenciler", icon: <StudentsIcon className="w-6 h-6"/>, action: () => setActivePage('students') },
    ];
    return (
        <Card title="Hızlı Eylemler">
            <div className="grid grid-cols-2 gap-4">
                {actions.map(action => (
                     <button key={action.label} onClick={action.action} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center gap-2 transition-all transform hover:scale-105">
                        {action.icon}
                        <span className="text-sm font-semibold text-center">{action.label}</span>
                    </button>
                ))}
            </div>
        </Card>
    );
};


const CoachDashboard = () => {
    const { students, assignments, findOrCreateConversation } = useDataContext();
    const { setActivePage } = useUI();
    const [isAnnouncementModalOpen, setAnnouncementModalOpen] = useState(false);
    
    const stats = useMemo(() => {
        const studentIds = students.map(s => s.id);
        const coachAssignments = assignments.filter(a => studentIds.includes(a.studentId));
        return {
            pendingCount: coachAssignments.filter(a => a.status === AssignmentStatus.Submitted).length,
            overdueCount: coachAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length,
        };
    }, [students, assignments]);
    
    const studentsWithAlerts = useMemo(() => students.map(s => {
        const studentAssignments = assignments.filter(a => a.studentId === s.id);
        const graded = studentAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        const avg = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 0;
        const overdue = studentAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
        const showAlert = (avg < 60 && avg > 0) || overdue > 0;
        return { ...s, showAlert, avg, overdue };
    }).filter(s => s.showAlert)
      .sort((a, b) => (b.overdue - a.overdue) || (a.avg - b.avg)), [students, assignments]);

    const statusData = useMemo(() => {
         const coachAssignments = assignments.filter(a => students.map(s => s.id).includes(a.studentId));
        return [
            { name: 'Bekliyor', value: coachAssignments.filter(a => a.status === AssignmentStatus.Pending).length, color: '#facc15' },
            { name: 'Teslim Edildi', value: coachAssignments.filter(a => a.status === AssignmentStatus.Submitted).length, color: '#3b82f6' },
            { name: 'Notlandırıldı', value: coachAssignments.filter(a => a.status === AssignmentStatus.Graded).length, color: '#22c55e' },
        ];
    }, [assignments, students]);

    const handleSendMessage = async (studentId: string) => {
        const convId = await findOrCreateConversation(studentId);
        if (convId) {
            setActivePage('messages', { contactId: convId });
        }
    };

    return (
        <div className="space-y-6">
            <CoachWelcomeHeader />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="tour-step-3">
                <StatCard title="Toplam Öğrenci" value={students.length} icon={<StudentsIcon className="w-6 h-6"/>} onClick={() => setActivePage('students')} />
                <StatCard title="Değerlendirilecek Ödev" value={stats.pendingCount} icon={<AssignmentsIcon className="w-6 h-6"/>} onClick={() => setActivePage('assignments', { status: AssignmentStatus.Submitted })} />
                <StatCard title="Gecikmiş Ödev" value={stats.overdueCount} icon={<AlertTriangleIcon className="w-6 h-6"/>} onClick={() => setActivePage('assignments', { status: AssignmentStatus.Pending })} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                     <Card title="Dikkat Gerektiren Öğrenciler">
                        {studentsWithAlerts.length > 0 ? (
                            <ul className="space-y-3">
                                {studentsWithAlerts.slice(0, 5).map(s => (
                                    <li key={s.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <img src={s.profilePicture} alt={s.name} className="w-8 h-8 rounded-full" />
                                                <span className="ml-3 font-medium">{s.name}</span>
                                                 {s.overdue > 0 && <span title={`${s.overdue} gecikmiş ödev`} className="ml-2"><AlertTriangleIcon className="w-5 h-5 text-red-500" /></span>}
                                                {s.avg < 60 && s.avg > 0 && <span title={`Not ortalaması: ${s.avg}`} className="ml-2"><AlertTriangleIcon className="w-5 h-5 text-yellow-500" /></span>}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                 <button onClick={() => handleSendMessage(s.id)} className="text-xs font-semibold text-blue-500 hover:underline">Mesaj Gönder</button>
                                                 <button onClick={() => setActivePage('students', { studentId: s.id })} className="text-xs font-semibold text-gray-500 hover:underline">Profili Görüntüle</button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                 <CheckCircleIcon className="w-10 h-10 mb-2 text-green-400" />
                                 <p className="text-sm font-semibold">Harika! Tüm öğrencileriniz yolunda görünüyor.</p>
                            </div>
                        )}
                    </Card>
                    <Card title="Ödev Durum Dağılımı">
                         <div className="w-full h-64">
                            <ResponsiveContainer>
                                <BarChart data={statusData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }}/>
                                    <Bar dataKey="value" name="Ödev Sayısı">
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <QuickActionsCard onAnnounceClick={() => setAnnouncementModalOpen(true)} />
                    <AnnouncementsCard />
                </div>
            </div>
            
            <AnnouncementModal isOpen={isAnnouncementModalOpen} onClose={() => setAnnouncementModalOpen(false)} />
        </div>
    );
};

const Dashboard = () => {
    const { currentUser, isLoading } = useDataContext();

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (!currentUser) {
        return <div>Lütfen giriş yapın.</div>;
    }

    if (currentUser.role === UserRole.Coach || currentUser.role === UserRole.SuperAdmin) {
        return <CoachDashboard />;
    }
    
    return <StudentDashboard />;
};

export default Dashboard;