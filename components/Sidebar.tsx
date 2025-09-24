
import React, { Fragment } from 'react';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';
import { Page, UserRole } from '../types';
import {
    DashboardIcon, AssignmentsIcon, StudentsIcon, MessagesIcon,
    AnalyticsIcon, SettingsIcon, SunIcon, MoonIcon, LogoutIcon, XIcon, LibraryIcon, AdminIcon,
} from './Icons';

interface NavItemProps {
    page: Page;
    label: string;
    icon: React.ReactNode;
}

const NavItem = ({ page, label, icon }: NavItemProps) => {
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
            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            {icon}
            <span className="ml-3">{label}</span>
        </a>
    );
};


interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
    const { theme, toggleTheme } = useUI();
    const { currentUser, students, logout } = useDataContext();

    // FIX: Refactored navItems creation to an imperative approach to fix TypeScript type inference issues.
    // The previous complex expression with spreads and ternaries caused the 'page' property to be
    // widened to 'string', which is not assignable to the 'Page' type. This is more readable and type-safe.
    const navItems: NavItemProps[] = [];
    if (currentUser?.role === UserRole.SuperAdmin) {
        navItems.push({ page: 'superadmin', label: 'Süper Admin Paneli', icon: <AdminIcon className="w-5 h-5" /> });
    } else {
        navItems.push(
            { page: 'dashboard', label: 'Anasayfa', icon: <DashboardIcon className="w-5 h-5" /> },
            { page: 'assignments', label: 'Ödevler', icon: <AssignmentsIcon className="w-5 h-5" /> }
        );
    }
    if (currentUser?.role === UserRole.Coach) {
        navItems.push(
          { page: 'students', label: 'Öğrenciler', icon: <StudentsIcon className="w-5 h-5" /> },
          { page: 'library', label: 'Kütüphane', icon: <LibraryIcon className="w-5 h-5" /> }
        );
    }
    if (currentUser?.role !== UserRole.SuperAdmin) {
        navItems.push(
            { page: 'messages', label: 'Mesajlar', icon: <MessagesIcon className="w-5 h-5" /> },
            { page: 'analytics', label: 'Analitik', icon: <AnalyticsIcon className="w-5 h-5" /> }
        );
    }
    navItems.push({ page: 'settings', label: 'Ayarlar', icon: <SettingsIcon className="w-5 h-5" /> });
    
    // Switch between student and coach view for demo
    const { login, users } = useDataContext();
    const handleUserChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedUser = users.find(u => u.id === e.target.value);
        if (selectedUser) {
            await login(selectedUser.email);
        }
    };


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
                    {navItems.map(item => <NavItem key={item.page} {...item} />)}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className='mb-4' id="tour-step-2">
                    <label htmlFor="user-switch" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kullanıcı Değiştir (Demo)</label>
                    <select id="user-switch" value={currentUser?.id} onChange={handleUserChange} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2">
                         {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                    </select>
                </div>

                <div className="flex items-center justify-between mb-4">
                     <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
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
                     <button onClick={() => logout()} className="ml-auto p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Çıkış Yap">
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