
import React, { useState, useMemo, useEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { User, Assignment, AssignmentStatus } from '../types';
import Card from '../components/Card';
import { MegaphoneIcon, TrendingUpIcon, TargetIcon, TrophyIcon } from '../components/Icons';

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-center">
        <div className="text-primary-500 w-8 h-8 mx-auto mb-2">{icon}</div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-gray-500">{title}</p>
    </div>
);

const AnnouncementsCard = () => {
    const { messages, coach } = useDataContext();
    const announcements = useMemo(() => messages
        .filter(m => m.type === 'announcement')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3), [messages]);

    if (announcements.length === 0) {
        return null;
    }

    return (
        <Card title="Koçun Son Duyuruları">
             <ul className="space-y-3">
                {announcements.map(msg => (
                     <li key={msg.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg flex items-start space-x-3">
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

export default function ParentPortal() {
    const { currentUser, users, assignments } = useDataContext();
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    const children = useMemo(() => {
        if (!currentUser || !currentUser.childIds) return [];
        return users.filter(u => currentUser.childIds!.includes(u.id));
    }, [currentUser, users]);

    useEffect(() => {
        if (children.length > 0 && !selectedChildId) {
            setSelectedChildId(children[0].id);
        }
    }, [children, selectedChildId]);

    const selectedChild = useMemo(() => {
        if (!selectedChildId) return null;
        return users.find(u => u.id === selectedChildId);
    }, [selectedChildId, users]);

    const childCoach = useMemo(() => {
        if (!selectedChild || !selectedChild.assignedCoachId) return null;
        return users.find(u => u.id === selectedChild.assignedCoachId);
    }, [selectedChild, users]);

    const childAssignments = useMemo(() => {
        if (!selectedChildId) return [];
        return assignments.filter(a => a.studentId === selectedChildId);
    }, [selectedChildId, assignments]);

    const stats = useMemo(() => {
        const graded = childAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 'N/A';
        const completionRate = childAssignments.length > 0 ? `${Math.round((childAssignments.filter(a => a.status !== AssignmentStatus.Pending).length / childAssignments.length) * 100)}%` : 'N/A';
        const completedCount = childAssignments.filter(a => a.status !== AssignmentStatus.Pending).length;
        return { avgGrade, completionRate, completedCount };
    }, [childAssignments]);
    
    const upcomingAssignments = useMemo(() => 
        childAssignments
            .filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) >= new Date())
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5), 
    [childAssignments]);

    const recentGradedAssignments = useMemo(() =>
        childAssignments
            .filter(a => a.status === AssignmentStatus.Graded)
            .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
            .slice(0, 5),
    [childAssignments]);


    if (!currentUser || children.length === 0) {
        return <Card><p>Görüntülenecek öğrenci bilgisi bulunamadı. Lütfen yöneticinizle iletişime geçin.</p></Card>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center">
                    <h1 className="text-2xl font-bold">Veli Portalı</h1>
                    {children.length > 1 && (
                        <select
                            value={selectedChildId || ''}
                            onChange={e => setSelectedChildId(e.target.value)}
                            className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 mt-4 sm:mt-0"
                        >
                            {children.map(child => <option key={child.id} value={child.id}>{child.name}</option>)}
                        </select>
                    )}
                </div>
            </Card>

            {selectedChild && (
                 <div className="space-y-6">
                    <Card>
                        <div className="flex items-center space-x-4">
                            <img src={selectedChild.profilePicture} alt={selectedChild.name} className="w-20 h-20 rounded-full" />
                            <div>
                                <h2 className="text-2xl font-bold">{selectedChild.name}</h2>
                                <p className="text-gray-500">Koç: {childCoach?.name || 'Atanmamış'}</p>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Not Ortalaması" value={stats.avgGrade} icon={<TrendingUpIcon className="w-8 h-8"/>} />
                        <StatCard title="Tamamlama Oranı" value={stats.completionRate} icon={<TargetIcon className="w-8 h-8"/>} />
                        <StatCard title="Tamamlanan Ödev" value={stats.completedCount} icon={<TrophyIcon className="w-8 h-8"/>} />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card title="Yaklaşan Ödevler">
                            <ul className="space-y-3">
                                {upcomingAssignments.length > 0 ? upcomingAssignments.map(a => (
                                    <li key={a.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                                        <p className="font-semibold">{a.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(a.dueDate).toLocaleDateString('tr-TR')}
                                        </p>
                                    </li>
                                )) : <p className="text-sm text-gray-500 text-center py-4">Yaklaşan ödev bulunmuyor.</p>}
                            </ul>
                        </Card>
                        
                        <Card title="Son Notlandırılan Ödevler">
                             <ul className="space-y-3">
                                {recentGradedAssignments.length > 0 ? recentGradedAssignments.map(a => (
                                    <li key={a.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold">{a.title}</p>
                                            <p className="text-sm font-bold text-primary-600">{a.grade}/100</p>
                                        </div>
                                        {a.feedback && <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{a.feedback}"</p>}
                                    </li>
                                )) : <p className="text-sm text-gray-500 text-center py-4">Henüz notlandırılmış ödev yok.</p>}
                            </ul>
                        </Card>
                    </div>

                    <AnnouncementsCard />
                 </div>
            )}
        </div>
    );
}
