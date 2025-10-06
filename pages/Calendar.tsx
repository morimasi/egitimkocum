import { useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { Assignment, UserRole, AssignmentStatus, CalendarEvent } from '../types';
import Card from '../components/Card';
import { TrashIcon } from '../components/Icons';
import { useUI } from '../contexts/UIContext';
import CalendarEventModal from '../components/CalendarEventModal';

const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
        case AssignmentStatus.Pending: return 'bg-yellow-500 hover:bg-yellow-600';
        case AssignmentStatus.Submitted: return 'bg-blue-500 hover:bg-blue-600';
        case AssignmentStatus.Graded: return 'bg-green-500 hover:bg-green-600';
        default: return 'bg-gray-500 hover:bg-gray-600';
    }
};

type CalendarItem = {
    id: string;
    date: string;
    title: string;
    color: string;
    type: 'assignment' | 'custom';
    original: Assignment | CalendarEvent;
};

export default function Calendar() {
    const { currentUser, assignments, students, calendarEvents, deleteCalendarEvent } = useDataContext();
    const { setActivePage } = useUI();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedDateForEvent, setSelectedDateForEvent] = useState(new Date());


    const isCoach = currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin;

    const allEvents = useMemo<CalendarItem[]>(() => {
        if (!currentUser) return [];
        
        const assignmentEvents = (isCoach ? assignments : assignments.filter(a => a.studentId === currentUser.id))
            .map((a): CalendarItem => ({
                id: a.id,
                date: new Date(a.dueDate).toISOString().split('T')[0],
                title: isCoach ? `${students.find(s => s.id === a.studentId)?.name?.split(' ')[0]}: ${a.title}` : a.title,
                color: getStatusColor(a.status),
                type: 'assignment',
                original: a
            }));
            
        const userEvents = calendarEvents
            .filter(e => isCoach ? e.userId === currentUser.id : e.userId === currentUser.id) // Simple logic: users only see their own custom events
            .map((e): CalendarItem => ({
                id: e.id,
                date: new Date(e.date).toISOString().split('T')[0],
                title: e.title,
                color: e.color,
                type: 'custom',
                original: e
            }));

        return [...assignmentEvents, ...userEvents];

    }, [currentUser, assignments, students, isCoach, calendarEvents]);


    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarItem[]>();
        allEvents.forEach(event => {
            const dateStr = event.date;
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr)!.push(event);
        });
        return map;
    }, [allEvents]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleEventClick = (event: CalendarItem) => {
        if (event.type === 'assignment') {
            setActivePage('assignments', { assignmentId: event.id });
        }
    };
    
    const handleDayClick = (day: number, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return;
        setSelectedDateForEvent(new Date(year, month, day));
        setIsEventModalOpen(true);
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
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">&lt;</button>
                    <h2 className="text-xl font-bold w-40 text-center">
                        {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">&gt;</button>
                     <button onClick={handleToday} className="px-4 py-2 text-sm font-semibold border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                        Bugün
                    </button>
                </div>
                 <button onClick={() => { setSelectedDateForEvent(new Date()); setIsEventModalOpen(true); }} className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-md hover:bg-primary-700">
                    + Yeni Etkinlik
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
                        <div key={index} onClick={() => handleDayClick(cell.day, cell.isCurrentMonth)} className={`relative p-1 sm:p-2 h-24 sm:h-32 bg-white dark:bg-gray-800/50 overflow-y-auto ${!cell.isCurrentMonth ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                            <span className={`absolute top-1 right-1 sm:top-2 sm:right-2 text-xs font-bold ${isToday ? 'bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                                {cell.day}
                            </span>
                            <div className="space-y-1 mt-6">
                                {cell.events.map(event => (
                                    <div 
                                        key={event.id}
                                        onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                                        className={`group relative p-1 sm:p-1.5 rounded text-white text-[10px] sm:text-xs truncate transition-transform transform hover:scale-105 ${event.color}`}
                                        title={event.title}
                                    >
                                        {event.title}
                                        {event.type === 'custom' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteCalendarEvent(event.id); }} 
                                                className="absolute top-0.5 right-0.5 p-0.5 bg-black/20 rounded-full opacity-0 group-hover:opacity-100"
                                            >
                                                <TrashIcon className="w-2.5 h-2.5 text-white" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            {isEventModalOpen && <CalendarEventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} eventDate={selectedDateForEvent} />}
        </Card>
    );
}
