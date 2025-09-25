

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Page, ToastMessage, ToastType, User } from '../types';

type Theme = 'light' | 'dark';
type CallState = 'idle' | 'calling' | 'in-call' | 'ended';

interface InitialFilters {
    studentId?: string;
    contactId?: string;
}

interface UIContextType {
    theme: Theme;
    toggleTheme: () => void;
    activePage: Page;
    setActivePage: (page: Page, filters?: InitialFilters) => void;
    toasts: ToastMessage[];
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: number) => void;
    initialFilters: InitialFilters;
    setInitialFilters: (filters: InitialFilters) => void;
    isTourActive: boolean;
    tourStep: number;
    startTour: () => void;
    nextTourStep: () => void;
    endTour: () => void;
    callState: CallState;
    callContact: User | null;
    startCall: (contact: User) => void;
    answerCall: () => void;
    endCall: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children?: ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as Theme | null;
            return savedTheme || 'light';
        }
        return 'light';
    });
    const [activePage, _setActivePage] = useState<Page>('dashboard');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [initialFilters, setInitialFilters] = useState<InitialFilters>({});
    
    // Tour state
    const [isTourActive, setIsTourActive] = useState(false);
    const [tourStep, setTourStep] = useState(0);

    // Call state
    const [callState, setCallState] = useState<CallState>('idle');
    const [callContact, setCallContact] = useState<User | null>(null);

    const setActivePage = (page: Page, filters: InitialFilters = {}) => {
        _setActivePage(page);
        setInitialFilters(filters);
    };

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const hasCompletedTour = localStorage.getItem('tourCompleted');
        if (!hasCompletedTour) {
            // Delay tour start slightly to allow app to render
            setTimeout(() => startTour(), 1000);
        }
    }, []);
    
    const startTour = () => {
        setActivePage('dashboard');
        setTourStep(0);
        setIsTourActive(true);
    };

    const nextTourStep = () => {
        setTourStep(prev => prev + 1);
    };

    const endTour = () => {
        setIsTourActive(false);
        setTourStep(0);
        localStorage.setItem('tourCompleted', 'true');
    };
    
    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const addToast = (message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Call management
    const startCall = (contact: User) => {
        setCallContact(contact);
        setCallState('calling');
    };

    const answerCall = () => {
        if(callState === 'calling') {
            setCallState('in-call');
        }
    };
    
    const endCall = () => {
        setCallState('idle');
        setCallContact(null);
    };

    const value = {
        theme,
        toggleTheme,
        activePage,
        setActivePage,
        toasts,
        addToast,
        removeToast,
        initialFilters,
        setInitialFilters,
        isTourActive,
        tourStep,
        startTour,
        nextTourStep,
        endTour,
        callState,
        callContact,
        startCall,
        answerCall,
        endCall,
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
