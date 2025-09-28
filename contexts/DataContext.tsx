import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useReducer } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, Conversation, AssignmentStatus, Badge, BadgeID, CalendarEvent, Poll, PollOption, AcademicTrack } from '../types';
import { useUI } from './UIContext';
import { seedData as initialSeedData } from '../services/seedData';

// --- App State and Reducer ---

const uuid = () => crypto.randomUUID();

const getInitialState = (): AppState => {
    // Deep copy to prevent mutation of the original seed data
    const seedData = JSON.parse(JSON.stringify(initialSeedData));
    
    const coachId = uuid();
    const student1Id = uuid();
    const student2Id = uuid();

    const users: User[] = [
        { id: coachId, name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@egitim.com', role: UserRole.Coach, profilePicture: `https://i.pravatar.cc/150?u=ahmet.yilmaz@egitim.com` },
        { id: student1Id, name: 'Leyla Kaya', email: 'leyla.kaya@mail.com', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=leyla.kaya@mail.com`, assignedCoachId: coachId, gradeLevel: '12', academicTrack: AcademicTrack.Sayisal, xp: 1250, streak: 3, earnedBadgeIds: [BadgeID.FirstAssignment, BadgeID.HighAchiever] },
        { id: student2Id, name: 'Mehmet Öztürk', email: 'mehmet.ozturk@mail.com', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=mehmet.ozturk@mail.com`, assignedCoachId: coachId, gradeLevel: '11', academicTrack: AcademicTrack.EsitAgirlik, xp: 850, streak: 0, earnedBadgeIds: [BadgeID.FirstAssignment] }
    ];

    const assignments: Assignment[] = seedData.assignments.map((a: any) => ({
        ...a,
        id: uuid(),
        studentId: a.studentId === "STUDENT_1_ID" ? student1Id : student2Id,
        coachId: coachId,
        checklist: a.checklist?.map((c: any) => ({ ...c, id: uuid(), isCompleted: false })) || [],
    }));

    const conversations: Conversation[] = seedData.conversations.map((c: any) => ({
        ...c,
        participantIds: c.participantIds.map((p: string) => 
            p === "COACH_ID" ? coachId : p === "STUDENT_1_ID" ? student1Id : student2Id
        ),
        adminId: c.adminId === "COACH_ID" ? coachId : c.adminId,
    }));
    
    const messages: Message[] = seedData.messages.map((m: any) => ({
        ...m,
        id: uuid(),
        senderId: m.senderId === "COACH_ID" ? coachId : student1Id,
        readBy: [m.senderId === "COACH_ID" ? coachId : student1Id]
    }));
    
    const goals: Goal[] = seedData.goals.map((g: any) => ({ ...g, id: uuid(), studentId: g.studentId === "STUDENT_1_ID" ? student1Id : student2Id }));
    const resources: Resource[] = seedData.resources.map((r: any) => ({ ...r, id: uuid(), uploaderId: coachId, assignedTo: (r.assignedTo || []).map((id:string) => id === "STUDENT_2_ID" ? student2Id : id)}));
    const templates: AssignmentTemplate[] = seedData.templates.map((t: any) => ({...t, id: uuid()}));
    
    return {
        users,
        assignments,
        messages,
        conversations,
        notifications: [],
        templates,
        resources,
        goals,
        badges: seedData.badges,
        calendarEvents: [],
        currentUser: null,
        isLoading: true,
        typingStatus: {},
    };
};


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
    currentUser: User | null;
    isLoading: boolean;
    typingStatus: { [userId: string]: boolean };
};

type Action =
    | { type: 'SET_DATA'; payload: { collection: keyof Omit<AppState, 'currentUser' | 'isLoading' | 'typingStatus'>, data: any[] } }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_CURRENT_USER'; payload: User | null }
    | { type: 'ADD_OR_UPDATE_DOC'; payload: { collection: keyof Omit<AppState, 'currentUser' | 'isLoading' | 'typingStatus'>, data: any } }
    | { type: 'REMOVE_DOC'; payload: { collection: keyof Omit<AppState, 'currentUser' | 'isLoading' | 'typingStatus'>, id: string } }
    | { type: 'RESET_STATE'; payload: { currentUserEmail: string | null } }
    | { type: 'SET_TYPING_STATUS'; payload: { userId: string; isTyping: boolean } };


const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, [action.payload.collection]: action.payload.data };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload };
        case 'RESET_STATE': {
            const initialState = getInitialState();
            const rehydratedUser = action.payload.currentUserEmail 
                ? initialState.users.find(u => u.email === action.payload.currentUserEmail) || null 
                : null;
            return {
                ...initialState,
                currentUser: rehydratedUser, 
                isLoading: false,
            };
        }
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
        case 'REMOVE_DOC': {
            const collectionName = action.payload.collection;
            const docId = action.payload.id;
            const existingCollection = state[collectionName] as any[];
            return { ...state, [collectionName]: existingCollection.filter(d => d.id !== docId) };
        }
        case 'SET_TYPING_STATUS':
             if (state.currentUser && action.payload.userId === state.currentUser.id) {
                return state; 
            }
            return { ...state, typingStatus: { ...state.typingStatus, [action.payload.userId]: action.payload.isTyping } };
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
    badges: Badge[];
    calendarEvents: CalendarEvent[];
    isLoading: boolean;
    typingStatus: { [userId: string]: boolean };
    login: (email: string) => Promise<User | null>;
    logout: () => Promise<void>;
    register: (name: string, email: string, profilePictureFile: File | null) => Promise<void>;
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
    markNotificationsAsRead: () => Promise<void>;
    updateTypingStatus: (isTyping: boolean) => Promise<void>;
    getGoalsForStudent: (studentId: string) => Goal[];
    updateGoal: (updatedGoal: Goal) => Promise<void>;
    addGoal: (newGoal: Omit<Goal, 'id'>) => Promise<void>;
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
    unreadCounts: Map<string, number>;
    lastMessagesMap: Map<string, Message>;
    startGroupChat: (participantIds: string[], groupName: string) => Promise<string | undefined>;
    findOrCreateConversation: (otherParticipantId: string) => Promise<string | undefined>;
    addUserToConversation: (conversationId: string, userId: string) => Promise<void>;
    removeUserFromConversation: (conversationId: string, userId: string) => Promise<void>;
    endConversation: (conversationId: string) => Promise<void>;
    updateBadge: (updatedBadge: Badge) => Promise<void>;
    addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'userId'>) => Promise<void>;
    deleteCalendarEvent: (eventId: string) => Promise<void>;
    toggleTemplateFavorite: (templateId: string) => Promise<void>;
    seedDatabase: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children?: ReactNode }) => {
    const [state, dispatch] = useReducer(dataReducer, getInitialState());
    const { addToast } = useUI();
    
    useEffect(() => {
        // Simulate initial data loading time
        const timer = setTimeout(() => {
            dispatch({ type: 'SET_LOADING', payload: false });
        }, 500);
        return () => clearTimeout(timer);
    }, []);


    const seedDatabase = useCallback(async () => {
        dispatch({ type: 'RESET_STATE', payload: { currentUserEmail: state.currentUser?.email || null } });
        addToast("Veritabanı deneme verileriyle dolduruldu.", "success");
    }, [addToast, state.currentUser]);

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
    
    // Simulates file upload by returning a blob URL. In a real app, this would upload to a service.
    const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
        });
    }, []);

    const login = useCallback(async (email: string): Promise<User | null> => {
        const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            dispatch({ type: 'SET_CURRENT_USER', payload: user });
            return user;
        }
        throw new Error("Kullanıcı bulunamadı veya şifre yanlış.");
    }, [state.users]);

    const logout = useCallback(async () => {
        dispatch({ type: 'SET_CURRENT_USER', payload: null });
    }, []);

    const register = useCallback(async (name: string, email: string, profilePictureFile: File | null) => {
        if (state.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            throw new Error("Bu e-posta adresi zaten kullanılıyor.");
        }

        let profilePictureUrl = `https://i.pravatar.cc/150?u=${email}`;
        if(profilePictureFile) {
            profilePictureUrl = await uploadFile(profilePictureFile, `profile-pictures/${email}`);
        }

        const isFirstUser = state.users.length === 0;
        const newUser: User = {
            id: uuid(),
            name,
            email,
            role: isFirstUser ? UserRole.SuperAdmin : UserRole.Student,
            profilePicture: profilePictureUrl,
        };

        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: newUser } });
        dispatch({ type: 'SET_CURRENT_USER', payload: newUser });

    }, [state.users, uploadFile]);
    
     const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!state.currentUser) return;
        const newMessage: Message = {
            ...messageData,
            id: uuid(),
            timestamp: new Date().toISOString(),
            readBy: [messageData.senderId],
        };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: newMessage } });
    }, [state.currentUser]);

    const addAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        studentIds.forEach(studentId => {
            const newAssignment = {
                ...assignmentData,
                id: uuid(),
                studentId,
            };
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'assignments', data: newAssignment }});
        });
    }, []);

    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'assignments', data: updatedAssignment }});
    }, []);

    const deleteAssignments = useCallback(async (assignmentIds: string[]) => {
        assignmentIds.forEach(id => {
            dispatch({ type: 'REMOVE_DOC', payload: { collection: 'assignments', id }});
        });
    }, []);
    
    const updateUser = useCallback(async (updatedUser: User) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: updatedUser }});
        if (state.currentUser?.id === updatedUser.id) {
            dispatch({ type: 'SET_CURRENT_USER', payload: updatedUser });
        }
    }, [state.currentUser]);

    const deleteUser = useCallback(async (userId: string) => {
       dispatch({ type: 'REMOVE_DOC', payload: { collection: 'users', id: userId } });
    }, []);

    const addUser = useCallback(async (newUser: Omit<User, 'id'>): Promise<User | null> => {
        const userWithId = { ...newUser, id: uuid() };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: userWithId }});
        return userWithId;
    }, []);
    
    const markMessagesAsRead = useCallback(async (conversationId: string) => {
        if (!state.currentUser) return;
        const currentUserId = state.currentUser.id;
        const updatedMessages = state.messages.map(msg => {
            if (msg.conversationId === conversationId && msg.senderId !== currentUserId && !msg.readBy.includes(currentUserId)) {
                return { ...msg, readBy: [...msg.readBy, currentUserId] };
            }
            return msg;
        });
        dispatch({ type: 'SET_DATA', payload: { collection: 'messages', data: updatedMessages } });
    }, [state.currentUser, state.messages]);
    
     const addReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!state.currentUser) return;
        const currentUserId = state.currentUser.id;
        const message = state.messages.find(m => m.id === messageId);
        if(!message) return;

        const reactions = { ...(message.reactions || {}) };
        Object.keys(reactions).forEach(key => {
            reactions[key] = reactions[key].filter(uid => uid !== currentUserId);
            if (reactions[key].length === 0) delete reactions[key];
        });
        
        if (!reactions[emoji]) reactions[emoji] = [];
        if (!reactions[emoji].includes(currentUserId)) {
            reactions[emoji].push(currentUserId);
        } else {
             reactions[emoji] = reactions[emoji].filter(uid => uid !== currentUserId);
             if (reactions[emoji].length === 0) delete reactions[emoji];
        }

        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: { ...message, reactions } }});
    }, [state.currentUser, state.messages]);
    
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
    
    const markNotificationsAsRead = useCallback(async () => {
        if (!state.currentUser) return;
        const currentUserId = state.currentUser.id;
        const updatedNotifications = state.notifications.map(n => {
            if (n.userId === currentUserId && !n.isRead) {
                return { ...n, isRead: true };
            }
            return n;
        });
        dispatch({ type: 'SET_DATA', payload: { collection: 'notifications', data: updatedNotifications } });
    }, [state.currentUser, state.notifications]);

    const updateTypingStatus = useCallback(async (isTyping: boolean) => {}, []);
    
    const updateGoal = useCallback(async (updatedGoal: Goal) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'goals', data: updatedGoal }});
    }, []);
    const addGoal = useCallback(async (newGoal: Omit<Goal, 'id'>) => {
        const goalWithId = { ...newGoal, id: uuid() };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'goals', data: goalWithId }});
    }, []);
    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if(!state.currentUser) return;
        const message = state.messages.find(m => m.id === messageId);
        if(!message || !message.poll) return;
        const newPoll = JSON.parse(JSON.stringify(message.poll));
        const userId = state.currentUser.id;
        
        newPoll.options.forEach((opt: PollOption) => {
            opt.votes = opt.votes.filter(vId => vId !== userId);
        });
        newPoll.options[optionIndex].votes.push(userId);
        
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'messages', data: { ...message, poll: newPoll } }});
    }, [state.currentUser, state.messages]);

    const toggleResourceAssignment = useCallback(async (resourceId: string, studentId: string) => {
        const resource = state.resources.find(r => r.id === resourceId);
        if(!resource) return;
        const assignedTo = resource.assignedTo || [];
        const isAssigned = assignedTo.includes(studentId);
        const newAssignedTo = isAssigned ? assignedTo.filter(id => id !== studentId) : [...assignedTo, studentId];
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'resources', data: { ...resource, assignedTo: newAssignedTo } }});
    }, [state.resources]);

    const assignResourceToStudents = useCallback(async (resourceId: string, studentIds: string[]) => {
        const resource = state.resources.find(r => r.id === resourceId);
        if(!resource) return;
        const assignedTo = new Set([...(resource.assignedTo || []), ...studentIds]);
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'resources', data: { ...resource, assignedTo: Array.from(assignedTo) } }});
    }, [state.resources]);

    const addResource = useCallback(async (resourceData: Omit<Resource, 'id' | 'uploaderId'>) => {
        if (!state.currentUser) return;
        const newResource = { ...resourceData, id: uuid(), uploaderId: state.currentUser.id };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'resources', data: newResource }});
    }, [state.currentUser]);

    const deleteResource = useCallback(async (resourceId: string) => {
        dispatch({ type: 'REMOVE_DOC', payload: { collection: 'resources', id: resourceId }});
    }, []);

    const addTemplate = useCallback(async (templateData: Omit<AssignmentTemplate, 'id'>) => {
        const newTemplate = { ...templateData, id: uuid() };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'templates', data: newTemplate }});
    }, []);

    const updateTemplate = useCallback(async (template: AssignmentTemplate) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'templates', data: template }});
    }, []);

    const deleteTemplate = useCallback(async (templateId: string) => {
        dispatch({ type: 'REMOVE_DOC', payload: { collection: 'templates', id: templateId }});
    }, []);

    const updateStudentNotes = useCallback(async (studentId: string, notes: string) => {
        const user = state.users.find(u => u.id === studentId);
        if (user) {
            dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'users', data: { ...user, notes } }});
        }
    }, [state.users]);

    const startGroupChat = useCallback(async (participantIds: string[], groupName: string) => {
        if (!state.currentUser) return;
        const newConversation: Conversation = {
            id: uuid(),
            participantIds: [state.currentUser.id, ...participantIds],
            isGroup: true,
            groupName,
            adminId: state.currentUser.id,
        };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: newConversation }});
        
        await sendMessage({
            senderId: state.currentUser.id,
            conversationId: newConversation.id,
            text: `${state.currentUser.name}, ${groupName} grubunu oluşturdu.`,
            type: 'system',
        });
        return newConversation.id;
    }, [state.currentUser, sendMessage]);

    const findOrCreateConversation = useCallback(async (otherParticipantId: string) => {
        if (!state.currentUser) return;
        const currentUserId = state.currentUser.id;

        const existing = state.conversations.find(c => 
            !c.isGroup &&
            c.participantIds.includes(currentUserId) &&
            c.participantIds.includes(otherParticipantId)
        );
            
        if (existing) return existing.id;
        
        const newConversation: Conversation = {
            id: uuid(),
            participantIds: [currentUserId, otherParticipantId],
            isGroup: false,
        };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: newConversation }});
        return newConversation.id;
    }, [state.currentUser, state.conversations]);
    const addUserToConversation = useCallback(async (conversationId: string, userId: string) => {
        const conv = state.conversations.find(c => c.id === conversationId);
        if(!conv) return;
        const newParticipants = Array.from(new Set([...conv.participantIds, userId]));
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: { ...conv, participantIds: newParticipants } }});
    }, [state.conversations]);
    const removeUserFromConversation = useCallback(async (conversationId: string, userId: string) => {
        const conv = state.conversations.find(c => c.id === conversationId);
        if(!conv) return;
        const newParticipants = conv.participantIds.filter(id => id !== userId);
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: { ...conv, participantIds: newParticipants } }});
    }, [state.conversations]);
    const endConversation = useCallback(async (conversationId: string) => {
        const conv = state.conversations.find(c => c.id === conversationId);
        if (conv) {
             dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'conversations', data: { ...conv, isArchived: true } }});
        }
    }, [state.conversations]);
    const updateBadge = useCallback(async (updatedBadge: Badge) => {
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'badges', data: updatedBadge }});
    }, []);
    const addCalendarEvent = useCallback(async (event: Omit<CalendarEvent, 'id' | 'userId'>) => {
        if (!state.currentUser) return;
        const newEvent = { ...event, id: uuid(), userId: state.currentUser.id };
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'calendarEvents', data: newEvent }});
    }, [state.currentUser]);
    const deleteCalendarEvent = useCallback(async (eventId: string) => {
        dispatch({ type: 'REMOVE_DOC', payload: { collection: 'calendarEvents', id: eventId }});
    }, []);
    const toggleTemplateFavorite = useCallback(async (templateId: string) => {
        const template = state.templates.find(t => t.id === templateId);
        if(!template) return;
        dispatch({ type: 'ADD_OR_UPDATE_DOC', payload: { collection: 'templates', data: { ...template, isFavorite: !template.isFavorite } }});
    }, [state.templates]);
    
    const value = useMemo(() => ({
        ...state,
        coach,
        students,
        getAssignmentsForStudent,
        getMessagesForConversation,
        unreadCounts,
        lastMessagesMap,
        findMessageById,
        login,
        logout,
        register,
        sendMessage,
        addAssignment,
        updateAssignment,
        deleteAssignments,
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
        toggleResourceAssignment,
        assignResourceToStudents,
        addResource,
        deleteResource,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        uploadFile,
        updateStudentNotes,
        startGroupChat,
        findOrCreateConversation,
        addUserToConversation,
        removeUserFromConversation,
        endConversation,
        updateBadge,
        addCalendarEvent,
        deleteCalendarEvent,
        toggleTemplateFavorite,
        seedDatabase,
    }), [
        state, coach, students, unreadCounts, lastMessagesMap,
        getAssignmentsForStudent, getMessagesForConversation, findMessageById,
        login, logout, register, sendMessage, addAssignment, updateAssignment, deleteAssignments,
        updateUser, deleteUser, addUser, markMessagesAsRead, markNotificationsAsRead, updateTypingStatus,
        getGoalsForStudent, updateGoal, addGoal, addReaction, voteOnPoll, toggleResourceAssignment,
        assignResourceToStudents, addResource, deleteResource, addTemplate, updateTemplate, deleteTemplate,
        uploadFile, updateStudentNotes, startGroupChat, findOrCreateConversation, addUserToConversation,
        removeUserFromConversation, endConversation, updateBadge, addCalendarEvent, deleteCalendarEvent,
        toggleTemplateFavorite, seedDatabase
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