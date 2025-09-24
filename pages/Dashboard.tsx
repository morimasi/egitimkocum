
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, AssignmentStatus, User } from '../types';
import Card from '../components/Card';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, StudentsIcon, XIcon } from '../components/Icons';
import { DashboardSkeleton } from '../components/SkeletonLoader';

const KpiCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => (
    <Card className="flex items-center">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </Card>
);

const CoachDashboard = () => {
    const { students, assignments } = useDataContext();
    const { setActivePage, setInitialFilters } = useUI();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const pendingSubmissions = assignments.filter(a => a.status === AssignmentStatus.Submitted).length;
    const studentAverages = students.map(student => {
        const studentAssignments = assignments.filter(a => a.studentId === student.id && a.status === AssignmentStatus.Graded && a.grade !== null);
        const total = studentAssignments.reduce((acc, curr) => acc + curr.grade!, 0);
        const average = studentAssignments.length > 0 ? Math.round(total / studentAssignments.length) : 0;
        return { name: student.name.split(' ')[0], "Not Ortalaması": average, studentId: student.id };
    });

    const handleBarClick = (data: any) => {
        if (data && data.studentId) {
            setInitialFilters({ studentId: data.studentId });
            setActivePage('assignments');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Toplam Öğrenci" value={students.length} icon={<StudentsIcon className="w-6 h-6 text-white"/>} color="bg-blue-500" />
                <KpiCard title="Bekleyen Teslimler" value={pendingSubmissions} icon={<AssignmentsIcon className="w-6 h-6 text-white"/>} color="bg-yellow-500" />
                <KpiCard title="Toplam Ödev Sayısı" value={assignments.length} icon={<CheckCircleIcon className="w-6 h-6 text-white"/>} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Öğrenci Not Ortalamaları" className="lg:col-span-2">
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            {/* FIX: Cast event argument to 'any' to resolve incorrect type definition for recharts onClick handler. */}
                            <BarChart data={studentAverages} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={(e: any) => handleBarClick(e?.activePayload?.[0]?.payload)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }}/>
                                <Legend />
                                <Bar dataKey="Not Ortalaması" radius={[4, 4, 0, 0]} onMouseOver={(data, index) => setActiveIndex(index)} onMouseOut={() => setActiveIndex(null)}>
                                     {studentAverages.map((entry, index) => (
                                        <Cell cursor="pointer" fill={index === activeIndex ? '#2563eb' : '#3b82f6'} key={`cell-${index}`}/>
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Hızlı Erişim: Öğrenciler">
                    <ul className="space-y-3">
                        {students.map(student => (
                            <li key={student.id} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setActivePage('students')}>
                                <img className="w-10 h-10 rounded-full" src={student.profilePicture} alt={student.name} />
                                <div className="ml-3">
                                    <p className="text-sm font-medium">{student.name}</p>
                                    <p className="text-xs text-gray-500">{student.email}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};


const StudentDashboard = () => {
    const { currentUser, getAssignmentsForStudent, messages } = useDataContext();
    const { addToast } = useUI();
    const [showNotificationBanner, setShowNotificationBanner] = useState(false);

    const myAssignments = currentUser ? getAssignmentsForStudent(currentUser.id) : [];

    useEffect(() => {
        if (!('Notification' in window)) return;

        const checkPermissionsAndNotify = () => {
            const upcomingAssignment = myAssignments.find(a => {
                const dueDate = new Date(a.dueDate);
                const now = new Date();
                const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                return a.status === AssignmentStatus.Pending && hoursUntilDue > 0 && hoursUntilDue <= 24;
            });

            if (upcomingAssignment) {
                if (Notification.permission === 'granted') {
                    new Notification('Ödev Hatırlatma', {
                        body: `'${upcomingAssignment.title}' ödevinin teslimine 24 saatten az kaldı!`,
                        icon: '/vite.svg'
                    });
                } else if (Notification.permission === 'default') {
                    setShowNotificationBanner(true);
                }
            }
        };
        
        // Check on component mount and then every hour
        checkPermissionsAndNotify();
        const interval = setInterval(checkPermissionsAndNotify, 1000 * 60 * 60);
        return () => clearInterval(interval);

    }, [myAssignments]);
    
    const handleRequestPermission = async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            addToast('Bildirimlere izin verildi!', 'success');
            setShowNotificationBanner(false);
        } else {
            addToast('Bildirimlere izin verilmedi.', 'info');
        }
    }

    const pendingAssignments = myAssignments.filter(a => a.status === AssignmentStatus.Pending).length;
    const gradedAssignments = myAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    
    const averageGrade = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((acc, curr) => acc + curr.grade!, 0) / gradedAssignments.length)
        : 0;

    const unreadMessages = messages.filter(m => m.receiverId === currentUser?.id && !m.isRead).length;

    const gradeHistory = gradedAssignments
        .sort((a,b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime())
        .map((a, index) => ({
        name: `Ödev ${index + 1}`,
        "Not": a.grade,
    }));
    
    const upcomingAssignments = myAssignments
        .filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) > new Date())
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3);

    return (
        <div className="space-y-6">
            {showNotificationBanner && (
                 <div className="bg-primary-100 dark:bg-primary-900/50 border-l-4 border-primary-500 text-primary-700 dark:text-primary-200 p-4 rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-bold">Bildirimleri Etkinleştir</p>
                        <p className="text-sm">Yaklaşan ödev teslim tarihlerini kaçırmamak için bildirimlere izin verin.</p>
                    </div>
                    <div>
                        <button onClick={handleRequestPermission} className="px-3 py-1.5 border border-primary-500 text-primary-600 dark:text-primary-200 rounded-md text-sm font-semibold hover:bg-primary-200 dark:hover:bg-primary-800">İzin Ver</button>
                         <button onClick={() => setShowNotificationBanner(false)} className="ml-2 p-1 text-primary-600 dark:text-primary-200 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800"><XIcon className="w-4 h-4"/></button>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Bekleyen Ödev" value={pendingAssignments} icon={<AssignmentsIcon className="w-6 h-6 text-white"/>} color="bg-red-500" />
                <KpiCard title="Not Ortalaması" value={averageGrade} icon={<CheckCircleIcon className="w-6 h-6 text-white"/>} color="bg-green-500" />
                <KpiCard title="Yeni Mesaj" value={unreadMessages} icon={<StudentsIcon className="w-6 h-6 text-white"/>} color="bg-purple-500" />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Not Trendi" className="lg:col-span-2">
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={gradeHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }}/>
                                <Legend />
                                <Line type="monotone" dataKey="Not" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Yaklaşan Ödevler">
                     <ul className="space-y-3">
                        {upcomingAssignments.length > 0 ? upcomingAssignments.map(assignment => (
                            <li key={assignment.id} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <p className="font-semibold">{assignment.title}</p>
                                <p className="text-sm text-red-500">
                                    Son Teslim: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                                </p>
                            </li>
                        )) : <p className="text-sm text-gray-500">Yaklaşan ödeviniz bulunmamaktadır.</p>}
                    </ul>
                </Card>
             </div>
        </div>
    );
};

const Dashboard = () => {
    const { currentUser, isLoading } = useDataContext();

    if(isLoading) {
        return <DashboardSkeleton />;
    }

    if (!currentUser) return null;

    return currentUser.role === UserRole.Coach ? <CoachDashboard /> : <StudentDashboard />;
};

export default Dashboard;
