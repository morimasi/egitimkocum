import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Assignment, Message, UserRole, AppNotification } from '../types';
import { useMockData } from '../hooks/useMockData';

interface DataContextType {
    currentUser: User | null;
    setCurrentUser: (user: User) => void;
    users: User[];
    assignments: Assignment[];
    messages: Message[];
    students: User[];
    coach: User | null;
    notifications: AppNotification[];
    isLoading: boolean;
    typingStatus: { [userId: string]: boolean };
    getAssignmentsForStudent: (studentId: string) => Assignment[];
    getMessagesWithUser: (userId: string) => Message[];
    sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => void;
    addAssignment: (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => void;
    updateAssignment: (updatedAssignment: Assignment) => void;
    updateUser: (updatedUser: User) => void;
    deleteUser: (userId: string) => void;
    addUser: (newUser: Omit<User, 'id'>) => void;
    resetData: () => void;
    markMessagesAsRead: (contactId: string) => void;
    markNotificationsAsRead: () => void;
    updateTypingStatus: (userId: string, isTyping: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { users, setUsers, assignments, setAssignments, messages, setMessages, notifications, setNotifications, getInitialData } = useMockData();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [typingStatus, setTypingStatus] = useState<{ [userId: string]: boolean }>({});

    useEffect(() => {
        const coachUser = users.find(u => u.role === UserRole.Coach);
        // Simulate initial load
        setTimeout(() => {
            setCurrentUser(coachUser || null);
            setIsLoading(false);
        }, 500);
    }, []); // Removed users dependency to only run once
    
    const students = users.filter(user => user.role === UserRole.Student);
    const coach = users.find(user => user.role === UserRole.Coach) || null;
    
    const handleSetCurrentUser = (user: User) => {
        setIsLoading(true);
        setTimeout(() => {
            setCurrentUser(user);
            setIsLoading(false);
        }, 300); // Simulate loading for user switch
    };

    const getAssignmentsForStudent = (studentId: string) => {
        return assignments.filter(a => a.studentId === studentId);
    };

    const getMessagesWithUser = (userId: string) => {
        if (!currentUser) return [];
        return messages.filter(
            m => (m.senderId === currentUser.id && m.receiverId === userId) || (m.senderId === userId && m.receiverId === currentUser.id)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    };

    const sendMessage = (message: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => {
        const newMessage: Message = {
            ...message,
            id: `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            isRead: false,
        };
        setMessages(prev => [...prev, newMessage]);
    };
    
    const addAssignment = (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        const newAssignments: Assignment[] = studentIds.map(studentId => ({
            ...assignmentData,
            id: `asg-${Date.now()}-${studentId}`,
            studentId,
        }));
        setAssignments(prev => [...prev, ...newAssignments]);
    };

    const updateAssignment = (updatedAssignment: Assignment) => {
        setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
    };
    
    const deleteUser = (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setAssignments(prev => prev.filter(a => a.studentId !== userId));
        setMessages(prev => prev.filter(m => m.senderId !== userId && m.receiverId !== userId));
    };

    const addUser = (userData: Omit<User, 'id'>) => {
        const newUser: User = {
            ...userData,
            id: `user-${Date.now()}`,
        };
        setUsers(prev => [...prev, newUser]);
    };
    
    const resetData = () => {
        setIsLoading(true);
        const { users, assignments, messages, notifications } = getInitialData();
        setUsers(users);
        setAssignments(assignments);
        setMessages(messages);
        setNotifications(notifications);
        const coachUser = users.find(u => u.role === UserRole.Coach);
        setTimeout(() => {
            setCurrentUser(coachUser || null);
            setIsLoading(false);
        }, 300);
    };

    const markMessagesAsRead = (contactId: string) => {
        if (!currentUser) return;
        setMessages(prev =>
            prev.map(m =>
                (m.senderId === contactId && m.receiverId === currentUser.id)
                    ? { ...m, isRead: true }
                    : m
            )
        );
    };

    const markNotificationsAsRead = () => {
        if (!currentUser) return;
        setNotifications(prev => 
            prev.map(n => n.userId === currentUser.id ? { ...n, isRead: true } : n)
        );
    };

    const updateTypingStatus = (userId: string, isTyping: boolean) => {
        setTypingStatus(prev => ({ ...prev, [userId]: isTyping }));
    };

    const value = {
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        users,
        assignments,
        messages,
        students,
        coach,
        notifications,
        isLoading,
        typingStatus,
        getAssignmentsForStudent,
        getMessagesWithUser,
        sendMessage,
        addAssignment,
        updateAssignment,
        updateUser,
        deleteUser,
        addUser,
        resetData,
        markMessagesAsRead,
        markNotificationsAsRead,
        updateTypingStatus
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};
