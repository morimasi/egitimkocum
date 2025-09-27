import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useReducer } from 'react';
// FIX: Added Poll to the import list.
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, Conversation, AssignmentStatus, Badge, BadgeID, CalendarEvent, Poll } from '../types';
import { useUI } from './UIContext';
import {
    auth,
    db,
    storage,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    writeBatch,
    getDocs,
    // FIX: Added getDoc to the import list.
    getDoc,
    ref,
    uploadBytes,
    getDownloadURL,
    arrayUnion,
    arrayRemove,
} from '../services/firebase';
import { seedData } from '../services/seedData';


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
    | { type: 'SET_DATA'; payload: { collection: keyof AppState, data: any[] } }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_CURRENT_USER'; payload: User | null }
    | { type: 'ADD_OR_UPDATE_DOC'; payload: { collection: keyof AppState, data: any } }
    | { type: 'REMOVE_DOC'; payload: { collection: keyof AppState, id: string } }
    | { type: 'RESET_STATE' }
    | { type: 'SET_TYPING_STATUS'; payload: { userId: string; isTyping: boolean } };


const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, [action.payload.collection]: action.payload.data };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload };
        case 'RESET_STATE':
            return getInitialState();
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
    login: (email: string, pass: string) => Promise<User | null>;
    logout: () => Promise<void>;
    register: (name: string, email: string, pass: string, profilePictureFile: File | null) => Promise<void>;
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
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const unsubUser = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const appUser = { id: doc.id, ...doc.data() } as User;
                        dispatch({ type: 'SET_CURRENT_USER', payload: appUser });
                    }
                    dispatch({ type: 'SET_LOADING', payload: false });
                });
                return () => unsubUser();
            } else {
                dispatch({ type: 'RESET_STATE' });
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        });
        return () => unsubscribe();
    }, []);

     useEffect(() => {
        if (!state.currentUser) return;

        const { id, role } = state.currentUser;
        const subscriptions: (() => void)[] = [];

        // Universal subscriptions
        subscriptions.push(onSnapshot(collection(db, 'users'), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'users', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
        subscriptions.push(onSnapshot(collection(db, 'badges'), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'badges', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
        subscriptions.push(onSnapshot(query(collection(db, 'notifications'), where('userId', '==', id)), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'notifications', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
        subscriptions.push(onSnapshot(query(collection(db, 'conversations'), where('participantIds', 'array-contains', id)), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'conversations', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
       
        // Role-based subscriptions
        if (role === UserRole.Student) {
            subscriptions.push(onSnapshot(query(collection(db, 'assignments'), where('studentId', '==', id)), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'assignments', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
            subscriptions.push(onSnapshot(query(collection(db, 'goals'), where('studentId', '==', id)), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'goals', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
            subscriptions.push(onSnapshot(query(collection(db, 'resources'), where('assignedTo', 'array-contains', id)), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'resources', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
            subscriptions.push(onSnapshot(query(collection(db, 'calendarEvents'), where('userId', '==', id)), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'calendarEvents', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));

        } else if (role === UserRole.Coach || role === UserRole.SuperAdmin) {
            const studentIds = state.users.filter(u => u.role === UserRole.Student && (role === UserRole.SuperAdmin || u.assignedCoachId === id)).map(s => s.id);
            if (studentIds.length > 0) {
                 subscriptions.push(onSnapshot(query(collection(db, 'assignments'), where('studentId', 'in', studentIds)), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'assignments', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
            } else {
                 dispatch({ type: 'SET_DATA', payload: { collection: 'assignments', data: [] } });
            }
            subscriptions.push(onSnapshot(collection(db, 'templates'), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'templates', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
            subscriptions.push(onSnapshot(collection(db, 'resources'), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'resources', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
            subscriptions.push(onSnapshot(collection(db, 'goals'), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'goals', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
            subscriptions.push(onSnapshot(query(collection(db, 'calendarEvents'), where('userId', '==', id)), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'calendarEvents', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
        }
        
        // Message subscription based on active conversations
        if (state.conversations.length > 0) {
            const conversationIds = state.conversations.map(c => c.id);
            subscriptions.push(onSnapshot(query(collection(db, 'messages'), where('conversationId', 'in', conversationIds)), snapshot => dispatch({ type: 'SET_DATA', payload: { collection: 'messages', data: snapshot.docs.map(d => ({id: d.id, ...d.data()})) } })));
        }


        return () => {
            subscriptions.forEach(unsub => unsub());
        };

    }, [state.currentUser, state.users, state.conversations.length]);

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
    
     const awardBadge = useCallback(async (studentId: string, badgeId: BadgeID) => {
        const student = state.users.find(u => u.id === studentId);
        const badge = state.badges.find(b => b.id === badgeId);
        if (!student || !badge || student.earnedBadgeIds?.includes(badgeId)) {
            return;
        }
        const userRef = doc(db, 'users', studentId);
        await updateDoc(userRef, {
            earnedBadgeIds: arrayUnion(badgeId),
            xp: (student.xp || 0) + 50
        });
        addToast(`Yeni rozet kazandın: ${badge.name}! (+50 XP)`, 'xp');
    }, [state.users, state.badges, addToast]);

    const login = useCallback(async (email: string, pass: string): Promise<User | null> => {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const appUser = state.users.find(u => u.email === userCredential.user.email);
        return appUser || null;
    }, [state.users]);

    const logout = useCallback(async () => {
        await signOut(auth);
    }, []);

    const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    }, []);

    const register = useCallback(async (name: string, email: string, pass: string, profilePictureFile: File | null) => {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const isFirstUser = usersSnapshot.empty;
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        
        let profilePictureUrl = `https://i.pravatar.cc/150?u=${email}`;
        if (profilePictureFile) {
            profilePictureUrl = await uploadFile(profilePictureFile, `profile-pictures/${userCredential.user.uid}`);
        }

        const newUser: User = {
            id: userCredential.user.uid,
            name,
            email,
            role: isFirstUser ? UserRole.SuperAdmin : UserRole.Student,
            profilePicture: profilePictureUrl,
        };
        
        await setDoc(doc(db, "users", userCredential.user.uid), newUser);
    }, [uploadFile]);
    
    const sendMessage = useCallback(async (messageData: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!state.currentUser) return;
        const newMessage = {
            ...messageData,
            timestamp: new Date().toISOString(),
            readBy: [messageData.senderId],
        };
        await addDoc(collection(db, 'messages'), newMessage);
    }, [state.currentUser]);

    const addAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        const batch = writeBatch(db);
        studentIds.forEach(studentId => {
            const newAssignment = { ...assignmentData, studentId };
            const docRef = doc(collection(db, 'assignments'));
            batch.set(docRef, newAssignment);
        });
        await batch.commit();
    }, []);

    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        const { id, ...dataToUpdate } = updatedAssignment;
        await updateDoc(doc(db, 'assignments', id), dataToUpdate);
    }, []);

    const deleteAssignments = useCallback(async (assignmentIds: string[]) => {
        const batch = writeBatch(db);
        assignmentIds.forEach(id => {
            batch.delete(doc(db, 'assignments', id));
        });
        await batch.commit();
    }, []);
    
    const updateUser = useCallback(async (updatedUser: User) => {
         const { id, ...dataToUpdate } = updatedUser;
         await updateDoc(doc(db, 'users', id), dataToUpdate);
    }, []);

    const deleteUser = useCallback(async (userId: string) => {
         await deleteDoc(doc(db, 'users', userId));
    }, []);

    const addUser = useCallback(async (newUser: Omit<User, 'id'>): Promise<User | null> => {
        const userRef = await addDoc(collection(db, 'users'), newUser);
        return { ...newUser, id: userRef.id };
    }, []);

    const markMessagesAsRead = useCallback(async (conversationId: string) => {
        if (!state.currentUser) return;
        const currentUserId = state.currentUser.id;
        const q = query(collection(db, 'messages'), where('conversationId', '==', conversationId));
        const messagesSnapshot = await getDocs(q);
        const batch = writeBatch(db);
        messagesSnapshot.forEach(messageDoc => {
            const msg = messageDoc.data() as Message;
            if (msg.senderId !== currentUserId && !msg.readBy.includes(currentUserId)) {
                batch.update(messageDoc.ref, { readBy: arrayUnion(currentUserId) });
            }
        });
        await batch.commit();
    }, [state.currentUser]);

    const markNotificationsAsRead = useCallback(async () => {
        if (!state.currentUser) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', state.currentUser.id), where('isRead', '==', false));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(doc => batch.update(doc.ref, { isRead: true }));
        await batch.commit();
    }, [state.currentUser]);

    const updateTypingStatus = useCallback(async (isTyping: boolean) => {}, []);
    
    const updateGoal = useCallback(async (updatedGoal: Goal) => { 
        const { id, ...data } = updatedGoal;
        await updateDoc(doc(db, 'goals', id), data);
    }, []);

    const addGoal = useCallback(async (newGoal: Omit<Goal, 'id'>) => { 
        await addDoc(collection(db, 'goals'), newGoal);
    }, []);

    const addReaction = useCallback(async (messageId: string, emoji: string) => {
         if (!state.currentUser) return;
         const msgRef = doc(db, 'messages', messageId);
         // This is complex with Firestore security rules, simplified for now
         const msgDoc = await getDoc(msgRef);
         if (!msgDoc.exists()) return;

         const reactions = msgDoc.data().reactions || {};
         // Remove previous reactions by the user
         Object.keys(reactions).forEach(key => {
            reactions[key] = reactions[key].filter((uid: string) => uid !== state.currentUser!.id);
            if (reactions[key].length === 0) delete reactions[key];
         });
         
         if (!reactions[emoji]) reactions[emoji] = [];
         reactions[emoji].push(state.currentUser.id);
         
         await updateDoc(msgRef, { reactions });
    }, [state.currentUser]);

    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if (!state.currentUser) return;
        const msgRef = doc(db, 'messages', messageId);
        const msgDoc = await getDoc(msgRef);
        if (!msgDoc.exists() || !msgDoc.data().poll) return;
        
        const poll = msgDoc.data().poll as Poll;
        const userId = state.currentUser.id;

        const alreadyVoted = poll.options[optionIndex]?.votes.includes(userId);
        
        poll.options.forEach(opt => {
            opt.votes = opt.votes.filter(vId => vId !== userId);
        });

        if (!alreadyVoted) {
            poll.options[optionIndex].votes.push(userId);
        }

        await updateDoc(msgRef, { poll });
    }, [state.currentUser]);
    
    const toggleResourceAssignment = useCallback(async (resourceId: string, studentId: string) => {
        const resRef = doc(db, 'resources', resourceId);
        const resDoc = await getDoc(resRef);
        if(!resDoc.exists()) return;
        const isAssigned = resDoc.data().assignedTo?.includes(studentId);
        await updateDoc(resRef, {
            assignedTo: isAssigned ? arrayRemove(studentId) : arrayUnion(studentId)
        });
    }, []);

    const assignResourceToStudents = useCallback(async (resourceId: string, studentIds: string[]) => {
         const resRef = doc(db, 'resources', resourceId);
         await updateDoc(resRef, { assignedTo: arrayUnion(...studentIds) });
    }, []);

    const addResource = useCallback(async (resourceData: Omit<Resource, 'id' | 'uploaderId'>) => {
        if (!state.currentUser) return;
        const newResource = { ...resourceData, uploaderId: state.currentUser.id };
        await addDoc(collection(db, 'resources'), newResource);
    }, [state.currentUser]);

    const deleteResource = useCallback(async (resourceId: string) => {
        await deleteDoc(doc(db, 'resources', resourceId));
    }, []);

    const addTemplate = useCallback(async (templateData: Omit<AssignmentTemplate, 'id'>) => {
        await addDoc(collection(db, 'templates'), templateData);
    }, []);

    const updateTemplate = useCallback(async (template: AssignmentTemplate) => {
        const { id, ...data } = template;
        await updateDoc(doc(db, 'templates', id), data);
    }, []);

    const deleteTemplate = useCallback(async (templateId: string) => {
        await deleteDoc(doc(db, 'templates', templateId));
    }, []);
    
    const updateStudentNotes = useCallback(async (studentId: string, notes: string) => {
         await updateDoc(doc(db, 'users', studentId), { notes });
    }, []);

    const startGroupChat = useCallback(async (participantIds: string[], groupName: string) => {
        if (!state.currentUser) return;
        const newConversation = {
            participantIds,
            isGroup: true,
            groupName,
            adminId: state.currentUser.id,
        };
        const docRef = await addDoc(collection(db, 'conversations'), newConversation);
        await sendMessage({
            senderId: state.currentUser.id,
            conversationId: docRef.id,
            text: `${state.currentUser.name}, ${groupName} grubunu oluşturdu.`,
            type: 'system',
        });
        return docRef.id;
    }, [state.currentUser, sendMessage]);
    
    const findOrCreateConversation = useCallback(async (otherParticipantId: string) => {
        if (!state.currentUser) return;
        const currentUserId = state.currentUser.id;

        const q = query(
            collection(db, 'conversations'),
            where('isGroup', '==', false),
            where('participantIds', 'array-contains', currentUserId)
        );
        const snapshot = await getDocs(q);
        const existing = snapshot.docs.find(d => d.data().participantIds.includes(otherParticipantId));

        if (existing) return existing.id;
        
        const newConversation = {
            participantIds: [currentUserId, otherParticipantId],
            isGroup: false,
        };
        const docRef = await addDoc(collection(db, 'conversations'), newConversation);
        return docRef.id;
    }, [state.currentUser]);


    const addUserToConversation = useCallback(async (conversationId: string, userId: string) => {
        await updateDoc(doc(db, 'conversations', conversationId), {
            participantIds: arrayUnion(userId)
        });
    }, []);

    const removeUserFromConversation = useCallback(async (conversationId: string, userId: string) => {
        await updateDoc(doc(db, 'conversations', conversationId), {
            participantIds: arrayRemove(userId)
        });
    }, []);

    const endConversation = useCallback(async (conversationId: string) => {
        await updateDoc(doc(db, 'conversations', conversationId), { isArchived: true });
    }, []);
    
    const updateBadge = useCallback(async (updatedBadge: Badge) => {
        const { id, ...data } = updatedBadge;
        await updateDoc(doc(db, 'badges', id), data);
    }, []);

    const addCalendarEvent = useCallback(async (event: Omit<CalendarEvent, 'id' | 'userId'>) => {
        if (!state.currentUser) return;
        await addDoc(collection(db, 'calendarEvents'), { ...event, userId: state.currentUser.id });
    }, [state.currentUser]);

    const deleteCalendarEvent = useCallback(async (eventId: string) => {
        await deleteDoc(doc(db, 'calendarEvents', eventId));
    }, []);

    const toggleTemplateFavorite = useCallback(async (templateId: string) => {
        const templateRef = doc(db, 'templates', templateId);
        const templateDoc = await getDoc(templateRef);
        if (templateDoc.exists()) {
            await updateDoc(templateRef, { isFavorite: !templateDoc.data().isFavorite });
        }
    }, []);

    const seedDatabase = useCallback(async () => {
        if (!state.currentUser || state.currentUser.role !== UserRole.SuperAdmin) {
            addToast("Sadece Süper Adminler bu işlemi yapabilir.", "error");
            return;
        }

        const assignmentsCheck = await getDocs(collection(db, 'assignments'));
        if (!assignmentsCheck.empty) {
            addToast("Veritabanı zaten dolu. Bu işlem yalnızca boş bir veritabanında çalıştırılabilir.", "info");
            return;
        }
        
        addToast("Deneme verileri ekleniyor, lütfen bekleyin...", "info");

        try {
            const coach = state.users.find(u => u.email === 'koc@deneme.com');
            const student1 = state.users.find(u => u.email === 'leyla.tek@deneme.com');
            const student2 = state.users.find(u => u.email === 'can.yurt@deneme.com');

            if (!coach || !student1 || !student2) {
                addToast("Lütfen önce deneme hesaplarını oluşturun: koc@deneme.com, leyla.tek@deneme.com, can.yurt@deneme.com", "error");
                return;
            }

            const batch = writeBatch(db);

            batch.update(doc(db, 'users', student1.id), { assignedCoachId: coach.id });
            batch.update(doc(db, 'users', student2.id), { assignedCoachId: coach.id });

            const idMap: { [key: string]: string } = {
                COACH_ID: coach.id,
                STUDENT_1_ID: student1.id,
                STUDENT_2_ID: student2.id,
            };

            const processItem = (item: any) => {
                const processed = { ...item };
                for (const key in processed) {
                    if (key.endsWith('Id') && idMap[processed[key]]) {
                        processed[key] = idMap[processed[key]];
                    } else if (key.endsWith('Ids') && Array.isArray(processed[key])) {
                        processed[key] = processed[key].map((id: string) => idMap[id] || id);
                    }
                }
                if (processed.assignedTo && Array.isArray(processed.assignedTo)) {
                     processed.assignedTo = processed.assignedTo.map((id: string) => idMap[id] || id);
                }
                return processed;
            };

            seedData.assignments.map(processItem).forEach(item => batch.set(doc(collection(db, 'assignments')), item));
            seedData.conversations.map(processItem).forEach(item => batch.set(doc(db, 'conversations', item.id), item));
            seedData.messages.map(processItem).forEach(item => batch.set(doc(collection(db, 'messages')), item));
            seedData.goals.map(processItem).forEach(item => batch.set(doc(collection(db, 'goals')), item));
            seedData.resources.map(processItem).forEach(item => batch.set(doc(collection(db, 'resources')), item));
            seedData.templates.forEach(item => batch.set(doc(collection(db, 'templates')), item));
            seedData.badges.forEach(item => batch.set(doc(db, 'badges', item.id), item));

            await batch.commit();
            addToast("Deneme verileri başarıyla eklendi!", "success");

        } catch (error) {
            console.error("Error seeding database:", error);
            addToast("Veritabanı doldurulurken bir hata oluştu.", "error");
        }
    }, [state.currentUser, addToast, state.users]);

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
        updateBadge,
        addCalendarEvent,
        deleteCalendarEvent,
        toggleTemplateFavorite,
        seedDatabase,
    }), [
        state, coach, students, unreadCounts, lastMessagesMap,
        login, logout, register, getAssignmentsForStudent, getMessagesForConversation,
        sendMessage, addAssignment, updateAssignment, deleteAssignments, updateUser, deleteUser, addUser,
        markMessagesAsRead, markNotificationsAsRead, updateTypingStatus, getGoalsForStudent,
        updateGoal, addGoal, addReaction, voteOnPoll, findMessageById, toggleResourceAssignment,
        assignResourceToStudents, addResource, deleteResource, addTemplate, updateTemplate, deleteTemplate, uploadFile, updateStudentNotes, startGroupChat,
        findOrCreateConversation, addUserToConversation, removeUserFromConversation, endConversation,
        updateBadge, addCalendarEvent, deleteCalendarEvent, toggleTemplateFavorite, seedDatabase
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