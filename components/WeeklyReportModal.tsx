import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useDataContext } from '../contexts/DataContext';
import { generateWeeklySummary } from '../services/geminiService';
import { SparklesIcon } from './Icons';
import { SkeletonCard, SkeletonText } from './SkeletonLoader';

const ReportSkeleton = () => (
    <div className="space-y-4">
        <SkeletonText className="h-8 w-3/4 mx-auto" />
        <SkeletonText className="h-4 w-1/2 mx-auto" />
        <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                <SkeletonText className="h-8 w-1/2 mx-auto mb-2" />
                <SkeletonText className="h-4 w-3/4 mx-auto" />
            </div>
             <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                <SkeletonText className="h-8 w-1/2 mx-auto mb-2" />
                <SkeletonText className="h-4 w-3/4 mx-auto" />
            </div>
             <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                <SkeletonText className="h-8 w-1/2 mx-auto mb-2" />
                <SkeletonText className="h-4 w-3/4 mx-auto" />
            </div>
        </div>
        <div className="pt-4">
            <SkeletonText className="h-20 w-full" />
        </div>
    </div>
);

const WeeklyReportModal = ({ onClose }: { onClose: () => void }) => {
    const { currentUser, getAssignmentsForStudent, getGoalsForStudent } = useDataContext();
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ completed: 0, avgGrade: 'N/A' as string | number, goals: 0 });

    useEffect(() => {
        if (!currentUser) return;

        const now = new Date();
        const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

        const allAssignments = getAssignmentsForStudent(currentUser.id);
        const allGoals = getGoalsForStudent(currentUser.id);

        const assignmentsThisWeek = allAssignments.filter(a => {
            const submittedDate = a.submittedAt ? new Date(a.submittedAt) : null;
            return submittedDate && submittedDate >= oneWeekAgo;
        });

        const gradedThisWeek = assignmentsThisWeek.filter(a => a.status === 'graded' && a.grade !== null);
        const avgGrade = gradedThisWeek.length > 0
            ? Math.round(gradedThisWeek.reduce((sum, a) => sum + a.grade!, 0) / gradedThisWeek.length)
            : 'N/A';
        
        const goalsCompletedThisWeek = allGoals.filter(g => g.isCompleted).length; // Simplified: just count all completed goals

        const calculatedStats = {
            completed: assignmentsThisWeek.length,
            avgGrade,
            goals: goalsCompletedThisWeek
        };

        setStats(calculatedStats);
        
        const fetchSummary = async () => {
            setIsLoading(true);
            try {
                const generatedSummary = await generateWeeklySummary(currentUser.name, calculatedStats);
                setSummary(generatedSummary);
            } catch (error) {
                setSummary("Bu haftaki performans özetin oluşturulurken bir hata oluştu. Harika çalışmaya devam et!");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();

    }, [currentUser, getAssignmentsForStudent, getGoalsForStudent]);
    

    const footer = (
        <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
            Harika, Anladım!
        </button>
    );

    return (
        <Modal isOpen={true} onClose={onClose} title="Haftalık Performans Raporun" footer={footer}>
            {isLoading ? <ReportSkeleton /> : (
                <div className="text-center">
                    <h3 className="text-2xl font-bold">Harika Bir Hafta Daha, {currentUser?.name}!</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">İşte geçen haftaki ilerlemen:</p>

                    <div className="grid grid-cols-3 gap-4 my-6">
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">{stats.completed}</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">Ödev Tamamlandı</p>
                        </div>
                        <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <p className="text-3xl font-bold text-green-600 dark:text-green-300">{stats.avgGrade}</p>
                            <p className="text-xs text-green-700 dark:text-green-400">Not Ortalaması</p>
                        </div>
                        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-300">{stats.goals}</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400">Hedefe Ulaşıldı</p>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="font-semibold flex items-center justify-center mb-2">
                           <SparklesIcon className="w-5 h-5 mr-2 text-primary-500" /> Koçunun Mesajı
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{summary}</p>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default WeeklyReportModal;
