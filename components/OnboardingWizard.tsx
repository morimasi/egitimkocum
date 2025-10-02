

import React, { useState, useEffect, useCallback } from 'react';
import Card from './Card';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';
import { CheckCircleIcon, RocketIcon } from './Icons';

const ONBOARDING_KEY_PREFIX = 'onboarding_tasks_';
const WIZARD_DISMISSED_KEY = 'onboarding_wizard_dismissed_';

const OnboardingWizard = ({ onCompleteOrDismiss }: { onCompleteOrDismiss: () => void }) => {
    const { setActivePage, startTour, activePage } = useUI();
    const { currentUser, awardXp, getGoalsForStudent, coach, findOrCreateConversation, getMessagesForConversation } = useDataContext();

    const getInitialTasks = useCallback(() => {
        const saved = localStorage.getItem(ONBOARDING_KEY_PREFIX + currentUser?.id);
        return saved ? JSON.parse(saved) : {
            tour: false,
            goal: false,
            calendar: false,
            message: false,
        };
    }, [currentUser?.id]);
    
    const [completedTasks, setCompletedTasks] = useState(getInitialTasks);

    const tasks = [
        { id: 'tour', title: "Tanıtım Turunu Tamamla", description: "Platformun ana özelliklerini öğrenin.", action: startTour },
        { id: 'goal', title: "İlk Hedefini Belirle", description: "Başarıya giden yolda bir adım atın.", action: () => document.getElementById('student-goals-card')?.scrollIntoView({ behavior: 'smooth' }) },
        { id: 'calendar', title: "Takvimine Göz At", description: "Ödev teslim tarihlerini ve etkinliklerini gör.", action: () => {
            setActivePage('calendar');
        }},
        { id: 'message', title: "Koçuna Merhaba De", description: "Koçunla iletişime geçerek ilk mesajını gönder.", action: async () => {
            if (coach) {
                const convId = await findOrCreateConversation(coach.id);
                if (convId) setActivePage('messages', { conversationId: convId });
            }
        }},
    ];

    const markTaskAsDone = useCallback((taskId: string) => {
        if (!currentUser) return;

        setCompletedTasks((prev: any) => {
            if (prev[taskId]) return prev; // Already completed, no double XP
            
            const newTasks = { ...prev, [taskId]: true };
            localStorage.setItem(ONBOARDING_KEY_PREFIX + currentUser.id, JSON.stringify(newTasks));
            awardXp(50, `Başlangıç görevini tamamladın: ${tasks.find(t=>t.id === taskId)?.title}`);
            return newTasks;
        });
    }, [currentUser, awardXp, tasks]);
    
    // Effect to check for task completion automatically
    useEffect(() => {
        if (!currentUser) return;
        
        // Check tour completion
        if (!completedTasks.tour && localStorage.getItem('tourCompleted')) {
            markTaskAsDone('tour');
        }
        
        // Check goal completion
        if (!completedTasks.goal && getGoalsForStudent(currentUser.id).length > 0) {
            markTaskAsDone('goal');
        }

        // Check message completion
        const checkMessage = async () => {
            if (!completedTasks.message && coach) {
                 const convId = await findOrCreateConversation(coach.id);
                 if (convId) {
                     const messages = getMessagesForConversation(convId);
                     if (messages.some(m => m.senderId === currentUser.id)) {
                         markTaskAsDone('message');
                     }
                 }
            }
        };
        checkMessage();

    }, [currentUser, completedTasks, markTaskAsDone, getGoalsForStudent, coach, findOrCreateConversation, getMessagesForConversation]);
    
    // Separate effect for calendar since it's just a visit
    useEffect(() => {
        if(activePage === 'calendar' && !completedTasks.calendar) {
            markTaskAsDone('calendar');
        }
    }, [activePage, completedTasks.calendar, markTaskAsDone]);


    const completedCount = Object.values(completedTasks).filter(Boolean).length;
    const totalCount = tasks.length;
    const progress = (completedCount / totalCount) * 100;
    
    const handleDismiss = useCallback(() => {
        if (currentUser) {
            localStorage.setItem(WIZARD_DISMISSED_KEY + currentUser.id, 'true');
            onCompleteOrDismiss();
        }
    }, [currentUser, onCompleteOrDismiss]);

    useEffect(() => {
         if (progress === 100) {
            const timer = setTimeout(() => {
                 handleDismiss();
            }, 2000); // Auto dismiss after 2 seconds
            return () => clearTimeout(timer);
        }
    }, [progress, handleDismiss]);

    return (
        <Card className="mb-6 animate-fade-in border-2 border-primary-500/50">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <RocketIcon className="w-6 h-6 text-primary-500" />
                        Platforma Hoş Geldin!
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Başlamak için aşağıdaki görevleri tamamla ve XP kazan!</p>
                </div>
                <button onClick={handleDismiss} className="text-sm text-slate-400 hover:text-slate-600">Daha Sonra</button>
            </div>

            <div className="my-4">
                <div className="flex justify-between text-sm font-semibold mb-1">
                    <span>İlerleme</span>
                    <span>{completedCount}/{totalCount}</span>
                </div>
                 <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="space-y-3">
                {tasks.map(task => (
                    <div key={task.id} className={`p-3 rounded-lg flex items-center justify-between transition-colors ${completedTasks[task.id] ? 'bg-green-50 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                        <div className="flex items-center">
                             {completedTasks[task.id] ? (
                                <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                            ) : (
                                <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-500 rounded-full flex-shrink-0"></div>
                            )}
                            <div className="ml-3">
                                <p className={`font-semibold ${completedTasks[task.id] ? 'line-through text-slate-500' : ''}`}>{task.title}</p>
                            </div>
                        </div>
                        {!completedTasks[task.id] && (
                            <button onClick={task.action} className="px-3 py-1 text-sm bg-primary-500 text-white rounded-full hover:bg-primary-600 flex-shrink-0">
                                Başla
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};
export default OnboardingWizard;