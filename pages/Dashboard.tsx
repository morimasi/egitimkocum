import React, { useEffect, useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { UserRole, AssignmentStatus, User, Assignment } from '../types';
import Card from '../components/Card';
import { useUI } from '../contexts/UIContext';
import { AssignmentsIcon, CheckCircleIcon, StudentsIcon, AlertTriangleIcon, SparklesIcon, MegaphoneIcon, MessagesIcon, PlusCircleIcon, LibraryIcon, TargetIcon, TrendingUpIcon, XIcon, PieChartIcon } from '../components/Icons';
import { DashboardSkeleton, SkeletonText } from '../components/SkeletonLoader';
import { generateStudentFocusSuggestion, generatePersonalCoachSummary, suggestFocusAreas } from '../services/geminiService';
import AnnouncementModal from '../components/AnnouncementModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import GoalsCard from '../components/GoalsCard';
import OnboardingWizard from '../components/OnboardingWizard';


const WelcomeCard = ({ user, onDismiss }: { user: User, onDismiss: () => void }) => {
    let title = `Hoş geldin, ${user.name}!`;
    let message = "Platformumuza hoş geldin! Başarıya giden yolda sana destek olmak için buradayız. Ödevlerini takip edebilir, koçunla mesajlaşabilir ve ilerlemeni görebilirsin.";

    if (user.role === UserRole.Coach) {
        title = `Hoş geldin Koç, ${user.name}!`;
        message = "Öğrencilerinizi başarıya ulaştırmaya hazır mısınız? Ödevler oluşturun, ilerlemelerini takip edin ve onlarla iletişimde kalın.";
    } else if (user.role === UserRole.SuperAdmin) {
        title = `Hoş geldin Admin, ${user.name}!`;
        message = "Platform yönetimine hoş geldiniz. Kullanıcıları yönetebilir ve sistemin genel durumunu izleyebilirsiniz.";
    }

    return (
        <Card className="bg-gradient-to-r from-primary-600 to-blue-500 text-white mb-6 relative animate-fade-in shadow-lg">
            <button onClick={onDismiss} className="absolute top-3 right-3 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <XIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
                 <img src={user.profilePicture} alt={user.name} className="w-16 h-16 rounded-full border-4 border-white/50" />
                <div>
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <p className="mt-1 text-white/90 max-w-2xl">{message}</p>
                </div>
            </div>
        </Card>
    );
};


const AnnouncementsCard = React.memo(({className = ''}: {className?: string}) => {
    const { messages, users } = useDataContext();
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
                {announcements.map(msg => {
                    const sender = users.find(u => u.id === msg.senderId);
                     return (
                         <li key={msg.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg flex items-center space-x-3 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900" onClick={() => setActivePage('messages', {conversationId: 'conv-announcements'})}>
                            <div className="flex-shrink-0">
                                {sender && sender.profilePicture ? (
                                    <img src={sender.profilePicture} alt={sender.name} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <StudentsIcon className="w-4 h-4 text-gray-500" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{msg.text}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {sender?.name} - {new Date(msg.timestamp).toLocaleString('tr-TR')}
                                </p>
                            </div>
                        </li>
                    )
                })}
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
                 <button onClick={handleGenerateSuggestion} className="px-3 py-1.5 text-sm font-semibold bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full transition-colors flex-shrink-0">
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

const FocusAreasCard = React.memo(() => {
    const { currentUser, getAssignmentsForStudent } = useDataContext();
    const [focusSuggestion, setFocusSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestion = async () => {
            if (!currentUser) return;
            setIsLoading(true);
            try {
                const assignments = getAssignmentsForStudent(currentUser.id);
                const suggestion = await suggestFocusAreas(currentUser.name, assignments);
                setFocusSuggestion(suggestion);
            } catch (error) {
                console.error("Error fetching focus suggestion:", error);
                setFocusSuggestion("Odak önerisi alınırken bir hata oluştu. Lütfen tüm derslerine eşit önem ver.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestion();
    }, [currentUser, getAssignmentsForStudent]);

    return (
        <Card title="Bu Haftaki Odak Alanların" icon={<TargetIcon />}>
            {isLoading ? (
                <div className="space-y-2">
                    <SkeletonText className="h-4 w-full" />
                    <SkeletonText className="h-4 w-full" />
                    <SkeletonText className="h-4 w-3/4" />
                </div>
            ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">{focusSuggestion}</p>
            )}
        </Card>
    );
});


const StudentDashboard = () => {
    const { currentUser, getAssignmentsForStudent } = useDataContext();
    const { setActivePage } = useUI();
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (currentUser) {
            const dismissed = localStorage.getItem(`onboarding_wizard_dismissed_${currentUser.id}`);
            if (!dismissed) {
                setShowOnboarding(true);
            }
        }
    }, [currentUser]);


    if (!currentUser) return null;
    
    const assignments = getAssignmentsForStudent(currentUser.id);

    const pendingCount = assignments.filter(a => a.status === AssignmentStatus.Pending).length;
    const gradedAssignments = assignments.filter(a => a.grade !== null);
    const averageGrade = gradedAssignments.length > 0 ? Math.round(gradedAssignments.reduce((sum, a) => sum + a.grade!, 0) / gradedAssignments.length) : 'N/A';
    const streak = currentUser.streak || 0;
    
    const upcomingAssignments = useMemo(() => assignments
        .filter(a => a.status === AssignmentStatus.Pending)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3), [assignments]);

    return (
        <div className="space-y-6">
            {showOnboarding && <OnboardingWizard onCompleteOrDismiss={() => setShowOnboarding(false)} />}
            <StudentWelcomeHeader />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="tour-step-3">
                <StudentStatCard title="Bekleyen Ödev" value={pendingCount} icon={<AssignmentsIcon />} color="text-yellow-500"/>
                <StudentStatCard title="Not Ortalaması" value={averageGrade} icon={<TrendingUpIcon />} color="text-green-500"/>
                <StudentStatCard title="Günlük Seri" value={streak} icon={<TargetIcon />} color="text-red-500"/>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Yaklaşan Ödevler" className="h-full">
                     {upcomingAssignments.length > 0 ? (
                        <ul className="space-y-3">
                            {upcomingAssignments.map(a => (
                                <li key={a.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setActivePage('assignments', {assignmentId: a.id})}>
                                    <div>
                                        <p className="font-semibold">{a.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(a.dueDate).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-yellow-600 dark:text-yellow-300">Bekliyor</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8">
                            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto" />
                            <p className="mt-2 font-semibold">Tebrikler!</p>
                            <p className="text-sm text-gray-500">Bekleyen ödevin bulunmuyor.</p>
                        </div>
                    )}
                </Card>
                <div className="space-y-6">
                    <GoalsCard />
                    <FocusAreasCard />
                </div>
            </div>
            <AnnouncementsCard />
        </div>
    );
};

// --- Coach Dashboard Components ---
const CoachWelcomeHeader = React.memo(() => {
    const { currentUser, students, assignments } = useDataContext();
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
     const handleGenerateSummary = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const result = await generatePersonalCoachSummary(currentUser.name, students, assignments);
        setSummary(result);
        setIsLoading(false);
    };

    return (
         <Card variant="gradient" className="animate-fade-in" icon={<SparklesIcon />}>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-white">Merhaba Koç {currentUser?.name}!</h1>
                    <p className="text-sm text-white/80">İşte haftalık genel durumun.</p>
                </div>
                 <button onClick={handleGenerateSummary} className="px-3 py-1.5 text-sm font-semibold bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full transition-colors flex-shrink-0">
                    ✨ Haftalık Özeti Al
                </button>
            </div>
             <div className="mt-3 text-white/90 bg-white/10 p-3 rounded-md min-h-[40px] text-sm whitespace-pre-wrap">
                 {isLoading ? (
                    <SkeletonText className="h-16 w-full bg-white/30" />
                ) : summary ? (
                    <p>{summary}</p>
                ) : (
                   <p className="opacity-80">Öğrencilerinin durumu hakkında hızlı bir özet almak için butona tıkla.</p>
                )}
            </div>
        </Card>
    );
});

const CoachStatCard = ({ title, value, icon, color, onClick }: { title: string, value: string | number, icon: React.ReactNode, color:string, onClick?: () => void}) => (
    <Card className="relative overflow-hidden" onClick={onClick}>
        <div className={`absolute -top-2 -right-2 text-6xl opacity-10 ${color}`}>
            {icon}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </Card>
);

const StudentsAtRiskCard = () => {
    const { students, assignments } = useDataContext();
    const { setActivePage } = useUI();

    const studentsAtRisk = useMemo(() => {
        return students.map(student => {
            const studentAssignments = assignments.filter(a => a.studentId === student.id);
            const overdueCount = studentAssignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
            const graded = studentAssignments.filter(a => a.grade !== null);
            const avgGrade = graded.length > 0 ? Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length) : null;
            
            const riskFactors = [];
            if (overdueCount > 1) riskFactors.push(`${overdueCount} gecikmiş ödev`);
            if (avgGrade !== null && avgGrade < 70) riskFactors.push(`not ort: ${avgGrade}`);
            
            return { ...student, overdueCount, avgGrade, riskFactors };
        }).filter(s => s.riskFactors.length > 0)
          .sort((a, b) => b.riskFactors.length - a.riskFactors.length)
          .slice(0, 5); // Show top 5
    }, [students, assignments]);

    if (studentsAtRisk.length === 0) {
        return null;
    }

    return (
        <Card title="İlgi Gerektiren Öğrenciler">
            <ul className="space-y-3">
                {studentsAtRisk.map(student => (
                    <li key={student.id} onClick={() => setActivePage('students', {studentId: student.id})} className="p-3 bg-red-50 dark:bg-red-900/50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-red-100 dark:hover:bg-red-900">
                        <div className="flex items-center gap-3">
                             <img src={student.profilePicture} alt={student.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                                <p className="font-semibold">{student.name}</p>
                                <p className="text-xs text-red-700 dark:text-red-300">{student.riskFactors.join(', ')}</p>
                            </div>
                        </div>
                         <button className="text-xs font-semibold text-red-600 dark:text-red-200 hover:underline">Detay</button>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

const QuickActions = () => {
    const { setActivePage } = useUI();
    const [isAnnouncementModalOpen, setAnnouncementModalOpen] = useState(false);

    const actions = [
        { label: "Yeni Ödev", icon: <PlusCircleIcon className="w-6 h-6 text-primary-500"/>, action: () => setActivePage('assignments', {openNewAssignmentModal: true})},
        { label: "Mesajlar", icon: <MessagesIcon className="w-6 h-6 text-green-500"/>, action: () => setActivePage('messages')},
        { label: "Duyuru Yap", icon: <MegaphoneIcon className="w-6 h-6 text-yellow-500"/>, action: () => setAnnouncementModalOpen(true)},
        { label: "Kütüphane", icon: <LibraryIcon className="w-6 h-6 text-purple-500"/>, action: () => setActivePage('library')},
    ];

    return (
        <>
            <Card title="Hızlı Eylemler">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {actions.map(({ label, icon, action }) => (
                        <button key={label} onClick={action} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 flex flex-col items-center justify-center gap-2 transition-all transform hover:scale-105 active:bg-gray-200 dark:active:bg-gray-600">
                            {icon}
                            <span className="text-sm font-semibold text-center">{label}</span>
                        </button>
                    ))}
                </div>
            </Card>
            <AnnouncementModal isOpen={isAnnouncementModalOpen} onClose={() => setAnnouncementModalOpen(false)} />
        </>
    );
};

const CoachDashboard = () => {
    const { students, assignments } = useDataContext();
    const { setActivePage } = useUI();

    const toGradeCount = assignments.filter(a => a.status === AssignmentStatus.Submitted).length;
    const overdueCount = assignments.filter(a => a.status === AssignmentStatus.Pending && new Date(a.dueDate) < new Date()).length;
    
    const recentActivity = useMemo(() => assignments
        .filter(a => a.status === AssignmentStatus.Submitted)
        .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())
        .slice(0, 5)
    , [assignments]);

    const studentPerformanceData = useMemo(() => students.map(student => {
        const studentAssignments = assignments.filter(a => a.studentId === student.id && a.status === AssignmentStatus.Graded && a.grade !== null);
        const avgGrade = studentAssignments.length > 0 ? Math.round(studentAssignments.reduce((sum, a) => sum + a.grade!, 0) / studentAssignments.length) : 0;
        return {
            name: student.name,
            avgGrade,
            id: student.id,
        };
    }).sort((a,b) => b.avgGrade - a.avgGrade), [students, assignments]);
    
    const assignmentStatusData = useMemo(() => {
        const statusCounts = assignments.reduce((acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
        }, {} as Record<AssignmentStatus, number>);

        return [
            { name: 'Bekleyen', value: statusCounts.pending || 0, fill: '#f59e0b' },
            { name: 'Teslim Edilen', value: statusCounts.submitted || 0, fill: '#3b82f6' },
            { name: 'Notlandırılan', value: statusCounts.graded || 0, fill: '#22c55e' },
        ];
    }, [assignments]);
    
     const handleBarClick = (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const studentId = data.activePayload[0].payload.id;
            setActivePage('students', { studentId });
        }
    };


    return (
        <div className="space-y-6">
            <CoachWelcomeHeader />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="tour-step-3">
                <CoachStatCard title="Toplam Öğrenci" value={students.length} icon={<StudentsIcon />} color="text-green-500" onClick={() => setActivePage('students')} />
                <CoachStatCard title="Değerlendirilecek" value={toGradeCount} icon={<AssignmentsIcon />} color="text-blue-500" onClick={() => setActivePage('assignments', {status: AssignmentStatus.Submitted})} />
                <CoachStatCard title="Gecikmiş Ödev" value={overdueCount} icon={<AlertTriangleIcon />} color="text-red-500" onClick={() => setActivePage('assignments', { status: AssignmentStatus.Pending })} />
            </div>

            <QuickActions />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card title="Öğrenci Performans Sıralaması" className="lg:col-span-3 h-full">
                     <div className="w-full h-80">
                         <ResponsiveContainer>
                            <BarChart data={studentPerformanceData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]}/>
                                <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12}} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }} />
                                <Bar dataKey="avgGrade" name="Not Ort." barSize={20} onClick={handleBarClick} cursor="pointer">
                                    {studentPerformanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.avgGrade >= 85 ? '#22c55e' : entry.avgGrade >= 60 ? '#3b82f6' : '#ef4444'}/>
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </Card>
                 <div className="lg:col-span-2 space-y-6">
                    <Card title="Ödev Durum Dağılımı" icon={<PieChartIcon />}>
                         <div className="w-full h-40">
                             <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={assignmentStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                     <Card title="Son Aktiviteler" className="h-full">
                         {recentActivity.length > 0 ? (
                            <ul className="space-y-3">
                                {recentActivity.map(a => (
                                    <li key={a.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setActivePage('assignments', {assignmentId: a.id})}>
                                        <div>
                                            <p className="font-semibold text-sm">{students.find(s=>s.id === a.studentId)?.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{a.title}</p>
                                        </div>
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-300 flex-shrink-0">Teslim Edildi</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto" />
                                <p className="mt-2 font-semibold">Her şey güncel!</p>
                                <p className="text-sm text-gray-500">Değerlendirilecek yeni ödev yok.</p>
                            </div>
                        )}
                     </Card>
                </div>
            </div>
            <StudentsAtRiskCard />
            <AnnouncementsCard />
        </div>
    );
};


export default function Dashboard() {
    const { currentUser, isLoading } = useDataContext();
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        if (currentUser) {
            const welcomeSeen = localStorage.getItem(`welcome_seen_${currentUser.id}`);
            if (!welcomeSeen) {
                setShowWelcome(true);
            }
        }
    }, [currentUser]);

    const handleDismissWelcome = () => {
        if (currentUser) {
            localStorage.setItem(`welcome_seen_${currentUser.id}`, 'true');
            setShowWelcome(false);
        }
    };
    
    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (!currentUser) {
        return null;
    }

    const renderDashboardContent = () => {
        switch (currentUser.role) {
            case UserRole.Student:
                return <StudentDashboard />;
            case UserRole.Coach:
            case UserRole.SuperAdmin:
                return <CoachDashboard />;
            default:
                return <div>Bilinmeyen kullanıcı rolü.</div>;
        }
    };
    
    return (
        <>
            {showWelcome && <WelcomeCard user={currentUser} onDismiss={handleDismissWelcome} />}
            {renderDashboardContent()}
        </>
    );
}