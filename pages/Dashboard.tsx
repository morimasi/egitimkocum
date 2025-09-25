import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, AssignmentStatus, User, Assignment } from '../types';
import Card from '../components/Card';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, StudentsIcon, XIcon, AlertTriangleIcon, SparklesIcon, MegaphoneIcon } from '../components/Icons';
import { DashboardSkeleton, SkeletonText } from '../components/SkeletonLoader';
import { generateStudentFocusSuggestion, generatePersonalCoachSummary } from '../services/geminiService';

const AnnouncementsCard = () => {
    const { messages, coach } = useDataContext();
    const { setActivePage } = useUI();
    const announcements = messages
        .filter(m => m.type === 'announcement')
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);

    if (announcements.length === 0) {
        return null;
    }

    return (
        <Card title="Son Duyurular" id="tour-announcements">
             <ul className="space-y-3">
                {announcements.map(msg => (
                     <li key={msg.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg flex items-start space-x-3 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900" onClick={() => setActivePage('messages', {contactId: 'announcements'})}>
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
};

const KpiCard = React.memo(({ title, value, icon, color, id }: { title: string, value: string | number, icon: React.ReactNode, color: string, id?: string }) => (
    <Card className="flex items-center" id={id}>
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </Card>
));

const FocusAreaCard = () => {
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
        <Card>
             <h4 className="font-semibold flex items-center mb-2">
                <SparklesIcon className="w-5 h-5 mr-2 text-primary-500" />
                Sıradaki Adım
             </h4>
             {isLoading ? <SkeletonText className="h-16 w-full" /> : <p className="text-sm text-gray-600 dark:text-gray-300">{suggestion}</p>}
        </Card>
    );
};

const GoalsCard = () => {
    const { currentUser, getGoalsForStudent, updateGoal } = useDataContext();
    if (!currentUser) return null;

    const goals = getGoalsForStudent(currentUser.id);

    const handleToggleGoal = (goalId: string) => {
        const goal = goals.find(g => g.id === goalId);
        if(goal) {
            updateGoal({...goal, isCompleted: !goal.isCompleted});
        }
    };
    
    return (
        <Card title="Hedeflerim">
            <ul className="space-y-3 max-h-56 overflow-y-auto pr-2">
                {goals.length > 0 ? goals.map(goal => (
                    <li key={goal.id} className="flex items-center">
                        <input
                            type="checkbox"
                            id={`goal-${goal.id}`}
                            checked={goal.isCompleted}
                            onChange={() => handleToggleGoal(goal.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                        <label htmlFor={`goal-${goal.id}`} className={`ml-3 text-sm ${goal.isCompleted ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{goal.text}</label>
                    </li>
                )) : (
                    <p className="text-sm text-gray-500 text-center py-4">Henüz bir hedef belirlemedin.</p>
                )}
            </ul>
        </Card>
    );
}

const StudentDashboard = () => {
    const { currentUser, getAssignmentsForStudent, coach, messages } = useDataContext();
    const { setActivePage } = useUI();
    
    if (!currentUser) return null;

    const myAssignments = getAssignmentsForStudent(currentUser.id);
    const pendingAssignments = myAssignments.filter(a => a.status === AssignmentStatus.Pending);
    const gradedAssignments = myAssignments.filter(a => a.status === AssignmentStatus.Graded);
    const averageGrade = gradedAssignments.length > 0 ? Math.round(gradedAssignments.reduce((acc, a) => acc + (a.grade || 0), 0) / gradedAssignments.length) : 'N/A';
    
    const upcomingAssignments = myAssignments
        .filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) > new Date())
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

    const recentMessages = messages
        .filter(m => m.receiverId === currentUser.id && !m.readBy.includes(currentUser.id))
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0,3);

    return (
        <div className="space-y-6">
            <AnnouncementsCard />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Bekleyen Ödevler" value={pendingAssignments.length} icon={<AssignmentsIcon className="w-6 h-6 text-yellow-800" />} color="bg-yellow-200" id="tour-step-3" />
                <KpiCard title="Not Ortalaması" value={averageGrade} icon={<CheckCircleIcon className="w-6 h-6 text-green-800" />} color="bg-green-200" />
                <KpiCard title="Koç" value={coach?.name || 'Atanmadı'} icon={<StudentsIcon className="w-6 h-6 text-blue-800" />} color="bg-blue-200" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Yaklaşan Ödevler" className="lg:col-span-2">
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
                                        <p className={`text-sm ${isUrgent ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                            Son teslim: {dueDate.toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                    <button onClick={() => setActivePage('assignments')} className="text-sm font-semibold text-primary-500 hover:underline">Detay</button>
                                </li>
                            )
                        }) : (
                             <p className="text-center text-gray-500 py-8">
                                Harika iş! Yaklaşan bir ödevin yok. {' '}
                                <button onClick={() => setActivePage('library')} className="font-semibold text-primary-500 hover:underline">
                                    Kütüphaneden
                                </button>
                                {' '}yeni konular keşfetmeye ne dersin?
                            </p>
                        )}
                    </ul>
                </Card>
                <div className="space-y-6">
                    <FocusAreaCard />
                    <GoalsCard />
                    <Card title="Son Mesajlar">
                         <ul className="space-y-3">
                            {recentMessages.length > 0 ? recentMessages.map(msg => (
                                <li key={msg.id} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => setActivePage('messages', {contactId: msg.senderId})}>
                                    <p className="text-sm font-semibold">{coach?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{msg.text}</p>
                                </li>
                            )) : <p className="text-sm text-gray-500 text-center py-4">Yeni mesaj yok.</p>}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const CoachInsightsCard = ({ currentUser }: { currentUser: User }) => {
    const { students, assignments } = useDataContext();
    const [insights, setInsights] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoading(true);
            const result = await generatePersonalCoachSummary(currentUser.name, students, assignments);
            setInsights(result);
            setIsLoading(false);
        };
        fetchInsights();
    }, [currentUser, students, assignments]);

    return (
        <Card>
            <h4 className="font-semibold flex items-center mb-2">
                <SparklesIcon className="w-5 h-5 mr-2 text-primary-500" />
                Haftalık Koçluk Özetin
            </h4>
            {isLoading ? <SkeletonText className="h-20 w-full" /> : <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{insights}</p>}
        </Card>
    );
};


const CoachDashboard = () => {
    const { students, assignments, messages, currentUser } = useDataContext();
    const { setActivePage } = useUI();
    
    // A coach should only see data for their assigned students
    const studentIds = students.map(s => s.id);
    const coachAssignments = assignments.filter(a => studentIds.includes(a.studentId));

    const pendingCount = coachAssignments.filter(a => a.status === AssignmentStatus.Submitted).length;
    const overdueCount = coachAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
    
    // Calculate overall grade average
    const gradedAssignments = coachAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    const overallAverage = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((sum, a) => sum + a.grade!, 0) / gradedAssignments.length)
        : 0;

    // Data for assignment status chart
    const statusData = [
        { name: 'Bekliyor', value: coachAssignments.filter(a => a.status === AssignmentStatus.Pending).length },
        { name: 'Teslim Edildi', value: coachAssignments.filter(a => a.status === AssignmentStatus.Submitted).length },
        { name: 'Notlandırıldı', value: coachAssignments.filter(a => a.status === AssignmentStatus.Graded).length },
    ];
    const COLORS = ['#facc15', '#3b82f6', '#22c55e'];
    
    const studentsWithAlerts = students.map(s => {
        const studentAssignments = coachAssignments.filter(a => a.studentId === s.id);
        const graded = studentAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        const avg = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 0;
        const overdue = studentAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
        const showAlert = (avg < 60 && avg > 0) || overdue > 0;
        return { ...s, showAlert, avg, overdue };
    }).filter(s => s.showAlert)
      .sort((a, b) => (b.overdue - a.overdue) || (a.avg - b.avg));
    
    const unreadMessagesCount = messages.filter(m => m.receiverId === currentUser?.id && !m.readBy.includes(currentUser.id)).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Toplam Öğrenci" value={students.length} icon={<StudentsIcon className="w-6 h-6 text-blue-800" />} color="bg-blue-200" />
                <KpiCard title="Değerlendirilecek Ödev" value={pendingCount} icon={<AssignmentsIcon className="w-6 h-6 text-yellow-800" />} color="bg-yellow-200" id="tour-step-3"/>
                <KpiCard title="Gecikmiş Ödev" value={overdueCount} icon={<XIcon className="w-6 h-6 text-red-800" />} color="bg-red-200" />
                 <KpiCard title="Okunmamış Mesaj" value={unreadMessagesCount} icon={<XIcon className="w-6 h-6 text-indigo-800" />} color="bg-indigo-200" />
            </div>
            <AnnouncementsCard />
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                    {currentUser && <CoachInsightsCard currentUser={currentUser} />}
                </div>
                <Card title="Dikkat Gerektiren Öğrenciler" className="lg:col-span-1">
                    {studentsWithAlerts.length > 0 ? (
                        <ul className="space-y-3">
                            {studentsWithAlerts.map(s => (
                                <li key={s.id} onClick={() => setActivePage('students')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <img src={s.profilePicture} alt={s.name} className="w-8 h-8 rounded-full" />
                                            <span className="ml-3 font-medium">{s.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {s.overdue > 0 && <span title={`${s.overdue} gecikmiş ödev`}><AlertTriangleIcon className="w-5 h-5 text-red-500" /></span>}
                                            {s.avg < 60 && s.avg > 0 && <span title={`Not ortalaması: ${s.avg}`}><AlertTriangleIcon className="w-5 h-5 text-yellow-500" /></span>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Harika! Tüm öğrencileriniz yolunda görünüyor.</p>
                    )}
                </Card>
                <Card title="Ödev Durum Dağılımı" className="lg:col-span-2">
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={statusData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128, 128, 128, 0.2)"/>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'rgba(243, 244, 246, 0.5)'}} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }}/>
                                <Bar dataKey="value" barSize={30} background={{ fill: '#eee' }}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
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

    return currentUser.role === UserRole.Coach ? <CoachDashboard /> : <StudentDashboard />;
};

export default Dashboard;