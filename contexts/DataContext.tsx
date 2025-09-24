import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal } from '../types';
import { useMockData } from '../hooks/useMockData';

interface DataContextType {
    currentUser: User | null;
    users: User[];
    assignments: Assignment[];
    messages: Message[];
    students: User[];
    coach: User | null;
    notifications: AppNotification[];
    templates: AssignmentTemplate[];
    resources: Resource[];
    goals: Goal[];
    isLoading: boolean;
    typingStatus: { [userId: string]: boolean };
    login: (email: string) => User | null;
    logout: () => void;
    register: (name: string, email: string) => User | null;
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
    getGoalsForStudent: (studentId: string) => Goal[];
    updateGoal: (updatedGoal: Goal) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { 
        users, setUsers, 
        assignments, setAssignments, 
        messages, setMessages, 
        notifications, setNotifications, 
        templates, setTemplates,
        resources, setResources,
        goals, setGoals,
        getInitialData 
    } = useMockData();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [typingStatus, setTypingStatus] = useState<{ [userId: string]: boolean }>({});

    useEffect(() => {
        // Simulate initial load, but don't set a user
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, []);
    
    const students = users.filter(user => user.role === UserRole.Student);
    const coach = users.find(user => user.role === UserRole.Coach) || null;

    const login = (email: string): User | null => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            setIsLoading(true);
            setTimeout(() => {
                setCurrentUser(user);
                setIsLoading(false);
            }, 300);
            return user;
        }
        return null;
    };

    const logout = () => {
        setCurrentUser(null);
    };
    
    const register = (name: string, email: string): User | null => {
        if(users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return null; // User already exists
        }
        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            role: UserRole.Student, // New users are students by default
            profilePicture: `https://i.pravatar.cc/150?u=${email}`
        };
        setUsers(prev => [...prev, newUser]);
        return newUser;
    };

    const getAssignmentsForStudent = (studentId: string) => {
        return assignments.filter(a => a.studentId === studentId);
    };

    const getMessagesWithUser = (userId: string) => {
        if (!currentUser) return [];
        if (userId === 'announcements') {
            return messages.filter(m => m.type === 'announcement').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
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
        const initialData = getInitialData();
        setUsers(initialData.users);
        setAssignments(initialData.assignments);
        setMessages(initialData.messages);
        setNotifications(initialData.notifications);
        setTemplates(initialData.templates);
        setResources(initialData.resources);
        setGoals(initialData.goals);

        setTimeout(() => {
            setCurrentUser(null); // Log out after reset
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

    const getGoalsForStudent = (studentId: string) => {
        return goals.filter(g => g.studentId === studentId);
    };

    const updateGoal = (updatedGoal: Goal) => {
        setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    };


    const value = {
        currentUser,
        users,
        assignments,
        messages,
        students,
        coach,
        notifications,
        templates,
        resources,
        goals,
        isLoading,
        typingStatus,
        login,
        logout,
        register,
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
        updateTypingStatus,
        getGoalsForStudent,
        updateGoal,
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