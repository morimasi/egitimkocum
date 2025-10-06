import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, Conversation, AssignmentStatus, Badge, BadgeID, CalendarEvent, Poll, PollOption, AcademicTrack, Exam, Question, NotificationPriority, Page } from '../types';
import { useUI } from './UIContext';

// --- App State and Reducer ---
const uuid = () => crypto.randomUUID();

const initialBadges: Badge[] = [
    { id: BadgeID.FirstAssignment, name: "İlk Adım", description: "İlk ödevini başarıyla tamamladın!" },
    { id: BadgeID.HighAchiever, name: "Yüksek Başarı", description: "Not ortalaman 90'ın üzerinde!" },
    { id: BadgeID.PerfectScore, name: "Mükemmel Skor", description: "Bir ödevden 100 tam puan aldın!" },
    { id: BadgeID.GoalGetter, name: "Hedef Avcısı", description: "Haftalık hedeflerinin hepsine ulaştın!" },
    { id: BadgeID.StreakStarter, name: "Seri Başladı", description: "3 gün üst üste ödev teslim ettin." },
    { id: BadgeID.StreakMaster, name: "Seri Ustası", description: "7 gün üst üste ödev teslim ettin." },
    { id: BadgeID.OnTimeSubmissions, name: "Dakik Oyuncu", description: "5 ödevi zamanında teslim ettin." },
];

const getInitialState = (): AppState => ({
    users: [],
    assignments: [],
    messages: [],
    conversations: [],
    notifications: [],
    templates: [],
    resources: [],
    goals: [],
    badges: initialBadges, // Badges are mostly static
    calendarEvents: [],
    exams: [],
    questions: [],
    currentUser: null,
    isLoading: true,
    isDbInitialized: true,
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
    | { type: 'SET_ALL_DATA', payload: Partial<AppState> }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_CURRENT_USER'; payload: User | null }
    | { type: 'ADD_OR_UPDATE_DOC'; payload: { collection: keyof Omit<AppState, 'currentUser' | 'isLoading' | 'typingStatus' | 'isDbInitialized'>, data: any } }
    | { type: 'REMOVE_DOCS'; payload: { collection: keyof Omit<AppState, 'currentUser' | 'isLoading' | 'typingStatus' | 'isDbInitialized'>, ids: string[] } }
    | { type: 'SET_DB_UNINITIALIZED' };

const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_ALL_DATA':
            return { ...state, ...action.payload, isLoading: false };
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

// --- API Helper ---
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`/backend${endpoint}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `API request failed: ${response.statusText}`);
    }
    if (response.status === 204) { // No Content
        return;
    }
    return response.json();
};


interface DataContextType {
    // This interface remains mostly the same, as we are abstracting the data source
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
    register: (name: string, email: string, profilePictureFile: File | null) => Promise<void>;
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
    updateBadge: (updatedBadge: Badge) => Promise<void>;
    addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
    addMultipleCalendarEvents: (events: Omit<CalendarEvent, 'id' | 'userId'>[]) => Promise<void>;
    deleteCalendarEvent: (eventId: string) => Promise<void>;
    toggleTemplateFavorite: (templateId: string) => Promise<void>;
    seedDatabase: () => Promise<void>;
    addExam: (exam: Omit<Exam, 'id'>) => Promise<void>;
    updateExam: (updatedExam: Exam) => Promise<void>;
    deleteExam: (examId: string) => Promise<void>;
    addQuestion: (questionData: Omit<Question, 'id'>) => Promise<void>;
    updateQuestion: (question: Question) => Promise<void>;
    deleteQuestion: (questionId: string) => Promise<void>;
}


const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children?: ReactNode }) => {
    const [state, dispatch] = useReducer(dataReducer, getInitialState());
    const { addToast } = useUI();
    
    const messagesRef = useRef(state.messages);
    useEffect(() => {
        messagesRef.current = state.messages;
    }, [state.messages]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await apiRequest('/data');
                dispatch({ type: 'SET_ALL_DATA', payload: data });
            } catch (error: any) {
                if (error.message && (error.message.includes('DB_NOT_INITIALIZED') || error.message.includes('DB_SCHEMA_OLD'))) {
                    console.warn('Database not initialized or outdated. Showing setup wizard.');
                    dispatch({ type: 'SET_DB_UNINITIALIZED' });
                } else {
                    console.error("Failed to fetch initial data:", error);
                    addToast("Veriler yüklenemedi. Lütfen sayfayı yenileyin.", "error");
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            }
        };
        fetchData();
    }, [addToast]);
    
     const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => { resolve(reader.result as string); };
            reader.readAsDataURL(file);
        });
    }, []);

    const login = useCallback(async (email: string): Promise<User | null> => {
        try {
            const user = await apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ email: email.toLowerCase() })
            });
            dispatch({ type: 'SET_CURRENT_USER', payload: user });
            return user;
        } catch (error: any) {
            throw new Error("Kullanıcı bulunamadı veya şifre yanlış.");
        }
    }, []);

    const logout = useCallback(async () => {
        dispatch({ type: 'SET_CURRENT_USER', payload: null });
    }, []);

    const addUser = useCallback(async (newUser: Omit<User, 'id'>): Promise<User | null> => {
        try {
            const userWithId = { ...newUser, id: uuid() };
            const addedUser = await apiRequest('/users', {
                method: 'POST',
                body: JSON.stringify(userWithId)
            });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: addedUser } });
            return addedUser;
        } catch (error: any) {
            addToast(`Kullanıcı eklenemedi: ${error.message}`, 'error');
            return null;
        }
    }, [addToast]);

    const register = useCallback(async (name: string, email: string, profilePictureFile: File | null) => {
        try {
            let profilePicture = `https://i.pravatar.cc/150?u=${email}`;
            if (profilePictureFile) {
                profilePicture = await uploadFile(profilePictureFile, `profile_pictures/${uuid()}`);
            }
    
            const role = state.users.length === 0 ? UserRole.SuperAdmin : UserRole.Student;
            
            const newUser: Omit<User, 'id'> = {
                name,
                email: email.toLowerCase(),
                role,
                profilePicture,
                xp: 0,
                streak: 0,
            };
            
            const addedUser = await addUser(newUser);
    
            if (addedUser) {
                addToast("Kayıt başarılı! Giriş yapılıyor...", "success");
                await login(addedUser.email);
            } else {
                throw new Error("Kullanıcı oluşturulamadı.");
            }
    
        } catch (error: any) {
            addToast(`Kayıt başarısız: ${error.message}`, 'error');
            throw error;
        }
    }, [state.users, addUser, login, uploadFile, addToast]);
    
    const updateUser = useCallback(async (updatedUser: User) => {
        try {
            const userToSave = { ...updatedUser };
            userToSave.childIds = (userToSave.childIds || []).join(',') as any;
            userToSave.parentIds = (userToSave.parentIds || []).join(',') as any;
            userToSave.earnedBadgeIds = (userToSave.earnedBadgeIds || []).join(',') as any;

            await apiRequest(`/users/${updatedUser.id}`, {
                method: 'PUT',
                body: JSON.stringify(userToSave)
            });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: updatedUser }});
            if (state.currentUser?.id === updatedUser.id) {
                dispatch({ type: 'SET_CURRENT_USER', payload: updatedUser });
            }
        } catch (error: any) {
            addToast(`Kullanıcı güncellenemedi: ${error.message}`, 'error');
        }
    }, [addToast, state.currentUser?.id]);

    const deleteUser = useCallback(async (userId: string) => {
        try {
            await apiRequest('/users', {
                method: 'DELETE',
                body: JSON.stringify({ ids: [userId] })
            });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'users', ids: [userId] }});
        } catch (error: any) {
            addToast(`Kullanıcı silinemedi: ${error.message}`, 'error');
        }
    }, [addToast]);

    const findOrCreateConversation = useCallback(async (otherParticipantId: string): Promise<string | undefined> => {
        if (!state.currentUser) return;
    
        const existing = state.conversations.find(c => !c.isGroup && c.participantIds.length === 2 && c.participantIds.includes(state.currentUser!.id) && c.participantIds.includes(otherParticipantId));
        if (existing) return existing.id;
    
        const newConversation: Conversation = { id: uuid(), participantIds: [state.currentUser.id, otherParticipantId], isGroup: false };
        try {
            await apiRequest('/conversations', { method: 'POST', body: JSON.stringify({ ...newConversation, participantIds: newConversation.participantIds.join(',') }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: newConversation }});
            return newConversation.id;
        } catch (error: any) { addToast(`Sohbet oluşturulamadı: ${error.message}`, 'error'); }
        return undefined;
    }, [state.currentUser, state.conversations, addToast]);
    
    const inviteStudent = useCallback(async (name: string, email: string): Promise<void> => {
        if (!state.currentUser || (state.currentUser.role !== UserRole.Coach && state.currentUser.role !== UserRole.SuperAdmin)) {
            addToast("Sadece koçlar öğrenci davet edebilir.", "error"); return;
        }
        try {
            const newUser = await addUser({ name, email, role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=${email}`, assignedCoachId: state.currentUser.id });
            if (newUser) {
                await findOrCreateConversation(newUser.id);
                addToast(`${name} başarıyla davet edildi ve bir sohbet başlatıldı.`, "success");
            }
        } catch (error: any) { addToast(`Öğrenci davet edilemedi: ${error.message}`, 'error'); }
    }, [state.currentUser, addUser, findOrCreateConversation, addToast]);
    
     const addAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        try {
            const addedAssignments = [];
            for (const studentId of studentIds) {
                const newAssignment = { ...assignmentData, id: uuid(), studentId, checklist: JSON.stringify(assignmentData.checklist || []) };
                const added = await apiRequest('/assignments', { method: 'POST', body: JSON.stringify(newAssignment) });
                addedAssignments.push({ ...added, checklist: assignmentData.checklist || [] });
                dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'assignments', data: addedAssignments[addedAssignments.length-1] } });
            }
            addToast("Ödev(ler) başarıyla oluşturuldu.", "success");
        } catch (error: any) { addToast(`Ödev oluşturulamadı: ${error.message}`, 'error'); }
    }, [addToast]);

    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        try {
             await apiRequest(`/assignments/${updatedAssignment.id}`, { method: 'PUT', body: JSON.stringify({ ...updatedAssignment, checklist: JSON.stringify(updatedAssignment.checklist || []) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'assignments', data: updatedAssignment }});
        } catch (error: any) { addToast(`Ödev güncellenemedi: ${error.message}`, 'error'); }
    }, [addToast]);

    const deleteAssignments = useCallback(async (assignmentIds: string[]) => {
        try {
            await apiRequest('/assignments', { method: 'DELETE', body: JSON.stringify({ ids: assignmentIds }) });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'assignments', ids: assignmentIds }});
        } catch (error: any) { addToast(`Ödevler silinemedi: ${error.message}`, 'error'); }
    }, [addToast]);

    const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!state.currentUser) return;
        const message: Message = { ...messageData, id: uuid(), timestamp: new Date().toISOString(), readBy: [state.currentUser.id] };
        try {
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: message } });
            const dataToSend = { ...message, readBy: JSON.stringify(message.readBy), reactions: message.reactions ? JSON.stringify(message.reactions) : null, poll: message.poll ? JSON.stringify(message.poll) : null };
            await apiRequest('/messages', { method: 'POST', body: JSON.stringify(dataToSend) });
        } catch (error: any) {
            addToast(`Mesaj gönderilemedi: ${error.message}`, 'error');
            console.error("Failed to send message:", error);
        }
    }, [state.currentUser, addToast]);

    const markMessagesAsRead = useCallback(async (conversationId: string) => {
        if (!state.currentUser) return;
        const updatedMessages = messagesRef.current.map(m => (m.conversationId === conversationId && !m.readBy.includes(state.currentUser!.id)) ? { ...m, readBy: [...m.readBy, state.currentUser!.id] } : m);
        dispatch({ type: 'SET_ALL_DATA', payload: { messages: updatedMessages }});
        try {
            await apiRequest(`/conversations/${conversationId}/mark-as-read`, { method: 'POST', body: JSON.stringify({ userId: state.currentUser.id }) });
        } catch (error) { addToast("Mesajlar okundu olarak işaretlenemedi.", "error"); }
    }, [state.currentUser, addToast]);
    
    const markNotificationsAsRead = useCallback(async (userId: string) => {
        const updatedNotifs = state.notifications.map(n => (n.userId === userId && !n.isRead) ? { ...n, isRead: true } : n);
        dispatch({ type: 'SET_ALL_DATA', payload: { notifications: updatedNotifs }});
        try {
            await apiRequest('/notifications/mark-as-read', { method: 'POST', body: JSON.stringify({ userId }) });
        } catch (error) { addToast("Bildirimler okundu olarak işaretlenemedi.", "error"); }
    }, [state.notifications, addToast]);
    
    const addGoal = useCallback(async (newGoal: Omit<Goal, 'id'>) => {
        const goalWithId = { ...newGoal, id: uuid() };
        try {
            await apiRequest('/goals', { method: 'POST', body: JSON.stringify({ ...goalWithId, milestones: JSON.stringify(goalWithId.milestones) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'goals', data: goalWithId } });
        } catch (error: any) { addToast(`Hedef eklenemedi: ${error.message}`, 'error'); }
    }, [addToast]);
    
    const updateGoal = useCallback(async (updatedGoal: Goal) => {
        try {
            await apiRequest(`/goals/${updatedGoal.id}`, { method: 'PUT', body: JSON.stringify({ ...updatedGoal, milestones: JSON.stringify(updatedGoal.milestones) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'goals', data: updatedGoal } });
        } catch (error: any) { addToast(`Hedef güncellenemedi: ${error.message}`, 'error'); }
    }, [addToast]);
    
    const deleteGoal = useCallback(async (goalId: string) => {
        try {
            await apiRequest('/goals', { method: 'DELETE', body: JSON.stringify({ ids: [goalId] }) });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'goals', ids: [goalId] } });
        } catch (error: any) { addToast(`Hedef silinemedi: ${error.message}`, 'error'); }
    }, [addToast]);

    const addReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!state.currentUser) return;
        const message = messagesRef.current.find(m => m.id === messageId);
        if (!message) return;
    
        const updatedReactions = { ...(message.reactions || {}) };
        if (updatedReactions[emoji]?.includes(state.currentUser.id)) {
            updatedReactions[emoji] = updatedReactions[emoji].filter(id => id !== state.currentUser!.id);
            if (updatedReactions[emoji].length === 0) delete updatedReactions[emoji];
        } else {
            if (!updatedReactions[emoji]) updatedReactions[emoji] = [];
            updatedReactions[emoji].push(state.currentUser.id);
        }
    
        const updatedMessage = { ...message, reactions: updatedReactions };
        
        try {
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: updatedMessage } });
            await apiRequest(`/messages/${messageId}`, { method: 'PUT', body: JSON.stringify({ reactions: JSON.stringify(updatedReactions) }) });
        } catch (error: any) {
            addToast(`Tepki eklenemedi: ${error.message}`, 'error');
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: message } });
        }
    }, [state.currentUser, addToast]);
    
    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if (!state.currentUser) return;
        const message = messagesRef.current.find(m => m.id === messageId);
        if (!message || !message.poll) return;
    
        const updatedPoll = { ...message.poll };
        updatedPoll.options.forEach(opt => { opt.votes = opt.votes.filter(id => id !== state.currentUser!.id); });
        updatedPoll.options[optionIndex].votes.push(state.currentUser.id);
    
        const updatedMessage = { ...message, poll: updatedPoll };
        
        try {
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: updatedMessage } });
            await apiRequest(`/messages/${messageId}`, { method: 'PUT', body: JSON.stringify({ poll: JSON.stringify(updatedPoll) }) });
        } catch (error: any) {
            addToast(`Oy kullanılamadı: ${error.message}`, 'error');
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: message } });
        }
    }, [state.currentUser, addToast]);

    const startGroupChat = useCallback(async (participantIds: string[], groupName: string): Promise<string | undefined> => {
        if (!state.currentUser) return;
    
        const allParticipantIds = Array.from(new Set([...participantIds, state.currentUser.id]));
        const newConversation: Conversation = { id: uuid(), participantIds: allParticipantIds, isGroup: true, groupName, groupImage: `https://i.pravatar.cc/150?u=${uuid()}`, adminId: state.currentUser.id };
        try {
            await apiRequest('/conversations', { method: 'POST', body: JSON.stringify({ ...newConversation, participantIds: newConversation.participantIds.join(',') }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: newConversation }});
            return newConversation.id;
        } catch (error: any) { addToast(`Grup sohbeti oluşturulamadı: ${error.message}`, 'error'); }
        return undefined;
    }, [state.currentUser, addToast]);

    const updateStudentNotes = useCallback(async (studentId: string, notes: string) => {
        try {
            await apiRequest(`/users/${studentId}`, { method: 'PUT', body: JSON.stringify({ notes }) });
            const student = state.users.find(u => u.id === studentId);
            if (student) dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: { ...student, notes } }});
        } catch (error: any) { addToast(`Notlar güncellenemedi: ${error.message}`, 'error'); }
    }, [state.users, addToast]);

    const awardXp = useCallback(async (amount: number, reason: string) => {
        if (!state.currentUser) return;
        const updatedUser = { ...state.currentUser, xp: (state.currentUser.xp || 0) + amount };
        await updateUser(updatedUser);
        addToast(`+${amount} XP! ${reason}`, 'xp');
    }, [state.currentUser, updateUser, addToast]);
    
    const seedDatabase = useCallback(async () => {
        try {
            const response = await fetch('/backend/seed');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen bir kurulum hatası.'}));
                throw new Error(errorData.message);
            }
            addToast("Veritabanı deneme verileriyle dolduruldu. Sayfa yenileniyor...", "success");
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) { 
            addToast(`Veritabanı doldurulamadı: ${error.message}`, 'error');
            throw error; // Re-throw for the caller to handle
        }
    }, [addToast]);

    const addResource = useCallback(async (newResource: Omit<Resource, 'id'>) => {
        const resourceWithId = { ...newResource, id: uuid() };
        try {
            await apiRequest('/resources', { method: 'POST', body: JSON.stringify({ ...resourceWithId, assignedTo: JSON.stringify(resourceWithId.assignedTo || []) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'resources', data: resourceWithId } });
        } catch (error: any) { addToast(`Kaynak eklenemedi: ${error.message}`, 'error'); }
    }, [addToast]);

    const deleteResource = useCallback(async (resourceId: string) => {
        try {
            await apiRequest('/resources', { method: 'DELETE', body: JSON.stringify({ ids: [resourceId] }) });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'resources', ids: [resourceId] } });
        } catch (error: any) { addToast(`Kaynak silinemedi: ${error.message}`, 'error'); }
    }, [addToast]);

    const assignResourceToStudents = useCallback(async (resourceId: string, studentIds: string[]) => {
        const resource = state.resources.find(r => r.id === resourceId);
        if (!resource) return;
        const updatedResource = { ...resource, assignedTo: Array.from(new Set([...(resource.assignedTo || []), ...studentIds])) };
        try {
            await apiRequest(`/resources/${resourceId}`, { method: 'PUT', body: JSON.stringify({ assignedTo: JSON.stringify(updatedResource.assignedTo) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'resources', data: updatedResource } });
        } catch (error: any) { addToast(`Kaynak atanamadı: ${error.message}`, 'error'); }
    }, [state.resources, addToast]);

    const addTemplate = useCallback(async (templateData: Omit<AssignmentTemplate, 'id'>) => {
        const templateWithId = { ...templateData, id: uuid(), isFavorite: false };
        try {
            await apiRequest('/templates', { method: 'POST', body: JSON.stringify({ ...templateWithId, checklist: JSON.stringify(templateWithId.checklist) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'templates', data: templateWithId } });
        } catch (error: any) { addToast(`Şablon eklenemedi: ${error.message}`, 'error'); }
    }, [addToast]);

    const updateTemplate = useCallback(async (template: AssignmentTemplate) => {
        try {
            await apiRequest(`/templates/${template.id}`, { method: 'PUT', body: JSON.stringify({ ...template, checklist: JSON.stringify(template.checklist) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'templates', data: template } });
        } catch (error: any) { addToast(`Şablon güncellenemedi: ${error.message}`, 'error'); }
    }, [addToast]);

    const deleteTemplate = useCallback(async (templateId: string) => {
        try {
            await apiRequest('/templates', { method: 'DELETE', body: JSON.stringify({ ids: [templateId] }) });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'templates', ids: [templateId] } });
        } catch (error: any) { addToast(`Şablon silinemedi: ${error.message}`, 'error'); }
    }, [addToast]);
    
    const toggleTemplateFavorite = useCallback(async (templateId: string) => {
        const template = state.templates.find(t => t.id === templateId);
        if(template) await updateTemplate({ ...template, isFavorite: !template.isFavorite });
    }, [state.templates, updateTemplate]);
    
    const addUserToConversation = useCallback(async (conversationId: string, userId: string) => {
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (!conversation || conversation.participantIds.includes(userId)) return;
        const updatedConversation = { ...conversation, participantIds: [...conversation.participantIds, userId] };
        try {
            await apiRequest(`/conversations/${conversationId}`, { method: 'PUT', body: JSON.stringify({ participantIds: updatedConversation.participantIds.join(',') }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: updatedConversation }});
        } catch(e: any) { addToast(`Kullanıcı eklenemedi: ${e.message}`, 'error'); }
    }, [state.conversations, addToast]);
    
    const removeUserFromConversation = useCallback(async (conversationId: string, userId: string) => {
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (!conversation) return;
        const updatedConversation = { ...conversation, participantIds: conversation.participantIds.filter(id => id !== userId) };
        try {
            await apiRequest(`/conversations/${conversationId}`, { method: 'PUT', body: JSON.stringify({ participantIds: updatedConversation.participantIds.join(',') }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: updatedConversation }});
        } catch(e: any) { addToast(`Kullanıcı çıkarılamadı: ${e.message}`, 'error'); }
    }, [state.conversations, addToast]);

    const endConversation = useCallback(async (conversationId: string) => {
        try {
            await apiRequest('/conversations', { method: 'DELETE', body: JSON.stringify({ ids: [conversationId] }) });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'conversations', ids: [conversationId] }});
        } catch (error: any) { addToast(`Grup sonlandırılamadı: ${error.message}`, 'error'); }
    }, [addToast]);

    const setConversationArchived = useCallback(async (conversationId: string, isArchived: boolean) => {
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (!conversation) return;
        const updatedConversation = { ...conversation, isArchived };
        try {
            await apiRequest(`/conversations/${conversationId}`, { method: 'PUT', body: JSON.stringify({ isArchived: isArchived }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: updatedConversation }});
        } catch(e: any) { addToast(`Sohbet arşivlenemedi: ${e.message}`, 'error'); }
    }, [state.conversations, addToast]);

    const addCalendarEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
        const eventWithId = { ...event, id: uuid() };
        try {
            await apiRequest('/calendarEvents', { method: 'POST', body: JSON.stringify(eventWithId) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'calendarEvents', data: eventWithId } });
        } catch (error: any) { addToast(`Etkinlik eklenemedi: ${error.message}`, 'error'); }
    }, [addToast]);
    
    const addMultipleCalendarEvents = useCallback(async (events: Omit<CalendarEvent, 'id' | 'userId'>[]) => {
        if (!state.currentUser) return;
        const eventsWithIds = events.map(e => ({...e, id: uuid(), userId: state.currentUser!.id}));
        try {
            await apiRequest('/calendarEvents/batch', { method: 'POST', body: JSON.stringify(eventsWithIds) });
            eventsWithIds.forEach(e => dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'calendarEvents', data: e } }));
        } catch (error: any) { addToast(`Etkinlikler eklenemedi: ${error.message}`, 'error'); }
    }, [state.currentUser, addToast]);

    const deleteCalendarEvent = useCallback(async (eventId: string) => {
        try {
            await apiRequest('/calendarEvents', { method: 'DELETE', body: JSON.stringify({ ids: [eventId] }) });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'calendarEvents', ids: [eventId] } });
        } catch (error: any) { addToast(`Etkinlik silinemedi: ${error.message}`, 'error'); }
    }, [addToast]);

    const addExam = useCallback(async (exam: Omit<Exam, 'id'>) => {
        const examWithId = { ...exam, id: uuid() };
        try {
            await apiRequest('/exams', { method: 'POST', body: JSON.stringify({ ...examWithId, subjects: JSON.stringify(examWithId.subjects) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'exams', data: examWithId } });
        } catch (error: any) { addToast(`Sınav eklenemedi: ${error.message}`, 'error'); }
    }, [addToast]);
    
    const updateExam = useCallback(async (updatedExam: Exam) => {
        try {
            await apiRequest(`/exams/${updatedExam.id}`, { method: 'PUT', body: JSON.stringify({ ...updatedExam, subjects: JSON.stringify(updatedExam.subjects) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'exams', data: updatedExam } });
        } catch (error: any) { addToast(`Sınav güncellenemedi: ${error.message}`, 'error'); }
    }, [addToast]);
    
    const deleteExam = useCallback(async (examId: string) => {
        try {
            await apiRequest('/exams', { method: 'DELETE', body: JSON.stringify({ ids: [examId] }) });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'exams', ids: [examId] } });
        } catch (error: any) { addToast(`Sınav silinemedi: ${error.message}`, 'error'); }
    }, [addToast]);
    
    const addQuestion = useCallback(async (questionData: Omit<Question, 'id'>) => {
        const questionWithId = { ...questionData, id: uuid() };
        try {
            await apiRequest('/questions', { method: 'POST', body: JSON.stringify({ ...questionWithId, options: JSON.stringify(questionWithId.options) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'questions', data: questionWithId } });
        } catch (error: any) { addToast(`Soru eklenemedi: ${error.message}`, 'error'); }
    }, [addToast]);

    const updateQuestion = useCallback(async (question: Question) => {
        try {
            await apiRequest(`/questions/${question.id}`, { method: 'PUT', body: JSON.stringify({ ...question, options: JSON.stringify(question.options) }) });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'questions', data: question } });
        } catch (error: any) { addToast(`Soru güncellenemedi: ${error.message}`, 'error'); }
    }, [addToast]);

    const deleteQuestion = useCallback(async (questionId: string) => {
        try {
            await apiRequest('/questions', { method: 'DELETE', body: JSON.stringify({ ids: [questionId] }) });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'questions', ids: [questionId] } });
        } catch (error: any) { addToast(`Soru silinemedi: ${error.message}`, 'error'); }
    }, [addToast]);
    
    const updateBadge = useCallback(async (updatedBadge: Badge) => {
        try {
            await apiRequest(`/badges/${updatedBadge.id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedBadge)
            });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'badges', data: updatedBadge } });
            addToast("Rozet güncellendi.", "success");
        } catch (error: any) {
            addToast(`Rozet güncellenemedi: ${error.message}`, 'error');
        }
    }, [addToast]);

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
                    
                    if (convMessages.length > 0) {
                        lasts.set(c.id, convMessages[0]);
                    }
                    
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
    
    const value: DataContextType = {
        ...state, coach, students, login, logout, addUser, updateUser, deleteUser, register, inviteStudent, addAssignment, updateAssignment, deleteAssignments,
        getAssignmentsForStudent, getGoalsForStudent, findMessageById, getMessagesForConversation, sendMessage, seedDatabase, uploadFile, updateGoal, addGoal,
        deleteGoal, addReaction, voteOnPoll, updateStudentNotes, startGroupChat, findOrCreateConversation, markMessagesAsRead,
        markNotificationsAsRead, updateTypingStatus: async () => {}, awardXp, addUserToConversation, removeUserFromConversation, endConversation, setConversationArchived,
        updateBadge, addCalendarEvent, deleteCalendarEvent, addMultipleCalendarEvents, toggleTemplateFavorite, addResource, deleteResource,
        assignResourceToStudents, addTemplate, updateTemplate, deleteTemplate, addExam, updateExam, deleteExam, addQuestion, updateQuestion, deleteQuestion,
        unreadCounts, lastMessagesMap,
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