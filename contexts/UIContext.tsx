import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Page, ToastMessage, ToastType, User, AssignmentStatus, Conversation } from '../types';

type Theme = 'light' | 'dark';
type CallState = 'idle' | 'calling' | 'in-call' | 'ended';

interface InitialFilters {
    studentId?: string;
    conversationId?: string;
    status?: AssignmentStatus;
    openNewAssignmentModal?: boolean;
    assignmentId?: string;
    preselectedStudentIds?: string[];
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
    callConversation: Conversation | null;
    startCall: (contactOrConversation: User | Conversation) => void;
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
    const [callConversation, setCallConversation] = useState<Conversation | null>(null);


    const setActivePage = useCallback((page: Page, filters: InitialFilters = {}) => {
        _setActivePage(page);
        setInitialFilters(filters);
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const startTour = useCallback(() => {
        setActivePage('dashboard');
        setTourStep(0);
        setIsTourActive(true);
    }, [setActivePage]);

    const nextTourStep = useCallback(() => {
        setTourStep(prev => prev + 1);
    }, []);

    const endTour = useCallback(() => {
        setIsTourActive(false);
        setTourStep(0);
        localStorage.setItem('tourCompleted', 'true');
    }, []);
    
    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Call management
    const startCall = useCallback((contactOrConversation: User | Conversation) => {
         if ('participantIds' in contactOrConversation) { // Duck typing to check if it's a Conversation
            setCallConversation(contactOrConversation);
            setCallContact(null);
        } else { // It's a User
            setCallContact(contactOrConversation);
            setCallConversation(null);
        }
        setCallState('calling');
    }, []);

    const answerCall = useCallback(() => {
        setCallState(prev => (prev === 'calling' ? 'in-call' : prev));
    }, []);
    
    const endCall = useCallback(() => {
        setCallState('idle');
        setCallContact(null);
        setCallConversation(null);
    }, []);

    const value = useMemo(() => ({
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
        callConversation,
        startCall,
        answerCall,
        endCall,
    }), [
        theme, toggleTheme, activePage, setActivePage, toasts, addToast, removeToast, initialFilters, setInitialFilters,
        isTourActive, tourStep, startTour, nextTourStep, endTour,
        callState, callContact, callConversation, startCall, answerCall, endCall
    ]);

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};