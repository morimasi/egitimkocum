

import React from 'react';
import { useDataContext } from '../contexts/DataContext';
import Card from '../components/Card';
import { Assignment, AssignmentStatus, UserRole } from '../types';
import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateExamPerformanceInsight } from '../services/geminiService';
import { SkeletonText } from '../components/SkeletonLoader';
import { SparklesIcon, TrendingUpIcon, TrophyIcon, XIcon } from '../components/Icons';

// Fix: Replaced with a more robust and consistent subject detection logic.
// This logic is now aligned with the one used in the Gemini service for better data consistency.
const getSubject = (title: string): string => {
    const subjectKeywords: { [key: string]: string[] } = {
        'Matematik': ['matematik', 'türev', 'limit', 'problem', 'geometri'],
        'Fizik': ['fizik', 'deney', 'sarkaç', 'vektörler', 'optik', 'elektrik'],
        'Kimya': ['kimya', 'formül', 'organik', 'mol'],
        'Biyoloji': ['biyoloji', 'hücre', 'bölünme', 'çizim'],
        'Türkçe': ['türkçe', 'kompozisyon', 'paragraf', 'özet', 'makale', 'kitap', 'edebiyat'],
        'Tarih': ['tarih', 'ihtilal', 'araştırma', 'savaş'],
        'Coğrafya': ['coğrafya', 'iklim', 'sunum', 'göller'],
        'İngilizce': ['ingilizce', 'kelime', 'essay'],
        'Felsefe': ['felsefe']
    };
    for (const subject in subjectKeywords) {
        if (subjectKeywords[subject].some(keyword => title.toLowerCase().includes(keyword))) {
            return subject;
        }
    }
    return 'Diğer';
};

const InsightRenderer = ({ text }: { text: string }) => {
    const parts = text.split('### ').filter(p => p.trim());

    return (
        <div className="space-y-4">
            {parts.map((part, index) => {
                const lines = part.split('\n').filter(l => l.trim());
                if (!lines.length) return null;
                const title = lines[0];
                const content = lines.slice(1);

                return (
                    <div key={index}>
                        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">{title}</h3>
                        <ul className="space-y-1.5">
                            {content.map((line, lineIndex) => (
                                <li key={lineIndex} className="text-sm text-gray-600 dark:text-gray-300 list-inside list-disc ml-2">{line.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '$1')}</li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
};

const SinavPerformansi = () => {
    const { currentUser, getAssignmentsForStudent } = useDataContext();
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const performanceData = useMemo(() => {
        if (!currentUser) return null;
        const assignments = getAssignmentsForStudent(currentUser.id);
        const graded = assignments.filter(a => a.status === AssignmentStatus.Graded && a.grade !== null);

        if (graded.length === 0) return { overallAvg: 0, subjectAvgs: [], strongestSubject: 'N/A', weakestSubject: 'N/A' };
        
        const overallAvg = Math.round(graded.reduce((sum, a) => sum + a.grade!, 0) / graded.length);

        const subjectGrades: { [key: string]: number[] } = {};
        graded.forEach(a => {
            const subject = getSubject(a.title);
            if (!subjectGrades[subject]) subjectGrades[subject] = [];
            subjectGrades[subject].push(a.grade!);
        });
        
        const subjectAvgs = Object.entries(subjectGrades).map(([subject, grades]) => ({
            subject,
            average: Math.round(grades.reduce((a, b) => a + b, 0) / grades.length)
        })).sort((a,b) => b.average - a.average);

        const strongestSubject = subjectAvgs.length > 0 ? subjectAvgs[0].subject : 'N/A';
        const weakestSubject = subjectAvgs.length > 0 ? subjectAvgs[subjectAvgs.length - 1].subject : 'N/A';

        return { overallAvg, subjectAvgs, strongestSubject, weakestSubject };
    }, [currentUser, getAssignmentsForStudent]);

    useEffect(() => {
        if (currentUser && performanceData && performanceData.subjectAvgs.length > 0) {
            setIsLoading(true);
            generateExamPerformanceInsight(currentUser.name, { overallAvg: performanceData.overallAvg, subjectAvgs: performanceData.subjectAvgs })
                .then(setInsight)
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
            setInsight('### 📊 Analiz için Yeterli Veri Yok\n\nPerformans analizi oluşturabilmek için daha fazla notlandırılmış ödevinin olması gerekiyor. Çalışmaya devam et!');
        }
    }, [currentUser, performanceData]);

    if (!currentUser || !performanceData) return null;

    const { overallAvg, subjectAvgs, strongestSubject, weakestSubject } = performanceData;

    return (
        <div className="space-y-6">
             <Card>
                <div className="text-center">
                    <TrophyIcon className="w-16 h-16 text-primary-500 mx-auto" />
                    <h1 className="text-3xl font-bold mt-2">Sınav Performansı Analizi</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto mt-2">
                        Genel durumunu gör, güçlü ve zayıf yönlerini anla ve yapay zeka destekli tavsiyelerle netlerini artır!
                    </p>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center bg-blue-50 dark:bg-blue-900/50">
                     <TrendingUpIcon className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-300">{overallAvg}<span className="text-lg">/100</span></p>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Genel Ortalama</p>
                </Card>
                 <Card className="text-center bg-green-50 dark:bg-green-900/50">
                     <TrophyIcon className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600 dark:text-green-300">{strongestSubject}</p>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">En Güçlü Ders</p>
                </Card>
                 <Card className="text-center bg-red-50 dark:bg-red-900/50">
                    <XIcon className="w-10 h-10 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600 dark:text-red-300">{weakestSubject}</p>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">En Zayıf Ders</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card title="Ders Bazında Başarı Dağılımı" className="lg:col-span-3">
                    <div className="w-full h-80">
                         <ResponsiveContainer>
                            <BarChart data={subjectAvgs} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]}/>
                                <YAxis type="category" dataKey="subject" width={80} tick={{fontSize: 12}}/>
                                <Tooltip />
                                <Bar dataKey="average" name="Ortalama" barSize={20}>
                                    {subjectAvgs.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.average >= 85 ? '#22c55e' : entry.average >= 60 ? '#3b82f6' : '#ef4444'}/>
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="AI Koçundan Tavsiyeler" className="lg:col-span-2" icon={<SparklesIcon />}>
                    {isLoading ? (
                         <div className="space-y-3">
                            <SkeletonText className="h-6 w-1/3" />
                            <SkeletonText className="h-4 w-full" />
                            <SkeletonText className="h-4 w-full" />
                            <SkeletonText className="h-6 w-1/3 mt-4" />
                            <SkeletonText className="h-4 w-full" />
                            <SkeletonText className="h-4 w-4/5" />
                        </div>
                    ) : (
                        <InsightRenderer text={insight} />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default SinavPerformansi;
