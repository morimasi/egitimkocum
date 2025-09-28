import React, { useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';
import { Page, UserRole } from '../types';
import {
    DashboardIcon, AssignmentsIcon, StudentsIcon, MessagesIcon,
    AnalyticsIcon, SettingsIcon, SunIcon, MoonIcon, LogoutIcon, XIcon, LibraryIcon, AdminIcon, CalendarIcon, ParentIcon, ClipboardListIcon, FlameIcon, TargetIcon, BrainCircuitIcon, ClipboardCheckIcon,
} from './Icons';

interface NavItemProps {
    page: Page;
    label: string;
    icon: React.ReactNode;
    badge?: number;
}

const NavItem = React.memo(({ page, label, icon, badge }: NavItemProps) => {
    const { activePage, setActivePage } = useUI();
    const isActive = activePage === page;

    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                setActivePage(page);
            }}
            id={`nav-${page}`}
            className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600'
            }`}
        >
            <div className="flex items-center">
                {icon}
                <span className="ml-3">{label}</span>
            </div>
            {badge && badge > 0 && (
                <span className={`ml-2 text-xs font-bold rounded-full px-2 py-0.5 ${isActive ? 'bg-white text-primary-600' : 'bg-primary-100 text-primary-600 dark:bg-primary-700 dark:text-primary-100'}`}>
                    {badge}
                </span>
            )}
        </a>
    );
});


interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
    const { theme, toggleTheme } = useUI();
    const { currentUser, students, logout, unreadCounts } = useDataContext();

    const totalUnreadMessages = useMemo(() => 
        Array.from(unreadCounts.values()).reduce((sum: number, count: number) => sum + count, 0),
        [unreadCounts]
    );

    const navItems: NavItemProps[] = useMemo(() => {
        if (!currentUser) return [];

        const studentItems: NavItemProps[] = [
            { page: 'dashboard', label: 'Anasayfa', icon: <DashboardIcon className="w-5 h-5" /> },
            { page: 'assignments', label: 'Ödevler', icon: <AssignmentsIcon className="w-5 h-5" /> },
            { page: 'messages', label: 'Mesajlar', icon: <MessagesIcon className="w-5 h-5" />, badge: totalUnreadMessages },
            { page: 'sinav-performansi', label: 'Sınav Performansı', icon: <ClipboardCheckIcon className="w-5 h-5" /> },
            { page: 'akilli-planlayici', label: 'Akıllı Planlayıcı', icon: <BrainCircuitIcon className="w-5 h-5" /> },
            { page: 'odak', label: 'Odak Modu', icon: <TargetIcon className="w-5 h-5" /> },
            { page: 'motivation', label: 'Motivasyon', icon: <FlameIcon className="w-5 h-5" /> },
            { page: 'calendar', label: 'Takvim', icon: <CalendarIcon className="w-5 h-5" /> },
            { page: 'settings', label: 'Ayarlar', icon: <SettingsIcon className="w-5 h-5" /> },
        ];

        const coachItems: NavItemProps[] = [
            { page: 'dashboard', label: 'Anasayfa', icon: <DashboardIcon className="w-5 h-5" /> },
            { page: 'assignments', label: 'Ödevler', icon: <AssignmentsIcon className="w-5 h-5" /> },
            { page: 'students', label: 'Öğrenciler', icon: <StudentsIcon className="w-5 h-5" /> },
            { page: 'library', label: 'Kütüphane', icon: <LibraryIcon className="w-5 h-5" /> },
            { page: 'templates', label: 'Şablonlar', icon: <ClipboardListIcon className="w-5 h-5" /> },
            { page: 'messages', label: 'Mesajlar', icon: <MessagesIcon className="w-5 h-5" />, badge: totalUnreadMessages },
            { page: 'analytics', label: 'Analitik', icon: <AnalyticsIcon className="w-5 h-5" /> },
            { page: 'calendar', label: 'Takvim', icon: <CalendarIcon className="w-5 h-5" /> },
            { page: 'settings', label: 'Ayarlar', icon: <SettingsIcon className="w-5 h-5" /> },
        ];
    
        switch (currentUser.role) {
            case UserRole.Student:
                return studentItems;
            case UserRole.Coach:
                return coachItems;
            case UserRole.SuperAdmin:
                return [
                    ...coachItems.slice(0, -1), // All coach items except settings
                    { page: 'superadmin', label: 'Süper Admin Paneli', icon: <AdminIcon className="w-5 h-5" /> },
                    coachItems.slice(-1)[0], // Settings
                ];
            case UserRole.Parent:
                return [
                    { page: 'parent', label: 'Veli Portalı', icon: <ParentIcon className="w-5 h-5" /> },
                    { page: 'settings', label: 'Ayarlar', icon: <SettingsIcon className="w-5 h-5" /> },
                ];
            default:
                return [];
        }
    }, [currentUser, totalUnreadMessages]);
    

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700" id="tour-step-0">
                <div className="flex items-center">
                    <div className="bg-primary-500 rounded-full p-2">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v11.494m-9-5.747h18"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18a6 6 0 110-12 6 6 0 010 12z"></path></svg>
                    </div>
                    <span className="ml-3 text-xl font-bold text-gray-800 dark:text-white">Eğitim Koçu</span>
                </div>
                 <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>

            <div className="flex-1 p-4 space-y-2 overflow-y-auto" id="tour-step-1">
                <nav>
                    {navItems.map(item => <NavItem key={item.page} page={item.page} label={item.label} icon={item.icon} badge={item.badge} />)}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                     <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600"
                        >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5 mr-3" /> : <SunIcon className="w-5 h-5 mr-3" />}
                        {theme === 'light' ? 'Koyu Mod' : 'Açık Mod'}
                    </button>
                </div>

                <div className="flex items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                    <img className="w-10 h-10 rounded-full" src={currentUser?.profilePicture} alt="User" />
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{currentUser?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
                    </div>
                     <button onClick={() => logout()} className="ml-auto p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 active:bg-red-200 dark:active:bg-red-900" aria-label="Çıkış Yap">
                        <LogoutIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
    
    return (
        <>
            <div className="hidden lg:flex lg:flex-shrink-0">
                <div className="flex flex-col w-64">
                    {sidebarContent}
                </div>
            </div>

            {/* Mobile sidebar */}
            <div className={`fixed inset-0 z-40 flex lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)}></div>
                 <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {sidebarContent}
                </div>
            </div>
        </>
    );
};

export default Sidebar;