

import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, Conversation } from '../types';
import { getMockData } from '../hooks/useMockData';

export const getInitialDataForSeeding = () => {
    const { users } = getMockData();
    return { initialUsers: users };
};

const getInitialState = (): AppState => ({
    users: [],
    assignments: [],
    messages: [],
    conversations: [],
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
    conversations: Conversation[];
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
    | { type: 'MARK_MESSAGES_AS_READ'; payload: { conversationId: string; currentUserId: string } }
    | { type: 'SET_NOTIFICATIONS'; payload: AppNotification[] }
    | { type: 'ADD_NOTIFICATIONS'; payload: AppNotification[] }
    | { type: 'MARK_NOTIFICATIONS_AS_READ'; payload: { userId: string } }
    | { type: 'SET_TYPING_STATUS'; payload: { userId: string; isTyping: boolean } }
    | { type: 'ADD_GOAL'; payload: Goal }
    | { type: 'UPDATE_GOAL'; payload: Goal }
    | { type: 'ADD_REACTION'; payload: { messageId: string; emoji: string; userId: string } }
    | { type: 'VOTE_ON_POLL'; payload: { messageId: string; optionIndex: number; userId: string } }
    | { type: 'TOGGLE_RESOURCE_ASSIGNMENT'; payload: { resourceId: string; studentId: string } }
    | { type: 'ADD_RESOURCE'; payload: Resource }
    | { type: 'DELETE_RESOURCE'; payload: string }
    | { type: 'ADD_CONVERSATION'; payload: Conversation }
    | { type: 'UPDATE_CONVERSATION'; payload: Conversation };

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
                messages: state.messages.filter(m => m.senderId !== action.payload),
                conversations: state.conversations.map(c => ({...c, participantIds: c.participantIds.filter(pid => pid !== action.payload)})).filter(c => c.participantIds.length > 1 || c.id === 'conv-announcements'),
            };
        case 'MARK_MESSAGES_AS_READ':
            return { ...state, messages: state.messages.map(m => {
                if (m.conversationId === action.payload.conversationId && !m.readBy.includes(action.payload.currentUserId)) {
                    return { ...m, readBy: [...m.readBy, action.payload.currentUserId] };
                }
                return m;
            })};
        case 'SET_NOTIFICATIONS':
             return { ...state, notifications: action.payload };
        case 'ADD_NOTIFICATIONS':
             return { ...state, notifications: [...state.notifications, ...action.payload] };
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
        case 'TOGGLE_RESOURCE_ASSIGNMENT':
             return {
                ...state,
                resources: state.resources.map(r => {
                    if (r.id === action.payload.resourceId) {
                        const assignedTo = r.assignedTo || [];
                        const isAssigned = assignedTo.includes(action.payload.studentId);
                        return {
                            ...r,
                            assignedTo: isAssigned
                                ? assignedTo.filter(id => id !== action.payload.studentId)
                                : [...assignedTo, action.payload.studentId],
                        };
                    }
                    return r;
                }),
            };
        case 'ADD_RESOURCE':
            return { ...state, resources: [...state.resources, action.payload] };
        case 'DELETE_RESOURCE':
            return { ...state, resources: state.resources.filter(r => r.id !== action.payload) };
         case 'ADD_CONVERSATION':
            return { ...state, conversations: [...state.conversations, action.payload] };
        case 'UPDATE_CONVERSATION':
            return { ...state, conversations: state.conversations.map(c => c.id === action.payload.id ? action.payload : c) };
        default:
            return state;
    }
};

interface DataContextType {
    currentUser: User | null;
    users: User[];
    assignments: Assignment[];
    messages: Message[];
    conversations: Conversation[];
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
    getMessagesForConversation: (conversationId: string) => Message[];
    sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => Promise<void>;
    addAssignment: (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => Promise<void>;
    updateAssignment: (updatedAssignment: Assignment) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addUser: (newUser: Omit<User, 'id'>) => Promise<User | null>;
    markMessagesAsRead: (conversationId: string) => Promise<void>;
    markNotificationsAsRead: () => Promise<void>;
    updateTypingStatus: (isTyping: boolean) => Promise<void>;
    getGoalsForStudent: (studentId: string) => Goal[];
    updateGoal: (updatedGoal: Goal) => Promise<void>;
    addGoal: (newGoal: Omit<Goal, 'id'>) => Promise<void>;
    addReaction: (messageId: string, emoji: string) => Promise<void>;
    voteOnPoll: (messageId: string, optionIndex: number) => Promise<void>;
    findMessageById: (messageId: string) => Message | undefined;
    toggleResourceAssignment: (resourceId: string, studentId: string) => Promise<void>;
    addResource: (newResource: Omit<Resource, 'id' | 'uploaderId' | 'assignedTo'> & { isPublic: boolean; assignedTo?: string[] }) => Promise<void>;
    deleteResource: (resourceId: string) => Promise<void>;
    uploadFile: (file: File, path: string) => Promise<string>;
    updateStudentNotes: (studentId: string, notes: string) => Promise<void>;
    unreadCounts: Map<string, number>;
    lastMessagesMap: Map<string, Message>;
    startGroupChat: (participantIds: string[], groupName: string) => Promise<string | undefined>;
    addUserToConversation: (conversationId: string, userId: string) => Promise<void>;
    removeUserFromConversation: (conversationId: string, userId: string) => Promise<void>;
    endConversation: (conversationId: string) => Promise<void>;
    seedDatabase: (uids: Record<string, string>) => Promise<void>;
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
            
            const { users, assignments, messages, templates, resources, goals, conversations } = getMockData();
            
            const defaultUser = users.find(u => u.role === UserRole.Coach) || users[0];
            sessionStorage.setItem('currentUser', JSON.stringify(defaultUser));
            
            dispatch({
                type: 'SET_INITIAL_DATA',
                payload: { users, assignments, messages, templates, resources, goals, conversations, notifications: [
                     { id: 'notif-1', userId: defaultUser.id, message: 'Yeni bir ödev atandı: Matematik Problemleri', timestamp: new Date().toISOString(), isRead: false },
                     { id: 'notif-2', userId: 'student-1', message: 'Fizik raporunuz notlandırıldı: 85', timestamp: new Date(Date.now() - 3600*1000).toISOString(), isRead: false },
                ] }
            });
            dispatch({ type: 'SET_CURRENT_USER', payload: defaultUser });
            dispatch({ type: 'SET_LOADING', payload: false });
        };
        
        const persistedUser = sessionStorage.getItem('currentUser');
        if (persistedUser) {
             const { users, assignments, messages, templates, resources, goals, conversations } = getMockData();
             dispatch({ type: 'SET_INITIAL_DATA', payload: { users, assignments, messages, templates, resources, goals, conversations } });
             dispatch({ type: 'SET_CURRENT_USER', payload: JSON.parse(persistedUser) });
             dispatch({ type: 'SET_LOADING', payload: false });
        } else {
            loadData();
        }
    }, []);

    const coach = useMemo(() => {
        if (state.currentUser?.role === UserRole.Student) {
            return state.users.find(u => u.id === state.currentUser.assignedCoachId) || null;
        }
        if (state.currentUser?.role === UserRole.Coach || state.currentUser?.role === UserRole.SuperAdmin) {
            return state.currentUser;
        }
        return state.users.find(u => u.role === UserRole.Coach) || null;
    }, [state.users, state.currentUser]);

    const students = useMemo(() => {
        if (state.currentUser?.role === UserRole.Coach) {
            return state.users.filter(u => u.role === UserRole.Student && u.assignedCoachId === state.currentUser.id);
        }
        if (state.currentUser?.role === UserRole.SuperAdmin) {
            return state.users.filter(u => u.role === UserRole.Student);
        }
        return [];
    }, [state.users, state.currentUser]);

    const getAssignmentsForStudent = useCallback((studentId: string) => state.assignments.filter(a => a.studentId === studentId), [state.assignments]);
    const getGoalsForStudent = useCallback((studentId: string) => state.goals.filter(g => g.studentId === studentId), [state.goals]);
    const findMessageById = useCallback((messageId: string) => state.messages.find(m => m.id === messageId), [state.messages]);
    
    const getMessagesForConversation = useCallback((conversationId: string) => {
         if (!state.currentUser) return [];
         return state.messages.filter(m => m.conversationId === conversationId)
            .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [state.messages, state.currentUser]);
    
    const unreadCounts = useMemo(() => {
        const counts = new Map<string, number>();
        if (state.currentUser) {
            state.messages.forEach(msg => {
                const conversation = state.conversations.find(c => c.id === msg.conversationId);
                if (conversation && conversation.participantIds.includes(state.currentUser!.id) && msg.senderId !== state.currentUser!.id && !msg.readBy.includes(state.currentUser!.id)) {
                    const currentCount = counts.get(msg.conversationId) || 0;
                    counts.set(msg.conversationId, currentCount + 1);
                }
            });
        }
        return counts;
    }, [state.messages, state.conversations, state.currentUser]);
    
    const lastMessagesMap = useMemo(() => {
        const map = new Map<string, Message>();
        state.messages.forEach(msg => {
            const existingLastMessage = map.get(msg.conversationId);
            if (!existingLastMessage || new Date(msg.timestamp) > new Date(existingLastMessage.timestamp)) {
                map.set(msg.conversationId, msg);
            }
        });
        return map;
    }, [state.messages]);

    const value = useMemo(() => {
        
        const login = async (email: string, pass: string): Promise<User | null> => {
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

        const markMessagesAsRead = async (conversationId: string) => {
            if (state.currentUser) {
                dispatch({ type: 'MARK_MESSAGES_AS_READ', payload: { conversationId, currentUserId: state.currentUser.id } });
            }
        };

        const markNotificationsAsRead = async () => {
             if (state.currentUser) {
                dispatch({ type: 'MARK_NOTIFICATIONS_AS_READ', payload: { userId: state.currentUser.id } });
             }
        };

        const updateTypingStatus = async (isTyping: boolean) => {};
        
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
        
        const toggleResourceAssignment = async (resourceId: string, studentId: string) => {
            dispatch({ type: 'TOGGLE_RESOURCE_ASSIGNMENT', payload: { resourceId, studentId } });
        };

        const addResource = async (resourceData: Omit<Resource, 'id' | 'uploaderId' | 'assignedTo'> & { isPublic: boolean; assignedTo?: string[] }) => {
            if (!state.currentUser) return;
            const newResource: Resource = {
                name: resourceData.name,
                type: resourceData.type,
                url: resourceData.url,
                isPublic: resourceData.isPublic,
                id: `res-${Date.now()}`,
                uploaderId: state.currentUser.id,
                assignedTo: resourceData.assignedTo || []
            };
            dispatch({ type: 'ADD_RESOURCE', payload: newResource });

            if (!newResource.isPublic && newResource.assignedTo && newResource.assignedTo.length > 0) {
                const notificationsToAdd: AppNotification[] = newResource.assignedTo.map(studentId => ({
                    id: `notif-${Date.now()}-${studentId}`,
                    userId: studentId,
                    message: `${state.currentUser?.name} sizinle yeni bir kaynak paylaştı: "${newResource.name}"`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    link: { page: 'library' }
                }));
                dispatch({ type: 'ADD_NOTIFICATIONS', payload: notificationsToAdd });
            }
        };

        const deleteResource = async (resourceId: string) => {
            dispatch({ type: 'DELETE_RESOURCE', payload: resourceId });
        };
        
        const uploadFile = async (file: File, path: string): Promise<string> => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return URL.createObjectURL(file);
        };

        const updateStudentNotes = async (studentId: string, notes: string) => {
            const student = state.users.find(u => u.id === studentId);
            if (student) {
                dispatch({ type: 'UPDATE_USER', payload: { ...student, notes } });
            }
        };

        const startGroupChat = async (participantIds: string[], groupName: string) => {
            if (!state.currentUser) return;
            const newConversation: Conversation = {
                id: `conv-${Date.now()}`,
                participantIds,
                isGroup: true,
                groupName,
                adminId: state.currentUser.id,
            };
            dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
            sendMessage({
                senderId: state.currentUser.id,
                conversationId: newConversation.id,
                text: `${state.currentUser.name}, ${groupName} grubunu oluşturdu.`,
                type: 'system',
            });
            return newConversation.id;
        };

        const addUserToConversation = async (conversationId: string, userId: string) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            const user = state.users.find(u => u.id === userId);
            if (conversation && user && !conversation.participantIds.includes(userId)) {
                const updatedConversation = { ...conversation, participantIds: [...conversation.participantIds, userId] };
                dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation });
                sendMessage({
                    senderId: state.currentUser!.id,
                    conversationId: conversationId,
                    text: `${state.currentUser!.name}, ${user.name} kişisini gruba ekledi.`,
                    type: 'system',
                });
            }
        };

        const removeUserFromConversation = async (conversationId: string, userId: string) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            const user = state.users.find(u => u.id === userId);
            if (conversation && user && conversation.participantIds.includes(userId)) {
                const updatedConversation = { ...conversation, participantIds: conversation.participantIds.filter(id => id !== userId) };
                dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation });
                sendMessage({
                    senderId: state.currentUser!.id,
                    conversationId: conversationId,
                    text: `${state.currentUser!.name}, ${user.name} kişisini gruptan çıkardı.`,
                    type: 'system',
                });
            }
        };

        const endConversation = async (conversationId: string) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
                dispatch({ type: 'UPDATE_CONVERSATION', payload: { ...conversation, isArchived: true } });
                 sendMessage({
                    senderId: state.currentUser!.id,
                    conversationId: conversationId,
                    text: `${state.currentUser!.name}, grubu sonlandırdı.`,
                    type: 'system',
                });
            }
        };

        const seedDatabase = async (uids: Record<string, string>) => {};

        return {
            ...state,
            coach,
            students,
            login,
            logout,
            register,
            getAssignmentsForStudent,
            getMessagesForConversation,
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
            toggleResourceAssignment,
            addResource,
            deleteResource,
            uploadFile,
            updateStudentNotes,
            unreadCounts,
            lastMessagesMap,
            startGroupChat,
            addUserToConversation,
            removeUserFromConversation,
            endConversation,
            seedDatabase,
        };
    }, [state, coach, students, getAssignmentsForStudent, getMessagesForConversation, getGoalsForStudent, findMessageById, unreadCounts, lastMessagesMap]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};