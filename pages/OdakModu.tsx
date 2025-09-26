

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Assignment, Goal, AssignmentStatus } from '../types';
import Card from '../components/Card';
import { TargetIcon, PlayIcon, PauseIcon, CheckIcon, ClipboardListIcon, SettingsIcon } from '../components/Icons';
import Modal from '../components/Modal';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const SOUNDS: Record<string, string> = {
    bell: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg',
    bip: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
    chime: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
};

const SettingsModal = ({ isOpen, onClose, durations, setDurations, alertSound, setAlertSound }: {
    isOpen: boolean;
    onClose: () => void;
    durations: Record<TimerMode, number>;
    setDurations: (d: Record<TimerMode, number>) => void;
    alertSound: string;
    setAlertSound: (s: string) => void;
}) => {
    const [localDurations, setLocalDurations] = useState(durations);
    const [localSound, setLocalSound] = useState(alertSound);

    useEffect(() => {
        setLocalDurations(durations);
        setLocalSound(alertSound);
    }, [isOpen, durations, alertSound]);

    const handleSave = () => {
        setDurations(localDurations);
        setAlertSound(localSound);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Odak Modu Ayarları">
            <div className="space-y-4">
                <h4 className="font-semibold">Zamanlayıcı Süreleri (dakika)</h4>
                <div>
                    <label className="block text-sm font-medium mb-1">Çalışma</label>
                    <input type="number" value={localDurations.work / 60} onChange={e => setLocalDurations(d => ({...d, work: Number(e.target.value) * 60}))} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Kısa Mola</label>
                    <input type="number" value={localDurations.shortBreak / 60} onChange={e => setLocalDurations(d => ({...d, shortBreak: Number(e.target.value) * 60}))} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Uzun Mola</label>
                    <input type="number" value={localDurations.longBreak / 60} onChange={e => setLocalDurations(d => ({...d, longBreak: Number(e.target.value) * 60}))} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <h4 className="font-semibold pt-4 border-t dark:border-gray-600">Uyarı Sesi</h4>
                <select value={localSound} onChange={e => setLocalSound(e.target.value)} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    <option value="bell">Zil</option>
                    <option value="bip">Bip</option>
                    <option value="chime">Çan</option>
                </select>
            </div>
            <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 mr-2 rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">İptal</button>
                <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Kaydet</button>
            </div>
        </Modal>
    );
};

const OdakModu = () => {
    const { currentUser, getAssignmentsForStudent, getGoalsForStudent, updateGoal } = useDataContext();
    
    const [durations, setDurations] = useState<Record<TimerMode, number>>({
        work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60
    });
    const [alertSound, setAlertSound] = useState('bell');
    const [mode, setMode] = useState<TimerMode>('work');
    const [timeLeft, setTimeLeft] = useState(durations.work);
    const [isActive, setIsActive] = useState(false);
    const [pomodoros, setPomodoros] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(`odakSettings_${currentUser?.id}`);
            if (savedSettings) {
                const { savedDurations, savedAlertSound } = JSON.parse(savedSettings);
                setDurations(savedDurations);
                setAlertSound(savedAlertSound);
                setTimeLeft(savedDurations[mode]);
            }
        } catch (e) { console.error("Could not load settings", e); }
    }, [currentUser?.id, mode]);

    useEffect(() => {
        try {
            const settings = { savedDurations: durations, savedAlertSound: alertSound };
            localStorage.setItem(`odakSettings_${currentUser?.id}`, JSON.stringify(settings));
        } catch (e) { console.error("Could not save settings", e); }
    }, [durations, alertSound, currentUser?.id]);
    
    useEffect(() => {
        if (SOUNDS[alertSound]) {
            audioRef.current = new Audio(SOUNDS[alertSound]);
        }
    }, [alertSound]);

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
            interval = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            audioRef.current?.play();
            if (mode === 'work') {
                const newPomodoroCount = pomodoros + 1;
                setPomodoros(newPomodoroCount);
                if (newPomodoroCount % 4 === 0) selectMode('longBreak');
                else selectMode('shortBreak');
            } else {
                selectMode('work');
            }
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
        setTimeLeft(durations[newMode]);
    };

    const handleTaskToggle = (task: Assignment | Goal) => {
        if ('isCompleted' in task) { // It's a Goal
            updateGoal({ ...task, isCompleted: !task.isCompleted });
        }
    };
    
    const xpToNextLevel = (level: number) => (level * level) * 100;
    const currentLevel = useMemo(() => currentUser?.xp ? Math.floor(Math.sqrt(currentUser.xp / 100)) + 1 : 1, [currentUser?.xp]);
    const xpForCurrentLevel = useMemo(() => xpToNextLevel(currentLevel - 1), [currentLevel]);
    const xpForNextLevel = useMemo(() => xpToNextLevel(currentLevel), [currentLevel]);
    const levelProgress = useMemo(() => {
        const totalXpForLevel = xpForNextLevel - xpForCurrentLevel;
        const currentXpInLevel = (currentUser?.xp || 0) - xpForCurrentLevel;
        return totalXpForLevel > 0 ? (currentXpInLevel / totalXpForLevel) * 100 : 0;
    }, [currentUser?.xp, xpForCurrentLevel, xpForNextLevel]);

    const MODE_CONFIG: Record<TimerMode, { label: string; color: string }> = {
        work: { label: 'Çalışma', color: 'text-primary-500' },
        shortBreak: { label: 'Kısa Mola', color: 'text-green-500' },
        longBreak: { label: 'Uzun Mola', color: 'text-blue-500' },
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
                        <div className="flex items-center gap-2 sm:gap-4 mb-6">
                             {(Object.keys(MODE_CONFIG) as TimerMode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => selectMode(m)}
                                    className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-full transition-colors ${mode === m ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    {MODE_CONFIG[m].label}
                                </button>
                            ))}
                            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                                <SettingsIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        
                        <div className="relative w-60 h-60 sm:w-64 sm:h-64">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path className="text-gray-200 dark:text-gray-700"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="currentColor" strokeWidth="4" />
                                <path className={`${MODE_CONFIG[mode].color} transition-all duration-1000`}
                                    strokeDasharray={`${(timeLeft / durations[mode]) * 100}, 100`}
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" transform="rotate(-90 18 18)" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl sm:text-6xl font-bold font-mono tracking-tighter">{formatTime(timeLeft)}</span>
                                <span className="text-gray-500 font-semibold">{MODE_CONFIG[mode].label}</span>
                            </div>
                        </div>

                        <button
                            onClick={toggleTimer}
                            className="mt-8 px-10 py-3 sm:px-12 sm:py-4 text-xl sm:text-2xl font-bold bg-primary-600 text-white rounded-full hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-3"
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
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <h3 className="text-lg font-semibold mb-2">Seviye İlerlemen</h3>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex flex-col items-center justify-center font-bold flex-shrink-0">
                            <span className="text-xs">SEVİYE</span>
                            <span className="text-3xl">{currentLevel}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                                <span>{currentUser?.xp || 0} XP</span>
                                <span className="text-gray-500">{xpForNextLevel} XP</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full" style={{ width: `${levelProgress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </Card>
                <Card title="Bugünkü Odak Listesi" className="h-full">
                    <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
                        {tasks.length > 0 ? tasks.map(task => {
                            const isGoal = 'isCompleted' in task;
                            const isCompleted = isGoal && task.isCompleted;
                             return (
                                 <div key={task.id} className={`flex items-center p-3 rounded-lg transition-colors ${isCompleted ? 'bg-green-50 dark:bg-green-900/50' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                                    {isGoal ? (
                                        <>
                                            <button onClick={() => handleTaskToggle(task)} className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 hover:border-primary-500 ${isCompleted ? 'border-primary-500 bg-primary-500' : 'border-gray-400 dark:border-gray-500'}`}>
                                                {isCompleted && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                            </button>
                                            <div className="ml-3">
                                                <p className={`font-medium text-sm ${isCompleted ? 'line-through text-gray-500' : ''}`}>Hedef: {task.text}</p>
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
                             )
                        }) : (
                             <div className="text-center py-10">
                                <TargetIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                                <p className="mt-2 text-sm text-gray-500">Bugün için planlanmış bir görevin yok. Harika!</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                durations={durations}
                setDurations={setDurations}
                alertSound={alertSound}
                setAlertSound={setAlertSound}
            />
        </div>
    );
};

export default OdakModu;