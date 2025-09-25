
import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, AssignmentStatus, User, Assignment } from '../types';
import Card from '../components/Card';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, StudentsIcon, XIcon, AlertTriangleIcon, SparklesIcon, MegaphoneIcon, MessagesIcon, PlusCircleIcon, LibraryIcon, TargetIcon } from '../components/Icons';
import { DashboardSkeleton, SkeletonText } from '../components/SkeletonLoader';
import { generateStudentFocusSuggestion, generatePersonalCoachSummary } from '../services/geminiService';
import AnnouncementModal from '../components/AnnouncementModal';


const AnnouncementsCard = React.memo(() => {
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
        <Card title="Son Duyurular" id="tour-announcements" className="h-full">
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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        const fetchSuggestion = async () => {
            setIsLoading(true);
            const assignments = getAssignmentsForStudent(currentUser.id);
            const result = await generateStudentFocusSuggestion(currentUser.name, assignments);
            setSuggestion(result);
            setIsLoading(false);
        };
        fetchSuggestion();
    }, [currentUser, getAssignmentsForStudent]);

    return (
        <Card variant="gradient" className="animate-fade-in" icon={<SparklesIcon />}>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Hoş geldin, {currentUser?.name}!</h1>
            <div className="mt-2 text-white/80 h-10">
                 {isLoading ? <SkeletonText className="h-5 w-3/4 bg-white/30" /> : <p>{suggestion}</p>}
            </div>
        </Card>
    );
});

const ProgressCircle = ({ percentage, label, colorClass }: { percentage: number, label: string, colorClass: string }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                <circle className="text-gray-200 dark:text-gray-700" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                <circle className={colorClass} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" style={{transition: 'stroke-dashoffset 0.5s ease-out'}} />
            </svg>
            <div className="text-center -mt-20">
                <p className="text-2xl font-bold">{percentage.toFixed(0)}<span className="text-lg">%</span></p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </div>
        </div>
    );
};

const ProgressOverview = React.memo(() => {
    const { currentUser, getAssignmentsForStudent, getGoalsForStudent } = useDataContext();
    if(!currentUser) return null;

    const assignments = getAssignmentsForStudent(currentUser.id);
    const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    const averageGrade = gradedAssignments.length > 0 ? gradedAssignments.reduce((acc, a) => acc + (a.grade || 0), 0) / gradedAssignments.length : 0;
    const completionRate = assignments.length > 0 ? (assignments.filter(a => a.status !== AssignmentStatus.Pending).length / assignments.length) * 100 : 0;
    
    const goals = getGoalsForStudent(currentUser.id);
    const goalsRate = goals.length > 0 ? (goals.filter(g => g.isCompleted).length / goals.length) * 100 : 0;
    
    return (
        <Card title="Haftalık İlerlemen">
            <div className="flex justify-around items-center">
                <ProgressCircle percentage={completionRate} label="Ödev Tamamlama" colorClass="text-primary-500" />
                <ProgressCircle percentage={averageGrade} label="Not Ortalaması" colorClass="text-green-500" />
                 <ProgressCircle percentage={goalsRate} label="Hedefler" colorClass="text-yellow-500" />
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
        .slice(0, 5);
        
    const goals = getGoalsForStudent(currentUser.id);
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
                                    <button onClick={() => setActivePage('assignments')} className="text-sm font-semibold text-primary-500 hover:underline">Detay</button>
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


const StudentDashboard = () => (
    <div className="space-y-8">
        <StudentWelcomeHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <ToDoTabs />
            </div>
            <div className="space-y-8">
                <ProgressOverview />
                <AnnouncementsCard />
            </div>
        </div>
    </div>
);


// --- Coach Dashboard Components ---

const CoachWelcomeHeader = React.memo(() => {
    const { currentUser, students, assignments } = useDataContext();
    const [insights, setInsights] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        const fetchInsights = async () => {
            setIsLoading(true);
            const result = await generatePersonalCoachSummary(currentUser.name, students, assignments);
            setInsights(result);
            setIsLoading(false);
        };
        fetchInsights();
    }, [currentUser, students, assignments]);

    return (
        <Card variant="gradient" className="animate-fade-in" icon={<SparklesIcon />}>
             <h1 className="text-2xl md:text-3xl font-bold text-white">Merhaba, {currentUser?.name}!</h1>
             <p className="mt-2 text-white/80">İşte haftalık koçluk özetin ve tavsiyeler:</p>
             <div className="mt-4 p-4 bg-white/10 rounded-lg text-sm h-24">
                {isLoading ? <SkeletonText className="h-full w-full bg-white/20" /> : <p className="whitespace-pre-wrap">{insights}</p>}
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
        { label: "Yeni Ödev", icon: <PlusCircleIcon className="w-6 h-6"/>, action: () => setActivePage('assignments') },
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
    const { students, assignments, unreadCounts } = useDataContext();
    const { setActivePage } = useUI();
    const [isAnnouncementModalOpen, setAnnouncementModalOpen] = useState(false);
    
    const stats = useMemo(() => {
        const studentIds = students.map(s => s.id);
        const coachAssignments = assignments.filter(a => studentIds.includes(a.studentId));
        return {
            pendingCount: coachAssignments.filter(a => a.status === AssignmentStatus.Submitted).length,
            overdueCount: coachAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length,
            unreadMessagesCount: Array.from(unreadCounts.values()).reduce((sum: number, count: number) => sum + count, 0),
        };
    }, [students, assignments, unreadCounts]);
    
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

    return (
        <div className="space-y-8">
            <CoachWelcomeHeader />
            <QuickActionsCard onAnnounceClick={() => setAnnouncementModalOpen(true)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <StatCard title="Toplam Öğrenci" value={students.length} icon={<StudentsIcon className="w-6 h-6"/>} onClick={() => setActivePage('students')} />
                <StatCard title="Değerlendirilecek" value={stats.pendingCount} icon={<AssignmentsIcon className="w-6 h-6"/>} onClick={() => setActivePage('assignments', { status: AssignmentStatus.Submitted })} />
                <StatCard title="Gecikmiş Ödev" value={stats.overdueCount} icon={<XIcon className="w-6 h-6"/>} onClick={() => setActivePage('assignments', { status: AssignmentStatus.Pending })} />
                <StatCard title="Okunmamış Mesaj" value={stats.unreadMessagesCount} icon={<MessagesIcon className="w-6 h-6"/>} onClick={() => setActivePage('messages')} />
                
                 <Card title="Dikkat Gerektiren Öğrenciler" className="sm:col-span-2 md:col-span-3 lg:col-span-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white dark:from-yellow-500 dark:to-orange-600">
                    {studentsWithAlerts.length > 0 ? (
                        <ul className="space-y-3">
                            {studentsWithAlerts.slice(0, 5).map(s => (
                                <li key={s.id} onClick={() => setActivePage('students')} className="p-2 rounded-lg hover:bg-white/20 cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <img src={s.profilePicture} alt={s.name} className="w-8 h-8 rounded-full" />
                                            <span className="ml-3 font-medium">{s.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {s.overdue > 0 && <span title={`${s.overdue} gecikmiş ödev`}><AlertTriangleIcon className="w-5 h-5" /></span>}
                                            {s.avg < 60 && s.avg > 0 && <span title={`Not ortalaması: ${s.avg}`}><AlertTriangleIcon className="w-5 h-5" /></span>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                             <CheckCircleIcon className="w-10 h-10 mb-2 text-white/80" />
                             <p className="text-sm font-semibold">Harika! Tüm öğrencileriniz yolunda görünüyor.</p>
                        </div>
                    )}
                </Card>
            </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2">
                    <Card title="Ödev Durum Dağılımı">
                         <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <BarChart data={statusData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128, 128, 128, 0.2)"/>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{fill: 'rgba(243, 244, 246, 0.5)'}} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }}/>
                                    <Bar dataKey="value" barSize={30} radius={[0, 8, 8, 0]}>
                                        {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                 </div>
                 <div className="lg:col-span-1">
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