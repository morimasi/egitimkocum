
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Page, ToastMessage, ToastType } from '../types';

type Theme = 'light' | 'dark';

interface UIContextType {
    theme: Theme;
    toggleTheme: () => void;
    activePage: Page;
    setActivePage: (page: Page) => void;
    toasts: ToastMessage[];
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: number) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as Theme | null;
            return savedTheme || 'light';
        }
        return 'light';
    });
    const [activePage, setActivePage] = useState<Page>('dashboard');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
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

    const value = {
        theme,
        toggleTheme,
        activePage,
        setActivePage,
        toasts,
        addToast,
        removeToast,
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
