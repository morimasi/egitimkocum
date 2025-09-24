import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, AssignmentStatus } from '../types';
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
    sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => void;
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
    addGoal: (newGoal: Omit<Goal, 'id'>) => void;
    addReaction: (messageId: string, emoji: string) => void;
    voteOnPoll: (messageId: string, optionIndex: number) => void;
    findMessageById: (messageId: string) => Message | undefined;
    toggleResourceRecommendation: (resourceId: string, studentId: string) => void;
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
    
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const item = window.localStorage.getItem('currentUser');
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [typingStatus, setTypingStatus] = useState<{ [userId: string]: boolean }>({});
    
    useEffect(() => {
        try {
            if (currentUser) {
                window.localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
                window.localStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.error("Failed to save user to localStorage", error);
        }
    }, [currentUser]);
    
    const students = useMemo(() => users.filter(user => user.role === UserRole.Student), [users]);
    const coach = useMemo(() => users.find(user => user.role === UserRole.Coach) || null, [users]);

    const login = useCallback((email: string): User | null => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            setCurrentUser(user);
            return user;
        }
        return null;
    }, [users]);

    const logout = useCallback(() => {
        setCurrentUser(null);
    }, []);
    
    const register = useCallback((name: string, email: string): User | null => {
        if(users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return null;
        }
        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            role: UserRole.Student,
            profilePicture: `https://i.pravatar.cc/150?u=${email}`
        };
        setUsers(prev => [...prev, newUser]);
        return newUser;
    }, [users, setUsers]);

    const getAssignmentsForStudent = useCallback((studentId: string) => {
        return assignments.filter(a => a.studentId === studentId);
    }, [assignments]);

    const findMessageById = useCallback((messageId: string) => {
        return messages.find(m => m.id === messageId);
    }, [messages]);

    const getMessagesWithUser = useCallback((userId: string) => {
        if (!currentUser) return [];
        if (userId === 'announcements') {
            return messages.filter(m => m.type === 'announcement').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
        return messages.filter(
            m => (m.senderId === currentUser.id && m.receiverId === userId) || (m.senderId === userId && m.receiverId === currentUser.id)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [currentUser, messages]);

    const sendMessage = useCallback((message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!currentUser) return;
        const newMessage: Message = {
            ...message,
            id: `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            readBy: [currentUser.id],
        };
        setMessages(prev => [...prev, newMessage]);
    }, [currentUser, setMessages]);
    
    const addAssignment = useCallback((assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        const newAssignments: Assignment[] = studentIds.map(studentId => ({
            ...assignmentData,
            id: `asg-${Date.now()}-${studentId}`,
            studentId,
        }));
        setAssignments(prev => [...prev, ...newAssignments]);
    }, [setAssignments]);

    const addNotification = useCallback((userId: string, message: string, link?: AppNotification['link']) => {
        const newNotification: AppNotification = {
            id: `notif-${Date.now()}`,
            userId,
            message,
            timestamp: new Date().toISOString(),
            isRead: false,
            link,
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, [setNotifications]);

    const updateAssignment = useCallback((updatedAssignment: Assignment) => {
        setAssignments(prevAssignments => {
            const originalAssignment = prevAssignments.find(a => a.id === updatedAssignment.id);
    
            if (originalAssignment && originalAssignment.status !== AssignmentStatus.Graded && updatedAssignment.status === AssignmentStatus.Graded) {
                const coachName = coach?.name || 'Koçun';
                addNotification(
                    updatedAssignment.studentId, 
                    `${coachName}, "${updatedAssignment.title}" ödevini notlandırdı.`,
                    { page: 'assignments' }
                );
            }
    
            return prevAssignments.map(a => a.id === updatedAssignment.id ? updatedAssignment : a);
        });
    }, [setAssignments, coach, addNotification]);

    const updateUser = useCallback((updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
    }, [currentUser, setUsers]);
    
    const deleteUser = useCallback((userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setAssignments(prev => prev.filter(a => a.studentId !== userId));
        setMessages(prev => prev.filter(m => m.senderId !== userId && m.receiverId !== userId));
    }, [setUsers, setAssignments, setMessages]);

    const addUser = useCallback((userData: Omit<User, 'id'>) => {
        const newUser: User = {
            ...userData,
            id: `user-${Date.now()}`,
        };
        setUsers(prev => [...prev, newUser]);
    }, [setUsers]);
    
    const resetData = useCallback(() => {
        setIsLoading(true);
        const initialData = getInitialData();
        setUsers(initialData.users);
        setAssignments(initialData.assignments);
        setMessages(initialData.messages);
        setNotifications(initialData.notifications);
        setTemplates(initialData.templates);
        setResources(initialData.resources);
        setGoals(initialData.goals);
        setCurrentUser(null);
        setIsLoading(false);
    }, [getInitialData, setUsers, setAssignments, setMessages, setNotifications, setTemplates, setResources, setGoals]);

    const markMessagesAsRead = useCallback((contactId: string) => {
        if (!currentUser) return;
        setMessages(prev =>
            prev.map(m =>
                (m.senderId === contactId && m.receiverId === currentUser.id && !m.readBy.includes(currentUser.id))
                    ? { ...m, readBy: [...m.readBy, currentUser.id] }
                    : m
            )
        );
    }, [currentUser, setMessages]);

    const markNotificationsAsRead = useCallback(() => {
        if (!currentUser) return;
        setNotifications(prev => 
            prev.map(n => n.userId === currentUser.id ? { ...n, isRead: true } : n)
        );
    }, [currentUser, setNotifications]);

    const updateTypingStatus = useCallback((userId: string, isTyping: boolean) => {
        setTypingStatus(prev => ({ ...prev, [userId]: isTyping }));
    }, []);

    const getGoalsForStudent = useCallback((studentId: string) => {
        return goals.filter(g => g.studentId === studentId);
    }, [goals]);

    const updateGoal = useCallback((updatedGoal: Goal) => {
        setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    }, [setGoals]);

    const addGoal = useCallback((newGoalData: Omit<Goal, 'id'>) => {
        const newGoal: Goal = {
            ...newGoalData,
            id: `goal-${Date.now()}`,
        };
        setGoals(prev => [...prev, newGoal]);
    }, [setGoals]);
    
    const addReaction = useCallback((messageId: string, emoji: string) => {
        if (!currentUser) return;
        const userId = currentUser.id;
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const newReactions = { ...(msg.reactions || {}) };
                const userHasReactedWithEmoji = newReactions[emoji]?.includes(userId);
                // User can only have one reaction, so remove any existing reaction from this user
                Object.keys(newReactions).forEach(key => {
                    newReactions[key] = newReactions[key].filter(id => id !== userId);
                    if (newReactions[key].length === 0) delete newReactions[key];
                });
                // If the user is not toggling off the same emoji, add the new reaction
                if (!userHasReactedWithEmoji) {
                    if (!newReactions[emoji]) newReactions[emoji] = [];
                    newReactions[emoji].push(userId);
                }
                return { ...msg, reactions: newReactions };
            }
            return msg;
        }));
    }, [currentUser, setMessages]);

    const voteOnPoll = useCallback((messageId: string, optionIndex: number) => {
        if (!currentUser) return;
        const userId = currentUser.id;
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId && msg.poll) {
                const newPoll = { ...msg.poll };
                let userAlreadyVotedForThisOption = false;
                // Allow changing vote: first remove user's vote from all options
                const newOptions = newPoll.options.map((opt, index) => {
                    if (index === optionIndex && opt.votes.includes(userId)) userAlreadyVotedForThisOption = true;
                    const filteredVotes = opt.votes.filter(v => v !== userId);
                    return { ...opt, votes: filteredVotes };
                });
                 // If not toggling off, add the vote
                if (!userAlreadyVotedForThisOption) {
                    newOptions[optionIndex].votes.push(userId);
                }
                return { ...msg, poll: { ...newPoll, options: newOptions } };
            }
            return msg;
        }));
    }, [currentUser, setMessages]);

    const toggleResourceRecommendation = useCallback((resourceId: string, studentId: string) => {
        setResources(prev => prev.map(res => {
            if (res.id === resourceId) {
                const recommended = res.recommendedTo || [];
                const isRecommended = recommended.includes(studentId);
                const newRecommended = isRecommended
                    ? recommended.filter(id => id !== studentId)
                    : [...recommended, studentId];
                return { ...res, recommendedTo: newRecommended };
            }
            return res;
        }));
    }, [setResources]);

    const value = useMemo(() => ({
        currentUser, users, assignments, messages, students, coach, notifications, templates, resources, goals, isLoading, typingStatus,
        login, logout, register, getAssignmentsForStudent, getMessagesWithUser, sendMessage, addAssignment, updateAssignment,
        updateUser, deleteUser, addUser, resetData, markMessagesAsRead, markNotificationsAsRead, updateTypingStatus,
        getGoalsForStudent, updateGoal, addGoal, addReaction, voteOnPoll, findMessageById, toggleResourceRecommendation,
    }), [
        currentUser, users, assignments, messages, students, coach, notifications, templates, resources, goals, isLoading, typingStatus,
        login, logout, register, getAssignmentsForStudent, getMessagesWithUser, sendMessage, addAssignment, updateAssignment,
        updateUser, deleteUser, addUser, resetData, markMessagesAsRead, markNotificationsAsRead, updateTypingStatus,
        getGoalsForStudent, updateGoal, addGoal, addReaction, voteOnPoll, findMessageById, toggleResourceRecommendation,
    ]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};