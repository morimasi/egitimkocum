
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
import ToastContainer from './components/ToastContainer';
import Header from './components/Header';
import { useDataContext } from './contexts/DataContext';

const AppContent = () => {
    const { activePage } = useUI();
    const { currentUser } = useDataContext();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const renderPage = () => {
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
            case 'settings':
                return <Settings />;
            default:
                return <Dashboard />;
        }
    };

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="w-16 h-16 border-4 border-primary-500 border-dashed rounded-full animate-spin"></div>
            </div>
        );
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
        </div>
    );
};

const App = () => {
    return (
        <UIProvider>
            <DataProvider>
                <AppContent />
            </DataProvider>
        </UIProvider>
    );
};

export default App;
