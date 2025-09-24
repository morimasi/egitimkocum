
import React from 'react';
import { useUI } from '../contexts/UIContext';
import { useDataContext } from '../contexts/DataContext';
import { MenuIcon, BellIcon } from './Icons';

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

const Header = ({ setSidebarOpen }: HeaderProps) => {
    const { activePage } = useUI();
    const { currentUser, messages } = useDataContext();

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

    const unreadMessagesCount = messages.filter(m => m.receiverId === currentUser?.id && !m.isRead).length;

    return (
        <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between p-4 h-16">
                <div className="flex items-center">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 dark:text-gray-400 mr-4">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{getPageTitle()}</h1>
                </div>
                <div className="flex items-center space-x-4">
                     <div className="relative">
                        <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <BellIcon className="h-6 w-6" />
                        </button>
                        {unreadMessagesCount > 0 && (
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                {unreadMessagesCount}
                            </span>
                        )}
                    </div>
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
