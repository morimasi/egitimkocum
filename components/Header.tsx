import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';
import { MenuIcon, BellIcon, CheckCircleIcon } from './Icons';

const NotificationPopover = ({ unreadCount, onOpen }: { unreadCount: number, onOpen: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { currentUser, notifications } = useDataContext();
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
                            <li key={n.id} className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${!n.isRead ? 'font-semibold' : ''}`}>
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

const Header = ({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void; }) => {
    const { activePage } = useUI();
    const { currentUser, notifications, markNotificationsAsRead } = useDataContext();

    const getPageTitle = () => {
        switch (activePage) {
            case 'dashboard': return 'Anasayfa';
            case 'assignments': return 'Ödevler';
            case 'students': return 'Öğrenciler';
            case 'messages': return 'Mesajlar';
            case 'analytics': return 'Analitik';
            case 'settings': return 'Ayarlar';
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
                <div className="flex items-center space-x-4">
                    <NotificationPopover unreadCount={unreadNotificationsCount} onOpen={markNotificationsAsRead} />
                    <div className="hidden sm:flex items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">{currentUser?.name}</span>
                        <img className="h-9 w-9 rounded-full" src={currentUser?.profilePicture} alt="User avatar" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
