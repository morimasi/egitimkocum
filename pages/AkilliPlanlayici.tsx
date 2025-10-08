

import { useState } from 'react';
import Card from '../components/Card';
import { useDataContext } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { BrainCircuitIcon, CalendarIcon, SparklesIcon } from '../components/Icons';
import { generateStudyPlan } from '../services/geminiService';
import { SkeletonText } from '../components/SkeletonLoader';
import { CalendarEvent } from '../types';

type StudyPlanEvent = {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description: string;
}

const AkilliPlanlayici = () => {
    const { addMultipleCalendarEvents, currentUser } = useDataContext();
    const { addToast } = useUI();
    
    const [targetExams, setTargetExams] = useState('TYT, AYT');
    const [focusSubjects, setFocusSubjects] = useState('Matematik, Fizik');

    const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, boolean[]>>(
        () => ({
            Pazartesi: Array(3).fill(false),
            Salı: Array(3).fill(false),
            Çarşamba: Array(3).fill(false),
            Perşembe: Array(3).fill(false),
            Cuma: Array(3).fill(false),
            Cumartesi: Array(3).fill(true),
            Pazar: Array(3).fill(true),
        })
    );
    const [sessionDuration, setSessionDuration] = useState(45);
    const [breakDuration, setBreakDuration] = useState(15);
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState<StudyPlanEvent[] | null>(null);

    const TIME_SLOTS = ['Sabah (8-12)', 'Öğlen (13-17)', 'Akşam (18-22)'];

    const handleToggleAvailability = (day: string, timeIndex: number) => {
        setWeeklyAvailability(prev => ({
            ...prev,
            [day]: prev[day].map((val, i) => (i === timeIndex ? !val : val)),
        }));
    };

    const handleGeneratePlan = async () => {
        if (!targetExams.trim() || !focusSubjects.trim()) {
            addToast("Lütfen hedef sınavları ve odaklanılacak dersleri girin.", "error");
            return;
        }
        setIsLoading(true);
        setPlan(null);
        try {
            const planData = await generateStudyPlan({
                targetExams: targetExams.split(',').map(s => s.trim()),
                focusSubjects: focusSubjects.split(',').map(s => s.trim()),
                weeklyAvailability,
                sessionDuration,
                breakDuration
            });
            setPlan(planData);
        } catch (error) {
            console.error("Plan oluşturulurken hata:", error);
            addToast("Plan oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePlan = async () => {
        if (!plan || !Array.isArray(plan) || !currentUser) return;
        const newEvents: Omit<CalendarEvent, 'id' | 'userId'>[] = plan.map(item => ({
            title: item.title,
            date: item.date,
            type: 'study',
            color: 'bg-indigo-500 hover:bg-indigo-600',
            startTime: item.startTime,
            endTime: item.endTime,
        }));
        await addMultipleCalendarEvents(newEvents);
        addToast("Çalışma planı başarıyla takviminize eklendi!", "success");
    };


    return (
        <div className="space-y-6">
            <Card>
                <div className="text-center">
                    <BrainCircuitIcon className="w-16 h-16 text-primary-500 mx-auto" />
                    <h1 className="text-3xl font-bold mt-2">AI Destekli Planlayıcı</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto mt-2">
                        Hedefini, müsait zamanlarını ve çalışma tarzını belirt, Gemini yapay zekası senin için en verimli haftalık çalışma planını oluştursun.
                    </p>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="1. Hedef ve Tercihler">
                    <div className="space-y-4">
                        <div>
                            <label className="block font-semibold mb-2">Hedef Sınavlar</label>
                            <input
                                type="text"
                                value={targetExams}
                                onChange={e => setTargetExams(e.target.value)}
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Örn: TYT, AYT"
                            />
                        </div>
                         <div>
                            <label className="block font-semibold mb-2">Odaklanılacak Dersler</label>
                            <input
                                type="text"
                                value={focusSubjects}
                                onChange={e => setFocusSubjects(e.target.value)}
                                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Örn: Matematik, Fizik"
                            />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-semibold mb-2">Ders Süresi (dk)</label>
                                <input type="number" step="5" min="20" value={sessionDuration} onChange={e => setSessionDuration(Number(e.target.value))} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                             <div>
                                <label className="block font-semibold mb-2">Mola Süresi (dk)</label>
                                <input type="number" step="5" min="5" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="2. Müsait Zamanlar">
                     <div className="overflow-x-auto">
                        <table className="w-full text-center text-sm">
                            <thead>
                                <tr>
                                    <th className="p-1"></th>
                                    {TIME_SLOTS.map(slot => <th key={slot} className="p-1 font-normal text-gray-500">{slot.split(' ')[0]}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(weeklyAvailability).map(([day, slots]) => (
                                    <tr key={day}>
                                        <td className="font-semibold p-1 text-right">{day}</td>
                                        {slots.map((isAvailable, i) => (
                                            <td key={i} className="p-1">
                                                <button onClick={() => handleToggleAvailability(day, i)} className={`w-full h-8 rounded transition-colors ${isAvailable ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}></button>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            
            <div className="text-center">
                 <button onClick={handleGeneratePlan} disabled={isLoading} className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-lg flex items-center justify-center gap-3 w-full max-w-md mx-auto disabled:opacity-50">
                    <SparklesIcon className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Plan Oluşturuluyor...' : 'Akıllı Planımı Oluştur'}
                 </button>
            </div>
            
            {plan && Array.isArray(plan) && (
                <Card title="Oluşturulan Akıllı Planın">
                    <div className="space-y-4">
                        {plan.map((item, index) => (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-primary-600 dark:text-primary-400">{item.title}</h4>
                                    <div className="text-sm font-semibold bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">{new Date(item.date).toLocaleDateString('tr-TR', { weekday: 'long' })} - {item.startTime}</div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.description}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-6">
                        <button onClick={handleSavePlan} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 mx-auto">
                            <CalendarIcon className="w-5 h-5"/>
                            Planı Takvime Ekle
                        </button>
                    </div>
                </Card>
            )}
            
            {isLoading && !plan && (
                 <Card>
                     <div className="space-y-4">
                         {[...Array(3)].map((_, i) => (
                             <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                 <div className="flex justify-between items-center">
                                     <SkeletonText className="h-6 w-1/2"/>
                                     <SkeletonText className="h-6 w-1/4"/>
                                 </div>
                                 <SkeletonText className="h-4 w-full mt-2"/>
                                  <SkeletonText className="h-4 w-3/4 mt-1"/>
                             </div>
                         ))}
                     </div>
                 </Card>
            )}

        </div>
    );
};

export default AkilliPlanlayici;