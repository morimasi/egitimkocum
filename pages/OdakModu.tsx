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
                <button type="button" onClick={handleSave} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">Kaydet</button>
            </div>
        </Modal>
    );
};

const OdakModu = () => {
    const { currentUser, getAssignmentsForStudent, getGoalsForStudent, updateGoal } = useDataContext();
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [durations, setDurations] = useState<Record<TimerMode, number>>(() => {
        try {
            const saved = localStorage.getItem('pomodoroDurations');
            return saved ? JSON.parse(saved) : { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
        } catch {
            return { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
        }
    });
    const [alertSound, setAlertSound] = useState(() => localStorage.getItem('pomodoroSound') || 'bell');

    const [mode, setMode] = useState<TimerMode>('work');
    const [timeLeft, setTimeLeft] = useState(durations.work);
    const [isActive, setIsActive] = useState(false);
    const [sessionCount, setSessionCount] = useState(0);
    const timerRef = useRef<number | null>(null);

    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    
    const allTasks = useMemo(() => {
        if (!currentUser) return [];
        const assignments = getAssignmentsForStudent(currentUser.id)
            .filter(a => a.status === AssignmentStatus.Pending)
            .map(a => ({ id: `a-${a.id}`, text: a.title, type: 'assignment' as const, original: a }));
        const goals = getGoalsForStudent(currentUser.id)
            .filter(g => !g.isCompleted)
            .map(g => ({ id: `g-${g.id}`, text: g.title, type: 'goal' as const, original: g }));
        return [...assignments, ...goals];
    }, [currentUser, getAssignmentsForStudent, getGoalsForStudent]);
    
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            new Audio(SOUNDS[alertSound]).play();
            if (timerRef.current) clearInterval(timerRef.current);
            setIsActive(false);

            if (mode === 'work') {
                setSessionCount(s => s + 1);
                if ((sessionCount + 1) % 4 === 0) {
                    setMode('longBreak');
                } else {
                    setMode('shortBreak');
                }
            } else {
                setMode('work');
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft, alertSound, mode, sessionCount]);

    useEffect(() => {
        setTimeLeft(durations[mode]);
        setIsActive(false);
    }, [mode, durations]);
    
    useEffect(() => {
        localStorage.setItem('pomodoroDurations', JSON.stringify(durations));
    }, [durations]);

    useEffect(() => {
        localStorage.setItem('pomodoroSound', alertSound);
    }, [alertSound]);
    
    const handleToggleTask = (taskId: string) => {
        setSelectedTasks(prev => 
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleMarkTaskComplete = (taskId: string) => {
        const task = allTasks.find(t => t.id === taskId);
        if (task?.type === 'goal') {
            updateGoal({...task.original as Goal, isCompleted: true });
        }
        setSelectedTasks(prev => prev.filter(id => id !== taskId));
    };

    const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    const progress = (timeLeft / durations[mode]) * 100;

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Odak Modu</h1>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-gray-500 mt-2">Pomodoro tekniği ile verimliliğini artır. Bir görev seç ve zamanlayıcıyı başlat!</p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card title="Bugünün Görevleri">
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {allTasks.length > 0 ? allTasks.map(task => (
                                <label key={task.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input 
                                        type="checkbox"
                                        checked={selectedTasks.includes(task.id)}
                                        onChange={() => handleToggleTask(task.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="ml-3 text-sm font-medium">{task.text}</span>
                                </label>
                            )) : (
                                <p className="text-sm text-gray-500 text-center py-4">Aktif ödev veya hedefin yok.</p>
                            )}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card className="flex flex-col items-center">
                        <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-full">
                            <button onClick={() => setMode('work')} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${mode === 'work' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>Çalışma</button>
                            <button onClick={() => setMode('shortBreak')} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${mode === 'shortBreak' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>Kısa Mola</button>
                            <button onClick={() => setMode('longBreak')} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${mode === 'longBreak' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>Uzun Mola</button>
                        </div>

                        <div className="relative w-64 h-64">
                             <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle
                                    className="text-gray-200 dark:text-gray-700"
                                    cx="18"
                                    cy="18"
                                    r="15.9155"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                                <circle
                                    className="text-primary-500 transition-all duration-500"
                                    style={{ strokeDasharray: `${progress}, 100` }}
                                    cx="18"
                                    cy="18"
                                    r="15.9155"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-6xl font-bold tracking-tighter">{formatTime(timeLeft)}</span>
                                <span className="text-gray-500 text-sm mt-1">{selectedTasks.length > 0 ? allTasks.find(t => t.id === selectedTasks[0])?.text : 'Görev seçilmedi'}</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button onClick={() => setIsActive(!isActive)} className={`w-48 h-16 rounded-full text-white font-bold text-xl uppercase tracking-wider transition-colors ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
                                {isActive ? 'Duraklat' : 'Başlat'}
                            </button>
                        </div>
                    </Card>
                </div>
            </div>

            {selectedTasks.length > 0 && (
                 <Card title="Seçilen Görevler">
                    <ul className="space-y-2">
                        {selectedTasks.map(taskId => {
                            const task = allTasks.find(t => t.id === taskId);
                            if (!task) return null;
                            return (
                                <li key={task.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="font-medium">{task.text}</span>
                                    <button onClick={() => handleMarkTaskComplete(task.id)} className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded-full hover:bg-green-200"><CheckIcon className="w-3 h-3"/> Tamamlandı</button>
                                </li>
                            );
                        })}
                    </ul>
                 </Card>
            )}
            
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} durations={durations} setDurations={setDurations} alertSound={alertSound} setAlertSound={setAlertSound} />
        </div>
    );
};

export default OdakModu;