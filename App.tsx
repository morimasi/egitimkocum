
import React from 'react';
import { DataProvider } from './contexts/DataContext';
import { UIProvider, useUI } from './contexts/UIContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import Students from './pages/Students';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Library from './pages/Library';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import Tour from './components/Tour';
import ToastContainer from './components/ToastContainer';
import Header from './components/Header';
import { useDataContext } from './contexts/DataContext';
import { SkeletonCard, SkeletonText } from './components/SkeletonLoader';
import { UserRole } from './types';
import VideoCallModal from './components/VideoCallModal';

const AppSkeleton = () => (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Skeleton Sidebar */}
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
            {/* Skeleton Header */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-16 flex items-center justify-between p-4">
                <SkeletonText className="w-1/4 h-8" />
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
             {/* Skeleton Main Content */}
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
    const { activePage } = useUI();
    const { currentUser, isLoading } = useDataContext();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const [showRegister, setShowRegister] = React.useState(false);

    const renderPage = () => {
        if (currentUser?.role === UserRole.SuperAdmin) {
            return <SuperAdminDashboard />;
        }
        
        switch (activePage) {
            case 'dashboard':
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
            case 'settings':
                return <Settings />;
            case 'superadmin':
                return <SuperAdminDashboard />;
            default:
                return <Dashboard />;
        }
    };

    if (isLoading) {
       return <AppSkeleton />;
    }

    if (!currentUser) {
        if (showRegister) {
            return <RegisterScreen onSwitchToLogin={() => setShowRegister(false)} />;
        }
        return <LoginScreen onSwitchToRegister={() => setShowRegister(true)} />;
    }
    
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {renderPage()}
                    </div>
                </main>
            </div>
            <ToastContainer />
            <Tour />
            <VideoCallModal />
        </div>
    );
};

const App = () => {
    return (
        <DataProvider>
            <UIProvider>
                <AppContent />
            </UIProvider>
        </DataProvider>
    );
};

export default App;