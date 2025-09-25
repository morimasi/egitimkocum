import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, AssignmentStatus } from '../types';
import { getMockData } from '../hooks/useMockData';

// FIX: Export getInitialDataForSeeding to be used in SetupWizard.
export const getInitialDataForSeeding = () => {
    const { users } = getMockData();
    return { initialUsers: users };
};

const getInitialState = (): AppState => ({
    users: [],
    assignments: [],
    messages: [],
    notifications: [],
    templates: [],
    resources: [],
    goals: [],
    currentUser: null,
    isLoading: true,
    typingStatus: {},
});

type AppState = {
    users: User[];
    assignments: Assignment[];
    messages: Message[];
    notifications: AppNotification[];
    templates: AssignmentTemplate[];
    resources: Resource[];
    goals: Goal[];
    currentUser: User | null;
    isLoading: boolean;
    typingStatus: { [userId: string]: boolean };
};

type Action =
    | { type: 'SET_INITIAL_DATA'; payload: Partial<Omit<AppState, 'currentUser' | 'isLoading'>> }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_CURRENT_USER'; payload: User | null }
    | { type: 'ADD_ASSIGNMENTS'; payload: Assignment[] }
    | { type: 'UPDATE_ASSIGNMENT'; payload: Assignment }
    | { type: 'ADD_MESSAGE'; payload: Message }
    | { type: 'UPDATE_USER'; payload: User }
    | { type: 'ADD_USER'; payload: User }
    | { type: 'DELETE_USER'; payload: string }
    | { type: 'MARK_MESSAGES_AS_READ'; payload: { contactId: string; currentUserId: string } }
    | { type: 'SET_NOTIFICATIONS'; payload: AppNotification[] }
    | { type: 'MARK_NOTIFICATIONS_AS_READ'; payload: { userId: string } }
    | { type: 'SET_TYPING_STATUS'; payload: { userId: string; isTyping: boolean } }
    | { type: 'ADD_GOAL'; payload: Goal }
    | { type: 'UPDATE_GOAL'; payload: Goal }
    | { type: 'ADD_REACTION'; payload: { messageId: string; emoji: string; userId: string } }
    | { type: 'VOTE_ON_POLL'; payload: { messageId: string; optionIndex: number; userId: string } }
    | { type: 'TOGGLE_RESOURCE_RECOMMENDATION'; payload: { resourceId: string; studentId: string } };

const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_INITIAL_DATA':
            return { ...state, ...action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload };
        case 'ADD_ASSIGNMENTS':
            return { ...state, assignments: [...state.assignments, ...action.payload] };
        case 'UPDATE_ASSIGNMENT':
            return { ...state, assignments: state.assignments.map(a => a.id === action.payload.id ? action.payload : a) };
        case 'ADD_MESSAGE':
             return { ...state, messages: [...state.messages, action.payload] };
        case 'UPDATE_USER': {
            const newCurrentUser = state.currentUser?.id === action.payload.id ? action.payload : state.currentUser;
            return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u), currentUser: newCurrentUser };
        }
        case 'ADD_USER':
            if (state.users.some(u => u.id === action.payload.id)) {
                return state;
            }
            return { ...state, users: [...state.users, action.payload] };
        case 'DELETE_USER':
             return {
                ...state,
                users: state.users.filter(u => u.id !== action.payload),
                assignments: state.assignments.filter(a => a.studentId !== action.payload && a.coachId !== action.payload),
                messages: state.messages.filter(m => m.senderId !== action.payload && m.receiverId !== action.payload),
            };
        case 'MARK_MESSAGES_AS_READ':
            return { ...state, messages: state.messages.map(m => {
                if (m.senderId === action.payload.contactId && m.receiverId === action.payload.currentUserId && !m.readBy.includes(action.payload.currentUserId)) {
                    return { ...m, readBy: [...m.readBy, action.payload.currentUserId] };
                }
                return m;
            })};
        case 'SET_NOTIFICATIONS':
             return { ...state, notifications: action.payload };
        case 'MARK_NOTIFICATIONS_AS_READ':
            return { ...state, notifications: state.notifications.map(n => n.userId === action.payload.userId ? { ...n, isRead: true } : n) };
        case 'SET_TYPING_STATUS':
            if (state.currentUser && action.payload.userId === state.currentUser.id) {
                return state; // Don't update for own user
            }
            return { ...state, typingStatus: { ...state.typingStatus, [action.payload.userId]: action.payload.isTyping } };
        case 'ADD_GOAL':
            return { ...state, goals: [...state.goals, action.payload] };
        case 'UPDATE_GOAL':
            return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g) };
        case 'ADD_REACTION':
             return {
                ...state,
                messages: state.messages.map(m => {
                    if (m.id === action.payload.messageId) {
                        const newReactions = { ...(m.reactions || {}) };
                        // Find if user already reacted with any emoji
                        Object.keys(newReactions).forEach(emoji => {
                           newReactions[emoji] = newReactions[emoji].filter(uid => uid !== action.payload.userId);
                           if(newReactions[emoji].length === 0) delete newReactions[emoji];
                        });
                        // Add new reaction
                        if (!newReactions[action.payload.emoji]) {
                            newReactions[action.payload.emoji] = [];
                        }
                        newReactions[action.payload.emoji].push(action.payload.userId);
                        return { ...m, reactions: newReactions };
                    }
                    return m;
                })
            };
        case 'VOTE_ON_POLL':
            return {
                ...state,
                messages: state.messages.map(m => {
                    if (m.id === action.payload.messageId && m.poll) {
                        const newOptions = m.poll.options.map((opt, index) => {
                            const newVotes = opt.votes.filter(v => v !== action.payload.userId);
                            if (index === action.payload.optionIndex) {
                                if (!opt.votes.includes(action.payload.userId)) {
                                    newVotes.push(action.payload.userId);
                                }
                            }
                            return { ...opt, votes: newVotes };
                        });
                        return { ...m, poll: { ...m.poll, options: newOptions } };
                    }
                    return m;
                })
            };
        case 'TOGGLE_RESOURCE_RECOMMENDATION':
             return {
                ...state,
                resources: state.resources.map(r => {
                    if (r.id === action.payload.resourceId) {
                        const recommendedTo = r.recommendedTo || [];
                        const isRecommended = recommendedTo.includes(action.payload.studentId);
                        return {
                            ...r,
                            recommendedTo: isRecommended
                                ? recommendedTo.filter(id => id !== action.payload.studentId)
                                : [...recommendedTo, action.payload.studentId],
                        };
                    }
                    return r;
                }),
            };
        default:
            return state;
    }
};

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
    login: (email: string, pass: string) => Promise<User | null>;
    logout: () => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
    getAssignmentsForStudent: (studentId: string) => Assignment[];
    getMessagesWithUser: (userId: string) => Message[];
    sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => Promise<void>;
    addAssignment: (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => Promise<void>;
    updateAssignment: (updatedAssignment: Assignment) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addUser: (newUser: Omit<User, 'id'>) => Promise<User | null>;
    markMessagesAsRead: (contactId: string) => Promise<void>;
    markNotificationsAsRead: () => Promise<void>;
    updateTypingStatus: (isTyping: boolean) => Promise<void>;
    getGoalsForStudent: (studentId: string) => Goal[];
    updateGoal: (updatedGoal: Goal) => Promise<void>;
    addGoal: (newGoal: Omit<Goal, 'id'>) => Promise<void>;
    addReaction: (messageId: string, emoji: string) => Promise<void>;
    voteOnPoll: (messageId: string, optionIndex: number) => Promise<void>;
    findMessageById: (messageId: string) => Message | undefined;
    toggleResourceRecommendation: (resourceId: string, studentId: string) => Promise<void>;
    uploadFile: (file: File, path: string) => Promise<string>;
    unreadCounts: Map<string, number>;
    lastMessagesMap: Map<string, Message>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children?: ReactNode }) => {
    const [state, dispatch] = useReducer(dataReducer, getInitialState());
    const isInitialized = useRef(false);
    
    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;
        
        const loadData = () => {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            const { users, assignments, messages, templates, resources, goals } = getMockData();
            
            const defaultUser = users.find(u => u.role === UserRole.Coach) || users[0];
            sessionStorage.setItem('currentUser', JSON.stringify(defaultUser));
            
            dispatch({
                type: 'SET_INITIAL_DATA',
                payload: { users, assignments, messages, templates, resources, goals, notifications: [
                     { id: 'notif-1', userId: defaultUser.id, message: 'Yeni bir ödev atandı: Matematik Problemleri', timestamp: new Date().toISOString(), isRead: false },
                     { id: 'notif-2', userId: 'student-1', message: 'Fizik raporunuz notlandırıldı: 85', timestamp: new Date(Date.now() - 3600*1000).toISOString(), isRead: false },
                ] }
            });
            dispatch({ type: 'SET_CURRENT_USER', payload: defaultUser });
            dispatch({ type: 'SET_LOADING', payload: false });
        };
        
        const persistedUser = sessionStorage.getItem('currentUser');
        if (persistedUser) {
             const { users, assignments, messages, templates, resources, goals } = getMockData();
             dispatch({ type: 'SET_INITIAL_DATA', payload: { users, assignments, messages, templates, resources, goals } });
             dispatch({ type: 'SET_CURRENT_USER', payload: JSON.parse(persistedUser) });
             dispatch({ type: 'SET_LOADING', payload: false });
        } else {
            loadData();
        }
    }, []);


    const value = useMemo(() => {
        const coach = state.users.find(u => u.role === UserRole.Coach) || null;
        const students = state.users.filter(u => u.role === UserRole.Student);

        const login = async (email: string, pass: string): Promise<User | null> => {
            // Password check is ignored in local mock version
            const user = state.users.find(u => u.email === email);
            if (user) {
                dispatch({ type: 'SET_CURRENT_USER', payload: user });
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                return user;
            }
            return null;
        };

        const logout = async () => {
            dispatch({ type: 'SET_CURRENT_USER', payload: null });
            sessionStorage.removeItem('currentUser');
        };

        const register = async (name: string, email: string, pass: string) => {
             if (state.users.some(u => u.email === email)) {
                const error = new Error("Bu e-posta adresi zaten kullanılıyor.");
                (error as any).code = 'auth/email-already-in-use';
                throw error;
            }
            const newUser: User = {
                id: `user-${Date.now()}`,
                name,
                email,
                role: state.users.length === 0 ? UserRole.SuperAdmin : UserRole.Student,
                profilePicture: `https://i.pravatar.cc/150?u=${email}`,
            };
            dispatch({ type: 'ADD_USER', payload: newUser });
            dispatch({ type: 'SET_CURRENT_USER', payload: newUser });
            sessionStorage.setItem('currentUser', JSON.stringify(newUser));
        };

        const getAssignmentsForStudent = (studentId: string) => state.assignments.filter(a => a.studentId === studentId);
        
        const getMessagesWithUser = (contactId: string) => {
             if (!state.currentUser) return [];
             if (contactId === 'announcements') {
                 return state.messages.filter(m => m.type === 'announcement').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
             }
             const userId = state.currentUser.id;
             return state.messages.filter(m => 
                 ((m.senderId === userId && m.receiverId === contactId) || 
                 (m.senderId === contactId && m.receiverId === userId)) && m.type !== 'announcement'
             ).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        };
        
        const sendMessage = async (messageData: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
            if(!state.currentUser) return;
            const newMessage: Message = {
                ...messageData,
                id: `msg-${Date.now()}`,
                timestamp: new Date().toISOString(),
                readBy: [messageData.senderId],
            };
            dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
        };

        const addAssignment = async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
            const newAssignments: Assignment[] = studentIds.map(studentId => ({
                ...assignmentData,
                id: `asg-${Date.now()}-${studentId}`,
                studentId,
            }));
            dispatch({ type: 'ADD_ASSIGNMENTS', payload: newAssignments });
        };

        const updateAssignment = async (updatedAssignment: Assignment) => {
            dispatch({ type: 'UPDATE_ASSIGNMENT', payload: updatedAssignment });
        };
        
        const updateUser = async (updatedUser: User) => {
            dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        };

        const deleteUser = async (userId: string) => {
             dispatch({ type: 'DELETE_USER', payload: userId });
        };

        const addUser = async (newUser: Omit<User, 'id'>): Promise<User | null> => {
            const user: User = { ...newUser, id: `user-${Date.now()}`};
            dispatch({ type: 'ADD_USER', payload: user });
            return user;
        };

        const markMessagesAsRead = async (contactId: string) => {
            if (state.currentUser) {
                dispatch({ type: 'MARK_MESSAGES_AS_READ', payload: { contactId, currentUserId: state.currentUser.id } });
            }
        };

        const markNotificationsAsRead = async () => {
             if (state.currentUser) {
                dispatch({ type: 'MARK_NOTIFICATIONS_AS_READ', payload: { userId: state.currentUser.id } });
             }
        };

        const updateTypingStatus = async (isTyping: boolean) => {
            if (state.currentUser) {
                 dispatch({ type: 'SET_TYPING_STATUS', payload: { userId: state.currentUser.id, isTyping } });
            }
        };
        const getGoalsForStudent = (studentId: string) => state.goals.filter(g => g.studentId === studentId);
        
        const updateGoal = async (updatedGoal: Goal) => { 
            dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
        };
        const addGoal = async (newGoal: Omit<Goal, 'id'>) => { 
            const goal: Goal = { ...newGoal, id: `goal-${Date.now()}` };
            dispatch({ type: 'ADD_GOAL', payload: goal });
        };
        const addReaction = async (messageId: string, emoji: string) => {
             if (state.currentUser) {
                dispatch({ type: 'ADD_REACTION', payload: { messageId, emoji, userId: state.currentUser.id } });
             }
        };
        const voteOnPoll = async (messageId: string, optionIndex: number) => {
            if (state.currentUser) {
                dispatch({ type: 'VOTE_ON_POLL', payload: { messageId, optionIndex, userId: state.currentUser.id } });
            }
        };
        const findMessageById = (messageId: string) => state.messages.find(m => m.id === messageId);
        const toggleResourceRecommendation = async (resourceId: string, studentId: string) => {
            dispatch({ type: 'TOGGLE_RESOURCE_RECOMMENDATION', payload: { resourceId, studentId } });
        };
        
        const uploadFile = async (file: File, path: string): Promise<string> => {
            // Simulate a short delay for UX
            await new Promise(resolve => setTimeout(resolve, 500));
            // Create a blob URL, which is valid for the current session
            return URL.createObjectURL(file);
        };

        const allContacts = state.currentUser?.role === UserRole.Coach 
            ? students 
            : (coach ? [{ id: 'announcements', name: 'Duyurular', profilePicture: 'https://cdn-icons-png.flaticon.com/512/1041/1041891.png' }, coach] : []);

        const unreadCounts = new Map<string, number>();
        if(state.currentUser) {
            state.messages.forEach(msg => {
                if (msg.receiverId === state.currentUser!.id && !msg.readBy.includes(state.currentUser!.id)) {
                    const currentCount = unreadCounts.get(msg.senderId) || 0;
                    unreadCounts.set(msg.senderId, currentCount + 1);
                }
            });
        }
        
        const lastMessagesMap = new Map<string, Message>();
        const messageGroups = new Map<string, Message[]>();

        state.messages.forEach(msg => {
            let contactId: string | null = null;
            if (msg.type === 'announcement') {
                contactId = 'announcements';
            } else if (msg.senderId === state.currentUser?.id) {
                contactId = msg.receiverId;
            } else if (msg.receiverId === state.currentUser?.id) {
                contactId = msg.senderId;
            }

            if (contactId) {
                if (!messageGroups.has(contactId)) messageGroups.set(contactId, []);
                messageGroups.get(contactId)!.push(msg);
            }
        });

        allContacts.forEach((contact: any) => {
            const userMessages = messageGroups.get(contact.id);
            if (userMessages && userMessages.length > 0) {
                const lastMsg = userMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                lastMessagesMap.set(contact.id, lastMsg);
            }
        });


        return {
            ...state,
            coach,
            students,
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
            markMessagesAsRead,
            markNotificationsAsRead,
            updateTypingStatus,
            getGoalsForStudent,
            updateGoal,
            addGoal,
            addReaction,
            voteOnPoll,
            findMessageById,
            toggleResourceRecommendation,
            uploadFile,
            unreadCounts,
            lastMessagesMap
        };
    }, [state]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};