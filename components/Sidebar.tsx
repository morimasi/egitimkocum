import React, { useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';
import { Page, UserRole } from '../types';
import {
    DashboardIcon, AssignmentsIcon, StudentsIcon, MessagesIcon,
    AnalyticsIcon, SettingsIcon, SunIcon, MoonIcon, LogoutIcon, XIcon, LibraryIcon, AdminIcon, CalendarIcon, ParentIcon, ClipboardListIcon, FlameIcon, TargetIcon, BrainCircuitIcon, ClipboardCheckIcon, TrophyIcon, HelpCircleIcon,
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
            className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                isActive
                    ? 'bg-gradient-to-r from-primary-600 to-fuchsia-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600'
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
    const { currentUser, logout, unreadCounts } = useDataContext();

    const totalUnreadMessages = useMemo(() => 
        Array.from(unreadCounts.values()).reduce((sum: number, count: number) => sum + count, 0),
        [unreadCounts]
    );

    const navItems: NavItemProps[] = useMemo(() => {
        if (!currentUser) return [];

        const studentItems: NavItemProps[] = [
            { page: 'dashboard', label: 'Anasayfa', icon: <DashboardIcon className="w-5 h-5" /> },
            { page: 'assignments', label: 'Ödevler', icon: <AssignmentsIcon className="w-5 h-5" /> },
            { page: 'exams', label: 'Sınavlar', icon: <ClipboardCheckIcon className="w-5 h-5" /> },
            { page: 'messages', label: 'Mesajlar', icon: <MessagesIcon className="w-5 h-5" />, badge: totalUnreadMessages },
            { page: 'goals', label: 'Hedefler', icon: <TargetIcon className="w-5 h-5" /> },
            { page: 'sinav-performansi', label: 'Sınav Performansı', icon: <ClipboardCheckIcon className="w-5 h-5" /> },
            { page: 'akilli-planlayici', label: 'AI Planlayıcı', icon: <BrainCircuitIcon className="w-5 h-5" /> },
            { page: 'soru-bankasi', label: 'Soru Bankası', icon: <HelpCircleIcon className="w-5 h-5" /> },
            { page: 'odak', label: 'Odak Modu', icon: <FlameIcon className="w-5 h-5" /> },
            { page: 'motivation', label: 'Motivasyon', icon: <TrophyIcon className="w-5 h-5" /> },
            { page: 'calendar', label: 'Takvim', icon: <CalendarIcon className="w-5 h-5" /> },
            { page: 'settings', label: 'Ayarlar', icon: <SettingsIcon className="w-5 h-5" /> },
        ];

        const coachItems: NavItemProps[] = [
            { page: 'dashboard', label: 'Anasayfa', icon: <DashboardIcon className="w-5 h-5" /> },
            { page: 'assignments', label: 'Ödevler', icon: <AssignmentsIcon className="w-5 h-5" /> },
            { page: 'students', label: 'Öğrenciler', icon: <StudentsIcon className="w-5 h-5" /> },
            { page: 'exams', label: 'Sınavlar', icon: <ClipboardCheckIcon className="w-5 h-5" /> },
            { page: 'goals', label: 'Hedefler', icon: <TargetIcon className="w-5 h-5" /> },
            { page: 'library', label: 'Kütüphane', icon: <LibraryIcon className="w-5 h-5" /> },
            { page: 'soru-bankasi', label: 'Soru Bankası', icon: <HelpCircleIcon className="w-5 h-5" /> },
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
                    { page: 'exams', label: 'Sınavlar', icon: <ClipboardCheckIcon className="w-5 h-5" /> },
                    { page: 'settings', label: 'Ayarlar', icon: <SettingsIcon className="w-5 h-5" /> },
                ];
            default:
                return [];
        }
    }, [currentUser, totalUnreadMessages]);
    

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700" id="tour-step-0">
                <div className="flex items-center">
                     <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-800 dark:text-white">
                        <g className="animate-float-subtle">
                            <path d="M 20 50 C 20 25, 60 25, 60 50 C 60 75, 20 75, 20 50 Z" fill="#f2d5b1" stroke="currentColor" strokeWidth="2"/>
                            <rect x="22" y="38" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
                            <rect x="42" y="38" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5"/>
                            <line x1="40" y1="44" x2="42" y2="44" stroke="currentColor" strokeWidth="2.5"/>
                            <circle cx="31" cy="44" r="1.5" fill="currentColor"/>
                            <g transform="translate(51 44)">
                                <g className="animate-wink">
                                    <circle cx="0" cy="0" r="1.5" fill="currentColor"/>
                                </g>
                            </g>
                            <path d="M 35 60 Q 40 62, 45 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M 20 70 L 35 80 L 45 80 L 60 70 L 60 55 L 20 55 Z" className="fill-slate-700 dark:fill-slate-300"/>
                            <path d="M 40 70 L 45 80 L 35 80 Z" fill="#ffffff" stroke="currentColor" strokeWidth="1"/>
                        </g>
                    </svg>
                    <span className="ml-2 text-xl font-bold text-slate-800 dark:text-white">Mahmut Hoca</span>
                </div>
                 <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>

            <div className="flex-1 p-4 space-y-2 overflow-y-auto" id="tour-step-1">
                <nav>
                    {navItems.map(item => <NavItem key={item.page} page={item.page} label={item.label} icon={item.icon} badge={item.badge} />)}
                </nav>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                     <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600"
                        >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5 mr-3" /> : <SunIcon className="w-5 h-5 mr-3" />}
                        {theme === 'light' ? 'Koyu Mod' : 'Açık Mod'}
                    </button>
                </div>

                <div className="flex items-center p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                    <img className="w-10 h-10 rounded-full" src={currentUser?.profilePicture} alt="User" loading="lazy" />
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{currentUser?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
                    </div>
                     <button onClick={() => logout()} className="ml-auto p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 active:bg-red-200 dark:active:bg-red-900" aria-label="Çıkış Yap">
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
                 <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-800 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {sidebarContent}
                </div>
            </div>
        </>
    );
};

export default Sidebar;