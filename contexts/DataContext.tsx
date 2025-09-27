import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useReducer, useRef } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, Conversation, AssignmentStatus, Badge, CalendarEvent } from '../types';
import { getMockData } from '../hooks/useMockData';
import { useUI } from './UIContext';

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
    badges: [],
    calendarEvents: [],
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
    | { type: 'DELETE_ASSIGNMENTS'; payload: string[] }
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
    | { type: 'ASSIGN_RESOURCE_TO_STUDENTS'; payload: { resourceId: string; studentIds: string[] } }
    | { type: 'ADD_RESOURCE'; payload: Resource }
    | { type: 'DELETE_RESOURCE'; payload: string }
    | { type: 'ADD_TEMPLATE'; payload: AssignmentTemplate }
    | { type: 'UPDATE_TEMPLATE'; payload: AssignmentTemplate }
    | { type: 'DELETE_TEMPLATE'; payload: string }
    | { type: 'ADD_CONVERSATION'; payload: Conversation }
    | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
    | { type: 'UPDATE_BADGE'; payload: Badge }
    | { type: 'ADD_CALENDAR_EVENT'; payload: CalendarEvent }
    | { type: 'DELETE_CALENDAR_EVENT'; payload: string }
    | { type: 'TOGGLE_TEMPLATE_FAVORITE'; payload: string };

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
        case 'DELETE_ASSIGNMENTS':
            return { ...state, assignments: state.assignments.filter(a => !action.payload.includes(a.id)) };
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
                        const userId = action.payload.userId;
                        const optionIndex = action.payload.optionIndex;
                        const originalOptions = m.poll.options;

                        // Check if the user has already voted for the option they just clicked.
                        const alreadyVotedForThisOption = originalOptions[optionIndex]?.votes.includes(userId);

                        const newOptions = originalOptions.map((opt, index) => {
                            // First, remove user's vote from all options.
                            const votes = opt.votes.filter(vId => vId !== userId);
                            
                            // If it's the clicked option AND they weren't already voting for it, add the vote.
                            if (index === optionIndex && !alreadyVotedForThisOption) {
                                votes.push(userId);
                            }
                            return { ...opt, votes };
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
        case 'ASSIGN_RESOURCE_TO_STUDENTS':
            return {
                ...state,
                resources: state.resources.map(r => {
                    if (r.id === action.payload.resourceId) {
                        const currentAssigned = r.assignedTo || [];
                        const newAssigned = [...new Set([...currentAssigned, ...action.payload.studentIds])];
                        return { ...r, assignedTo: newAssigned };
                    }
                    return r;
                }),
            };
        case 'ADD_RESOURCE':
            return { ...state, resources: [...state.resources, action.payload] };
        case 'DELETE_RESOURCE':
            return { ...state, resources: state.resources.filter(r => r.id !== action.payload) };
        case 'ADD_TEMPLATE':
            return { ...state, templates: [...state.templates, action.payload] };
        case 'UPDATE_TEMPLATE':
            return { ...state, templates: state.templates.map(t => t.id === action.payload.id ? action.payload : t) };
        case 'DELETE_TEMPLATE':
            return { ...state, templates: state.templates.filter(t => t.id !== action.payload) };
         case 'ADD_CONVERSATION':
            return { ...state, conversations: [...state.conversations, action.payload] };
        case 'UPDATE_CONVERSATION':
            return { ...state, conversations: state.conversations.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'UPDATE_BADGE':
            return { ...state, badges: state.badges.map(b => b.id === action.payload.id ? action.payload : b) };
        case 'ADD_CALENDAR_EVENT':
            return { ...state, calendarEvents: [...state.calendarEvents, action.payload] };
        case 'DELETE_CALENDAR_EVENT':
            return { ...state, calendarEvents: state.calendarEvents.filter(e => e.id !== action.payload) };
        case 'TOGGLE_TEMPLATE_FAVORITE':
            return {
                ...state,
                templates: state.templates.map(t =>
                    t.id === action.payload ? { ...t, isFavorite: !t.isFavorite } : t
                ),
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
    login: (email: string, pass: string) => Promise<User | null>;
    logout: () => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
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
    seedDatabase: (uids: Record<string, string>) => Promise<void>;
    updateBadge: (updatedBadge: Badge) => Promise<void>;
    addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
    deleteCalendarEvent: (eventId: string) => Promise<void>;
    toggleTemplateFavorite: (templateId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children?: ReactNode }) => {
    const [state, dispatch] = useReducer(dataReducer, getInitialState());
    const { addToast } = useUI();
    const isInitialized = useRef(false);
    
    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;
        
        const loadData = () => {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            const { users, assignments, messages, templates, resources, goals, conversations, badges, calendarEvents } = getMockData();
            
            const defaultUser = users.find(u => u.role === UserRole.Coach) || users[0];
            sessionStorage.setItem('currentUser', JSON.stringify(defaultUser));
            
            dispatch({
                type: 'SET_INITIAL_DATA',
                payload: { users, assignments, messages, templates, resources, goals, conversations, badges, calendarEvents, notifications: [
                     { id: 'notif-1', userId: defaultUser.id, message: 'Yeni bir ödev atandı: Matematik Problemleri', timestamp: new Date().toISOString(), isRead: false, link: { page: 'assignments' } },
                     { id: 'notif-2', userId: 'student-1', message: 'Fizik raporunuz notlandırıldı: 85', timestamp: new Date(Date.now() - 3600*1000).toISOString(), isRead: false, link: { page: 'assignments' } },
                ] }
            });
            dispatch({ type: 'SET_CURRENT_USER', payload: defaultUser });
            dispatch({ type: 'SET_LOADING', payload: false });
        };
        
        const persistedUser = sessionStorage.getItem('currentUser');
        if (persistedUser) {
             const { users, assignments, messages, templates, resources, goals, conversations, badges, calendarEvents } = getMockData();
             dispatch({ type: 'SET_INITIAL_DATA', payload: { users, assignments, messages, templates, resources, goals, conversations, badges, calendarEvents } });
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

     // --- Memoized Functions ---
    const login = useCallback(async (email: string, pass: string): Promise<User | null> => {
        const user = state.users.find(u => u.email === email);
        if (user) {
            dispatch({ type: 'SET_CURRENT_USER', payload: user });
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        }
        return null;
    }, [state.users]);

    const logout = useCallback(async () => {
        dispatch({ type: 'SET_CURRENT_USER', payload: null });
        sessionStorage.removeItem('currentUser');
    }, []);

    const register = useCallback(async (name: string, email: string, pass: string) => {
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
    }, [state.users]);
    
    const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if(!state.currentUser) return;
        const newMessage: Message = {
            ...messageData,
            id: `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            readBy: [messageData.senderId],
        };
        dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
        addToast("Mesaj başarıyla gönderildi.", "success");

        // Notify recipients
        const conversation = state.conversations.find(c => c.id === messageData.conversationId);
        if (conversation) {
            const recipients = conversation.participantIds.filter(id => id !== state.currentUser!.id);
            const notificationsToAdd: AppNotification[] = recipients.map(recipientId => ({
                id: `notif-${Date.now()}-${recipientId}`,
                userId: recipientId,
                message: `${state.currentUser!.name} size yeni bir mesaj gönderdi.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                link: { page: 'messages', filter: { contactId: conversation.id } }
            }));
            dispatch({ type: 'ADD_NOTIFICATIONS', payload: notificationsToAdd });
        }
    }, [state.currentUser, state.conversations, addToast]);

    const addAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        const newAssignments: Assignment[] = studentIds.map(studentId => ({
            ...assignmentData,
            id: `asg-${Date.now()}-${studentId}`,
            studentId,
        }));
        dispatch({ type: 'ADD_ASSIGNMENTS', payload: newAssignments });

        if (state.currentUser) {
            const notificationsToAdd: AppNotification[] = studentIds.map(studentId => ({
                 id: `notif-${Date.now()}-${studentId}`,
                 userId: studentId,
                 message: `${state.currentUser!.name} size yeni bir ödev atadı: "${assignmentData.title}"`,
                 timestamp: new Date().toISOString(),
                 isRead: false,
                 link: { page: 'assignments' }
            }));
            dispatch({ type: 'ADD_NOTIFICATIONS', payload: notificationsToAdd });
        }
    }, [state.currentUser]);

    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        const oldAssignment = state.assignments.find(a => a.id === updatedAssignment.id);

        // Dispatch the main update first
        dispatch({ type: 'UPDATE_ASSIGNMENT', payload: updatedAssignment });
    
        // Now handle notifications based on the state change
        if (!oldAssignment || !state.currentUser) {
            return;
        }
    
        let notificationsToAdd: AppNotification[] = [];
    
        // Student submits an assignment -> Notify coach
        if (oldAssignment.status === AssignmentStatus.Pending && updatedAssignment.status === AssignmentStatus.Submitted) {
            const student = state.users.find(u => u.id === updatedAssignment.studentId);
            if (student) {
                addToast("Ödev başarıyla teslim edildi.", "success");
                notificationsToAdd.push({
                    id: `notif-${Date.now()}-${updatedAssignment.coachId}`,
                    userId: updatedAssignment.coachId,
                    message: `${student.name}, "${updatedAssignment.title}" ödevini teslim etti.`,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    link: { page: 'assignments', filter: { status: AssignmentStatus.Submitted, studentId: student.id } }
                });
            }
        }
        
        // Coach grades an assignment -> Notify student
        if (oldAssignment.status === AssignmentStatus.Submitted && updatedAssignment.status === AssignmentStatus.Graded) {
            addToast("Ödev notlandırıldı.", "success");
            notificationsToAdd.push({
                id: `notif-${Date.now()}-${updatedAssignment.studentId}`,
                userId: updatedAssignment.studentId,
                message: `"${updatedAssignment.title}" ödeviniz notlandırıldı: ${updatedAssignment.grade}`,
                timestamp: new Date().toISOString(),
                isRead: false,
                link: { page: 'assignments' }
            });
        }
    
        if (notificationsToAdd.length > 0) {
            dispatch({ type: 'ADD_NOTIFICATIONS', payload: notificationsToAdd });
        }
    }, [state.assignments, state.currentUser, state.users, addToast]);

    const deleteAssignments = useCallback(async (assignmentIds: string[]) => {
        dispatch({ type: 'DELETE_ASSIGNMENTS', payload: assignmentIds });
    }, []);
    
    const updateUser = useCallback(async (updatedUser: User) => {
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    }, []);

    const deleteUser = useCallback(async (userId: string) => {
         dispatch({ type: 'DELETE_USER', payload: userId });
    }, []);

    const addUser = useCallback(async (newUser: Omit<User, 'id'>): Promise<User | null> => {
        const user: User = { ...newUser, id: `user-${Date.now()}`};
        dispatch({ type: 'ADD_USER', payload: user });
        return user;
    }, []);

    const markMessagesAsRead = useCallback(async (conversationId: string) => {
        if (state.currentUser) {
            dispatch({ type: 'MARK_MESSAGES_AS_READ', payload: { conversationId, currentUserId: state.currentUser.id } });
        }
    }, [state.currentUser]);

    const markNotificationsAsRead = useCallback(async () => {
         if (state.currentUser) {
            dispatch({ type: 'MARK_NOTIFICATIONS_AS_READ', payload: { userId: state.currentUser.id } });
         }
    }, [state.currentUser]);

    const updateTypingStatus = useCallback(async (isTyping: boolean) => {}, []);
    
    const updateGoal = useCallback(async (updatedGoal: Goal) => { 
        dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    }, []);

    const addGoal = useCallback(async (newGoal: Omit<Goal, 'id'>) => { 
        const goal: Goal = { ...newGoal, id: `goal-${Date.now()}` };
        dispatch({ type: 'ADD_GOAL', payload: goal });
    }, []);

    const addReaction = useCallback(async (messageId: string, emoji: string) => {
         if (state.currentUser) {
            dispatch({ type: 'ADD_REACTION', payload: { messageId, emoji, userId: state.currentUser.id } });
         }
    }, [state.currentUser]);

    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if (state.currentUser) {
            dispatch({ type: 'VOTE_ON_POLL', payload: { messageId, optionIndex, userId: state.currentUser.id } });
        }
    }, [state.currentUser]);
    
    const toggleResourceAssignment = useCallback(async (resourceId: string, studentId: string) => {
        dispatch({ type: 'TOGGLE_RESOURCE_ASSIGNMENT', payload: { resourceId, studentId } });
    }, []);

    const assignResourceToStudents = useCallback(async (resourceId: string, studentIds: string[]) => {
        dispatch({ type: 'ASSIGN_RESOURCE_TO_STUDENTS', payload: { resourceId, studentIds } });
    }, []);

    const addResource = useCallback(async (resourceData: Omit<Resource, 'id' | 'uploaderId' | 'assignedTo'> & { isPublic: boolean; assignedTo?: string[] }) => {
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
    }, [state.currentUser]);

    const deleteResource = useCallback(async (resourceId: string) => {
        dispatch({ type: 'DELETE_RESOURCE', payload: resourceId });
    }, []);

    const addTemplate = useCallback(async (templateData: Omit<AssignmentTemplate, 'id'>) => {
        const newTemplate: AssignmentTemplate = {
            ...templateData,
            id: `temp-${Date.now()}`
        };
        dispatch({ type: 'ADD_TEMPLATE', payload: newTemplate });
    }, []);

    const updateTemplate = useCallback(async (template: AssignmentTemplate) => {
        dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
    }, []);

    const deleteTemplate = useCallback(async (templateId: string) => {
        dispatch({ type: 'DELETE_TEMPLATE', payload: templateId });
    }, []);
    
    const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return URL.createObjectURL(file);
    }, []);

    const updateStudentNotes = useCallback(async (studentId: string, notes: string) => {
        const student = state.users.find(u => u.id === studentId);
        if (student) {
            dispatch({ type: 'UPDATE_USER', payload: { ...student, notes } });
        }
    }, [state.users]);

    const startGroupChat = useCallback(async (participantIds: string[], groupName: string) => {
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
    }, [state.currentUser, sendMessage]);
    
    const findOrCreateConversation = useCallback(async (otherParticipantId: string) => {
        if (!state.currentUser) return;
        const currentUserId = state.currentUser.id;

        const existingConversation = state.conversations.find(c =>
            !c.isGroup &&
            c.participantIds.length === 2 &&
            c.participantIds.includes(currentUserId) &&
            c.participantIds.includes(otherParticipantId)
        );

        if (existingConversation) {
            return existingConversation.id;
        }

        const newConversation: Conversation = {
            id: `conv-${Date.now()}`,
            participantIds: [currentUserId, otherParticipantId],
            isGroup: false,
        };
        dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
        return newConversation.id;
    }, [state.currentUser, state.conversations]);


    const addUserToConversation = useCallback(async (conversationId: string, userId: string) => {
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
    }, [state.conversations, state.users, state.currentUser, sendMessage]);

    const removeUserFromConversation = useCallback(async (conversationId: string, userId: string) => {
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
    }, [state.conversations, state.users, state.currentUser, sendMessage]);

    const endConversation = useCallback(async (conversationId: string) => {
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation && state.currentUser) {
            dispatch({ type: 'UPDATE_CONVERSATION', payload: { ...conversation, isArchived: true } });
             sendMessage({
                senderId: state.currentUser.id,
                conversationId: conversationId,
                text: `${state.currentUser.name}, grubu sonlandırdı.`,
                type: 'system',
            });
        }
    }, [state.conversations, state.currentUser, sendMessage]);
    
    const updateBadge = useCallback(async (updatedBadge: Badge) => {
        dispatch({ type: 'UPDATE_BADGE', payload: updatedBadge });
    }, []);

    const seedDatabase = useCallback(async (uids: Record<string, string>) => {}, []);

    const addCalendarEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
        const newEvent: CalendarEvent = { ...event, id: `ce-${Date.now()}` };
        dispatch({ type: 'ADD_CALENDAR_EVENT', payload: newEvent });
    }, []);

    const deleteCalendarEvent = useCallback(async (eventId: string) => {
        dispatch({ type: 'DELETE_CALENDAR_EVENT', payload: eventId });
    }, []);

    const toggleTemplateFavorite = useCallback(async (templateId: string) => {
        dispatch({ type: 'TOGGLE_TEMPLATE_FAVORITE', payload: templateId });
    }, []);

    const value = useMemo(() => ({
        currentUser: state.currentUser,
        users: state.users,
        assignments: state.assignments,
        messages: state.messages,
        conversations: state.conversations,
        notifications: state.notifications,
        templates: state.templates,
        resources: state.resources,
        goals: state.goals,
        badges: state.badges,
        calendarEvents: state.calendarEvents,
        isLoading: state.isLoading,
        typingStatus: state.typingStatus,
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
        findMessageById,
        toggleResourceAssignment,
        assignResourceToStudents,
        addResource,
        deleteResource,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        uploadFile,
        updateStudentNotes,
        unreadCounts,
        lastMessagesMap,
        startGroupChat,
        findOrCreateConversation,
        addUserToConversation,
        removeUserFromConversation,
        endConversation,
        seedDatabase,
        updateBadge,
        addCalendarEvent,
        deleteCalendarEvent,
        toggleTemplateFavorite,
    }), [
        state, coach, students, unreadCounts, lastMessagesMap,
        login, logout, register, getAssignmentsForStudent, getMessagesForConversation,
        sendMessage, addAssignment, updateAssignment, deleteAssignments, updateUser, deleteUser, addUser,
        markMessagesAsRead, markNotificationsAsRead, updateTypingStatus, getGoalsForStudent,
        updateGoal, addGoal, addReaction, voteOnPoll, findMessageById, toggleResourceAssignment,
        assignResourceToStudents, addResource, deleteResource, addTemplate, updateTemplate, deleteTemplate, uploadFile, updateStudentNotes, startGroupChat,
        findOrCreateConversation, addUserToConversation, removeUserFromConversation, endConversation,
        seedDatabase, updateBadge, addCalendarEvent, deleteCalendarEvent, toggleTemplateFavorite
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