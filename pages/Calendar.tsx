

import React, { useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Assignment, UserRole, AssignmentStatus } from '../types';
import Card from '../components/Card';
import { CalendarIcon as PageIcon } from '../components/Icons';
import { useUI } from '../contexts/UIContext';

const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
        case AssignmentStatus.Pending: return 'bg-yellow-500 hover:bg-yellow-600';
        case AssignmentStatus.Submitted: return 'bg-blue-500 hover:bg-blue-600';
        case AssignmentStatus.Graded: return 'bg-green-500 hover:bg-green-600';
        default: return 'bg-gray-500 hover:bg-gray-600';
    }
};

const Calendar = () => {
    const { currentUser, assignments, students } = useDataContext();
    const { setActivePage } = useUI();
    const [currentDate, setCurrentDate] = useState(new Date());

    const isCoach = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;

    const displayedAssignments = useMemo(() => {
        if (!currentUser) return [];
        if (isCoach) {
            const studentIds = students.map(s => s.id);
            return assignments.filter(a => studentIds.includes(a.studentId));
        }
        return assignments.filter(a => a.studentId === currentUser.id);
    }, [currentUser, assignments, students, isCoach]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, Assignment[]>();
        displayedAssignments.forEach(assignment => {
            const dateStr = new Date(assignment.dueDate).toISOString().split('T')[0];
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr)!.push(assignment);
        });
        return map;
    }, [displayedAssignments]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleEventClick = (assignment: Assignment) => {
        setActivePage('assignments', { assignmentId: assignment.id });
    };

    const { year, month, daysInMonth, firstDayOfMonth } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        return { year, month, daysInMonth, firstDayOfMonth: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 };
    }, [currentDate]);

    const calendarGrid = useMemo(() => {
        const grid = [];
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = 0; i < firstDayOfMonth; i++) {
            grid.push({ day: prevMonthDays - firstDayOfMonth + i + 1, isCurrentMonth: false, events: [] });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toISOString().split('T')[0];
            grid.push({ day: i, isCurrentMonth: true, events: eventsByDate.get(dateStr) || [] });
        }
        const remainingCells = 42 - grid.length;
        for (let i = 1; i <= remainingCells; i++) {
            grid.push({ day: i, isCurrentMonth: false, events: [] });
        }
        return grid;
    }, [year, month, daysInMonth, firstDayOfMonth, eventsByDate]);

    const weekDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">&lt;</button>
                    <h2 className="text-xl font-bold w-40 text-center">
                        {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">&gt;</button>
                </div>
                <button onClick={handleToday} className="mt-4 sm:mt-0 px-4 py-2 text-sm font-semibold border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                    Bugün
                </button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border-t border-l border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {weekDays.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        <span className="sm:hidden">{day.slice(0, 3)}</span>
                        <span className="hidden sm:inline">{day}</span>
                    </div>
                ))}

                {calendarGrid.map((cell, index) => {
                    const isToday = cell.isCurrentMonth && cell.day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                    return (
                        <div key={index} className={`relative p-1 sm:p-2 h-20 sm:h-32 bg-white dark:bg-gray-800/50 overflow-y-auto ${!cell.isCurrentMonth ? 'opacity-50' : ''}`}>
                            <span className={`absolute top-1 right-1 sm:top-2 sm:right-2 text-xs font-bold ${isToday ? 'bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                                {cell.day}
                            </span>
                            <div className="space-y-1 mt-6">
                                {cell.events.map(event => (
                                    <div 
                                        key={event.id}
                                        onClick={() => handleEventClick(event)}
                                        className={`p-1 sm:p-1.5 rounded text-white text-[10px] sm:text-xs cursor-pointer truncate transition-transform transform hover:scale-105 ${getStatusColor(event.status)}`}
                                        title={event.title}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default Calendar;