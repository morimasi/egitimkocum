import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, AssignmentStatus } from '../types';
import { useMockData } from '../hooks/useMockData';
import { auth, db } from '../services/firebase';
import {
    collection,
    getDocs,
    writeBatch,
    doc,
    setDoc,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User as FirebaseUser,
} from 'firebase/auth';


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
    login: (email: string) => Promise<User | null>;
    logout: () => Promise<void>;
    register: (name: string, email: string) => Promise<User | null>;
    getAssignmentsForStudent: (studentId: string) => Assignment[];
    getMessagesWithUser: (userId: string) => Message[];
    sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => Promise<void>;
    addAssignment: (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => Promise<void>;
    updateAssignment: (updatedAssignment: Assignment) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addUser: (newUser: Omit<User, 'id'>) => Promise<void>;
    resetData: () => Promise<void>;
    markMessagesAsRead: (contactId: string) => Promise<void>;
    markNotificationsAsRead: () => Promise<void>;
    updateTypingStatus: (userId: string, isTyping: boolean) => void;
    getGoalsForStudent: (studentId: string) => Goal[];
    updateGoal: (updatedGoal: Goal) => Promise<void>;
    addGoal: (newGoal: Omit<Goal, 'id'>) => Promise<void>;
    addReaction: (messageId: string, emoji: string) => Promise<void>;
    voteOnPoll: (messageId: string, optionIndex: number) => Promise<void>;
    findMessageById: (messageId: string) => Message | undefined;
    toggleResourceRecommendation: (resourceId: string, studentId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { getInitialData } = useMockData();
    
    // States for holding real-time data from Firestore
    const [users, setUsers] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [templates, setTemplates] = useState<AssignmentTemplate[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [typingStatus, setTypingStatus] = useState<{ [userId: string]: boolean }>({});

    // Data Seeding on initial load
    useEffect(() => {
        const seedData = async () => {
            const usersCollectionRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollectionRef);
            if (usersSnapshot.empty) {
                console.log("Database is empty, seeding initial data...");
                const initialData = getInitialData();
                const batch = writeBatch(db);

                initialData.users.forEach(user => {
                    const docRef = doc(db, "users", user.id);
                    batch.set(docRef, user);
                });
                 initialData.assignments.forEach(item => {
                    const docRef = doc(db, "assignments", item.id);
                    batch.set(docRef, item);
                });
                initialData.messages.forEach(item => {
                    const docRef = doc(db, "messages", item.id);
                    batch.set(docRef, item);
                });
                 initialData.notifications.forEach(item => {
                    const docRef = doc(db, "notifications", item.id);
                    batch.set(docRef, item);
                });
                 initialData.templates.forEach(item => {
                    const docRef = doc(db, "templates", item.id);
                    batch.set(docRef, item);
                });
                 initialData.resources.forEach(item => {
                    const docRef = doc(db, "resources", item.id);
                    batch.set(docRef, item);
                });
                 initialData.goals.forEach(item => {
                    const docRef = doc(db, "goals", item.id);
                    batch.set(docRef, item);
                });

                await batch.commit();
                console.log("Initial data seeded successfully.");
            }
        };
        seedData();
    }, [getInitialData]);

    // Firestore real-time listeners
    useEffect(() => {
        const collectionsInfo: { name: string; setter: Function }[] = [
            { name: "users", setter: setUsers },
            { name: "assignments", setter: setAssignments },
            { name: "messages", setter: setMessages },
            { name: "notifications", setter: setNotifications },
            { name: "templates", setter: setTemplates },
            { name: "resources", setter: setResources },
            { name: "goals", setter: setGoals },
        ];

        const unsubscribers = collectionsInfo.map(({ name, setter }) => 
            onSnapshot(collection(db, name), (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Firestore data might not have `id` in the object itself
                setter(data as any); 
            })
        );
        
        return () => unsubscribers.forEach(unsub => unsub());
    }, []);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Find user from our Firestore-backed state
                const appUser = users.find(u => u.email.toLowerCase() === firebaseUser.email?.toLowerCase());
                setCurrentUser(appUser || null);
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [users]); // Depend on users state
    
    const students = useMemo(() => users.filter(user => user.role === UserRole.Student), [users]);
    const coach = useMemo(() => users.find(user => user.role === UserRole.Coach) || null, [users]);

    const login = useCallback(async (email: string): Promise<User | null> => {
        const password = 'password123'; // Hardcoded password for demo
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                const mockUser = getInitialData().users.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (mockUser) {
                    try {
                        await createUserWithEmailAndPassword(auth, email, password);
                        // Also add user to Firestore if they don't exist from the mock data
                        const userDocRef = doc(db, "users", mockUser.id);
                        await setDoc(userDocRef, mockUser);
                        return mockUser;
                    } catch (creationError) {
                        console.error("Failed to auto-migrate user:", creationError);
                        return null;
                    }
                }
            }
            console.error("Firebase login error:", error);
            return null;
        }
    }, [users, getInitialData]);

    const logout = useCallback(async () => {
        await signOut(auth);
    }, []);
    
    const register = useCallback(async (name: string, email: string): Promise<User | null> => {
        if(users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            await login(email);
            return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        }
        const password = 'password123';
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            if (!firebaseUser) throw new Error("User creation failed.");
            
            const newUser: User = {
                id: firebaseUser.uid,
                name,
                email,
                role: UserRole.Student,
                profilePicture: `https://i.pravatar.cc/150?u=${email}`
            };
            await setDoc(doc(db, "users", newUser.id), newUser);
            return newUser;
        } catch (error: any) {
            console.error("Firebase registration error:", error);
            return null;
        }
    }, [users, login]);

    const getAssignmentsForStudent = useCallback((studentId: string) => assignments.filter(a => a.studentId === studentId), [assignments]);
    const findMessageById = useCallback((messageId: string) => messages.find(m => m.id === messageId), [messages]);

    const getMessagesWithUser = useCallback((userId: string) => {
        if (!currentUser) return [];
        const query = (userId === 'announcements') 
            ? messages.filter(m => m.type === 'announcement')
            : messages.filter(m => (m.senderId === currentUser.id && m.receiverId === userId) || (m.senderId === userId && m.receiverId === currentUser.id));
        return query.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [currentUser, messages]);

    const sendMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!currentUser) return;
        const newMessage = {
            ...message,
            timestamp: new Date().toISOString(),
            readBy: [currentUser.id],
        };
        await addDoc(collection(db, "messages"), newMessage);
    }, [currentUser]);
    
    const addAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        const batch = writeBatch(db);
        studentIds.forEach(studentId => {
            const newDocRef = doc(collection(db, "assignments"));
            const newAssignment = {
                ...assignmentData,
                id: newDocRef.id,
                studentId,
                 checklist: assignmentData.checklist?.map((item, index) => ({ ...item, id: `chk-${Date.now()}-${index}`, isCompleted: false })),
            };
            batch.set(newDocRef, newAssignment);
        });
        await batch.commit();
    }, []);

    const addNotification = useCallback(async (userId: string, message: string, link?: AppNotification['link']) => {
        const newNotification = {
            userId,
            message,
            timestamp: new Date().toISOString(),
            isRead: false,
            link,
        };
        await addDoc(collection(db, "notifications"), newNotification);
    }, []);

    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        const originalAssignment = assignments.find(a => a.id === updatedAssignment.id);
        if (originalAssignment && originalAssignment.status !== AssignmentStatus.Graded && updatedAssignment.status === AssignmentStatus.Graded) {
            const coachName = coach?.name || 'Koçun';
            addNotification(
                updatedAssignment.studentId, 
                `${coachName}, "${updatedAssignment.title}" ödevini notlandırdı.`,
                { page: 'assignments' }
            );
        }
        await setDoc(doc(db, "assignments", updatedAssignment.id), updatedAssignment);
    }, [assignments, coach, addNotification]);

    const updateUser = async (updatedUser: User) => {
        await setDoc(doc(db, "users", updatedUser.id), updatedUser);
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
    };
    
    const deleteUser = useCallback(async (userId: string) => {
        const batch = writeBatch(db);
        // Delete user doc
        batch.delete(doc(db, "users", userId));
        // Delete related data
        assignments.filter(a => a.studentId === userId).forEach(a => batch.delete(doc(db, "assignments", a.id)));
        messages.filter(m => m.senderId === userId || m.receiverId === userId).forEach(m => batch.delete(doc(db, "messages", m.id)));
        await batch.commit();
        // Note: Firebase Auth user deletion should be handled via a backend function for security.
    }, [assignments, messages]);

    const addUser = useCallback(async (userData: Omit<User, 'id'>) => {
        const newDocRef = doc(collection(db, "users"));
        const newUser = { ...userData, id: newDocRef.id };
        await setDoc(newDocRef, newUser);
    }, []);
    
    const resetData = useCallback(async () => {
        setIsLoading(true);
        console.log("Resetting data...");
        const collectionsToDelete = ["users", "assignments", "messages", "notifications", "templates", "resources", "goals"];
        for (const coll of collectionsToDelete) {
            const snapshot = await getDocs(collection(db, coll));
            const batch = writeBatch(db);
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
        await logout();
        await seedData(); // re-seed after deleting
        setIsLoading(false);

        async function seedData() {
            const initialData = getInitialData();
            const batch = writeBatch(db);
            initialData.users.forEach(user => batch.set(doc(db, "users", user.id), user));
            initialData.assignments.forEach(item => batch.set(doc(db, "assignments", item.id), item));
            initialData.messages.forEach(item => batch.set(doc(db, "messages", item.id), item));
            initialData.notifications.forEach(item => batch.set(doc(db, "notifications", item.id), item));
            initialData.templates.forEach(item => batch.set(doc(db, "templates", item.id), item));
            initialData.resources.forEach(item => batch.set(doc(db, "resources", item.id), item));
            initialData.goals.forEach(item => batch.set(doc(db, "goals", item.id), item));
            await batch.commit();
            console.log("Data re-seeded.");
        }
    }, [getInitialData, logout]);

    const markMessagesAsRead = useCallback(async (contactId: string) => {
        if (!currentUser) return;
        const batch = writeBatch(db);
        messages.forEach(m => {
            if (m.senderId === contactId && m.receiverId === currentUser.id && !m.readBy.includes(currentUser.id)) {
                batch.update(doc(db, "messages", m.id), { readBy: [...m.readBy, currentUser.id] });
            }
        });
        await batch.commit();
    }, [currentUser, messages]);

    const markNotificationsAsRead = useCallback(async () => {
        if (!currentUser) return;
        const batch = writeBatch(db);
        notifications.forEach(n => {
            if (n.userId === currentUser.id && !n.isRead) {
                batch.update(doc(db, "notifications", n.id), { isRead: true });
            }
        });
        await batch.commit();
    }, [currentUser, notifications]);

    const updateTypingStatus = (userId: string, isTyping: boolean) => {
        setTypingStatus(prev => ({ ...prev, [userId]: isTyping }));
    };

    const getGoalsForStudent = useCallback((studentId: string) => goals.filter(g => g.studentId === studentId), [goals]);
    const updateGoal = async (updatedGoal: Goal) => await setDoc(doc(db, "goals", updatedGoal.id), updatedGoal);
    const addGoal = async (newGoalData: Omit<Goal, 'id'>) => await addDoc(collection(db, "goals"), newGoalData);
    
    const addReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!currentUser) return;
        const userId = currentUser.id;
        const msg = messages.find(m => m.id === messageId);
        if (msg) {
            const newReactions = { ...(msg.reactions || {}) };
            const userHasReactedWithEmoji = newReactions[emoji]?.includes(userId);
            Object.keys(newReactions).forEach(key => {
                newReactions[key] = newReactions[key].filter(id => id !== userId);
                if (newReactions[key].length === 0) delete newReactions[key];
            });
            if (!userHasReactedWithEmoji) {
                if (!newReactions[emoji]) newReactions[emoji] = [];
                newReactions[emoji].push(userId);
            }
            await updateDoc(doc(db, "messages", messageId), { reactions: newReactions });
        }
    }, [currentUser, messages]);

    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if (!currentUser) return;
        const userId = currentUser.id;
        const msg = messages.find(m => m.id === messageId);
        if (msg && msg.poll) {
            let userAlreadyVotedForThisOption = false;
            const newOptions = msg.poll.options.map((opt, index) => {
                if (index === optionIndex && opt.votes.includes(userId)) userAlreadyVotedForThisOption = true;
                return { ...opt, votes: opt.votes.filter(v => v !== userId) };
            });
            if (!userAlreadyVotedForThisOption) {
                newOptions[optionIndex].votes.push(userId);
            }
            await updateDoc(doc(db, "messages", messageId), { 'poll.options': newOptions });
        }
    }, [currentUser, messages]);

    const toggleResourceRecommendation = useCallback(async (resourceId: string, studentId: string) => {
        const res = resources.find(r => r.id === resourceId);
        if (res) {
            const recommended = res.recommendedTo || [];
            const isRecommended = recommended.includes(studentId);
            const newRecommended = isRecommended
                ? recommended.filter(id => id !== studentId)
                : [...recommended, studentId];
            await updateDoc(doc(db, "resources", resourceId), { recommendedTo: newRecommended });
        }
    }, [resources]);

    const value = useMemo(() => ({
        currentUser, users, assignments, messages, students, coach, notifications, templates, resources, goals, isLoading, typingStatus,
        login, logout, register, getAssignmentsForStudent, getMessagesWithUser, sendMessage, addAssignment, updateAssignment,
        updateUser, deleteUser, addUser, resetData, markMessagesAsRead, markNotificationsAsRead, updateTypingStatus,
        getGoalsForStudent, updateGoal, addGoal, addReaction, voteOnPoll, findMessageById, toggleResourceRecommendation,
    }), [
        currentUser, users, assignments, messages, students, coach, notifications, templates, resources, goals, isLoading, typingStatus,
        login, logout, register, getAssignmentsForStudent, getMessagesWithUser, sendMessage, addAssignment, updateAssignment,
        updateUser, deleteUser, addUser, resetData, markMessagesAsRead, markNotificationsAsRead, updateTypingStatus,
        getGoalsForStudent, updateGoal, addGoal, addReaction, voteOnPoll, findMessageById, toggleResourceRecommendation,
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