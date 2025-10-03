import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useDataContext } from '../contexts/DataContext';
import { AssignmentStatus, UserRole } from '../types';
import Card from '../components/Card';
import { SkeletonText } from '../components/SkeletonLoader';
import { generateStudentAnalyticsInsight, generateCoachAnalyticsInsight } from '../services/geminiService';
import { SparklesIcon } from '../components/Icons';
import { useUI } from '../contexts/UIContext';

const AnalyticsSkeleton = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Card key={i} className="h-28"><SkeletonText className="h-full w-full" /></Card>)}
        </div>
        <Card className="h-80"><SkeletonText className="h-full w-full" /></Card>
        <Card><SkeletonText className="h-20 w-full" /></Card>
    </div>
);


const StudentAnalytics = () => {
    const { currentUser, getAssignmentsForStudent } = useDataContext();
    const { setActivePage } = useUI();
    const [insight, setInsight] = useState('');
    const [isLoadingInsight, setIsLoadingInsight] = useState(true);

    const assignments = useMemo(() => currentUser ? getAssignmentsForStudent(currentUser.id) : [], [currentUser, getAssignmentsForStudent]);

    const stats = useMemo(() => {
        const graded = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        const completionRate = assignments.length > 0 ? (assignments.filter(a => a.status !== AssignmentStatus.Pending).length / assignments.length) * 100 : 0;
        const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 'N/A';
        
        const subjectGrades: { [key: string]: number[] } = {};
        graded.forEach(a => {
            const subject = a.title.split(' ')[0]; // Simple subject extraction
            if (!subjectGrades[subject]) subjectGrades[subject] = [];
            subjectGrades[subject].push(a.grade!);
        });
        
        const subjectAverages = Object.entries(subjectGrades).map(([subject, grades]) => ({
            subject,
            average: grades.reduce((a, b) => a + b, 0) / grades.length
        })).sort((a,b) => b.average - a.average);

        return {
            completionRate,
            avgGrade,
            topSubject: subjectAverages[0]?.subject || '',
            lowSubject: subjectAverages[subjectAverages.length - 1]?.subject || ''
        }
    }, [assignments]);

    useEffect(() => {
        if (currentUser) {
            generateStudentAnalyticsInsight(currentUser.name, stats)
                .then(setInsight)
                .finally(() => setIsLoadingInsight(false));
        }
    }, [currentUser, stats]);
    
    const handlePieClick = (data: any) => {
        if (data && data.name) {
            if (data.name === 'Bekleyen') {
                setActivePage('assignments', { status: AssignmentStatus.Pending });
            } else {
                setActivePage('assignments');
            }
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Performans Analizi</h1>
             <Card variant="gradient" icon={<SparklesIcon />}>
                <h2 className="text-xl font-bold text-white mb-2">Sana Özel Analiz</h2>
                {isLoadingInsight ? <SkeletonText className="h-12 w-full bg-white/30" /> : <p className="text-white/90">{insight}</p>}
            </Card>
             <Card title="Genel Başarı Oranları">
                <div className="w-full h-64">
                     <ResponsiveContainer>
                        <PieChart>
                            <Pie 
                                data={[{ name: 'Tamamlanan', value: stats.completionRate }, { name: 'Bekleyen', value: 100 - stats.completionRate }]} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={100} 
                                fill="#8b5cf6"
                                onClick={handlePieClick}
                                cursor="pointer"
                            >
                                 <Cell fill="#8b5cf6" />
                                 <Cell fill="#e2e8f0" />
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => `${value.toFixed(2)}%`}
                                contentStyle={{ 
                                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                                    border: 'none', 
                                    color: '#fff', 
                                    borderRadius: '0.5rem' 
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

const CoachAnalytics = () => {
    const { students, assignments } = useDataContext();
    const { setActivePage } = useUI();
    const [insight, setInsight] = useState('');
    const [isLoadingInsight, setIsLoadingInsight] = useState(true);

    const studentsData = useMemo(() => students.map(s => {
        const studentAssignments = assignments.filter(a => a.studentId === s.id);
        const graded = studentAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 0;
        const completionRate = studentAssignments.length > 0 ? (studentAssignments.filter(a => a.status !== AssignmentStatus.Pending).length / studentAssignments.length) * 100 : 0;
        const overdue = studentAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
        return { id: s.id, name: s.name, avgGrade, completionRate, overdue };
    }), [students, assignments]);

    useEffect(() => {
        if (studentsData.length > 0) {
            generateCoachAnalyticsInsight(studentsData)
                .then(setInsight)
                .finally(() => setIsLoadingInsight(false));
        }
    }, [studentsData]);
    
    const handleBarClick = (data: any) => {
        if (data && data.id) {
            setActivePage('students', { studentId: data.id });
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Sınıf Analizi</h1>
             <Card variant="gradient" icon={<SparklesIcon />}>
                <h2 className="text-xl font-bold text-white mb-2">Stratejik Özet</h2>
                {isLoadingInsight ? <SkeletonText className="h-20 w-full bg-white/30" /> : <p className="text-white/90 whitespace-pre-wrap">{insight}</p>}
            </Card>
            <Card title="Öğrenci Not Ortalamaları">
                <div className="w-full h-80">
                    <ResponsiveContainer>
                        <BarChart data={studentsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'rgba(31, 41, 55, 0.8)', 
                                    border: 'none', 
                                    color: '#fff', 
                                    borderRadius: '0.5rem' 
                                }}
                                cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                            />
                            <Legend />
                            <Bar 
                                dataKey="avgGrade" 
                                name="Not Ortalaması" 
                                fill="#8b5cf6" 
                                onClick={handleBarClick}
                                cursor="pointer"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    )
};

export default function Analytics() {
    const { currentUser, isLoading } = useDataContext();

    if (isLoading) {
        return <AnalyticsSkeleton />;
    }

    if (!currentUser) {
        return <div>Lütfen giriş yapın.</div>;
    }

    if (currentUser.role === UserRole.Coach || currentUser.role === UserRole.SuperAdmin) {
        return <CoachAnalytics />;
    }
    
    return <StudentAnalytics />;
}