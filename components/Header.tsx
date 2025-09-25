import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';
import { MenuIcon, BellIcon, CheckCircleIcon } from './Icons';
import { AppNotification } from '../types';

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);


const NotificationPopover = ({ unreadCount, onOpen }: { unreadCount: number, onOpen: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { currentUser, notifications } = useDataContext();
    const { setActivePage } = useUI();
    const popoverRef = useRef<HTMLDivElement>(null);

    const userNotifications = notifications
        .filter(n => n.userId === currentUser?.id)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const handleToggle = () => {
        if (!isOpen) {
            onOpen();
        }
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = (notification: AppNotification) => {
        if (notification.link) {
            setActivePage(notification.link.page, notification.link.filter);
        }
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={handleToggle}
                aria-label="Bildirimler"
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 origin-top-right animate-scale-in-tr">
                    <div className="p-3 border-b dark:border-gray-700">
                        <h4 className="font-semibold text-gray-800 dark:text-white">Bildirimler</h4>
                    </div>
                    <ul className="py-2 max-h-80 overflow-y-auto">
                        {userNotifications.length > 0 ? userNotifications.map(n => (
                            <li key={n.id} onClick={() => handleNotificationClick(n)} className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${!n.isRead ? 'font-semibold' : ''}`}>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString('tr-TR')}</p>
                            </li>
                        )) : (
                            <li className="px-4 py-8 text-center text-sm text-gray-500">
                                <CheckCircleIcon className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                Her şey güncel!
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

const Header = ({ setSidebarOpen, onOpenCommandPalette }: { setSidebarOpen: (open: boolean) => void; onOpenCommandPalette: () => void; }) => {
    const { activePage } = useUI();
    const { currentUser, notifications, markNotificationsAsRead } = useDataContext();

    const getPageTitle = () => {
        if (currentUser?.role === 'superadmin') return 'Süper Admin Paneli';
        switch (activePage) {
            case 'dashboard': return 'Anasayfa';
            case 'assignments': return 'Ödevler';
            case 'students': return 'Öğrenciler';
            case 'messages': return 'Mesajlar';
            case 'analytics': return 'Analitik';
            case 'settings': return 'Ayarlar';
            case 'library': return 'Kütüphane';
            default: return 'Anasayfa';
        }
    };

    const unreadNotificationsCount = notifications.filter(n => n.userId === currentUser?.id && !n.isRead).length;

    return (
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between p-4 h-16">
                <div className="flex items-center">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 dark:text-gray-400 mr-4" aria-label="Menüyü aç">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{getPageTitle()}</h1>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4">
                   <button onClick={onOpenCommandPalette} aria-label="Hızlı Erişim" className="flex items-center gap-2 p-2 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                       <SearchIcon className="h-5 w-5" />
                       <span className="hidden md:inline text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5">Ctrl+K</span>
                   </button>
                   {currentUser?.role !== 'superadmin' && <NotificationPopover unreadCount={unreadNotificationsCount} onOpen={markNotificationsAsRead} />}
                    <div className="hidden sm:flex items-center">
                        <img className="h-9 w-9 rounded-full" src={currentUser?.profilePicture} alt={`${currentUser?.name} avatarı`} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;