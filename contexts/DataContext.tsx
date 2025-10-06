import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useReducer } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, Conversation, AssignmentStatus, Badge, BadgeID, CalendarEvent, Poll, PollOption, AcademicTrack, Exam, Question, NotificationPriority, Page } from '../types';
import { useUI } from './UIContext';
import { seedData as initialSeedData } from '../services/seedData';

// --- App State and Reducer ---
const uuid = () => crypto.randomUUID();

const getInitialState = (): AppState => ({
    users: [],
    assignments: [],
    messages: [],
    conversations: [],
    notifications: [],
    templates: [],
    resources: [],
    goals: [],
    badges: initialSeedData.badges, // Badges are mostly static
    calendarEvents: [],
    exams: [],
    questions: [],
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
    badges: Badge[];
    calendarEvents: CalendarEvent[];
    exams: Exam[];
    questions: Question[];
    currentUser: User | null;
    isLoading: boolean;
    typingStatus: { [userId: string]: boolean };
};

type Action =
    | { type: 'SET_ALL_DATA', payload: Partial<AppState> }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_CURRENT_USER'; payload: User | null }
    | { type: 'ADD_OR_UPDATE_DOC'; payload: { collection: keyof Omit<AppState, 'currentUser' | 'isLoading' | 'typingStatus'>, data: any } }
    | { type: 'REMOVE_DOCS'; payload: { collection: keyof Omit<AppState, 'currentUser' | 'isLoading' | 'typingStatus'>, ids: string[] } };

const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_ALL_DATA':
            return { ...state, ...action.payload, isLoading: false };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload };
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
    const response = await fetch(`/api${endpoint}`, {
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
    // ... other functions ...
    unreadCounts: Map<string, number>;
    lastMessagesMap: Map<string, Message>;
    // The rest of the functions from the original interface
    markNotificationsAsRead: () => Promise<void>;
    updateTypingStatus: (isTyping: boolean) => Promise<void>;
    getGoalsForStudent: (studentId: string) => Goal[];
    updateGoal: (updatedGoal: Goal) => Promise<void>;
    addGoal: (newGoal: Omit<Goal, 'id'>) => Promise<void>;
    deleteGoal: (goalId: string) => Promise<void>;
    addReaction: (messageId: string, emoji: string) => Promise<void>;
    voteOnPoll: (messageId: string, optionIndex: number) => Promise<void>;
    findMessageById: (messageId: string) => Message | undefined;
    toggleResourceAssignment: (resourceId: string, studentId: string) => Promise<void>;
    assignResourceToStudents: (resourceId: string, studentIds: string[]) => Promise<void>;
    addResource: (newResource: Omit<Resource, 'id' | 'uploaderId' | 'assignedTo'> & { isPublic: boolean; assignedTo?: string[] }) => Promise<void>;
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
    addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'userId'>) => Promise<void>;
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await apiRequest('/data');
                dispatch({ type: 'SET_ALL_DATA', payload: data });
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                addToast("Veriler yüklenemedi. Lütfen sayfayı yenileyin.", "error");
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };
        fetchData();
    }, [addToast]);
    
     const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
        // This remains client-side for now, as setting up backend file uploads is complex.
        // In a real app, this would be an API call to a signed URL or a backend endpoint.
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
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
    
            // The first user registered becomes the superadmin
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
            // Convert arrays to strings for DB
            if (Array.isArray(userToSave.childIds)) userToSave.childIds = userToSave.childIds.join(',') as any;
            if (Array.isArray(userToSave.parentIds)) userToSave.parentIds = userToSave.parentIds.join(',') as any;
            if (Array.isArray(userToSave.earnedBadgeIds)) userToSave.earnedBadgeIds = userToSave.earnedBadgeIds.join(',') as any;

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
    
        const existing = state.conversations.find(c => 
            !c.isGroup && 
            c.participantIds.includes(state.currentUser!.id) && 
            c.participantIds.includes(otherParticipantId)
        );
        if (existing) return existing.id;
    
        const newConversation: Conversation = {
            id: uuid(),
            participantIds: [state.currentUser.id, otherParticipantId],
            isGroup: false,
        };
        try {
            await apiRequest('/conversations', {
                method: 'POST',
                body: JSON.stringify({
                    ...newConversation,
                    participantIds: newConversation.participantIds.join(','),
                }),
            });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: newConversation }});
            return newConversation.id;
        } catch (error: any) {
            addToast(`Sohbet oluşturulamadı: ${error.message}`, 'error');
        }
        return undefined;
    }, [state.currentUser, state.conversations, addToast]);
    
    const inviteStudent = useCallback(async (name: string, email: string): Promise<void> => {
        if (!state.currentUser || (state.currentUser.role !== UserRole.Coach && state.currentUser.role !== UserRole.SuperAdmin)) {
            addToast("Sadece koçlar öğrenci davet edebilir.", "error");
            return;
        }
        try {
            const newUser = await addUser({
                name,
                email,
                role: UserRole.Student,
                profilePicture: `https://i.pravatar.cc/150?u=${email}`,
                assignedCoachId: state.currentUser.id, // Assign to current coach
            });
    
            if (newUser) {
                await findOrCreateConversation(newUser.id);
                addToast(`${name} başarıyla davet edildi ve bir sohbet başlatıldı.`, "success");
            }
        } catch (error: any) {
            addToast(`Öğrenci davet edilemedi: ${error.message}`, 'error');
        }
    }, [state.currentUser, addUser, findOrCreateConversation, addToast]);
    
     const addAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        try {
            for (const studentId of studentIds) {
                const newAssignment = {
                    ...assignmentData,
                    id: uuid(),
                    studentId,
                    checklist: JSON.stringify(assignmentData.checklist || []),
                };
                const addedAssignment = await apiRequest('/assignments', {
                    method: 'POST',
                    body: JSON.stringify(newAssignment)
                });
                dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'assignments', data: { ...addedAssignment, checklist: assignmentData.checklist || [] } } });
            }
             addToast("Ödev(ler) başarıyla oluşturuldu.", "success");
        } catch (error: any) {
             addToast(`Ödev oluşturulamadı: ${error.message}`, 'error');
        }
    }, [addToast]);

    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        try {
             await apiRequest(`/assignments/${updatedAssignment.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...updatedAssignment,
                    checklist: JSON.stringify(updatedAssignment.checklist || [])
                })
            });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'assignments', data: updatedAssignment }});
        } catch (error: any) {
            addToast(`Ödev güncellenemedi: ${error.message}`, 'error');
        }
    }, [addToast]);

    const deleteAssignments = useCallback(async (assignmentIds: string[]) => {
        try {
            await apiRequest('/assignments', {
                method: 'DELETE',
                body: JSON.stringify({ ids: assignmentIds })
            });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'assignments', ids: assignmentIds }});
        } catch (error: any) {
            addToast(`Ödevler silinemedi: ${error.message}`, 'error');
        }
    }, [addToast]);

    const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!state.currentUser) return;
    
        const message: Message = {
            ...messageData,
            id: uuid(),
            timestamp: new Date().toISOString(),
            readBy: [state.currentUser.id],
        };
    
        try {
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: message } });
    
            const dataToSend = {
                ...message,
                readBy: JSON.stringify(message.readBy),
                reactions: message.reactions ? JSON.stringify(message.reactions) : null,
                poll: message.poll ? JSON.stringify(message.poll) : null,
            };
    
            await apiRequest('/messages', {
                method: 'POST',
                body: JSON.stringify(dataToSend)
            });
        } catch (error: any) {
            addToast(`Mesaj gönderilemedi: ${error.message}`, 'error');
            console.error("Failed to send message:", error);
        }
    }, [state.currentUser, addToast]);

    const addGoal = useCallback(async (newGoal: Omit<Goal, 'id'>) => {
        const goalWithId = { ...newGoal, id: uuid() };
        try {
            await apiRequest('/goals', {
                method: 'POST',
                body: JSON.stringify({ ...goalWithId, milestones: JSON.stringify(goalWithId.milestones) })
            });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'goals', data: goalWithId } });
        } catch (error: any) {
            addToast(`Hedef eklenemedi: ${error.message}`, 'error');
        }
    }, [addToast]);
    
    const updateGoal = useCallback(async (updatedGoal: Goal) => {
        try {
            await apiRequest(`/goals/${updatedGoal.id}`, {
                method: 'PUT',
                body: JSON.stringify({ ...updatedGoal, milestones: JSON.stringify(updatedGoal.milestones) })
            });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'goals', data: updatedGoal } });
        } catch (error: any) {
            addToast(`Hedef güncellenemedi: ${error.message}`, 'error');
        }
    }, [addToast]);
    
    const deleteGoal = useCallback(async (goalId: string) => {
        try {
            await apiRequest('/goals', {
                method: 'DELETE',
                body: JSON.stringify({ ids: [goalId] })
            });
            dispatch({ type: 'REMOVE_DOCS', payload: { collection: 'goals', ids: [goalId] } });
        } catch (error: any) {
            addToast(`Hedef silinemedi: ${error.message}`, 'error');
        }
    }, [addToast]);

    const addReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!state.currentUser) return;
        const message = state.messages.find(m => m.id === messageId);
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
            await apiRequest(`/messages/${messageId}`, {
                method: 'PUT',
                body: JSON.stringify({ reactions: JSON.stringify(updatedReactions) })
            });
        } catch (error: any) {
            addToast(`Tepki eklenemedi: ${error.message}`, 'error');
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: message } });
        }
    }, [state.currentUser, state.messages, addToast]);
    
    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if (!state.currentUser) return;
        const message = state.messages.find(m => m.id === messageId);
        if (!message || !message.poll) return;
    
        const updatedPoll = { ...message.poll };
        updatedPoll.options.forEach(opt => {
            opt.votes = opt.votes.filter(id => id !== state.currentUser!.id);
        });
        updatedPoll.options[optionIndex].votes.push(state.currentUser.id);
    
        const updatedMessage = { ...message, poll: updatedPoll };
        
        try {
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: updatedMessage } });
            await apiRequest(`/messages/${messageId}`, {
                method: 'PUT',
                body: JSON.stringify({ poll: JSON.stringify(updatedPoll) })
            });
        } catch (error: any) {
            addToast(`Oy kullanılamadı: ${error.message}`, 'error');
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: message } });
        }
    }, [state.currentUser, state.messages, addToast]);

    const startGroupChat = useCallback(async (participantIds: string[], groupName: string): Promise<string | undefined> => {
        if (!state.currentUser) return;
    
        const allParticipantIds = Array.from(new Set([...participantIds, state.currentUser.id]));
        const newConversation: Conversation = {
            id: uuid(),
            participantIds: allParticipantIds,
            isGroup: true,
            groupName,
            groupImage: `https://i.pravatar.cc/150?u=${uuid()}`,
            adminId: state.currentUser.id,
        };
        try {
            await apiRequest('/conversations', {
                method: 'POST',
                body: JSON.stringify({
                    ...newConversation,
                    participantIds: newConversation.participantIds.join(','),
                }),
            });
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: newConversation }});
            return newConversation.id;
        } catch (error: any) {
            addToast(`Grup sohbeti oluşturulamadı: ${error.message}`, 'error');
        }
        return undefined;
    }, [state.currentUser, addToast]);

    const updateStudentNotes = useCallback(async (studentId: string, notes: string) => {
        try {
            await apiRequest(`/users/${studentId}`, {
                method: 'PUT',
                body: JSON.stringify({ notes })
            });
            const student = state.users.find(u => u.id === studentId);
            if (student) {
                dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: { ...student, notes } }});
            }
        } catch (error: any) {
            addToast(`Notlar güncellenemedi: ${error.message}`, 'error');
        }
    }, [state.users, addToast]);


    const seedDatabase = async () => {
         try {
            await fetch('/api/seed');
            addToast("Veritabanı deneme verileriyle dolduruldu.", "success");
            window.location.reload();
        } catch (error: any) {
            addToast(`Veritabanı doldurulamadı: ${error.message}`, 'error');
        }
    }
    
    // Most memoized calculations and getters can remain the same
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

    // ... The rest of the provider would be filled with converted functions
    const getAssignmentsForStudent = useCallback((studentId: string) => state.assignments.filter(a => a.studentId === studentId), [state.assignments]);
    const getGoalsForStudent = useCallback((studentId: string) => state.goals.filter(g => g.studentId === studentId), [state.goals]);
    const findMessageById = useCallback((messageId: string) => state.messages.find(m => m.id === messageId), [state.messages]);
    const getMessagesForConversation = useCallback((conversationId: string) => {
         if (!state.currentUser) return [];
         return state.messages.filter(m => m.conversationId === conversationId)
            .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [state.messages, state.currentUser]);
    
    const value = {
        ...state,
        coach,
        students,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        register,
        inviteStudent,
        addAssignment,
        updateAssignment,
        deleteAssignments,
        getAssignmentsForStudent,
        getGoalsForStudent,
        findMessageById,
        getMessagesForConversation,
        sendMessage,
        seedDatabase,
        uploadFile,
        updateGoal,
        addGoal,
        deleteGoal,
        addReaction,
        voteOnPoll,
        updateStudentNotes,
        startGroupChat,
        findOrCreateConversation,
        // Provide placeholder or converted implementations for all other functions
        markMessagesAsRead: async () => {},
        markNotificationsAsRead: async () => {},
        updateTypingStatus: async () => {},
        toggleResourceAssignment: async () => { addToast('toggleResourceAssignment function not implemented for DB.', 'info')},
        assignResourceToStudents: async () => { addToast('assignResourceToStudents function not implemented for DB.', 'info')},
        addResource: async () => { addToast('addResource function not implemented for DB.', 'info')},
        deleteResource: async () => { addToast('deleteResource function not implemented for DB.', 'info')},
        addTemplate: async () => { addToast('addTemplate function not implemented for DB.', 'info')},
        updateTemplate: async () => { addToast('updateTemplate function not implemented for DB.', 'info')},
        deleteTemplate: async () => { addToast('deleteTemplate function not implemented for DB.', 'info')},
        awardXp: async () => { /* XP logic is client-side for now */},
        addUserToConversation: async () => { addToast('addUserToConversation function not implemented for DB.', 'info')},
        removeUserFromConversation: async () => { addToast('removeUserFromConversation function not implemented for DB.', 'info')},
        endConversation: async () => { addToast('endConversation function not implemented for DB.', 'info')},
        setConversationArchived: async () => { addToast('setConversationArchived function not implemented for DB.', 'info')},
        updateBadge: async () => { addToast('updateBadge function not implemented for DB.', 'info')},
        addCalendarEvent: async () => { addToast('addCalendarEvent function not implemented for DB.', 'info')},
        addMultipleCalendarEvents: async () => { addToast('addMultipleCalendarEvents function not implemented for DB.', 'info')},
        deleteCalendarEvent: async () => { addToast('deleteCalendarEvent function not implemented for DB.', 'info')},
        toggleTemplateFavorite: async () => { addToast('toggleTemplateFavorite function not implemented for DB.', 'info')},
        addExam: async () => { addToast('addExam function not implemented for DB.', 'info')},
        updateExam: async () => { addToast('updateExam function not implemented for DB.', 'info')},
        deleteExam: async () => { addToast('deleteExam function not implemented for DB.', 'info')},
        addQuestion: async () => { addToast('addQuestion function not implemented for DB.', 'info')},
        updateQuestion: async () => { addToast('updateQuestion function not implemented for DB.', 'info')},
        deleteQuestion: async () => { addToast('deleteQuestion function not implemented for DB.', 'info')},
        unreadCounts: new Map(),
        lastMessagesMap: new Map(),
    } as unknown as DataContextType;


    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};