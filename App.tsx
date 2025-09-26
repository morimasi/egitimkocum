

import React, { Suspense, useState, useEffect } from 'react';
import { DataProvider } from './contexts/DataContext';
import { UIProvider, useUI } from './contexts/UIContext';
import Sidebar from './components/Sidebar';
import Tour from './components/Tour';
import ToastContainer from './components/ToastContainer';
import Header from './components/Header';
import { useDataContext } from './contexts/DataContext';
import { SkeletonCard, SkeletonText } from './components/SkeletonLoader';
import { UserRole } from './types';
import VideoCallModal from './components/VideoCallModal';
import WeeklyReportModal from './components/WeeklyReportModal';
import ErrorBoundary from './components/ErrorBoundary';
import PageSkeleton from './components/PageSkeleton';
import CommandPalette from './components/CommandPalette';
import TabBar from './components/TabBar';

// Lazy load pages for better initial performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Assignments = React.lazy(() => import('./pages/Assignments'));
const Students = React.lazy(() => import('./pages/Students'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Library = React.lazy(() => import('./pages/Library'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const ParentPortal = React.lazy(() => import('./pages/ParentPortal'));
const TemplateManager = React.lazy(() => import('./pages/TemplateManager'));
const SuperAdminDashboard = React.lazy(() => import('./pages/SuperAdminDashboard'));
const LoginScreen = React.lazy(() => import('./pages/LoginScreen'));
const RegisterScreen = React.lazy(() => import('./pages/RegisterScreen'));
const Motivasyon = React.lazy(() => import('./pages/Motivasyon'));
const OdakModu = React.lazy(() => import('./pages/OdakModu'));


const AppSkeleton = () => (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <div className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4 space-y-4">
            <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                 <SkeletonText className="w-2/3" />
            </div>
            <div className="space-y-2 pt-4">
                {[...Array(6)].map((_, i) => <SkeletonText key={i} className="w-full h-10" />)}
            </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-16 flex items-center justify-between p-4">
                <SkeletonText className="w-1/4 h-8" />
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <main className="flex-1 p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SkeletonCard className="h-24"/>
                    <SkeletonCard className="h-24"/>
                    <SkeletonCard className="h-24"/>
                </div>
                 <div className="mt-6">
                    <SkeletonCard className="h-80"/>
                </div>
            </main>
        </div>
    </div>
);


const AppContent = () => {
    const { activePage, setActivePage } = useUI();
    const { currentUser, isLoading } = useDataContext();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [showRegister, setShowRegister] = React.useState(false);
    const [showWeeklyReport, setShowWeeklyReport] = React.useState(false);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

    useEffect(() => {
        if (currentUser && currentUser.role === UserRole.Student) {
            const lastReportDate = localStorage.getItem(`weeklyReport_${currentUser.id}`);
            const now = new Date();
            const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            
            if (!lastReportDate || new Date(lastReportDate) < oneWeekAgo) {
                 setShowWeeklyReport(true);
            }
        }
    }, [currentUser]);

     useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setCommandPaletteOpen(k => !k);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    const handleCloseReport = () => {
        setShowWeeklyReport(false);
        if(currentUser) {
            localStorage.setItem(`weeklyReport_${currentUser.id}`, new Date().toISOString());
        }
    };

    const renderPage = () => {
        // SuperAdmin can access coach pages.
        if (currentUser?.role === UserRole.SuperAdmin && activePage !== 'superadmin') {
             switch (activePage) {
                case 'dashboard': return <Dashboard />;
                case 'assignments': return <Assignments />;
                case 'students': return <Students />;
                case 'messages': return <Messages />;
                case 'analytics': return <Analytics />;
                case 'library': return <Library />;
                case 'calendar': return <Calendar />;
                case 'templates': return <TemplateManager />;
                case 'settings': return <Settings />;
                default: // Fallback to their own dashboard
                    setActivePage('superadmin');
                    return <SuperAdminDashboard />;
            }
        }
        
        switch (activePage) {
            case 'dashboard':
                if (currentUser?.role === UserRole.Parent) return <ParentPortal />;
                return <Dashboard />;
            case 'assignments':
                return <Assignments />;
            case 'students':
                return <Students />;
            case 'messages':
                return <Messages />;
            case 'analytics':
                return <Analytics />;
            case 'library':
                return <Library />;
            case 'calendar':
                return <Calendar />;
            case 'templates':
                if (currentUser?.role === UserRole.Coach) return <TemplateManager />;
                return <Dashboard />; // Fallback for others
             case 'parent':
                 if (currentUser?.role === UserRole.Parent) return <ParentPortal />;
                 return <Dashboard />; // Fallback for others
            case 'motivation':
                if (currentUser?.role === UserRole.Student) return <Motivasyon />;
                return <Dashboard />; // Fallback for others
            case 'odak':
                if (currentUser?.role === UserRole.Student) return <OdakModu />;
                return <Dashboard />; // Fallback for others
            case 'settings':
                return <Settings />;
            case 'superadmin':
                if (currentUser?.role === UserRole.SuperAdmin) {
                    return <SuperAdminDashboard />;
                }
                // Fallback for non-superadmins trying to access the page
                return <Dashboard />; 
            default:
                return <Dashboard />;
        }
    };

    if (isLoading) {
       return <AppSkeleton />;
    }

    if (!currentUser) {
        return (
            <Suspense fallback={<AppSkeleton />}>
                {showRegister 
                    ? <RegisterScreen onSwitchToLogin={() => setShowRegister(false)} /> 
                    : <LoginScreen onSwitchToRegister={() => setShowRegister(true)} />
                }
            </Suspense>
        );
    }
    
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header setSidebarOpen={setSidebarOpen} onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-3 sm:p-6 animate-fade-in pb-20 lg:pb-8">
                    <div className="max-w-7xl mx-auto">
                        <Suspense fallback={<PageSkeleton />}>
                            {renderPage()}
                        </Suspense>
                    </div>
                </main>
            </div>
            <TabBar />
            <ToastContainer />
            <Tour />
            <VideoCallModal />
            {showWeeklyReport && <WeeklyReportModal onClose={handleCloseReport} />}
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
        </div>
    );
};

const App = () => {
    return (
        <DataProvider>
            <UIProvider>
                <ErrorBoundary>
                    <AppContent />
                </ErrorBoundary>
            </UIProvider>
        </DataProvider>
    );
};

export default App;