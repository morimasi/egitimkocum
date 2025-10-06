
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
import GlobalSearchModal from './components/GlobalSearchModal';
import TabBar from './components/TabBar';
import AIChatbot from './components/AIChatbot';
import SetupWizard from './components/SetupWizard';


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
const Motivasyon = React.lazy(() => import('./pages/Motivasyon'));
const OdakModu = React.lazy(() => import('./pages/OdakModu'));
const AkilliPlanlayici = React.lazy(() => import('./pages/AkilliPlanlayici'));
const SinavPerformansi = React.lazy(() => import('./pages/SinavPerformansi'));
const Goals = React.lazy(() => import('./pages/Goals'));
const Exams = React.lazy(() => import('./pages/Exams'));
const SoruBankasi = React.lazy(() => import('./pages/SoruBankasi'));


const AppSkeleton = () => (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
        <div className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 p-4 space-y-4">
            <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                 <SkeletonText className="w-2/3" />
            </div>
            <div className="space-y-2 pt-4">
                {[...Array(6)].map((_, i) => <SkeletonText key={i} className="w-full h-10" />)}
            </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b dark:border-slate-700 h-16 flex items-center justify-between p-4">
                <SkeletonText className="w-1/4 h-8" />
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
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
    const { activePage, setActivePage, startTour } = useUI();
    const { currentUser, isLoading, isDbInitialized } = useDataContext();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [showWeeklyReport, setShowWeeklyReport] = React.useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    useEffect(() => {
        if (currentUser && currentUser.role === UserRole.Student) {
            const lastReportDate = localStorage.getItem(`weeklyReport_${currentUser.id}`);
            const now = new Date();
            const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

            if (!lastReportDate || new Date(lastReportDate) < oneWeekAgo) {
                setShowWeeklyReport(true);
                localStorage.setItem(`weeklyReport_${currentUser.id}`, now.toISOString());
            }
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            const hasCompletedTour = localStorage.getItem('tourCompleted');
            if (!hasCompletedTour) {
                // Delay tour start slightly to allow app to render fully
                setTimeout(() => startTour(), 1000);
            }
        }
    }, [currentUser, startTour]);

    useEffect(() => {
        const getPageTitle = () => {
            switch (activePage) {
                case 'dashboard': return 'Anasayfa';
                case 'assignments': return 'Ödevler';
                case 'students': return 'Öğrenciler';
                case 'messages': return 'Mesajlar';
                case 'analytics': return 'Analitik';
                case 'settings': return 'Ayarlar';
                case 'library': return 'Kütüphane';
                case 'calendar': return 'Takvim';
                case 'parent': return 'Veli Portalı';
                case 'templates': return 'Şablonlar';
                case 'superadmin': return 'Süper Admin';
                case 'motivation': return 'Motivasyon';
                case 'odak': return 'Odak Modu';
                case 'akilli-planlayici': return 'AI Planlayıcı';
                case 'sinav-performansi': return 'Sınav Performansı';
                case 'goals': return 'Hedefler';
                case 'exams': return 'Sınavlar';
                case 'soru-bankasi': return 'Soru Bankası';
                default: return 'Anasayfa';
            }
        };
        document.title = `Mahmut Hoca - ${getPageTitle()}`;
    }, [activePage]);

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard />;
            case 'assignments': return <Assignments />;
            case 'students': return <Students />;
            case 'messages': return <Messages />;
            case 'analytics': return <Analytics />;
            case 'settings': return <Settings />;
            case 'library': return <Library />;
            case 'calendar': return <Calendar />;
            case 'parent': return <ParentPortal />;
            case 'templates': return <TemplateManager />;
            case 'superadmin': return <SuperAdminDashboard />;
            case 'motivation': return <Motivasyon />;
            case 'odak': return <OdakModu />;
            case 'akilli-planlayici': return <AkilliPlanlayici />;
            case 'sinav-performansi': return <SinavPerformansi />;
            case 'goals': return <Goals />;
            case 'exams': return <Exams />;
            case 'soru-bankasi': return <SoruBankasi />;
            default: return <Dashboard />;
        }
    };

    if (isLoading) {
        return <AppSkeleton />;
    }

    if (!isDbInitialized) {
        return <SetupWizard />;
    }

    if (!currentUser) {
        return (
            <Suspense fallback={<AppSkeleton />}>
                <LoginScreen />
            </Suspense>
        );
    }

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header setSidebarOpen={setSidebarOpen} onOpenSearch={() => setIsSearchOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
                     <div className="max-w-7xl mx-auto pb-16 lg:pb-0">
                        <Suspense fallback={<PageSkeleton />}>
                           {renderPage()}
                        </Suspense>
                    </div>
                </main>
            </div>
            <TabBar />
            <VideoCallModal />
            <AIChatbot />
            {showWeeklyReport && <WeeklyReportModal onClose={() => setShowWeeklyReport(false)}/>}
            <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
};


const AppWrapper = () => (
    <ErrorBoundary>
        <UIProvider>
            <DataProvider>
                <AppContent />
                <ToastContainer />
                <Tour />
            </DataProvider>
        </UIProvider>
    </ErrorBoundary>
);

const App = () => {
  return <AppWrapper />;
};

export default App;
