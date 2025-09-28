

import React, { useState, useEffect, useRef } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { Page, User, UserRole } from '../types';
import {
    DashboardIcon, AssignmentsIcon, StudentsIcon, MessagesIcon,
    AnalyticsIcon, SettingsIcon, LibraryIcon, AdminIcon, CalendarIcon, ParentIcon, ClipboardListIcon, FlameIcon, TargetIcon, BrainCircuitIcon, ClipboardCheckIcon
} from './Icons';

interface Command {
    id: string;
    type: 'page' | 'student' | 'action';
    title: string;
    icon: React.ReactNode;
    action: () => void;
    keywords?: string;
}

const CommandPalette = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { currentUser, students } = useDataContext();
    const { setActivePage } = useUI();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLUListElement>(null);

    const commands: Command[] = [
        { id: 'page-dashboard', type: 'page', title: 'Anasayfa', icon: <DashboardIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('dashboard'), keywords: 'anasayfa gösterge paneli' },
        { id: 'page-assignments', type: 'page', title: 'Ödevler', icon: <AssignmentsIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('assignments'), keywords: 'ödevler görevler' },
        { id: 'page-messages', type: 'page', title: 'Mesajlar', icon: <MessagesIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('messages'), keywords: 'mesajlar sohbet' },
        { id: 'page-analytics', type: 'page', title: 'Analitik', icon: <AnalyticsIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('analytics'), keywords: 'analitik raporlar istatistik' },
        { id: 'page-calendar', type: 'page', title: 'Takvim', icon: <CalendarIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('calendar'), keywords: 'takvim ajanda program' },
        { id: 'page-library', type: 'page', title: 'Kütüphane', icon: <LibraryIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('library'), keywords: 'kütüphane kaynaklar şablonlar' },
        { id: 'page-settings', type: 'page', title: 'Ayarlar', icon: <SettingsIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('settings'), keywords: 'ayarlar profil' },
    ];
    
    if (currentUser?.role === UserRole.Student) {
         commands.push({ id: 'page-motivation', type: 'page', title: 'Motivasyon', icon: <FlameIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('motivation'), keywords: 'motivasyon seviye puan rozet' });
         commands.push({ id: 'page-odak', type: 'page', title: 'Odak Modu', icon: <TargetIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('odak'), keywords: 'odaklanma pomodoro zamanlayıcı' });
         commands.push({ id: 'page-sinav-performansi', type: 'page', title: 'Sınav Performansı', icon: <ClipboardCheckIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('sinav-performansi'), keywords: 'sınav performans analiz tyt ayt' });
         commands.push({ id: 'page-akilli-planlayici', type: 'page', title: 'Akıllı Planlayıcı', icon: <BrainCircuitIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('akilli-planlayici'), keywords: 'akıllı planlayıcı yapay zeka program' });
    }

    if (currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin) {
        commands.push({ id: 'page-students', type: 'page', title: 'Öğrenciler', icon: <StudentsIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('students'), keywords: 'öğrenciler liste' });
        commands.push({ id: 'page-templates', type: 'page', title: 'Şablonlar', icon: <ClipboardListIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('templates'), keywords: 'şablonlar ödev şablonu' });
        students.forEach(student => {
            commands.push({
                id: `student-${student.id}`,
                type: 'student',
                title: student.name,
                icon: <img src={student.profilePicture} className="w-5 h-5 rounded-full" alt={student.name}/>,
                action: () => setActivePage('students', { studentId: student.id }),
                keywords: `öğrenci ${student.name.toLowerCase()} ${student.email.toLowerCase()}`
            });
        });
    }
     if (currentUser?.role === UserRole.SuperAdmin) {
        commands.push({ id: 'page-superadmin', type: 'page', title: 'Süper Admin', icon: <AdminIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('superadmin'), keywords: 'admin panel kullanıcı yönetimi' });
    }
    if (currentUser?.role === UserRole.Parent) {
        commands.push({ id: 'page-parent', type: 'page', title: 'Veli Portalı', icon: <ParentIcon className="w-5 h-5 text-gray-400" />, action: () => setActivePage('parent'), keywords: 'veli portalı çocuğum öğrenci' });
    }

    const filteredCommands = query ? commands.filter(cmd =>
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords?.toLowerCase().includes(query.toLowerCase())
    ) : commands;

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[activeIndex]) {
                    filteredCommands[activeIndex].action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeIndex, filteredCommands, onClose]);

    useEffect(() => {
        resultsRef.current?.children[activeIndex]?.scrollIntoView({
            block: 'nearest',
        });
    }, [activeIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div
                className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 transform transition-all animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-3 border-b dark:border-gray-700">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Ara veya komut yaz..."
                        className="w-full bg-transparent p-2 text-lg focus:outline-none"
                    />
                </div>
                <ul ref={resultsRef} className="max-h-96 overflow-y-auto p-2">
                    {filteredCommands.length > 0 ? filteredCommands.map((cmd, index) => (
                        <li
                            key={cmd.id}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => { cmd.action(); onClose(); }}
                            className={`flex items-center gap-3 p-3 rounded-md cursor-pointer ${index === activeIndex ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            {cmd.icon}
                            <span className="flex-1">{cmd.title}</span>
                            <span className={`text-xs uppercase ${index === activeIndex ? 'text-primary-200' : 'text-gray-400'}`}>{cmd.type}</span>
                        </li>
                    )) : (
                        <li className="p-8 text-center text-gray-500">Sonuç bulunamadı.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CommandPalette;