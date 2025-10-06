import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { UserRole } from '../types';
import {
    SearchIcon,
    AssignmentsIcon,
    LibraryIcon,
} from './Icons';

interface SearchResult {
    id: string;
    type: 'student' | 'assignment' | 'resource';
    title: string;
    icon: React.ReactNode;
    action: () => void;
    secondaryText?: string;
}

export default function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
    const { currentUser, students, assignments, resources } = useDataContext();
    const { setActivePage } = useUI();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
        }
    }, [isOpen]);

    const filteredResults = useMemo(() => {
        const q = query.toLowerCase();
        if (!q) {
            return { students: [], assignments: [], resources: [] };
        }

        const isCoach = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;

        const filteredStudents = isCoach ? students.filter(s => s.name.toLowerCase().includes(q)) : [];
        
        const assignmentsForUser = isCoach ? assignments : assignments.filter(a => a.studentId === currentUser?.id);
        const filteredAssignments = assignmentsForUser.filter(a => a.title.toLowerCase().includes(q));

        const availableResources = resources.filter(r => r.isPublic || r.assignedTo?.includes(currentUser?.id || ''));
        const filteredResources = availableResources.filter(r => r.name.toLowerCase().includes(q));
        
        return {
            students: filteredStudents,
            assignments: filteredAssignments,
            resources: filteredResources,
        };
    }, [query, currentUser, students, assignments, resources]);

    const flatResults: SearchResult[] = useMemo(() => {
        const studentResults: SearchResult[] = filteredResults.students.map(s => ({
            id: `student-${s.id}`,
            type: 'student',
            title: s.name,
            icon: <img src={s.profilePicture} alt={s.name} className="w-5 h-5 rounded-full" />,
            action: () => setActivePage('students', { studentId: s.id }),
            secondaryText: s.email,
        }));
        const assignmentResults: SearchResult[] = filteredResults.assignments.map(a => ({
            id: `assignment-${a.id}`,
            type: 'assignment',
            title: a.title,
            icon: <AssignmentsIcon className="w-5 h-5 text-gray-400" />,
            action: () => setActivePage('assignments', { assignmentId: a.id }),
            secondaryText: `Teslim: ${new Date(a.dueDate).toLocaleDateString()}`
        }));
        const resourceResults: SearchResult[] = filteredResults.resources.map(r => ({
            id: `resource-${r.id}`,
            type: 'resource',
            title: r.name,
            icon: <LibraryIcon className="w-5 h-5 text-gray-400" />,
            action: () => window.open(r.url, '_blank'),
            secondaryText: r.type,
        }));

        return [...studentResults, ...assignmentResults, ...resourceResults];
    }, [filteredResults, setActivePage]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

     useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % flatResults.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (flatResults[activeIndex]) {
                    flatResults[activeIndex].action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, activeIndex, flatResults, onClose]);

    useEffect(() => {
        resultsRef.current?.children[activeIndex]?.scrollIntoView({
            block: 'nearest',
        });
    }, [activeIndex]);

    if (!isOpen) return null;
    
    const hasResults = flatResults.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div
                className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-xl border dark:border-slate-700 transform transition-all animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center p-3 border-b dark:border-slate-700">
                    <SearchIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Öğrenci, ödev veya kaynak ara..."
                        className="w-full bg-transparent p-1 text-lg focus:outline-none"
                    />
                </div>
                <ul ref={resultsRef} className="max-h-[60vh] overflow-y-auto p-2">
                    {query && !hasResults && (
                        <li className="p-8 text-center text-gray-500">Sonuç bulunamadı.</li>
                    )}
                    {!query && (
                         <li className="p-8 text-center text-gray-400">Öğrencileri, ödevleri ve kaynakları arayın.</li>
                    )}
                    {hasResults && (
                        <>
                            {filteredResults.students.length > 0 && (
                                <li>
                                    <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Öğrenciler</h3>
                                    {filteredResults.students.map(item => {
                                        const result = flatResults.find(fr => fr.id === `student-${item.id}`)!;
                                        const isSelected = flatResults[activeIndex]?.id === result.id;
                                        return (
                                            <div key={result.id} onClick={() => { result.action(); onClose(); }} className={`flex items-center gap-3 p-3 rounded-md cursor-pointer ${isSelected ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                                {result.icon}
                                                <div className="flex-1">
                                                    <p>{result.title}</p>
                                                    <p className={`text-xs ${isSelected ? 'text-primary-200' : 'text-gray-400'}`}>{result.secondaryText}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </li>
                            )}
                             {filteredResults.assignments.length > 0 && (
                                <li>
                                    <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Ödevler</h3>
                                    {filteredResults.assignments.map(item => {
                                        const result = flatResults.find(fr => fr.id === `assignment-${item.id}`)!;
                                        const isSelected = flatResults[activeIndex]?.id === result.id;
                                        return (
                                            <div key={result.id} onClick={() => { result.action(); onClose(); }} className={`flex items-center gap-3 p-3 rounded-md cursor-pointer ${isSelected ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                                {result.icon}
                                                <div className="flex-1">
                                                    <p>{result.title}</p>
                                                    <p className={`text-xs ${isSelected ? 'text-primary-200' : 'text-gray-400'}`}>{result.secondaryText}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </li>
                            )}
                             {filteredResults.resources.length > 0 && (
                                <li>
                                    <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">Kaynaklar</h3>
                                    {filteredResults.resources.map(item => {
                                        const result = flatResults.find(fr => fr.id === `resource-${item.id}`)!;
                                        const isSelected = flatResults[activeIndex]?.id === result.id;
                                        return (
                                            <div key={result.id} onClick={() => { result.action(); onClose(); }} className={`flex items-center gap-3 p-3 rounded-md cursor-pointer ${isSelected ? 'bg-primary-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                                {result.icon}
                                                <div className="flex-1">
                                                    <p>{result.title}</p>
                                                    <p className={`text-xs ${isSelected ? 'text-primary-200' : 'text-gray-400'}`}>{result.secondaryText}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </li>
                            )}
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
};