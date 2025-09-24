import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, AssignmentStatus, User } from '../types';
import Card from '../components/Card';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, StudentsIcon, XIcon, AlertTriangleIcon } from '../components/Icons';
import { DashboardSkeleton } from '../components/SkeletonLoader';

const KpiCard = ({ title, value, icon, color, id }: { title: string, value: string | number, icon: React.ReactNode, color: string, id?: string }) => (
    <Card className="flex items-center" id={id}>
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </Card>
);

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
                        }) : <p className="text-center text-gray-500 py-8">Yaklaşan bir ödevin yok. Harika iş!</p>}
                    </ul>
                </Card>
                <div className="space-y-6">
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

const CoachDashboard = () => {
    const { students, assignments, messages, currentUser } = useDataContext();
    const { setActivePage } = useUI();

    const pendingCount = assignments.filter(a => a.status === AssignmentStatus.Submitted).length;
    const overdueCount = assignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
    
    // Calculate overall grade average
    const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    const overallAverage = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((sum, a) => sum + a.grade!, 0) / gradedAssignments.length)
        : 0;

    // Data for assignment status chart
    const statusData = [
        { name: 'Bekliyor', value: assignments.filter(a => a.status === AssignmentStatus.Pending).length },
        { name: 'Teslim Edildi', value: assignments.filter(a => a.status === AssignmentStatus.Submitted).length },
        { name: 'Notlandırıldı', value: assignments.filter(a => a.status === AssignmentStatus.Graded).length },
    ];
    const COLORS = ['#facc15', '#3b82f6', '#22c55e'];
    
    const studentsWithAlerts = students.map(s => {
        const studentAssignments = assignments.filter(a => a.studentId === s.id);
        const graded = studentAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        const avg = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 0;
        const overdue = studentAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
        const showAlert = avg < 60 && avg > 0 || overdue > 0;
        return { ...s, showAlert, avg, overdue };
    }).filter(s => s.showAlert);
    
    const unreadMessagesCount = messages.filter(m => m.receiverId === currentUser?.id && !m.readBy.includes(currentUser.id)).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Toplam Öğrenci" value={students.length} icon={<StudentsIcon className="w-6 h-6 text-blue-800" />} color="bg-blue-200" />
                <KpiCard title="Değerlendirilecek Ödev" value={pendingCount} icon={<AssignmentsIcon className="w-6 h-6 text-yellow-800" />} color="bg-yellow-200" id="tour-step-3"/>
                <KpiCard title="Gecikmiş Ödev" value={overdueCount} icon={<XIcon className="w-6 h-6 text-red-800" />} color="bg-red-200" />
                 <KpiCard title="Okunmamış Mesaj" value={unreadMessagesCount} icon={<XIcon className="w-6 h-6 text-indigo-800" />} color="bg-indigo-200" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Hızlı Erişim" className="lg:col-span-1">
                     <ul className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Öğrenciler</h3>
                        {students.slice(0, 5).map(s => {
                             const hasAlert = studentsWithAlerts.some(alertStudent => alertStudent.id === s.id);
                             return (
                                <li key={s.id} onClick={() => setActivePage('students')} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                    <img src={s.profilePicture} alt={s.name} className="w-8 h-8 rounded-full" />
                                    <span className="ml-3 font-medium">{s.name}</span>
                                    {/* FIX: Wrapped icon in a span with a title attribute to fix prop type error and provide a tooltip. */}
                                    {hasAlert && <span title="Düşük not ortalaması veya gecikmiş ödev"><AlertTriangleIcon className="w-4 h-4 text-yellow-500 ml-auto" /></span>}
                                </li>
                            )
                        })}
                    </ul>
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