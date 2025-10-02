import React, { useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';
import { Page, UserRole, User } from '../types';
import {
    DashboardIcon, AssignmentsIcon, StudentsIcon, MessagesIcon, SettingsIcon, CalendarIcon, ParentIcon, FlameIcon, TargetIcon
} from './Icons';

interface TabItemProps {
    page: Page;
    label: string;
    icon: React.ReactNode;
    badge?: number;
}

const TabItem = React.memo(({ page, label, icon, badge }: TabItemProps) => {
    const { activePage, setActivePage } = useUI();
    const isActive = activePage === page;

    return (
        <a
            href="#"
            onClick={(e) => {
                e.preventDefault();
                setActivePage(page);
            }}
            className={`flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium transition-colors duration-200 rounded-md active:bg-slate-100 dark:active:bg-slate-700 ${
                isActive ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400 hover:text-primary-500'
            }`}
        >
            <div className="relative">
                {icon}
                {badge && badge > 0 && (
                    <span className="absolute -top-1 -right-2 text-white bg-red-500 text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            <span className="mt-1">{label}</span>
        </a>
    );
});

const TabBar = () => {
    const { currentUser, unreadCounts } = useDataContext();

    const totalUnreadMessages = useMemo(() =>
        Array.from(unreadCounts.values()).reduce((sum: number, count: number) => sum + count, 0),
    [unreadCounts]);

    const tabItems: TabItemProps[] = [];

    if (!currentUser) return null;
    
    if (currentUser.role === UserRole.Parent) {
        tabItems.push(
            { page: 'parent', label: 'Portal', icon: <ParentIcon className="w-6 h-6" /> },
            { page: 'settings', label: 'Ayarlar', icon: <SettingsIcon className="w-6 h-6" /> }
        );
    } else if (currentUser.role === UserRole.Student) {
        tabItems.push(
            { page: 'dashboard', label: 'Anasayfa', icon: <DashboardIcon className="w-6 h-6" /> },
            { page: 'assignments', label: 'Ödevler', icon: <AssignmentsIcon className="w-6 h-6" /> },
            { page: 'odak', label: 'Odak', icon: <TargetIcon className="w-6 h-6" /> },
            { page: 'messages', label: 'Mesajlar', icon: <MessagesIcon className="w-6 h-6" />, badge: totalUnreadMessages },
            { page: 'motivation', label: 'Motive', icon: <FlameIcon className="w-6 h-6" /> }
        );
    } else { // Coach and SuperAdmin
        tabItems.push(
            { page: 'dashboard', label: 'Anasayfa', icon: <DashboardIcon className="w-6 h-6" /> },
            { page: 'students', label: 'Öğrenciler', icon: <StudentsIcon className="w-6 h-6" /> },
            { page: 'assignments', label: 'Ödevler', icon: <AssignmentsIcon className="w-6 h-6" /> },
            { page: 'messages', label: 'Mesajlar', icon: <MessagesIcon className="w-6 h-6" />, badge: totalUnreadMessages },
            { page: 'calendar', label: 'Takvim', icon: <CalendarIcon className="w-6 h-6" /> }
        );
    }

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-2px_5px_rgba(0,0,0,0.05)] z-30">
            <div className="flex justify-around items-center h-full px-2">
                {tabItems.slice(0, 5).map(item => (
                    <TabItem key={item.page} {...item} />
                ))}
            </div>
        </div>
    );
};

export default TabBar;