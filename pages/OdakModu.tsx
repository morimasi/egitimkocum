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
    const [notificationPermission, setNotificationPermission] = useState('default');
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
        if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(setNotificationPermission);
        }
    }, []);

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
                        taskTitle: selectedTask ? selectedTask.title : 'Genel Çalışma',
                        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                    }
                ]);
                
                const isLongBreak = newPomodoroCount % 4 === 0;
                if (notificationPermission === 'granted') {
                    new Notification('Odak Modu', { body: `Çalışma süresi bitti! Şimdi ${isLongBreak ? 'uzun' : 'kısa'} bir mola zamanı.`, icon: '/vite.svg' });
                }
                selectMode(isLongBreak ? 'longBreak' : 'shortBreak');

            } else { // It's a break
                if (notificationPermission === 'granted') {
                    new Notification('Odak Modu', { body: 'Mola bitti! Tekrar odaklanmaya hazır mısın?', icon: '/vite.svg' });
                }
                selectMode('work');
            }
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, pomodoros, selectMode, awardXp, selectedTask, notificationPermission]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const toggleTimer = () => {
        if (!selectedTask && tasks.length > 0) {
            alert("Lütfen başlamadan önce bir görev seçin.");
            return;
        }
        setIsActive(!isActive);
    };
    
    const CIRCLE_RADIUS = 140;
    const CIRCLE_STROKE_WIDTH = 12;
    const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

    const modeClasses: Record<TimerMode, { progress: string, bg: string }> = {
        work: { progress: 'text-primary-500', bg: 'bg-primary-500' },
        shortBreak: { progress: 'text-green-500', bg: 'bg-green-500' },
        longBreak: { progress: 'text-blue-500', bg: 'bg-blue-500' },
    };

    const progress = (timeLeft / durations[mode]);
    const strokeDashoffset = CIRCLE_CIRCUMFERENCE - progress * CIRCLE_CIRCUMFERENCE;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <div className="text-center">
                        <div className="flex justify-center gap-2 mb-8">
                            <button onClick={() => selectMode('work')} className={`px-4 py-2 rounded-md font-semibold ${mode === 'work' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Çalışma</button>
                            <button onClick={() => selectMode('shortBreak')} className={`px-4 py-2 rounded-md font-semibold ${mode === 'shortBreak' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Kısa Mola</button>
                            <button onClick={() => selectMode('longBreak')} className={`px-4 py-2 rounded-md font-semibold ${mode === 'longBreak' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Uzun Mola</button>
                        </div>

                        <div className="relative w-[300px] h-[300px] mx-auto mb-8">
                            <svg className="w-full h-full" viewBox="0 0 300 300">
                                <circle
                                    strokeWidth={CIRCLE_STROKE_WIDTH}
                                    stroke="currentColor"
                                    fill="transparent"
                                    r={CIRCLE_RADIUS}
                                    cx="150"
                                    cy="150"
                                    className="text-gray-200 dark:text-gray-700"
                                />
                                <circle
                                    strokeWidth={CIRCLE_STROKE_WIDTH}
                                    stroke="currentColor"
                                    fill="transparent"
                                    r={CIRCLE_RADIUS}
                                    cx="150"
                                    cy="150"
                                    className={modeClasses[mode].progress}
                                    strokeLinecap="round"
                                    transform="rotate(-90 150 150)"
                                    style={{
                                        strokeDasharray: CIRCLE_CIRCUMFERENCE,
                                        strokeDashoffset: strokeDashoffset,
                                        transition: 'stroke-dashoffset 1s linear'
                                    }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="font-bold text-7xl tabular-nums">{formatTime(timeLeft)}</p>
                                <p className="font-semibold text-base mt-2 h-7 truncate max-w-[200px] text-gray-500 dark:text-gray-400">{selectedTask ? selectedTask.title : 'Bir görev seçin...'}</p>
                            </div>
                        </div>

                        <button onClick={toggleTimer} className={`w-24 h-24 text-2xl font-bold rounded-full text-white transition-all transform hover:scale-105 shadow-lg flex items-center justify-center mx-auto ${isActive ? 'bg-red-500 hover:bg-red-600' : `${modeClasses[mode].bg} hover:opacity-90`}`}>
                            {isActive ? <PauseIcon className="w-10 h-10"/> : <PlayIcon className="w-10 h-10 ml-1"/>}
                        </button>
                        
                        <div className="mt-8 flex justify-center items-center gap-4">
                             <p className="text-sm text-gray-500">Tamamlanan Pomodoro: {pomodoros}</p>
                             <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"><SettingsIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                </Card>
                 <Card title="Oturum Kaydı">
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                         {sessionLog.length > 0 ? sessionLog.map((log, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                <CheckIcon className="w-4 h-4 text-green-500"/>
                                <span className="flex-1">{log.taskTitle}</span>
                                <span className="text-xs text-gray-400">{log.timestamp}</span>
                            </li>
                         )) : <p className="text-sm text-center text-gray-500 py-4">Henüz tamamlanan bir oturum yok.</p>}
                    </ul>
                </Card>
            </div>
            
             <Card title="Bugünün Görevleri" icon={<ClipboardListIcon/>}>
                <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                    {tasks.map(task => (
                        <li key={task.id} onClick={() => setSelectedTask(task)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedTask?.id === task.id ? 'bg-primary-100 dark:bg-primary-900/50 ring-2 ring-primary-500' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            <p className="font-semibold text-sm flex items-center gap-2">
                                <TargetIcon className="w-4 h-4 flex-shrink-0"/>
                                {task.title}
                            </p>
                            {'dueDate' in task && <p className="text-xs text-gray-400 mt-1 ml-6">Ödev - {new Date(task.dueDate).toLocaleDateString('tr-TR')}</p>}
                            {'milestones' in task && <p className="text-xs text-gray-400 mt-1 ml-6">Hedef</p>}
                        </li>
                    ))}
                </ul>
            </Card>
             <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} durations={durations} setDurations={setDurations} alertSound={alertSound} setAlertSound={setAlertSound} />
        </div>
    );
};

export default OdakModu;
