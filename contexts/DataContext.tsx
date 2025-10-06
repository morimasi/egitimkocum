

import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useReducer } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, Conversation, AssignmentStatus, Badge, BadgeID, CalendarEvent, Exam, Question } from '../types';
import { useUI } from './UIContext';
import { seedData } from '../services/seedData';

// --- App State and Reducer ---
const uuid = () => crypto.randomUUID();
const LOCAL_STORAGE_KEY = 'mahmutHocaLocalData';

const getInitialState = (): AppState => ({
    users: [],
    assignments: [],
    messages: [],
    conversations: [],
    notifications: [],
    templates: [],
    resources: [],
    goals: [],
    badges: seedData.badges,
    calendarEvents: [],
    exams: [],
    questions: [],
    currentUser: null,
    isLoading: true,
    isDbInitialized: false, // Start as false to trigger setup or load
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
    badges: Badge[];
    calendarEvents: CalendarEvent[];
    exams: Exam[];
    questions: Question[];
    currentUser: User | null;
    isLoading: boolean;
    isDbInitialized: boolean;
    typingStatus: { [userId: string]: boolean };
};

type Action =
    | { type: 'SET_ALL_DATA', payload: Partial<Omit<AppState, 'isLoading'>> }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_CURRENT_USER'; payload: User | null }
    | { type: 'ADD_OR_UPDATE_DOC'; payload: { collection: keyof Omit<AppState, 'currentUser' | 'isLoading' | 'typingStatus' | 'isDbInitialized'>, data: any } }
    | { type: 'REMOVE_DOCS'; payload: { collection: keyof Omit<AppState, 'currentUser' | 'isLoading' | 'typingStatus' | 'isDbInitialized'>, ids: string[] } }
    | { type: 'SET_DB_UNINITIALIZED' };

const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_ALL_DATA':
            return { ...state, ...action.payload, isLoading: false, isDbInitialized: true };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload };
        case 'SET_DB_UNINITIALIZED':
            return { ...state, isDbInitialized: false, isLoading: false };
        case 'ADD_OR_UPDATE_DOC': {
            const collectionName = action.payload.collection;
            const docData = action.payload.data;
            const existingCollection = state[collectionName] as any[];
            const docIndex = existingCollection.findIndex(d => d.id === docData.id);

            let updatedCollection;
            if (docIndex > -1) {
                updatedCollection = [...existingCollection];
                updatedCollection[docIndex] = docData;
            } else {
                updatedCollection = [...existingCollection, docData];
            }
            return { ...state, [collectionName]: updatedCollection };
        }
        case 'REMOVE_DOCS': {
            const collectionName = action.payload.collection;
            const docIds = new Set(action.payload.ids);
            const existingCollection = state[collectionName] as any[];
            return { ...state, [collectionName]: existingCollection.filter(d => !docIds.has(d.id)) };
        }
        default:
            return state;
    }
};

// --- Data Context Interfaces ---
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
    badges: Badge[];
    calendarEvents: CalendarEvent[];
    exams: Exam[];
    questions: Question[];
    isLoading: boolean;
    isDbInitialized: boolean;
    typingStatus: { [userId: string]: boolean };
    login: (email: string) => Promise<User | null>;
    logout: () => Promise<void>;
    // FIX: Add 'register' to DataContextType to resolve usage in RegisterScreen.tsx
    register: (name: string, email: string, profilePictureFile: File | null) => Promise<User | null>;
    inviteStudent: (name: string, email: string) => Promise<void>;
    getAssignmentsForStudent: (studentId: string) => Assignment[];
    getMessagesForConversation: (conversationId: string) => Message[];
    sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => Promise<void>;
    addAssignment: (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => Promise<void>;
    updateAssignment: (updatedAssignment: Assignment) => Promise<void>;
    deleteAssignments: (assignmentIds: string[]) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addUser: (newUser: Omit<User, 'id'>) => Promise<User | null>;
    markMessagesAsRead: (conversationId: string) => Promise<void>;
    unreadCounts: Map<string, number>;
    lastMessagesMap: Map<string, Message>;
    markNotificationsAsRead: (userId: string) => Promise<void>;
    updateTypingStatus: (isTyping: boolean) => Promise<void>;
    getGoalsForStudent: (studentId: string) => Goal[];
    updateGoal: (updatedGoal: Goal) => Promise<void>;
    addGoal: (newGoal: Omit<Goal, 'id'>) => Promise<void>;
    deleteGoal: (goalId: string) => Promise<void>;
    addReaction: (messageId: string, emoji: string) => Promise<void>;
    voteOnPoll: (messageId: string, optionIndex: number) => Promise<void>;
    findMessageById: (messageId: string) => Message | undefined;
    assignResourceToStudents: (resourceId: string, studentIds: string[]) => Promise<void>;
    addResource: (newResource: Omit<Resource, 'id'>) => Promise<void>;
    deleteResource: (resourceId: string) => Promise<void>;
    addTemplate: (templateData: Omit<AssignmentTemplate, 'id'>) => Promise<void>;
    updateTemplate: (template: AssignmentTemplate) => Promise<void>;
    deleteTemplate: (templateId: string) => Promise<void>;
    uploadFile: (file: File, path: string) => Promise<string>;
    updateStudentNotes: (studentId: string, notes: string) => Promise<void>;
    awardXp: (amount: number, reason: string) => Promise<void>;
    startGroupChat: (participantIds: string[], groupName: string) => Promise<string | undefined>;
    findOrCreateConversation: (otherParticipantId: string) => Promise<string | undefined>;
    addUserToConversation: (conversationId: string, userId: string) => Promise<void>;
    removeUserFromConversation: (conversationId: string, userId: string) => Promise<void>;
    endConversation: (conversationId: string) => Promise<void>;
    setConversationArchived: (conversationId: string, isArchived: boolean) => Promise<void>;
    addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
    addMultipleCalendarEvents: (events: Omit<CalendarEvent, 'id' | 'userId'>[]) => Promise<void>;
    deleteCalendarEvent: (eventId: string) => Promise<void>;
    seedDatabase: () => Promise<void>;
    addExam: (exam: Omit<Exam, 'id'>) => Promise<void>;
    updateExam: (updatedExam: Exam) => Promise<void>;
    deleteExam: (examId: string) => Promise<void>;
    addQuestion: (questionData: Omit<Question, 'id'>) => Promise<void>;
    updateQuestion: (question: Question) => Promise<void>;
    deleteQuestion: (questionId: string) => Promise<void>;
    updateBadge: (badge: Badge) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children?: ReactNode }) => {
    const [state, dispatch] = useReducer(dataReducer, getInitialState());
    const { addToast } = useUI();
    
    // Initial load from local storage
    useEffect(() => {
        try {
            const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                // Make sure essential arrays exist
                 const sanitizedData = {
                    ...getInitialState(), // provides defaults for all keys
                    ...parsedData,
                    isLoading: false, // ensure loading is false after load
                    isDbInitialized: true,
                };
                dispatch({ type: 'SET_ALL_DATA', payload: sanitizedData });
            } else {
                dispatch({ type: 'SET_DB_UNINITIALIZED' });
            }
        } catch (error) {
            console.error("Failed to load data from local storage, showing setup.", error);
            dispatch({ type: 'SET_DB_UNINITIALIZED' });
        }
    }, []);

    // Persist state to local storage on change
    useEffect(() => {
        if (!state.isLoading && state.isDbInitialized) {
            try {
                // Don't persist current user, it's session-based
                const { currentUser, ...stateToSave } = state;
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
            } catch (error) {
                console.error("Failed to save data to local storage:", error);
                addToast("Değişiklikler kaydedilemedi. Depolama alanı dolu olabilir.", "error");
            }
        }
    }, [state, addToast]);

    const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    resolve(reader.result as string);
                } else {
                    reject(new Error("Dosya okunamadı."));
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }, []);

    const login = useCallback(async (email: string): Promise<User | null> => {
        const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            dispatch({ type: 'SET_CURRENT_USER', payload: user });
            return user;
        } else {
            throw new Error("Kullanıcı bulunamadı.");
        }
    }, [state.users]);

    const logout = useCallback(async () => {
        dispatch({ type: 'SET_CURRENT_USER', payload: null });
    }, []);

    const addUser = useCallback(async (newUser: Omit<User, 'id'>): Promise<User | null> => {
        const userWithId = { ...newUser, id: uuid() };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: userWithId } });
        return userWithId;
    }, []);
    
    // FIX: Implement and export the 'register' function.
    const register = useCallback(async (name: string, email: string, profilePictureFile: File | null): Promise<User | null> => {
        if (state.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error("Bu e-posta adresi zaten kullanılıyor.");
        }

        const isFirstUser = state.users.length === 0;

        const userWithId: User = {
            id: uuid(),
            name,
            email,
            role: isFirstUser ? UserRole.SuperAdmin : UserRole.Student,
            profilePicture: `https://i.pravatar.cc/150?u=${email}`,
            xp: 0,
            streak: 0,
        };

        if (profilePictureFile) {
            userWithId.profilePicture = await uploadFile(profilePictureFile, `profile-pictures/${userWithId.id}`);
        }

        if (isFirstUser) {
            const payload = {
                ...getInitialState(),
                users: [userWithId],
                currentUser: userWithId,
                isDbInitialized: true,
                isLoading: false,
            };
            dispatch({ type: 'SET_ALL_DATA', payload });
        } else {
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: userWithId } });
            dispatch({ type: 'SET_CURRENT_USER', payload: userWithId });
        }
        
        return userWithId;
    }, [state.users, uploadFile]);
    
    const updateUser = useCallback(async (updatedUser: User) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: updatedUser } });
        if (state.currentUser?.id === updatedUser.id) {
            dispatch({ type: 'SET_CURRENT_USER', payload: updatedUser });
        }
    }, [state.currentUser?.id]);

    const deleteUser = useCallback(async (userId: string) => {
        dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'users', ids: [userId] } });
    }, []);
    
    const findOrCreateConversation = useCallback(async (otherParticipantId: string): Promise<string | undefined> => {
        if (!state.currentUser) return;
        const existing = state.conversations.find(c => !c.isGroup && c.participantIds.length === 2 && c.participantIds.includes(state.currentUser!.id) && c.participantIds.includes(otherParticipantId));
        if (existing) return existing.id;

        const newConversation: Conversation = { id: uuid(), participantIds: [state.currentUser.id, otherParticipantId], isGroup: false };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: newConversation } });
        return newConversation.id;
    }, [state.currentUser, state.conversations]);

    const inviteStudent = useCallback(async (name: string, email: string): Promise<void> => {
        if (!state.currentUser || (state.currentUser.role !== UserRole.Coach && state.currentUser.role !== UserRole.SuperAdmin)) {
            addToast("Sadece koçlar öğrenci davet edebilir.", "error"); return;
        }
        const newUser = await addUser({ name, email, role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=${email}`, assignedCoachId: state.currentUser.id });
        if (newUser) {
            await findOrCreateConversation(newUser.id);
            addToast(`${name} başarıyla davet edildi ve bir sohbet başlatıldı.`, "success");
        }
    }, [state.currentUser, addUser, findOrCreateConversation, addToast]);
    
    const addAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        for (const studentId of studentIds) {
            const newAssignment = { ...assignmentData, id: uuid(), studentId };
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'assignments', data: newAssignment } });
        }
        addToast("Ödev(ler) başarıyla oluşturuldu.", "success");
    }, [addToast]);
    
    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'assignments', data: updatedAssignment } });
    }, []);

    const deleteAssignments = useCallback(async (assignmentIds: string[]) => {
        dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'assignments', ids: assignmentIds } });
    }, []);

    const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!state.currentUser) return;
        const message: Message = { ...messageData, id: uuid(), timestamp: new Date().toISOString(), readBy: [state.currentUser.id] };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: message } });
    }, [state.currentUser]);

    const markMessagesAsRead = useCallback(async (conversationId: string) => {
        if (!state.currentUser) return;
        const myId = state.currentUser.id;
        state.messages.forEach(m => {
            if (m.conversationId === conversationId && !m.readBy.includes(myId)) {
                const updatedMessage = { ...m, readBy: [...m.readBy, myId] };
                dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: updatedMessage } });
            }
        });
    }, [state.currentUser, state.messages]);

    const markNotificationsAsRead = useCallback(async (userId: string) => {
        state.notifications.forEach(n => {
            if (n.userId === userId && !n.isRead) {
                dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'notifications', data: { ...n, isRead: true } } });
            }
        });
    }, [state.notifications]);
    
    const addGoal = useCallback(async (newGoal: Omit<Goal, 'id'>) => {
        const goalWithId = { ...newGoal, id: uuid() };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'goals', data: goalWithId } });
    }, []);
    
    const updateGoal = useCallback(async (updatedGoal: Goal) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'goals', data: updatedGoal } });
    }, []);

    const deleteGoal = useCallback(async (goalId: string) => {
        dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'goals', ids: [goalId] } });
    }, []);

    const addReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!state.currentUser) return;
        const message = state.messages.find(m => m.id === messageId);
        if (!message) return;

        const updatedReactions = { ...(message.reactions || {}) };
        const myId = state.currentUser.id;

        if (updatedReactions[emoji]?.includes(myId)) {
            updatedReactions[emoji] = updatedReactions[emoji].filter(id => id !== myId);
            if (updatedReactions[emoji].length === 0) delete updatedReactions[emoji];
        } else {
            if (!updatedReactions[emoji]) updatedReactions[emoji] = [];
            updatedReactions[emoji].push(myId);
        }
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: { ...message, reactions: updatedReactions } } });
    }, [state.currentUser, state.messages]);
    
    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if (!state.currentUser) return;
        const message = state.messages.find(m => m.id === messageId);
        if (!message || !message.poll) return;
        
        const myId = state.currentUser.id;
        const updatedOptions = message.poll.options.map(opt => ({ ...opt, votes: opt.votes.filter(id => id !== myId) }));
        updatedOptions[optionIndex].votes.push(myId);
        
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: { ...message, poll: { ...message.poll, options: updatedOptions } } } });
    }, [state.currentUser, state.messages]);

    const startGroupChat = useCallback(async (participantIds: string[], groupName: string): Promise<string | undefined> => {
        if (!state.currentUser) return;
        const allParticipantIds = Array.from(new Set([...participantIds, state.currentUser.id]));
        const newConversation: Conversation = { id: uuid(), participantIds: allParticipantIds, isGroup: true, groupName, groupImage: `https://i.pravatar.cc/150?u=${uuid()}`, adminId: state.currentUser.id };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: newConversation } });
        return newConversation.id;
    }, [state.currentUser]);

    const addUserToConversation = useCallback(async (conversationId: string, userId: string) => {
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation && conversation.isGroup) {
            const updatedParticipants = Array.from(new Set([...conversation.participantIds, userId]));
            if(updatedParticipants.length > conversation.participantIds.length) {
                const updatedConversation = { ...conversation, participantIds: updatedParticipants };
                dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: updatedConversation } });
            }
        }
    }, [state.conversations]);

    const removeUserFromConversation = useCallback(async (conversationId: string, userId: string) => {
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation && conversation.isGroup) {
            const updatedConversation = { ...conversation, participantIds: conversation.participantIds.filter(id => id !== userId) };
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: updatedConversation } });
        }
    }, [state.conversations]);

    const endConversation = useCallback(async (conversationId: string) => {
        dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'conversations', ids: [conversationId] } });
        const messagesForConversation = state.messages.filter(m => m.conversationId === conversationId).map(m => m.id);
        if (messagesForConversation.length > 0) {
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'messages', ids: messagesForConversation } });
        }
    }, [state.messages]);

    const updateStudentNotes = useCallback(async (studentId: string, notes: string) => {
        const student = state.users.find(u => u.id === studentId);
        if (student) {
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: { ...student, notes } } });
        }
    }, [state.users]);

    const awardXp = useCallback(async (amount: number, reason: string) => {
        if (!state.currentUser) return;
        const updatedUser = { ...state.currentUser, xp: (state.currentUser.xp || 0) + amount };
        await updateUser(updatedUser);
        addToast(`+${amount} XP! ${reason}`, 'xp');
    }, [state.currentUser, updateUser, addToast]);
    
    const seedDatabase = useCallback(async () => {
        const seededState = { ...seedData, currentUser: null, isLoading: false, isDbInitialized: true, typingStatus: {} };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seededState));
        addToast("Veritabanı deneme verileriyle dolduruldu. Sayfa yenileniyor...", "success");
        setTimeout(() => window.location.reload(), 1500);
    }, [addToast]);

    const addResource = useCallback(async (newResource: Omit<Resource, 'id'>) => {
        const resourceWithId = { ...newResource, id: uuid() };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'resources', data: resourceWithId } });
    }, []);

    const deleteResource = useCallback(async (resourceId: string) => {
        dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'resources', ids: [resourceId] } });
    }, []);

    const assignResourceToStudents = useCallback(async (resourceId: string, studentIds: string[]) => {
        const resource = state.resources.find(r => r.id === resourceId);
        if (!resource) return;
        const updatedResource = { ...resource, assignedTo: Array.from(new Set([...(resource.assignedTo || []), ...studentIds])) };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'resources', data: updatedResource } });
    }, [state.resources]);

    const addTemplate = useCallback(async (templateData: Omit<AssignmentTemplate, 'id'>) => {
        const templateWithId = { ...templateData, id: uuid(), isFavorite: false };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'templates', data: templateWithId } });
    }, []);

    const updateTemplate = useCallback(async (template: AssignmentTemplate) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'templates', data: template } });
    }, []);

    const updateBadge = useCallback(async (badge: Badge) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'badges', data: badge } });
    }, []);

    const deleteTemplate = useCallback(async (templateId: string) => {
        dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'templates', ids: [templateId] } });
    }, []);

    const addCalendarEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
        const eventWithId = { ...event, id: uuid() };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'calendarEvents', data: eventWithId } });
    }, []);
    
    const addMultipleCalendarEvents = useCallback(async (events: Omit<CalendarEvent, 'id' | 'userId'>[]) => {
        if (!state.currentUser) return;
        const eventsWithIds = events.map(e => ({...e, id: uuid(), userId: state.currentUser!.id}));
        eventsWithIds.forEach(e => dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'calendarEvents', data: e } }));
    }, [state.currentUser]);

    const deleteCalendarEvent = useCallback(async (eventId: string) => {
        dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'calendarEvents', ids: [eventId] } });
    }, []);
    
    const addExam = useCallback(async (exam: Omit<Exam, 'id'>) => {
        const examWithId = { ...exam, id: uuid() };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'exams', data: examWithId } });
    }, []);

    const updateExam = useCallback(async (updatedExam: Exam) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'exams', data: updatedExam } });
    }, []);
    
    const deleteExam = useCallback(async (examId: string) => {
        dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'exams', ids: [examId] } });
    }, []);
    
    const addQuestion = useCallback(async (questionData: Omit<Question, 'id'>) => {
        const questionWithId = { ...questionData, id: uuid() };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'questions', data: questionWithId } });
    }, []);

    const updateQuestion = useCallback(async (question: Question) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'questions', data: question } });
    }, []);

    const deleteQuestion = useCallback(async (questionId: string) => {
        dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'questions', ids: [questionId] } });
    }, []);

    const setConversationArchived = useCallback(async (conversationId: string, isArchived: boolean) => {
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation) {
            updateUser({ ...conversation, isArchived } as any); // Bit of a hack, but it works with the generic updateUser
        }
    }, [state.conversations, updateUser]);
    
    // Derived state and memoized functions
    const { unreadCounts, lastMessagesMap } = useMemo(() => {
        const counts = new Map<string, number>();
        const lasts = new Map<string, Message>();
        if (state.currentUser) {
            const myId = state.currentUser.id;
            state.conversations
                .filter(c => c.participantIds.includes(myId))
                .forEach(c => {
                    const convMessages = state.messages
                        .filter(m => m.conversationId === c.id)
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    if (convMessages.length > 0) lasts.set(c.id, convMessages[0]);
                    const unreadCount = convMessages.filter(m => !m.readBy.includes(myId) && m.senderId !== myId).length;
                    counts.set(c.id, unreadCount);
                });
        }
        return { unreadCounts: counts, lastMessagesMap: lasts };
    }, [state.messages, state.conversations, state.currentUser]);
    
    const coach = useMemo(() => state.currentUser?.role === UserRole.Student ? state.users.find(u => u.id === state.currentUser.assignedCoachId) || null : (state.currentUser?.role === UserRole.Coach || state.currentUser?.role === UserRole.SuperAdmin ? state.currentUser : state.users.find(u => u.role === UserRole.Coach) || null), [state.users, state.currentUser]);
    const students = useMemo(() => state.currentUser?.role === UserRole.Coach ? state.users.filter(u => u.role === UserRole.Student && u.assignedCoachId === state.currentUser.id) : (state.currentUser?.role === UserRole.SuperAdmin ? state.users.filter(u => u.role === UserRole.Student) : []), [state.users, state.currentUser]);
    const getAssignmentsForStudent = useCallback((studentId: string) => state.assignments.filter(a => a.studentId === studentId), [state.assignments]);
    const getGoalsForStudent = useCallback((studentId: string) => state.goals.filter(g => g.studentId === studentId), [state.goals]);
    const findMessageById = useCallback((messageId: string) => state.messages.find(m => m.id === messageId), [state.messages]);
    const getMessagesForConversation = useCallback((conversationId: string) => {
         if (!state.currentUser) return [];
         return state.messages.filter(m => m.conversationId === conversationId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [state.messages, state.currentUser]);
    
    const contextValue: DataContextType = {
        ...state, coach, students, login, logout, register, inviteStudent,
        getAssignmentsForStudent, getMessagesForConversation, sendMessage,
        addAssignment, updateAssignment, deleteAssignments,
        updateUser, deleteUser, addUser,
        markMessagesAsRead, unreadCounts, lastMessagesMap, markNotificationsAsRead,
        updateTypingStatus: async () => {}, // No-op for local version
        getGoalsForStudent, updateGoal, addGoal, deleteGoal,
        addReaction, voteOnPoll, findMessageById, assignResourceToStudents,
        addResource, deleteResource, addTemplate, updateTemplate, deleteTemplate,
        uploadFile, updateStudentNotes, awardXp, startGroupChat, findOrCreateConversation,
        addUserToConversation, removeUserFromConversation, endConversation, setConversationArchived,
        addCalendarEvent, addMultipleCalendarEvents, deleteCalendarEvent, seedDatabase,
        addExam, updateExam, deleteExam, addQuestion, updateQuestion, deleteQuestion,
        updateBadge,
    };

    return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};