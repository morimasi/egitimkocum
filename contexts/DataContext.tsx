import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useState } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, Conversation, Badge, CalendarEvent, Exam, Question } from '../types';
import { useUI } from './UIContext';

const uuid = () => crypto.randomUUID();

// API Helper
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`/api/${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Bilinmeyen sunucu hatası." }));
        throw new Error(errorData.error || `API isteği başarısız: ${response.status}`);
    }
    if (response.status === 204) return null; // No content for DELETE
    return response.json();
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
    exams: Exam[];
    questions: Question[];
    isLoading: boolean;
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
    addExam: (exam: Omit<Exam, 'id'>) => Promise<void>;
    updateExam: (updatedExam: Exam) => Promise<void>;
    deleteExam: (examId: string) => Promise<void>;
    addQuestion: (questionData: Omit<Question, 'id'>) => Promise<void>;
    updateQuestion: (question: Question) => Promise<void>;
    deleteQuestion: (questionId: string) => Promise<void>;
    updateBadge: (badge: Badge) => Promise<void>;
    seedDatabase: () => Promise<void>;
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
    
    // Initial data load and DB initialization
    useEffect(() => {
        const initialize = async () => {
            try {
                // Step 1: Initialize DB schema
                await apiFetch('init', { method: 'POST' });
                
                // Step 2: Check for a logged-in user in sessionStorage
                const storedUser = sessionStorage.getItem('currentUser');
                if (storedUser) {
                    setCurrentUser(JSON.parse(storedUser));
                }

                // Step 3: Fetch all data
                const data = await apiFetch('data');
                setUsers(data.users);
                setAssignments(data.assignments);
                setMessages(data.messages);
                setConversations(data.conversations);
                setNotifications(data.notifications);
                setTemplates(data.templates);
                setResources(data.resources);
                setGoals(data.goals);
                setBadges(data.badges);
                setCalendarEvents(data.calendarEvents);
                setExams(data.exams);
                setQuestions(data.questions);
                
                setIsDbInitialized(true);
            } catch (error) {
                console.error("Initialization failed:", error);
                addToast("Uygulama başlatılamadı. Sunucuya bağlanılamıyor.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
    }, [addToast]);
    
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

    const login = useCallback(async (email: string, password: string): Promise<User | null> => {
        const user = await apiFetch('login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
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
        const id = uuid();
        let profilePicture = `https://i.pravatar.cc/150?u=${email}`;
        if (profilePictureFile) {
            profilePicture = await uploadFile(profilePictureFile, `profile-pictures/${id}`);
        }
        const user = await apiFetch('register', {
            method: 'POST',
            body: JSON.stringify({ id, name, email, password, role: 'student', profilePicture }),
        });
        if (user) {
            setUsers(prev => [...prev, user]);
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        }
        return null;
    }, [uploadFile]);

    const addUser = useCallback(async (newUser: Omit<User, 'id'>): Promise<User | null> => {
        const userWithId = { ...newUser, id: uuid() };
        const addedUser = await apiFetch('users', { method: 'POST', body: JSON.stringify(userWithId) });
        setUsers(prev => [...prev, addedUser]);
        return addedUser;
    }, []);

    const updateUser = useCallback(async (updatedUser: User) => {
        const user = await apiFetch(`users/${updatedUser.id}`, { method: 'PUT', body: JSON.stringify(updatedUser) });
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        if (currentUser?.id === user.id) {
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        }
    }, [currentUser?.id]);
    
    const deleteUser = useCallback(async (userId: string) => {
        await apiFetch('users', { method: 'DELETE', body: JSON.stringify({ ids: [userId] }) });
        setUsers(prev => prev.filter(u => u.id !== userId));
    }, []);

    const findOrCreateConversation = useCallback(async (otherParticipantId: string): Promise<string | undefined> => {
        if (!currentUser) return;
        const result = await apiFetch('conversations/findOrCreate', {
            method: 'POST',
            body: JSON.stringify({ userId1: currentUser.id, userId2: otherParticipantId })
        });
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
        for (const studentId of studentIds) {
            const newAssignment = { ...assignmentData, id: uuid(), studentId };
            const added = await apiFetch('assignments', { method: 'POST', body: JSON.stringify(newAssignment) });
            setAssignments(prev => [...prev, added]);
        }
    }, []);

    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        const updated = await apiFetch(`assignments/${updatedAssignment.id}`, { method: 'PUT', body: JSON.stringify(updatedAssignment) });
        setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
    }, []);

    const deleteAssignments = useCallback(async (assignmentIds: string[]) => {
        await apiFetch('assignments', { method: 'DELETE', body: JSON.stringify({ ids: assignmentIds }) });
        setAssignments(prev => prev.filter(a => !assignmentIds.includes(a.id)));
    }, []);

    const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!currentUser) return;
        // FIX: The type annotation `Omit<Message, 'id'>` was incorrect as the object literal includes an 'id'.
        // The correct type is `Message`.
        const message: Message = { ...messageData, id: uuid(), timestamp: new Date().toISOString(), readBy: [currentUser.id] };
        const added = await apiFetch('messages', { method: 'POST', body: JSON.stringify(message) });
        setMessages(prev => [...prev, added]);
    }, [currentUser]);

    const markMessagesAsRead = useCallback(async (conversationId: string) => {
        if (!currentUser) return;
        const myId = currentUser.id;
        let changed = false;
        const updatedMessages = messages.map(m => {
            if (m.conversationId === conversationId && !m.readBy.includes(myId)) {
                changed = true;
                const updatedReadBy = [...m.readBy, myId];
                // Fire-and-forget update to backend
                apiFetch(`messages/${m.id}`, { method: 'PUT', body: JSON.stringify({ readBy: updatedReadBy }) });
                return { ...m, readBy: updatedReadBy };
            }
            return m;
        });
        if (changed) setMessages(updatedMessages);
    }, [currentUser, messages]);

    // This is now client-side only for immediate UI feedback. Backend is fire-and-forget.
    const markNotificationsAsRead = useCallback(async (userId: string) => {
        let changed = false;
        const updated = notifications.map(n => {
            if (n.userId === userId && !n.isRead) {
                changed = true;
                apiFetch(`notifications/${n.id}`, { method: 'PUT', body: JSON.stringify({ isRead: true }) });
                return { ...n, isRead: true };
            }
            return n;
        });
        if (changed) setNotifications(updated);
    }, [notifications]);

    // All other functions need to be rewritten to use apiFetch
    const addGoal = useCallback(async (newGoal: Omit<Goal, 'id'>) => {
        const added = await apiFetch('goals', { method: 'POST', body: JSON.stringify({ ...newGoal, id: uuid() }) });
        setGoals(prev => [...prev, added]);
    }, []);
    
    const updateGoal = useCallback(async (updatedGoal: Goal) => {
        const updated = await apiFetch(`goals/${updatedGoal.id}`, { method: 'PUT', body: JSON.stringify(updatedGoal) });
        setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
    }, []);

    const deleteGoal = useCallback(async (goalId: string) => {
        await apiFetch('goals', { method: 'DELETE', body: JSON.stringify({ ids: [goalId] }) });
        setGoals(prev => prev.filter(g => g.id !== goalId));
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
    }, [currentUser, messages]);
    
    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if (!currentUser) return;
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.poll) return;
        
        const myId = currentUser.id;
        const updatedOptions = message.poll.options.map(opt => ({ ...opt, votes: opt.votes.filter(id => id !== myId) }));
        updatedOptions[optionIndex].votes.push(myId);
        
        await updateMessage({ ...message, poll: { ...message.poll, options: updatedOptions } });
    }, [currentUser, messages]);

    // Add generic update/delete functions that call API and update state
    const updateMessage = useCallback(async (msg) => {
        const updated = await apiFetch(`messages/${msg.id}`, { method: 'PUT', body: JSON.stringify(msg) });
        setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
    }, []);

    const updateConversation = useCallback(async (conv) => {
        const updated = await apiFetch(`conversations/${conv.id}`, { method: 'PUT', body: JSON.stringify(conv) });
        setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
    }, []);

    const startGroupChat = useCallback(async (participantIds: string[], groupName: string): Promise<string | undefined> => {
        if (!currentUser) return;
        const allParticipantIds = Array.from(new Set([...participantIds, currentUser.id]));
        const newConversation: Omit<Conversation, 'id'> = { participantIds: allParticipantIds, isGroup: true, groupName, groupImage: `https://i.pravatar.cc/150?u=${uuid()}`, adminId: currentUser.id };
        const added = await apiFetch('conversations', { method: 'POST', body: JSON.stringify({ ...newConversation, id: uuid() }) });
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
        await apiFetch('conversations', { method: 'DELETE', body: JSON.stringify({ ids: [conversationId] }) });
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        // Note: server should cascade delete messages, or client needs to filter them out.
        setMessages(prev => prev.filter(m => m.conversationId !== conversationId));
    }, []);

    const updateStudentNotes = useCallback(async (studentId: string, notes: string) => {
        await apiFetch(`users/${studentId}`, { method: 'PUT', body: JSON.stringify({ notes }) });
        setUsers(prev => prev.map(u => u.id === studentId ? { ...u, notes } : u));
    }, []);

    const awardXp = useCallback(async (amount: number, reason: string) => {
        if (!currentUser) return;
        const newXp = (currentUser.xp || 0) + amount;
        await updateUser({ ...currentUser, xp: newXp });
        addToast(`+${amount} XP! ${reason}`, 'xp');
    }, [currentUser, updateUser, addToast]);

    const addResource = useCallback(async (newResource: Omit<Resource, 'id'>) => {
        const added = await apiFetch('resources', { method: 'POST', body: JSON.stringify({ ...newResource, id: uuid() }) });
        setResources(prev => [...prev, added]);
    }, []);

    const deleteResource = useCallback(async (resourceId: string) => {
        await apiFetch('resources', { method: 'DELETE', body: JSON.stringify({ ids: [resourceId] }) });
        setResources(prev => prev.filter(r => r.id !== resourceId));
    }, []);

    const assignResourceToStudents = useCallback(async (resourceId: string, studentIds: string[]) => {
        const resource = resources.find(r => r.id === resourceId);
        if (!resource) return;
        const updatedResource = { ...resource, assignedTo: Array.from(new Set([...(resource.assignedTo || []), ...studentIds])) };
        await apiFetch(`resources/${resourceId}`, { method: 'PUT', body: JSON.stringify(updatedResource) });
        setResources(prev => prev.map(r => r.id === resourceId ? updatedResource : r));
    }, [resources]);

    const addTemplate = useCallback(async (templateData: Omit<AssignmentTemplate, 'id'>) => {
        const added = await apiFetch('templates', { method: 'POST', body: JSON.stringify({ ...templateData, id: uuid() }) });
        setTemplates(prev => [...prev, added]);
    }, []);
    
    const updateTemplate = useCallback(async (template: AssignmentTemplate) => {
        const updated = await apiFetch(`templates/${template.id}`, { method: 'PUT', body: JSON.stringify(template) });
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    }, []);
    
    const deleteTemplate = useCallback(async (templateId: string) => {
        await apiFetch('templates', { method: 'DELETE', body: JSON.stringify({ ids: [templateId] }) });
        setTemplates(prev => prev.filter(t => t.id !== templateId));
    }, []);
    
    const addCalendarEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
        const added = await apiFetch('calendarEvents', { method: 'POST', body: JSON.stringify({ ...event, id: uuid() }) });
        setCalendarEvents(prev => [...prev, added]);
    }, []);

    const addMultipleCalendarEvents = useCallback(async (events: Omit<CalendarEvent, 'id' | 'userId'>[]) => {
        if (!currentUser) return;
        for (const event of events) {
            const eventWithUser = { ...event, userId: currentUser.id };
            await addCalendarEvent(eventWithUser);
        }
    }, [currentUser, addCalendarEvent]);

    const deleteCalendarEvent = useCallback(async (eventId: string) => {
        await apiFetch('calendarEvents', { method: 'DELETE', body: JSON.stringify({ ids: [eventId] }) });
        setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
    }, []);
    
    const addExam = useCallback(async (exam: Omit<Exam, 'id'>) => {
        const added = await apiFetch('exams', { method: 'POST', body: JSON.stringify({ ...exam, id: uuid() }) });
        setExams(prev => [...prev, added]);
    }, []);

    const updateExam = useCallback(async (updatedExam: Exam) => {
        const updated = await apiFetch(`exams/${updatedExam.id}`, { method: 'PUT', body: JSON.stringify(updatedExam) });
        setExams(prev => prev.map(e => e.id === updated.id ? updated : e));
    }, []);

    const deleteExam = useCallback(async (examId: string) => {
        await apiFetch('exams', { method: 'DELETE', body: JSON.stringify({ ids: [examId] }) });
        setExams(prev => prev.filter(e => e.id !== examId));
    }, []);
    
    const addQuestion = useCallback(async (questionData: Omit<Question, 'id'>) => {
        const added = await apiFetch('questions', { method: 'POST', body: JSON.stringify({ ...questionData, id: uuid() }) });
        setQuestions(prev => [...prev, added]);
    }, []);

    const updateQuestion = useCallback(async (question: Question) => {
        const updated = await apiFetch(`questions/${question.id}`, { method: 'PUT', body: JSON.stringify(question) });
        setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
    }, []);

    const deleteQuestion = useCallback(async (questionId: string) => {
        await apiFetch('questions', { method: 'DELETE', body: JSON.stringify({ ids: [questionId] }) });
        setQuestions(prev => prev.filter(q => q.id !== questionId));
    }, []);

    const setConversationArchived = useCallback(async (conversationId: string, isArchived: boolean) => {
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
            await updateConversation({ ...conv, isArchived });
        }
    }, [conversations, updateConversation]);

    const updateBadge = useCallback(async (badge: Badge) => {
        const updated = await apiFetch(`badges/${badge.id}`, { method: 'PUT', body: JSON.stringify(badge) });
        setBadges(prev => prev.map(b => b.id === updated.id ? updated : b));
    }, []);
    
    const seedDatabase = useCallback(async () => {
        try {
            await apiFetch('seed', { method: 'POST' });
            addToast("Veritabanı başarıyla sıfırlandı ve yeniden oluşturuldu.", "success");
            window.location.reload();
        } catch (error) {
            console.error("Failed to seed database:", error);
            addToast("Veritabanı sıfırlanırken bir hata oluştu.", "error");
        }
    }, [addToast]);

    // Memoized derived state
    const { unreadCounts, lastMessagesMap } = useMemo(() => {
        const counts = new Map<string, number>();
        const lasts = new Map<string, Message>();
        if (currentUser) {
            const myId = currentUser.id;
            conversations.filter(c => c.participantIds.includes(myId)).forEach(c => {
                const convMessages = messages.filter(m => m.conversationId === c.id)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                if (convMessages.length > 0) lasts.set(c.id, convMessages[0]);
                const unreadCount = convMessages.filter(m => !m.readBy.includes(myId) && m.senderId !== myId).length;
                counts.set(c.id, unreadCount);
            });
        }
        return { unreadCounts: counts, lastMessagesMap: lasts };
    }, [messages, conversations, currentUser]);

    const coach = useMemo(() => currentUser?.role === UserRole.Student ? users.find(u => u.id === currentUser.assignedCoachId) || null : (currentUser?.role === UserRole.Coach || currentUser?.role === UserRole.SuperAdmin ? currentUser : users.find(u => u.role === UserRole.Coach) || null), [users, currentUser]);
    const students = useMemo(() => currentUser?.role === UserRole.Coach ? users.filter(u => u.role === UserRole.Student && u.assignedCoachId === currentUser.id) : (currentUser?.role === UserRole.SuperAdmin ? users.filter(u => u.role === UserRole.Student) : []), [users, currentUser]);
    const getAssignmentsForStudent = useCallback((studentId: string) => assignments.filter(a => a.studentId === studentId), [assignments]);
    const getGoalsForStudent = useCallback((studentId: string) => goals.filter(g => g.studentId === studentId), [goals]);
    const findMessageById = useCallback((messageId: string) => messages.find(m => m.id === messageId), [messages]);
    const getMessagesForConversation = useCallback((conversationId: string) => messages.filter(m => m.conversationId === conversationId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), [messages]);

    const contextValue: DataContextType = {
        currentUser, users, assignments, messages, conversations, notifications, templates, resources, goals, badges, calendarEvents, exams, questions, isLoading, isDbInitialized,
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
        seedDatabase,
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