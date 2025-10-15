import { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useState } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, Conversation, Badge, CalendarEvent, Exam, Question } from '../types';
import { useUI } from './UIContext';
import apiService, { setToastHandler } from '../services/apiService';
import { AxiosResponse } from 'axios';

const uuid = () => crypto.randomUUID();

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
    isApiLoading: boolean;
    isDbInitialized: boolean;
    typingStatus: { [userId: string]: boolean };

    login: (email: string, password: string) => Promise<User | null>;
    logout: () => Promise<void>;
    register: (name: string, email: string, password: string, profilePictureFile: File | null) => Promise<User | null>;
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
    uploadFile: (file: File) => Promise<string>;
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
    const { addToast } = useUI();
    
    const [users, setUsers] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [templates, setTemplates] = useState<AssignmentTemplate[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDbInitialized, setIsDbInitialized] = useState(false);
    const [isApiLoading, setIsApiLoading] = useState(false);

    useEffect(() => {
        setToastHandler(addToast);
    }, [addToast]);
    
    useEffect(() => {
        const initialize = async () => {
            try {
                await apiService.post('/api/setup');

                const [
                    usersRes, assignmentsRes, messagesRes, conversationsRes,
                    notificationsRes, templatesRes, resourcesRes, goalsRes,
                    badgesRes, calendarEventsRes, examsRes, questionsRes
                ] = await Promise.all([
                    apiService.get<User[]>('/api/users'),
                    apiService.get<Assignment[]>('/api/assignments'),
                    apiService.get<Message[]>('/api/messages'),
                    apiService.get<Conversation[]>('/api/conversations'),
                    apiService.get<AppNotification[]>('/api/notifications'),
                    apiService.get<AssignmentTemplate[]>('/api/templates'),
                    apiService.get<Resource[]>('/api/resources'),
                    apiService.get<Goal[]>('/api/goals'),
                    apiService.get<Badge[]>('/api/badges'),
                    apiService.get<CalendarEvent[]>('/api/calendarEvents'),
                    apiService.get<Exam[]>('/api/exams'),
                    apiService.get<Question[]>('/api/questions')
                ]);

                setUsers(usersRes.data);
                setAssignments(assignmentsRes.data);
                setMessages(messagesRes.data);
                setConversations(conversationsRes.data);
                setNotifications(notificationsRes.data);
                setTemplates(templatesRes.data);
                setResources(resourcesRes.data);
                setGoals(goalsRes.data);
                setBadges(badgesRes.data);
                setCalendarEvents(calendarEventsRes.data);
                setExams(examsRes.data);
                setQuestions(questionsRes.data);

                const storedUser = sessionStorage.getItem('currentUser');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    const freshUser = usersRes.data.find(u => u.id === parsedUser.id);
                    if (freshUser) {
                        setCurrentUser(freshUser);
                    } else {
                        sessionStorage.removeItem('currentUser');
                    }
                }
                
                setIsDbInitialized(true);
            } catch (error) {
                console.error("Initialization failed:", error);
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, []);
    
    const withApiLoading = async <T,>(promise: Promise<T>): Promise<T> => {
        setIsApiLoading(true);
        try {
            return await promise;
        } finally {
            setIsApiLoading(false);
        }
    };

    const uploadFile = useCallback(async (file: File): Promise<string> => {
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

    const login = useCallback(async (email: string, password: string): Promise<User | null> => {
        const response: AxiosResponse<User> = await withApiLoading(apiService.post('/api/login', { email, password }));
        const user = response.data;
        if (user) {
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        }
        return null;
    }, []);

    const logout = useCallback(async () => {
        setCurrentUser(null);
        sessionStorage.removeItem('currentUser');
    }, []);

    const register = useCallback(async (name: string, email: string, password: string, profilePictureFile: File | null): Promise<User | null> => {
        return await withApiLoading((async () => {
            const id = uuid();
            let profilePicture = `https://i.pravatar.cc/150?u=${email}`;
            if (profilePictureFile) {
                profilePicture = await uploadFile(profilePictureFile);
            }
            const response: AxiosResponse<User> = await apiService.post('/api/register', { id, name, email, password, role: 'student', profilePicture });
            const user = response.data;
            if (user) {
                setUsers(prev => [...prev, user]);
                setCurrentUser(user);
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                return user;
            }
            return null;
        })());
    }, [uploadFile]);

    const addUser = useCallback(async (newUser: Omit<User, 'id'>): Promise<User | null> => {
        const userWithId = { ...newUser, id: uuid() };
        const response: AxiosResponse<User> = await withApiLoading(apiService.post('/api/users', userWithId));
        const addedUser = response.data;
        setUsers(prev => [...prev, addedUser]);
        return addedUser;
    }, []);

    const updateUser = useCallback(async (updatedUser: User) => {
        const response: AxiosResponse<User> = await withApiLoading(apiService.put(`/api/users/${updatedUser.id}`, updatedUser));
        const user = response.data;
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        if (currentUser?.id === user.id) {
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        }
    }, [currentUser?.id]);
    
    const deleteUser = useCallback(async (userId: string) => {
        await withApiLoading(apiService.delete('/api/users', { data: { ids: [userId] } }));
        setUsers(prev => prev.filter(u => u.id !== userId));
    }, []);

    const findOrCreateConversation = useCallback(async (otherParticipantId: string): Promise<string | undefined> => {
        if (!currentUser) return;
        const response: AxiosResponse<Conversation> = await withApiLoading(apiService.post('/api/conversations/findOrCreate', { userId1: currentUser.id, userId2: otherParticipantId }));
        const result = response.data;
        if (!conversations.some(c => c.id === result.id)) {
            setConversations(prev => [...prev, result]);
        }
        return result.id;
    }, [currentUser, conversations]);

     const inviteStudent = useCallback(async (name: string, email: string): Promise<void> => {
        if (!currentUser || (currentUser.role !== UserRole.Coach && currentUser.role !== UserRole.SuperAdmin)) {
            throw new Error("Sadece koçlar öğrenci davet edebilir.");
        }
        const newUser = await addUser({ name, email, role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=${email}`, assignedCoachId: currentUser.id });
        if (newUser) {
            await findOrCreateConversation(newUser.id);
        }
    }, [currentUser, addUser, findOrCreateConversation]);
    
    const addAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        await withApiLoading((async () => {
            for (const studentId of studentIds) {
                const newAssignment = { ...assignmentData, id: uuid(), studentId };
                const response: AxiosResponse<Assignment> = await apiService.post('/api/assignments', newAssignment);
                setAssignments(prev => [...prev, response.data]);
            }
        })());
    }, []);

    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        const response: AxiosResponse<Assignment> = await withApiLoading(apiService.put(`/api/assignments/${updatedAssignment.id}`, updatedAssignment));
        setAssignments(prev => prev.map(a => a.id === response.data.id ? response.data : a));
    }, []);

    const deleteAssignments = useCallback(async (assignmentIds: string[]) => {
        await withApiLoading(apiService.delete('/api/assignments', { data: { ids: assignmentIds } }));
        setAssignments(prev => prev.filter(a => !assignmentIds.includes(a.id)));
    }, []);

    const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!currentUser) return;
        const message: Message = { ...messageData, id: uuid(), timestamp: new Date().toISOString(), readBy: [currentUser.id] };
        const response: AxiosResponse<Message> = await withApiLoading(apiService.post('/api/messages', message));
        setMessages(prev => [...prev, response.data]);
    }, [currentUser]);

    const markMessagesAsRead = useCallback(async (conversationId: string) => {
        if (!currentUser) return;
        const myId = currentUser.id;
        let changed = false;
        const updatedMessages = messages.map(m => {
            if (m.conversationId === conversationId && !m.readBy.includes(myId)) {
                changed = true;
                const updatedReadBy = [...m.readBy, myId];
                withApiLoading(apiService.put(`/api/messages/${m.id}`, { readBy: updatedReadBy }));
                return { ...m, readBy: updatedReadBy };
            }
            return m;
        });
        if (changed) setMessages(updatedMessages);
    }, [currentUser, messages]);

    const markNotificationsAsRead = useCallback(async (userId: string) => {
        let changed = false;
        const updated = notifications.map(n => {
            if (n.userId === userId && !n.isRead) {
                changed = true;
                withApiLoading(apiService.put(`/api/notifications/${n.id}`, { isRead: true }));
                return { ...n, isRead: true };
            }
            return n;
        });
        if (changed) setNotifications(updated);
    }, [notifications]);

    const addGoal = useCallback(async (newGoal: Omit<Goal, 'id'>) => {
        const response: AxiosResponse<Goal> = await withApiLoading(apiService.post('/api/goals', { ...newGoal, id: uuid() }));
        setGoals(prev => [...prev, response.data]);
    }, []);
    
    const updateGoal = useCallback(async (updatedGoal: Goal) => {
        const response: AxiosResponse<Goal> = await withApiLoading(apiService.put(`/api/goals/${updatedGoal.id}`, updatedGoal));
        setGoals(prev => prev.map(g => g.id === response.data.id ? response.data : g));
    }, []);

    const deleteGoal = useCallback(async (goalId: string) => {
        await withApiLoading(apiService.delete('/api/goals', { data: { ids: [goalId] } }));
        setGoals(prev => prev.filter(g => g.id !== goalId));
    }, []);
    
    const updateMessage = useCallback(async (msg: Message) => {
        const response: AxiosResponse<Message> = await withApiLoading(apiService.put(`/api/messages/${msg.id}`, msg));
        setMessages(prev => prev.map(m => m.id === response.data.id ? response.data : m));
    }, []);

    const addReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!currentUser) return;
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const updatedReactions = { ...(message.reactions || {}) };
        const myId = currentUser.id;

        if (updatedReactions[emoji]?.includes(myId)) {
            updatedReactions[emoji] = updatedReactions[emoji].filter(id => id !== myId);
            if (updatedReactions[emoji].length === 0) delete updatedReactions[emoji];
        } else {
            if (!updatedReactions[emoji]) updatedReactions[emoji] = [];
            updatedReactions[emoji].push(myId);
        }
        await updateMessage({ ...message, reactions: updatedReactions });
    }, [currentUser, messages, updateMessage]);
    
    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if (!currentUser) return;
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.poll) return;
        
        const myId = currentUser.id;
        const updatedOptions = message.poll.options.map(opt => ({ ...opt, votes: opt.votes.filter(id => id !== myId) }));
        updatedOptions[optionIndex].votes.push(myId);
        
        await updateMessage({ ...message, poll: { ...message.poll, options: updatedOptions } });
    }, [currentUser, messages, updateMessage]);

    const updateConversation = useCallback(async (conv: Conversation) => {
        const response: AxiosResponse<Conversation> = await withApiLoading(apiService.put(`/api/conversations/${conv.id}`, conv));
        setConversations(prev => prev.map(c => c.id === response.data.id ? response.data : c));
    }, []);

    const startGroupChat = useCallback(async (participantIds: string[], groupName: string): Promise<string | undefined> => {
        if (!currentUser) return;
        const allParticipantIds = Array.from(new Set([...participantIds, currentUser.id]));
        const newConversation: Omit<Conversation, 'id'> = { participantIds: allParticipantIds, isGroup: true, groupName, groupImage: `https://i.pravatar.cc/150?u=${uuid()}`, adminId: currentUser.id };
        const response: AxiosResponse<Conversation> = await withApiLoading(apiService.post('/api/conversations', { ...newConversation, id: uuid() }));
        const added = response.data;
        setConversations(prev => [...prev, added]);
        return added.id;
    }, [currentUser]);

    const addUserToConversation = useCallback(async (conversationId: string, userId: string) => {
        const conv = conversations.find(c => c.id === conversationId);
        if (conv && conv.isGroup && !conv.participantIds.includes(userId)) {
            await updateConversation({ ...conv, participantIds: [...conv.participantIds, userId] });
        }
    }, [conversations, updateConversation]);

    const removeUserFromConversation = useCallback(async (conversationId: string, userId: string) => {
        const conv = conversations.find(c => c.id === conversationId);
        if (conv && conv.isGroup) {
            await updateConversation({ ...conv, participantIds: conv.participantIds.filter(id => id !== userId) });
        }
    }, [conversations, updateConversation]);

    const endConversation = useCallback(async (conversationId: string) => {
        await withApiLoading(apiService.delete('/api/conversations', { data: { ids: [conversationId] } }));
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        setMessages(prev => prev.filter(m => m.conversationId !== conversationId));
    }, []);

    const updateStudentNotes = useCallback(async (studentId: string, notes: string) => {
        await withApiLoading(apiService.put(`/api/users/${studentId}`, { notes }));
        setUsers(prev => prev.map(u => u.id === studentId ? { ...u, notes } : u));
    }, []);

    const awardXp = useCallback(async (amount: number, reason: string) => {
        if (!currentUser) return;
        const newXp = (currentUser.xp || 0) + amount;
        await updateUser({ ...currentUser, xp: newXp });
        addToast(`+${amount} XP! ${reason}`, 'xp');
    }, [currentUser, updateUser, addToast]);

    const addResource = useCallback(async (newResource: Omit<Resource, 'id'>) => {
        const response: AxiosResponse<Resource> = await withApiLoading(apiService.post('/api/resources', { ...newResource, id: uuid() }));
        setResources(prev => [...prev, response.data]);
    }, []);

    const deleteResource = useCallback(async (resourceId: string) => {
        await withApiLoading(apiService.delete('/api/resources', { data: { ids: [resourceId] } }));
        setResources(prev => prev.filter(r => r.id !== resourceId));
    }, []);

    const assignResourceToStudents = useCallback(async (resourceId: string, studentIds: string[]) => {
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) return;
        const updatedResource = { ...resource, assignedTo: Array.from(new Set([...(resource.assignedTo || []), ...studentIds])) };
        const response: AxiosResponse<Resource> = await withApiLoading(apiService.put(`/api/resources/${resourceId}`, updatedResource));
        setResources(prev => prev.map(r => r.id === resourceId ? response.data : r));
    }, [resources]);

    const addTemplate = useCallback(async (templateData: Omit<AssignmentTemplate, 'id'>) => {
        const response: AxiosResponse<AssignmentTemplate> = await withApiLoading(apiService.post('/api/templates', { ...templateData, id: uuid() }));
        setTemplates(prev => [...prev, response.data]);
    }, []);
    
    const updateTemplate = useCallback(async (template: AssignmentTemplate) => {
        const response: AxiosResponse<AssignmentTemplate> = await withApiLoading(apiService.put(`/api/templates/${template.id}`, template));
        setTemplates(prev => prev.map(t => t.id === response.data.id ? response.data : t));
    }, []);
    
    const deleteTemplate = useCallback(async (templateId: string) => {
        await withApiLoading(apiService.delete('/api/templates', { data: { ids: [templateId] } }));
        setTemplates(prev => prev.filter(t => t.id !== templateId));
    }, []);
    
    const addCalendarEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
        const response: AxiosResponse<CalendarEvent> = await withApiLoading(apiService.post('/api/calendarEvents', { ...event, id: uuid() }));
        setCalendarEvents(prev => [...prev, response.data]);
    }, []);

    const addMultipleCalendarEvents = useCallback(async (events: Omit<CalendarEvent, 'id' | 'userId'>[]) => {
        if (!currentUser) return;
        await withApiLoading((async () => {
            for (const event of events) {
                const eventWithUser = { ...event, userId: currentUser.id };
                const response: AxiosResponse<CalendarEvent> = await apiService.post('/api/calendarEvents', { ...eventWithUser, id: uuid() });
                setCalendarEvents(prev => [...prev, response.data]);
            }
        })());
    }, [currentUser]);

    const deleteCalendarEvent = useCallback(async (eventId: string) => {
        await withApiLoading(apiService.delete('/api/calendarEvents', { data: { ids: [eventId] } }));
        setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
    }, []);
    
    const addExam = useCallback(async (exam: Omit<Exam, 'id'>) => {
        const response: AxiosResponse<Exam> = await withApiLoading(apiService.post('/api/exams', { ...exam, id: uuid() }));
        setExams(prev => [...prev, response.data]);
    }, []);

    const updateExam = useCallback(async (updatedExam: Exam) => {
        const response: AxiosResponse<Exam> = await withApiLoading(apiService.put(`/api/exams/${updatedExam.id}`, updatedExam));
        setExams(prev => prev.map(e => e.id === response.data.id ? response.data : e));
    }, []);

    const deleteExam = useCallback(async (examId: string) => {
        await withApiLoading(apiService.delete('/api/exams', { data: { ids: [examId] } }));
        setExams(prev => prev.filter(e => e.id !== examId));
    }, []);
    
    const addQuestion = useCallback(async (questionData: Omit<Question, 'id'>) => {
        const response: AxiosResponse<Question> = await withApiLoading(apiService.post('/api/questions', { ...questionData, id: uuid() }));
        setQuestions(prev => [...prev, response.data]);
    }, []);

    const updateQuestion = useCallback(async (question: Question) => {
        const response: AxiosResponse<Question> = await withApiLoading(apiService.put(`/api/questions/${question.id}`, question));
        setQuestions(prev => prev.map(q => q.id === response.data.id ? response.data : q));
    }, []);

    const deleteQuestion = useCallback(async (questionId: string) => {
        await withApiLoading(apiService.delete('/api/questions', { data: { ids: [questionId] } }));
        setQuestions(prev => prev.filter(q => q.id !== questionId));
    }, []);

    const setConversationArchived = useCallback(async (conversationId: string, isArchived: boolean) => {
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
            await updateConversation({ ...conv, isArchived });
        }
    }, [conversations, updateConversation]);

    const updateBadge = useCallback(async (badge: Badge) => {
        const response: AxiosResponse<Badge> = await withApiLoading(apiService.put(`/api/badges/${badge.id}`, badge));
        setBadges(prev => prev.map(b => b.id === response.data.id ? response.data : b));
    }, []);
    
    const { messagesByConversation, unreadCounts, lastMessagesMap } = useMemo(() => {
        const msgByConv = new Map<string, Message[]>();
        messages.forEach(msg => {
            if (!msgByConv.has(msg.conversationId)) {
                msgByConv.set(msg.conversationId, []);
            }
            msgByConv.get(msg.conversationId)!.push(msg);
        });

        const counts = new Map<string, number>();
        const lasts = new Map<string, Message>();
        
        msgByConv.forEach((convMessages, convId) => {
            convMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            if (convMessages.length > 0) {
                lasts.set(convId, convMessages[convMessages.length - 1]);
            }
        });
        
        if (currentUser) {
            const myId = currentUser.id;
            conversations.forEach(c => {
                if (!c || !c.participantIds || !c.participantIds.includes(myId)) return;

                const convMessages = msgByConv.get(c.id) || [];
                const unreadCount = convMessages.filter(m => m && m.readBy && !m.readBy.includes(myId) && m.senderId !== myId).length;
                counts.set(c.id, unreadCount);
            });
        }
        
        return { messagesByConversation: msgByConv, unreadCounts: counts, lastMessagesMap: lasts };
    }, [messages, conversations, currentUser]);


    const coach = useMemo(() => currentUser?.role === UserRole.Student ? users.find(u => u.id === currentUser.assignedCoachId) || null : (currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin ? currentUser : users.find(u => u.role === UserRole.Coach) || null), [users, currentUser]);
    const students = useMemo(() => currentUser?.role === UserRole.Coach ? users.filter(u => u.role === UserRole.Student && u.assignedCoachId === currentUser.id) : (currentUser?.role === UserRole.SuperAdmin ? users.filter(u => u.role === UserRole.Student) : []), [users, currentUser]);
    const getAssignmentsForStudent = useCallback((studentId: string) => assignments.filter(a => a.studentId === studentId), [assignments]);
    const getGoalsForStudent = useCallback((studentId: string) => goals.filter(g => g.studentId === studentId), [goals]);
    const findMessageById = useCallback((messageId: string) => messages.find(m => m.id === messageId), [messages]);
    const getMessagesForConversation = useCallback((conversationId: string) => messagesByConversation.get(conversationId) || [], [messagesByConversation]);

    const contextValue: DataContextType = {
        currentUser, users, assignments, messages, conversations, notifications, templates, resources, goals, badges, calendarEvents, exams, questions, isLoading, isDbInitialized, isApiLoading,
        coach, students, login, logout, register, inviteStudent,
        getAssignmentsForStudent, getMessagesForConversation, sendMessage,
        addAssignment, updateAssignment, deleteAssignments,
        updateUser, deleteUser, addUser,
        markMessagesAsRead, unreadCounts, lastMessagesMap, markNotificationsAsRead,
        typingStatus: {}, // Simplified for now
        updateTypingStatus: async () => {}, // No-op
        getGoalsForStudent, updateGoal, addGoal, deleteGoal,
        addReaction, voteOnPoll, findMessageById, assignResourceToStudents,
        addResource, deleteResource, addTemplate, updateTemplate, deleteTemplate,
        uploadFile, updateStudentNotes, awardXp, startGroupChat, findOrCreateConversation,
        addUserToConversation, removeUserFromConversation, endConversation, setConversationArchived,
        addCalendarEvent, addMultipleCalendarEvents, deleteCalendarEvent,
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