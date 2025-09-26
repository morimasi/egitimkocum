
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Assignment, Goal, AssignmentStatus } from '../types';
import Card from '../components/Card';
import { TargetIcon, PlayIcon, PauseIcon, CheckIcon, ClipboardListIcon } from '../components/Icons';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const MODE_CONFIG: Record<TimerMode, { duration: number; label: string; color: string }> = {
    work: { duration: 25 * 60, label: 'Çalışma', color: 'bg-primary-500' },
    shortBreak: { duration: 5 * 60, label: 'Kısa Mola', color: 'bg-green-500' },
    longBreak: { duration: 15 * 60, label: 'Uzun Mola', color: 'bg-blue-500' },
};

const OdakModu = () => {
    const { currentUser, getAssignmentsForStudent, getGoalsForStudent, updateGoal } = useDataContext();
    
    const [mode, setMode] = useState<TimerMode>('work');
    const [timeLeft, setTimeLeft] = useState(MODE_CONFIG.work.duration);
    const [isActive, setIsActive] = useState(false);
    const [pomodoros, setPomodoros] = useState(0);

    const tasks: (Assignment | Goal)[] = useMemo(() => {
        if (!currentUser) return [];
        const today = new Date().toISOString().split('T')[0];
        const assignmentsToday = getAssignmentsForStudent(currentUser.id)
            .filter(a => new Date(a.dueDate).toISOString().split('T')[0] === today && a.status === AssignmentStatus.Pending);
        const openGoals = getGoalsForStudent(currentUser.id).filter(g => !g.isCompleted);
        return [...assignmentsToday, ...openGoals];
    }, [currentUser, getAssignmentsForStudent, getGoalsForStudent]);

    useEffect(() => {
        let interval: number | undefined;

        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (mode === 'work') {
                const newPomodoroCount = pomodoros + 1;
                setPomodoros(newPomodoroCount);
                if (newPomodoroCount % 4 === 0) {
                    setMode('longBreak');
                    setTimeLeft(MODE_CONFIG.longBreak.duration);
                } else {
                    setMode('shortBreak');
                    setTimeLeft(MODE_CONFIG.shortBreak.duration);
                }
            } else {
                setMode('work');
                setTimeLeft(MODE_CONFIG.work.duration);
            }
            // In a real app, you might play a sound here: new Audio('/alert.mp3').play();
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, pomodoros]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const toggleTimer = () => setIsActive(!isActive);

    const selectMode = (newMode: TimerMode) => {
        setIsActive(false);
        setMode(newMode);
        setTimeLeft(MODE_CONFIG[newMode].duration);
    };

    const handleTaskToggle = (task: Assignment | Goal) => {
        if ('isCompleted' in task) { // It's a Goal
            updateGoal({ ...task, isCompleted: !task.isCompleted });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <div className="flex flex-col items-center justify-center p-8">
                        <div className="flex items-center gap-4 mb-6">
                            {(Object.keys(MODE_CONFIG) as TimerMode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => selectMode(m)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full ${mode === m ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    {MODE_CONFIG[m].label}
                                </button>
                            ))}
                        </div>
                        
                        <div className="relative w-64 h-64">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path className="text-gray-200 dark:text-gray-700"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="currentColor" strokeWidth="2" />
                                <path className="text-primary-500 transition-all duration-1000"
                                    strokeDasharray={`${(timeLeft / MODE_CONFIG[mode].duration) * 100}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform="rotate(90 18 18)" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-bold font-mono">{formatTime(timeLeft)}</span>
                                <span className="text-gray-500">{MODE_CONFIG[mode].label}</span>
                            </div>
                        </div>

                        <button
                            onClick={toggleTimer}
                            className="mt-8 px-12 py-4 text-2xl font-bold bg-primary-600 text-white rounded-full hover:bg-primary-700 flex items-center gap-3"
                        >
                            {isActive ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                            {isActive ? 'DURAKLAT' : 'BAŞLAT'}
                        </button>
                        
                        <div className="mt-6 text-center">
                            <p className="font-semibold">Tamamlanan Pomodoro: {pomodoros}</p>
                            <p className="text-sm text-gray-500">Her 4 çalışmadan sonra uzun mola verilir.</p>
                        </div>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card title="Bugünkü Odak Listesi" className="h-full">
                    <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                        {tasks.length > 0 ? tasks.map(task => (
                             <div key={task.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                {'isCompleted' in task ? (
                                    <>
                                        <button onClick={() => handleTaskToggle(task)} className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 hover:border-primary-500 border-gray-400 dark:border-gray-500`}>
                                            {task.isCompleted && <CheckIcon className="w-3.5 h-3.5 text-primary-500" />}
                                        </button>
                                        <div className="ml-3">
                                            <p className="font-medium text-sm">Hedef: {task.text}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-shrink-0">
                                            <ClipboardListIcon className="w-5 h-5 text-primary-500" />
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-medium text-sm">Ödev: {task.title}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )) : (
                             <div className="text-center py-10">
                                <TargetIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                                <p className="mt-2 text-sm text-gray-500">Bugün için planlanmış bir görevin yok. Harika!</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default OdakModu;
