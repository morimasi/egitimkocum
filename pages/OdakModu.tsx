
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
                    <input type="number" min="1" value={localDurations.work / 60} onChange={e => setLocalDurations(d => ({...d, work: Number(e.target.value) * 60}))} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Kısa Mola</label>
                    <input type="number" min="1" value={localDurations.shortBreak / 60} onChange={e => setLocalDurations(d => ({...d, shortBreak: Number(e.target.value) * 60}))} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Uzun Mola</label>
                    <input type="number" min="1" value={localDurations.longBreak / 60} onChange={e => setLocalDurations(d => ({...d, longBreak: Number(e.target.value) * 60}))} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
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
    const { currentUser, getAssignmentsForStudent, getGoalsForStudent, awardXp } = useDataContext();
    
    const [durations, setDurations] = useState<Record<TimerMode, number>>({
        work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60
    });
    const [alertSound, setAlertSound] = useState('bell');
    const [mode, setMode] = useState<TimerMode>('work');
    const [timeLeft, setTimeLeft] = useState(durations.work);
    const [isActive, setIsActive] = useState(false);
    const [pomodoros, setPomodoros] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Assignment | Goal | null>(null);
    const [sessionLog, setSessionLog] = useState<{ taskTitle: string; timestamp: string }[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(`odakSettings_${currentUser?.id}`);
            if (savedSettings) {
                const { savedDurations, savedAlertSound } = JSON.parse(savedSettings);
                setDurations(savedDurations);
                setAlertSound(savedAlertSound);
            }
        } catch (e) { console.error("Could not load settings", e); }
    }, [currentUser?.id]);

    useEffect(() => {
        setTimeLeft(durations[mode]);
        setIsActive(false);
    }, [mode, durations]);


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
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const assignmentsToday = getAssignmentsForStudent(currentUser.id)
            .filter(a => new Date(a.dueDate) <= today && a.status === AssignmentStatus.Pending);
        const openGoals = getGoalsForStudent(currentUser.id).filter(g => !g.isCompleted);
        return [...assignmentsToday, ...openGoals];
    }, [currentUser, getAssignmentsForStudent, getGoalsForStudent]);
    
    const selectMode = useCallback((newMode: TimerMode) => {
        setIsActive(false);
        setMode(newMode);
    }, []);

    useEffect(() => {
        let interval: number | undefined;
        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (isActive && timeLeft === 0) {
            audioRef.current?.play();
            if (mode === 'work') {
                const newPomodoroCount = pomodoros + 1;
                setPomodoros(newPomodoroCount);
                awardXp(25, 'Odak seansını tamamladın!');
                setSessionLog(prev => [
                    ...prev,
                    {
                        taskTitle: selectedTask ? ('title' in selectedTask ? selectedTask.title : selectedTask.text) : 'Genel Çalışma',
                        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
                
                if (newPomodoroCount % 4 === 0) selectMode('longBreak');
                else selectMode('shortBreak');
            } else {
                selectMode('work');
            }
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, pomodoros, selectMode, awardXp, selectedTask]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const toggleTimer = () => {
        if (!selectedTask && tasks.length > 0) {
            alert("Lütfen odaklanmak için bir görev seçin.");
            return;
        }
        setIsActive(!isActive);
    };

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
                        <div className="flex items-center gap-2 sm:gap-4 mb-4">
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

                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-center mb-4 w-full max-w-md">
                            <p className="font-semibold text-gray-800 dark:text-gray-200">Odaklanılan Görev</p>
                            <p className="text-sm text-gray-500 truncate">{selectedTask ? ('title' in selectedTask ? selectedTask.title : selectedTask.text) : 'Lütfen bir görev seçin'}</p>
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
                            </div>
                        </div>

                        <button
                            onClick={toggleTimer}
                            className="mt-6 px-10 py-3 sm:px-12 sm:py-4 text-xl sm:text-2xl font-bold bg-primary-600 text-white rounded-full hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-3"
                        >
                            {isActive ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}
                            {isActive ? 'DURAKLAT' : 'BAŞLAT'}
                        </button>
                        
                        <div className="mt-4 text-center">
                            <p className="font-semibold">Tamamlanan Pomodoro: {pomodoros}</p>
                        </div>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                 <Card title="Odaklanılacak Görevi Seç">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {tasks.map(task => {
                            const isGoal = 'isCompleted' in task;
                            const title = isGoal ? task.text : task.title;
                             return (
                                 <button key={task.id} onClick={() => setSelectedTask(task)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTask?.id === task.id ? 'bg-primary-100 dark:bg-primary-900/50 ring-2 ring-primary-500' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <p className="font-medium text-sm">{isGoal ? 'Hedef' : 'Ödev'}: {title}</p>
                                </div>
                             )
                        })}
                        {tasks.length === 0 && <p className="text-sm text-center text-gray-500 py-4">Harika! Odaklanılacak aktif bir görevin yok.</p>}
                    </div>
                </Card>
                <Card title="Seans Günlüğü">
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {sessionLog.length > 0 ? sessionLog.map((log, index) => (
                            <li key={index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between items-center text-sm">
                                <span className="truncate pr-2">{log.taskTitle}</span>
                                <span className="flex-shrink-0 font-mono text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">{log.timestamp}</span>
                            </li>
                        )) : <p className="text-sm text-center text-gray-500 py-4">Henüz tamamlanan seans yok.</p>}
                    </ul>
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
