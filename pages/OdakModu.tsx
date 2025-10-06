import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
                        {/* Timer Circle */}
                        <div className="relative w-72 h-72 mx-auto">
                            <svg className="w-full h-full" viewBox="0 0 300 300">
                                <circle
                                    className="text-gray-200 dark:text-gray-700"
                                    stroke="currentColor" strokeWidth={CIRCLE_STROKE_WIDTH} fill="transparent"
                                    r={CIRCLE_RADIUS} cx="150" cy="150" />
                                <circle
                                    className={`${modeClasses[mode].progress} transition-all duration-1000`}
                                    stroke="currentColor" strokeWidth={CIRCLE_STROKE_WIDTH} fill="transparent"
                                    r={CIRCLE_RADIUS} cx="150" cy="150"
                                    strokeLinecap="round" transform="rotate(-90 150 150)"
                                    style={{ strokeDasharray: CIRCLE_CIRCUMFERENCE, strokeDashoffset }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-bold font-mono">{formatTime(timeLeft)}</span>
                                <p className="text-gray-500 mt-2">
                                    {isActive ? (mode === 'work' ? 'Odaklan!' : 'Mola zamanı!') : 'Başlamaya hazır...'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <button onClick={toggleTimer} className={`w-20 h-20 rounded-full text-white flex items-center justify-center text-2xl ${isActive ? 'bg-red-500' : modeClasses[mode].bg}`}>
                                {isActive ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8 ml-1"/>}
                            </button>
                             <button onClick={() => setIsSettingsOpen(true)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <SettingsIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>
                </Card>
                <Card title="Bugünkü Seanslar">
                    {sessionLog.length > 0 ? (
                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                            {sessionLog.map((log, index) => (
                                <li key={index} className="flex items-center gap-3 text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0"/>
                                    <span className="flex-1 truncate">{log.taskTitle}</span>
                                    <span className="text-xs text-gray-400">{log.timestamp}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">Henüz tamamlanmış bir seans yok.</p>
                    )}
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card title="Bugünün Görevleri">
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {tasks.map(task => (
                            <li key={task.id} onClick={() => setSelectedTask(task)} className={`p-3 rounded-lg cursor-pointer ${selectedTask?.id === task.id ? 'bg-primary-100 dark:bg-primary-900/50 ring-2 ring-primary-500' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100'}`}>
                                <div className="flex items-center gap-2">
                                    {'dueDate' in task ? <ClipboardListIcon className="w-4 h-4 text-yellow-500"/> : <TargetIcon className="w-4 h-4 text-green-500"/>}
                                    <p className="font-semibold text-sm">{task.title}</p>
                                </div>
                            </li>
                        ))}
                        {tasks.length === 0 && <p className="text-sm text-gray-500">Bugün için öncelikli bir görevin yok. Harika!</p>}
                    </ul>
                </Card>
            </div>
            {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} durations={durations} setDurations={setDurations} alertSound={alertSound} setAlertSound={setAlertSound} />}
        </div>
    );
};

// FIX: Add default export to allow for lazy loading.
export default OdakModu;
