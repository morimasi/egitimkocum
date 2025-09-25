


import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useDataContext } from '../contexts/DataContext';
import { Assignment, AssignmentStatus, User, UserRole } from '../types';
import Card from '../components/Card';
import { SkeletonText } from '../components/SkeletonLoader';
import { generateStudentAnalyticsInsight, generateCoachAnalyticsInsight } from '../services/geminiService';
import { SparklesIcon, TrendingUpIcon, CalendarIcon, TrophyIcon, TargetIcon, AlertTriangleIcon, StudentsIcon as StudentsIconType, AssignmentsIcon } from '../components/Icons';

type TimeFilter = '7d' | '30d' | 'all';

const StatCard = React.memo(({ title, value, icon, subtext }: { title: string, value: string | number, icon: React.ReactNode, subtext?: string }) => (
    <Card>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-500">
                {icon}
            </div>
        </div>
    </Card>
));

// --- Student Dashboard ---
const ActivityHeatmap = ({ assignments }: { assignments: Assignment[] }) => {
    const today = new Date();
    const days = Array.from({ length: 90 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        return date;
    }).reverse();

    const submissionsByDay = useMemo(() => {
        const map = new Map<string, number>();
        assignments.forEach(a => {
            if (a.submittedAt) {
                const dateStr = new Date(a.submittedAt).toISOString().split('T')[0];
                map.set(dateStr, (map.get(dateStr) || 0) + 1);
            }
        });
        return map;
    }, [assignments]);

    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100 dark:bg-gray-700/50';
        if (count === 1) return 'bg-green-200 dark:bg-green-900/50';
        if (count <= 3) return 'bg-green-400 dark:bg-green-700';
        return 'bg-green-600 dark:bg-green-500';
    };

    return (
        <Card title="Son 90 Günlük Aktivite">
            <div className="grid grid-cols-15 gap-1.5">
                {days.map(day => {
                    const dateStr = day.toISOString().split('T')[0];
                    const count = submissionsByDay.get(dateStr) || 0;
                    return (
                        <div key={dateStr} className={`w-full aspect-square rounded-sm ${getColor(count)}`} title={`${dateStr}: ${count} teslimat`} />
                    );
                })}
            </div>
             <style>{`.grid-cols-15 { grid-template-columns: repeat(15, minmax(0, 1fr)); }`}</style>
        </Card>
    );
};

const SubjectPerformanceChart = ({ assignments }: { assignments: Assignment[] }) => {
    const subjectData = useMemo(() => {
        const subjects: { [key: string]: { grades: number[], count: number } } = {};
        const subjectKeywords: { [key: string]: string[] } = {
            'Matematik': ['matematik', 'türev', 'limit', 'problem'],
            'Fizik': ['fizik', 'deney', 'sarkaç'],
            'Kimya': ['kimya', 'formül', 'organik'],
            'Biyoloji': ['biyoloji', 'hücre', 'çizim'],
            'Türkçe': ['türkçe', 'kompozisyon', 'paragraf', 'özet', 'makale'],
            'Tarih': ['tarih', 'ihtilal', 'araştırma'],
            'Coğrafya': ['coğrafya', 'iklim', 'sunum'],
            'İngilizce': ['ingilizce', 'kelime'],
        };

        assignments.forEach(a => {
            if (a.status === AssignmentStatus.Graded && a.grade !== null) {
                let foundSubject = 'Diğer';
                for (const subject in subjectKeywords) {
                    if (subjectKeywords[subject].some(keyword => a.title.toLowerCase().includes(keyword))) {
                        foundSubject = subject;
                        break;
                    }
                }
                if (!subjects[foundSubject]) {
                    subjects[foundSubject] = { grades: [], count: 0 };
                }
                subjects[foundSubject].grades.push(a.grade);
                subjects[foundSubject].count++;
            }
        });

        return Object.entries(subjects).map(([name, data]) => ({
            name,
            "Not Ortalaması": data.grades.reduce((a, b) => a + b, 0) / data.count,
        }));
    }, [assignments]);

    return (
        <Card title="Ders Bazında Performans">
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={subjectData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }} />
                        <Bar dataKey="Not Ortalaması" fill="#6366f1" barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const AiStudentInsight = ({ user, assignments }: { user: User, assignments: Assignment[] }) => {
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsight = async () => {
            setIsLoading(true);
            // This is a simplified derivation of subjects for the demo
            const gradedAssignments = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
            const avgGrade = gradedAssignments.length > 0 ? Math.round(gradedAssignments.reduce((sum, a) => sum + a.grade!, 0) / gradedAssignments.length) : 0;
            const completionRate = assignments.length > 0 ? (assignments.filter(a => a.status !== AssignmentStatus.Pending).length / assignments.length) * 100 : 0;
            const topSubject = gradedAssignments.filter(a=> a.grade! >= 90).map(a => a.title.split(' ')[0])[0] || 'Matematik';
            const lowSubject = gradedAssignments.filter(a=> a.grade! < 70).map(a => a.title.split(' ')[0])[0] || 'Fizik';

            const result = await generateStudentAnalyticsInsight(user.name, { avgGrade, completionRate, topSubject, lowSubject });
            setInsight(result);
            setIsLoading(false);
        };
        fetchInsight();
    }, [user, assignments]);

    return (
        <Card>
            <h4 className="font-semibold flex items-center mb-2">
                <SparklesIcon className="w-5 h-5 mr-2 text-primary-500" />
                Kişisel Koçun
            </h4>
            {isLoading ? <SkeletonText className="h-24 w-full" /> : <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{insight}</p>}
        </Card>
    );
};

// --- Coach Dashboard ---
const StudentLeaderboard = ({ students, assignments }: { students: User[], assignments: Assignment[] }) => {
    const [sortKey, setSortKey] = useState<'avgGrade' | 'completion' | 'overdue'>('avgGrade');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const leaderboardData = useMemo(() => {
        return students.map(student => {
            const studentAssignments = assignments.filter(a => a.studentId === student.id);
            const graded = studentAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
            const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 0;
            const completion = studentAssignments.length > 0 ? (studentAssignments.filter(a => a.status !== AssignmentStatus.Pending).length / studentAssignments.length) * 100 : 0;
            const overdue = studentAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
            return { ...student, avgGrade, completion, overdue };
        }).sort((a, b) => {
            if (sortOrder === 'asc') return a[sortKey] - b[sortKey];
            return b[sortKey] - a[sortKey];
        });
    }, [students, assignments, sortKey, sortOrder]);
    
    const handleSort = (key: 'avgGrade' | 'completion' | 'overdue') => {
        if (key === sortKey) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    const SortableHeader = ({ tKey, tTitle }: {tKey: 'avgGrade' | 'completion' | 'overdue', tTitle: string}) => (
        <th onClick={() => handleSort(tKey)} className="py-2 px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 cursor-pointer">
            {tTitle} {sortKey === tKey ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
        </th>
    );

    return (
        <Card title="Öğrenci Liderlik Tablosu">
            <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="py-2 px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Öğrenci</th>
                            <SortableHeader tKey="avgGrade" tTitle="Not Ort." />
                            <SortableHeader tKey="completion" tTitle="Tamamlama %" />
                            <SortableHeader tKey="overdue" tTitle="Gecikmiş" />
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboardData.map(s => (
                            <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-2 px-3 flex items-center gap-2"><img src={s.profilePicture} alt={s.name} className="w-6 h-6 rounded-full" />{s.name}</td>
                                <td className="py-2 px-3 font-semibold">{s.avgGrade}</td>
                                <td className="py-2 px-3">{s.completion.toFixed(0)}%</td>
                                <td className={`py-2 px-3 ${s.overdue > 0 ? 'text-red-500 font-semibold' : ''}`}>{s.overdue}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const GradeDistributionChart = ({ assignments }: { assignments: Assignment[] }) => {
    const data = useMemo(() => {
        const ranges = { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '<60': 0 };
        assignments.forEach(a => {
            if (a.status === AssignmentStatus.Graded && a.grade !== null) {
                if (a.grade >= 90) ranges['90-100']++;
                else if (a.grade >= 80) ranges['80-89']++;
                else if (a.grade >= 70) ranges['70-79']++;
                else if (a.grade >= 60) ranges['60-69']++;
                else ranges['<60']++;
            }
        });
        return Object.entries(ranges).map(([name, value]) => ({ name, 'Öğrenci Sayısı': value }));
    }, [assignments]);
    
    return (
        <Card title="Not Dağılım Grafiği">
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }} />
                        <Bar dataKey="Öğrenci Sayısı" fill="#818cf8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const AiCoachInsight = ({ students, assignments }: { students: User[], assignments: Assignment[] }) => {
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsight = async () => {
            setIsLoading(true);
            const studentData = students.map(student => {
                const studentAssignments = assignments.filter(a => a.studentId === student.id);
                const graded = studentAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
                const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 0;
                const completionRate = studentAssignments.length > 0 ? (studentAssignments.filter(a => a.status !== AssignmentStatus.Pending).length / studentAssignments.length) * 100 : 0;
                const overdue = studentAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
                return { name: student.name, avgGrade, completionRate, overdue };
            });
            const result = await generateCoachAnalyticsInsight(studentData);
            setInsight(result);
            setIsLoading(false);
        };
        fetchInsight();
    }, [students, assignments]);

    return (
        <Card>
            <h4 className="font-semibold flex items-center mb-2">
                <SparklesIcon className="w-5 h-5 mr-2 text-primary-500" />
                Yapay Zeka Analisti
            </h4>
            {isLoading ? <SkeletonText className="h-24 w-full" /> : <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{insight}</p>}
        </Card>
    );
};

// --- Super Admin Dashboard ---
const CoachPerformanceTable = ({ coaches, students, assignments }: { coaches: User[], students: User[], assignments: Assignment[] }) => {
    const coachData = useMemo(() => coaches.map(coach => {
        const myStudents = students.filter(s => s.assignedCoachId === coach.id);
        const studentIds = myStudents.map(s => s.id);
        const coachAssignments = assignments.filter(a => studentIds.includes(a.studentId));
        const graded = coachAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
        const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : 0;

        return {
            ...coach,
            studentCount: myStudents.length,
            avgGrade,
        };
    }), [coaches, students, assignments]);

    return (
        <Card title="Koç Performans Tablosu">
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="py-2 px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Koç</th>
                            <th className="py-2 px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Öğrenci Sayısı</th>
                            <th className="py-2 px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Genel Not Ort.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coachData.map(c => (
                            <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-2 px-3 flex items-center gap-2"><img src={c.profilePicture} alt={c.name} className="w-6 h-6 rounded-full" />{c.name}</td>
                                <td className="py-2 px-3 font-semibold">{c.studentCount}</td>
                                <td className="py-2 px-3 font-semibold">{c.avgGrade}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// --- Main Component & Dashboards ---



const TimeFilterComponent = ({ filter, setFilter }: { filter: TimeFilter, setFilter: (f: TimeFilter) => void }) => {
    const filters: {key: TimeFilter, label: string}[] = [{key: '7d', label: 'Son 7 Gün'}, {key: '30d', label: 'Son 30 Gün'}, {key: 'all', label: 'Tüm Zamanlar'}];
    return (
        <div className="flex justify-end">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                {filters.map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1 text-sm font-semibold rounded-md ${filter === f.key ? 'bg-white dark:bg-gray-800 shadow text-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
    );
};


const StudentAnalyticsDashboard = () => {
    const { currentUser, getAssignmentsForStudent } = useDataContext();
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    
    const allAssignments = useMemo(() => currentUser ? getAssignmentsForStudent(currentUser.id) : [], [currentUser, getAssignmentsForStudent]);

    const assignments = useMemo(() => {
        if (timeFilter === 'all') return allAssignments;
        const days = timeFilter === '7d' ? 7 : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return allAssignments.filter(a => new Date(a.dueDate) > cutoff);
    }, [allAssignments, timeFilter]);
    
    const graded = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    const avgGrade = graded.length > 0 ? Math.round(graded.reduce((s, a) => s + a.grade!, 0) / graded.length) : 'N/A';
    const completionRate = assignments.length > 0 ? `${Math.round((assignments.filter(a=> a.status !== AssignmentStatus.Pending).length / assignments.length) * 100)}%` : 'N/A';

    return (
        <div className="space-y-6">
            <TimeFilterComponent filter={timeFilter} setFilter={setTimeFilter} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Not Ortalaması" value={avgGrade} icon={<TrendingUpIcon className="w-6 h-6"/>} />
                <StatCard title="Tamamlama Oranı" value={completionRate} icon={<TargetIcon className="w-6 h-6"/>} />
                <StatCard title="Tamamlanan Ödev" value={assignments.filter(a=> a.status !== AssignmentStatus.Pending).length} icon={<TrophyIcon className="w-6 h-6"/>} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {currentUser && <AiStudentInsight user={currentUser} assignments={assignments} />}
                 <SubjectPerformanceChart assignments={assignments} />
            </div>
            <ActivityHeatmap assignments={allAssignments} />
        </div>
    );
};

const CoachAnalyticsDashboard = () => {
    const { students, assignments } = useDataContext();
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    
    const filteredAssignments = useMemo(() => {
        if (timeFilter === 'all') return assignments;
        const days = timeFilter === '7d' ? 7 : 30;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return assignments.filter(a => new Date(a.dueDate) > cutoff);
    }, [assignments, timeFilter]);

    const graded = filteredAssignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);
    const avgGrade = graded.length > 0 ? Math.round(graded.reduce((s, a) => s + a.grade!, 0) / graded.length) : 0;
    const submittedCount = filteredAssignments.filter(a => a.status === AssignmentStatus.Submitted).length;
    const overdueCount = filteredAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;

    return (
        <div className="space-y-6">
            <TimeFilterComponent filter={timeFilter} setFilter={setTimeFilter} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Öğrenci Sayısı" value={students.length} icon={<StudentsIconType className="w-6 h-6"/>} />
                <StatCard title="Sınıf Ortalaması" value={avgGrade} icon={<TrendingUpIcon className="w-6 h-6"/>} />
                <StatCard title="Değerlendirilecek" value={submittedCount} icon={<CalendarIcon className="w-6 h-6"/>} />
                <StatCard title="Gecikmiş Ödev" value={overdueCount} icon={<AlertTriangleIcon className="w-6 h-6"/>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <StudentLeaderboard students={students} assignments={filteredAssignments} />
                </div>
                <div className="lg:col-span-2 space-y-6">
                     <AiCoachInsight students={students} assignments={filteredAssignments} />
                     <GradeDistributionChart assignments={filteredAssignments} />
                </div>
            </div>
        </div>
    );
};

const SuperAdminAnalyticsDashboard = () => {
    const { users, assignments } = useDataContext();
    const coaches = users.filter(u => u.role === UserRole.Coach);
    const students = users.filter(u => u.role === UserRole.Student);
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Toplam Kullanıcı" value={users.length} icon={<StudentsIconType className="w-6 h-6"/>} />
                <StatCard title="Toplam Koç" value={coaches.length} icon={<StudentsIconType className="w-6 h-6"/>} />
                <StatCard title="Toplam Öğrenci" value={students.length} icon={<StudentsIconType className="w-6 h-6"/>} />
                <StatCard title="Toplam Ödev" value={assignments.length} icon={<AssignmentsIcon className="w-6 h-6"/>} />
            </div>
            <CoachPerformanceTable coaches={coaches} students={students} assignments={assignments} />
        </div>
    );
}

const Analytics = () => {
    const { currentUser } = useDataContext();

    if (!currentUser) return null;

    if (currentUser.role === UserRole.Student) return <StudentAnalyticsDashboard />;
    if (currentUser.role === UserRole.Coach) return <CoachAnalyticsDashboard />;
    if (currentUser.role === UserRole.SuperAdmin) return <SuperAdminAnalyticsDashboard />;
    
    return <div>Bu rol için analitik sayfası bulunmamaktadır.</div>;
};

export default Analytics;