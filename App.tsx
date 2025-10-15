

import React, { Suspense, useState, useEffect } from 'react';
import { DataProvider } from './contexts/DataContext';
import { UIProvider, useUI } from './contexts/UIContext';
import Sidebar from './components/Sidebar';
import Tour from './components/Tour';
import ToastContainer from './components/ToastContainer';
import Header from './components/Header';
import { useDataContext } from './contexts/DataContext';
import { SkeletonCard, SkeletonText } from './components/SkeletonLoader';
import VideoCallModal from './components/VideoCallModal';
import WeeklyReportModal from './components/WeeklyReportModal';
import ErrorBoundary from './components/ErrorBoundary';
import PageSkeleton from './components/PageSkeleton';
import GlobalSearchModal from './components/GlobalSearchModal';
import TabBar from './components/TabBar';
import AIChatbot from './components/AIChatbot';


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
const AkilliPlanlayici = React.lazy(() => import('./pages/AkilliPlanlayici'));
const SinavPerformansi = React.lazy(() => import('./pages/SinavPerformansi'));
const Goals = React.lazy(() => import('./pages/Goals'));
const Exams = React.lazy(() => import('./pages/Exams'));
const SoruBankasi = React.lazy(() => import('./pages/SoruBankasi'));


const AppSkeleton = () => (
    <div className="flex h-screen bg-background">
        <div className="hidden lg:flex flex-col w-64 bg-card border-r border-border p-4 space-y-4">
            <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 bg-muted rounded-full"></div>
                 <SkeletonText className="w-2/3" />
            </div>
            <div className="space-y-2 pt-4">
                {[...Array(6)].map((_, i) => <SkeletonText key={i} className="w-full h-10" />)}
            </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-shrink-0 bg-card border-b border-border h-16 flex items-center justify-between p-4">
                <SkeletonText className="w-1/4 h-8" />
                <div className="w-10 h-10 bg-muted rounded-full"></div>
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
    const { activePage, startTour } = useUI();
    const { currentUser, isLoading } = useDataContext();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [showWeeklyReport, setShowWeeklyReport] = React.useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showLogin, setShowLogin] = useState(true);
    
    useEffect(() => {
        if (currentUser) { // Check if currentUser exists
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
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
                <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-primary animate-float-subtle">
                    <g>
                        <path d="M 20 50 C 20 25, 60 25, 60 50 C 60 75, 20 75, 20 50 Z" fill="#f2d5b1" stroke="currentColor" strokeWidth="2"/>
                        <rect x="22" y="38" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
                        <rect x="42" y="38" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
                        <line x1="40" y1="44" x2="42" y2="44" stroke="currentColor" strokeWidth="2.5"/>
                        <circle cx="31" cy="44" r="1.5" fill="currentColor"/>
                        <g transform="translate(51 44)"><g className="animate-wink"><circle cx="0" cy="0" r="1.5" fill="currentColor"/></g></g>
                        <path d="M 35 60 Q 40 62, 45 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M 20 70 L 35 80 L 45 80 L 60 70 L 60 55 L 20 55 Z" className="fill-slate-700 dark:fill-slate-300"/>
                        <path d="M 40 70 L 45 80 L 35 80 Z" fill="#ffffff" stroke="currentColor" strokeWidth="1"/>
                    </g>
                </svg>
                <h1 className="text-2xl font-bold mt-4">Uygulama hazırlanıyor...</h1>
                <p className="text-muted-foreground mt-2">Bu işlem ilk kurulumda biraz zaman alabilir.</p>
            </div>
        );
    }
    
    if (!currentUser) {
        return (
            <Suspense fallback={<AppSkeleton />}>
                {showLogin ? (
                    <LoginScreen onSwitchToRegister={() => setShowLogin(false)} />
                ) : (
                    <RegisterScreen onSwitchToLogin={() => setShowLogin(true)} />
                )}
            </Suspense>
        );
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
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