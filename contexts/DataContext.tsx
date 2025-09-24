import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useReducer } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, AssignmentStatus } from '../types';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth, db, storage } from '../services/firebase';

// Fix: Corrected Firebase User type to align with the 'compat' library.
type FirebaseUser = firebase.User;

// This function now only serves to provide data for seeding the database.
export const getInitialDataForSeeding = () => {
    const initialUsers: Omit<User, 'id'>[] = [
      // The superadmin is created on first registration, so it's removed from seeding data.
      { name: 'Ayşe Yılmaz', email: 'ayse.yilmaz@koc.com', role: UserRole.Coach, profilePicture: 'https://i.pravatar.cc/150?u=coach-1' },
      { name: 'Ali Veli', email: 'ali.veli@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-1' },
      { name: 'Zeynep Kaya', email: 'zeynep.kaya@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-2' },
      { name: 'Mehmet Öztürk', email: 'mehmet.ozturk@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-3' },
      { name: 'Fatma Demir', email: 'fatma.demir@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-4' },
    ];
    
    // We use placeholder IDs here which will be mapped to real UIDs during seeding.
    const tempIds = {
        coach: 'coach-1',
        student1: 'student-1',
        student2: 'student-2',
        student3: 'student-3',
        student4: 'student-4',
    };

    // FIX: Corrected the type from Omit<Assignment, 'studentId' | 'coachId'>[] to Assignment[] because the objects include studentId and coachId.
    const initialAssignments: Assignment[] = [
        // Student 1 (Ali Veli)
        { id: 'asg-1', studentId: tempIds.student1, coachId: tempIds.coach, title: 'Matematik Problemleri', description: 'Limit ve Türev konularında 20 problem çözülecek.', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, feedbackReaction: null, submissionType: 'file', coachAttachments: [], audioFeedbackUrl: null, textSubmission: null, fileName: '' },
        { id: 'asg-2', studentId: tempIds.student1, coachId: tempIds.coach, title: 'Fizik Deney Raporu', description: 'Basit sarkaç deneyi raporu hazırlanacak.', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 85, feedback: 'Raporun gayet başarılı, özellikle sonuç bölümünü çok iyi analiz etmişsin. Bir dahaki sefere hipotez kısmını daha detaylı yazabilirsin.', fileUrl: '#', fileName: 'fizik_raporu.pdf', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), feedbackReaction: '👍', submissionType: 'file', coachAttachments: [], audioFeedbackUrl: null, textSubmission: null },
        { id: 'asg-10', studentId: tempIds.student1, coachId: tempIds.coach, title: 'Haftalık Kitap Özeti', description: 'Bu hafta okuduğun kitabın özetini 300 kelimeyi geçmeyecek şekilde yaz.', dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, feedbackReaction: null, submissionType: 'text', coachAttachments: [], audioFeedbackUrl: null, textSubmission: null, fileName: '' },

        // Student 2 (Zeynep Kaya)
        { id: 'asg-3', studentId: tempIds.student2, coachId: tempIds.coach, title: 'Kompozisyon Yazımı', description: 'Küresel ısınmanın etkileri üzerine bir kompozisyon yazılacak.', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Submitted, grade: null, feedback: '', fileUrl: '#', fileName: 'kompozisyon.docx', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), feedbackReaction: null, submissionType: 'file', coachAttachments: [], audioFeedbackUrl: null, textSubmission: null },
        { id: 'asg-4', studentId: tempIds.student2, coachId: tempIds.coach, title: 'Kimya Formül Ezberi', description: 'Organik kimya temel formüllerini ezberle ve tamamlandı olarak işaretle.', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 100, feedback: 'Harika, formülleri ezberlemen gelecekteki konular için çok önemli. Böyle devam et!', fileUrl: null, submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), feedbackReaction: null, submissionType: 'completed', coachAttachments: [], audioFeedbackUrl: null, textSubmission: null, fileName: '' },
        { id: 'asg-11', studentId: tempIds.student2, coachId: tempIds.coach, title: 'Biyoloji Çizimi', description: 'Bir bitki hücresinin organellerini çiz ve isimlendir. Çizimini yükle.', dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, feedbackReaction: null, submissionType: 'file', coachAttachments: [], audioFeedbackUrl: null, textSubmission: null, fileName: '' },

        // Student 3 (Mehmet Öztürk)
        { id: 'asg-5', studentId: tempIds.student3, coachId: tempIds.coach, title: 'Tarih Araştırması', description: 'Fransız İhtilali\'nin Osmanlı\'ya etkilerini araştır ve bir sayfalık rapor yaz.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, feedbackReaction: null, submissionType: 'file', coachAttachments: [], audioFeedbackUrl: null, textSubmission: null, fileName: '' }, // Overdue
        { id: 'asg-6', studentId: tempIds.student3, coachId: tempIds.coach, title: 'Coğrafya Sunumu', description: 'Türkiye\'nin iklim tipleri hakkında bir sunum hazırla.', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, feedbackReaction: null, submissionType: 'file', coachAttachments: [], audioFeedbackUrl: null, textSubmission: null, fileName: '' },
        { id: 'asg-12', studentId: tempIds.student3, coachId: tempIds.coach, title: '50 Paragraf Sorusu', description: 'Verilen kaynaktan 50 paragraf sorusu çöz ve sonuçlarını metin olarak gönder.', dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 75, feedback: 'Soruları çözmüş olman güzel fakat bazı dikkatsizlik hataların var. Lütfen soruları daha dikkatli oku.', fileUrl: null, textSubmission: '50 soruda 38 doğru, 12 yanlış yaptım.', submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), feedbackReaction: '👍', submissionType: 'text', coachAttachments: [], audioFeedbackUrl: null, fileName: '' },

        // Student 4 (Fatma Demir)
        { id: 'asg-7', studentId: tempIds.student4, coachId: tempIds.coach, title: 'İngilizce Kelime Testi', description: 'Verilen 100 kelimeyi ezberle ve kendini sına.', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Submitted, grade: null, feedback: '', fileUrl: null, submittedAt: new Date().toISOString(), feedbackReaction: null, submissionType: 'completed', coachAttachments: [], audioFeedbackUrl: null, textSubmission: null, fileName: '' },
        { id: 'asg-8', studentId: tempIds.student4, coachId: tempIds.coach, title: 'Deneme Analizi', description: 'Son deneme sınavının analizini yap ve hatalarını çıkar.', dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 95, feedback: 'Analizin çok detaylı ve yerinde. Hatalarının üzerine gitmen seni başarıya ulaştıracaktır.', fileUrl: '#', fileName: 'deneme_analizi.xlsx', submittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), feedbackReaction: '👍', submissionType: 'file', coachAttachments: [], audioFeedbackUrl: null, textSubmission: null },
        { id: 'asg-9', studentId: tempIds.student4, coachId: tempIds.coach, title: 'Felsefe Makalesi Okuma', description: 'Platon\'un "Devlet" eserinden belirlenen bölümü oku ve ana fikirleri çıkar.', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, feedbackReaction: null, submissionType: 'completed', checklist: [{id: 'chk-asg9-1', text: 'Belirlenen bölümü oku', isCompleted: false}, {id: 'chk-asg9-2', text: 'Bölümdeki ana fikirleri listele', isCompleted: false}, {id: 'chk-asg9-3', text: 'Kendi yorumunu ekle', isCompleted: false}], coachAttachments: [], audioFeedbackUrl: null, textSubmission: null, fileName: '' },
    ];
    
    // FIX: Corrected the type from Omit<Message, 'senderId' | 'receiverId'>[] to Message[] because the objects include senderId and receiverId.
    const initialMessages: Message[] = [
        // Conversation with Ali
        { id: 'msg-1', senderId: tempIds.student1, receiverId: tempIds.coach, text: 'Hocam merhaba, matematik ödevindeki 5. soruda takıldım. Yardımcı olabilir misiniz?', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: [tempIds.coach, tempIds.student1] },
        { id: 'msg-2', senderId: tempIds.coach, receiverId: tempIds.student1, text: 'Merhaba Ali, tabii ki. Hangi adımı anlamadığını söylersen oradan devam edelim.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: [tempIds.student1, tempIds.coach], reactions: {'👍': [tempIds.student1]} },
        { id: 'msg-3', senderId: tempIds.student1, receiverId: tempIds.coach, type: 'file', text: 'Türev alma kuralını uyguladıktan sonraki kısım hocam.', fileUrl: '#', fileName: 'soru_ekran_goruntusu.png', imageUrl: 'https://via.placeholder.com/300x200.png?text=Soru+Ekran+Görüntüsü', timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(), readBy: [tempIds.coach, tempIds.student1] },
        
        // Conversation with Zeynep
        { id: 'msg-4', senderId: tempIds.coach, receiverId: tempIds.student2, text: 'Zeynep, kompozisyon ödevin gelmiş, en kısa zamanda değerlendireceğim.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: [tempIds.student2, tempIds.coach] },
        { id: 'msg-5', senderId: tempIds.student2, receiverId: tempIds.coach, text: 'Teşekkürler hocam, bekliyorum 😊', timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: [tempIds.coach, tempIds.student2] },

        // Announcement
        { id: 'msg-6', senderId: tempIds.coach, receiverId: 'all', type: 'announcement', text: 'Arkadaşlar merhaba, yarınki etüt saatimiz 15:00\'e alınmıştır. Herkesin katılımını bekliyorum.', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), readBy: [tempIds.coach] },
        
        // Poll
        { id: 'msg-7', senderId: tempIds.coach, receiverId: tempIds.student3, type: 'poll', text: 'Anket: Gelecek haftaki deneme sınavı', poll: { question: 'Gelecek haftaki deneme sınavı hangi gün olsun?', options: [{text: 'Cumartesi', votes: [tempIds.student3]}, {text: 'Pazar', votes: []}] }, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), readBy: [tempIds.student3, tempIds.coach] }
    ];

    const initialTemplates: AssignmentTemplate[] = [
      { id: 'temp-task-1', title: 'Soru Çözümü', description: 'Belirtilen konularda veya kaynaklardan belirli sayıda soru çözülecektir. Çözüm adımlarınızı göstermeniz ve anlamadığınız noktaları belirtmeniz beklenmektedir.', checklist: [{text: 'Belirtilen sayıda soruyu çöz'}, {text: 'Yanlışlarını ve boşlarını kontrol et'}, {text: 'Anlamadığın soruları not al'}] },
      { id: 'temp-task-2', title: 'Makale/Kompozisyon Yazımı', description: 'Verilen konu hakkında araştırma yaparak, giriş-gelişme-sonuç bölümlerinden oluşan bir yazı hazırlanacaktır.', checklist: [{text: 'Konu hakkında araştırma yap'}, {text: 'Yazı taslağını oluştur'}, {text: 'Yazıyı yaz ve dilbilgisi kontrolü yap'}] },
    ];
    
    const initialResources: Resource[] = [
      { id: 'res-1', name: 'Türev Konu Anlatımı.pdf', type: 'pdf', url: '#', recommendedTo: [tempIds.student1] },
      { id: 'res-2', name: 'Rehber Matematik - YouTube', type: 'link', url: 'https://www.youtube.com/@RehberMatematik', recommendedTo: [tempIds.student1, tempIds.student3] },
      { id: 'res-3', name: 'Hücre Organelleri Videosu', type: 'video', url: '#', recommendedTo: [tempIds.student2] },
    ];
    
    // FIX: Corrected the type from Omit<Goal, 'studentId'>[] to Goal[] because the objects include studentId.
    const initialGoals: Goal[] = [
        {id: 'goal-1', studentId: tempIds.student1, text: 'Haftada 200 paragraf sorusu çöz.', isCompleted: false},
        {id: 'goal-2', studentId: tempIds.student2, text: 'Her gün 20 yeni İngilizce kelime ezberle.', isCompleted: true},
        {id: 'goal-3', studentId: tempIds.student3, text: 'Gecikmiş tarih ödevini bu hafta bitir.', isCompleted: false},
        {id: 'goal-4', studentId: tempIds.student4, text: 'Haftalık deneme sınavı netini 5 puan artır.', isCompleted: false},
    ];

    return { initialUsers, initialAssignments, initialMessages, initialTemplates, initialResources, initialGoals, tempIds };
};

const getInitialState = () => ({
    users: [],
    assignments: [],
    messages: [],
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
    notifications: AppNotification[];
    templates: AssignmentTemplate[];
    resources: Resource[];
    goals: Goal[];
    currentUser: User | null;
    isLoading: boolean;
    typingStatus: { [userId: string]: boolean };
};

type Action =
    | { type: 'SET_INITIAL_DATA'; payload: Omit<AppState, 'currentUser' | 'isLoading' | 'typingStatus'> }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_CURRENT_USER'; payload: User | null }
    | { type: 'ADD_ASSIGNMENTS'; payload: Assignment[] }
    | { type: 'UPDATE_ASSIGNMENT'; payload: Assignment }
    | { type: 'ADD_MESSAGE'; payload: Message }
    | { type: 'UPDATE_USER'; payload: User }
    | { type: 'ADD_USER'; payload: User }
    | { type: 'DELETE_USER'; payload: string }
    | { type: 'MARK_MESSAGES_AS_READ'; payload: { contactId: string; currentUserId: string } }
    | { type: 'MARK_NOTIFICATIONS_AS_READ'; payload: { currentUserId: string } }
    | { type: 'ADD_NOTIFICATION'; payload: AppNotification }
    | { type: 'SET_TYPING_STATUS'; payload: { userId: string; isTyping: boolean } }
    | { type: 'ADD_GOAL'; payload: Goal }
    | { type: 'UPDATE_GOAL'; payload: Goal }
    | { type: 'ADD_REACTION'; payload: { messageId: string; emoji: string; userId: string } }
    | { type: 'VOTE_ON_POLL'; payload: { messageId: string; optionIndex: number; userId: string } }
    | { type: 'TOGGLE_RESOURCE_RECOMMENDATION'; payload: { resourceId: string; studentId: string } }
    | { type: 'SET_STATE'; payload: AppState };

const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_STATE':
            return action.payload;
        case 'SET_INITIAL_DATA':
            return { ...state, ...action.payload, isLoading: false };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload };
        case 'ADD_ASSIGNMENTS':
            return { ...state, assignments: [...state.assignments, ...action.payload] };
        case 'UPDATE_ASSIGNMENT':
            return { ...state, assignments: state.assignments.map(a => a.id === action.payload.id ? action.payload : a) };
        case 'ADD_MESSAGE':
             // Prevent duplicate messages from being added
            if (state.messages.some(m => m.id === action.payload.id)) {
                return state;
            }
            return { ...state, messages: [...state.messages, action.payload] };
        case 'UPDATE_USER': {
            const newCurrentUser = state.currentUser?.id === action.payload.id ? action.payload : state.currentUser;
            return { ...state, users: state.users.map(u => u.id === action.payload.id ? action.payload : u), currentUser: newCurrentUser };
        }
        case 'ADD_USER':
            return { ...state, users: [...state.users, action.payload] };
        case 'DELETE_USER':
             return {
                ...state,
                users: state.users.filter(u => u.id !== action.payload),
                assignments: state.assignments.filter(a => a.studentId !== action.payload && a.coachId !== action.payload),
                messages: state.messages.filter(m => m.senderId !== action.payload && m.receiverId !== action.payload),
            };
        case 'MARK_MESSAGES_AS_READ':
            return { ...state, messages: state.messages.map(m => {
                if (m.senderId === action.payload.contactId && m.receiverId === action.payload.currentUserId && !m.readBy.includes(action.payload.currentUserId)) {
                    return { ...m, readBy: [...m.readBy, action.payload.currentUserId] };
                }
                return m;
            })};
        case 'MARK_NOTIFICATIONS_AS_READ':
            return { ...state, notifications: state.notifications.map(n => n.userId === action.payload.currentUserId ? { ...n, isRead: true } : n) };
        case 'ADD_NOTIFICATION':
            return { ...state, notifications: [...state.notifications, action.payload] };
        case 'SET_TYPING_STATUS':
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
                        if (!newReactions[action.payload.emoji]) {
                            newReactions[action.payload.emoji] = [];
                        }
                        // Prevent duplicate reactions
                        if (!newReactions[action.payload.emoji].includes(action.payload.userId)) {
                            newReactions[action.payload.emoji].push(action.payload.userId);
                        }
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
                             // Remove vote from other options
                            const newVotes = opt.votes.filter(v => v !== action.payload.userId);
                            if (index === action.payload.optionIndex) {
                                // Add vote to the selected option if not already voted
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
        case 'TOGGLE_RESOURCE_RECOMMENDATION':
             return {
                ...state,
                resources: state.resources.map(r => {
                    if (r.id === action.payload.resourceId) {
                        const recommendedTo = r.recommendedTo || [];
                        const isRecommended = recommendedTo.includes(action.payload.studentId);
                        return {
                            ...r,
                            recommendedTo: isRecommended
                                ? recommendedTo.filter(id => id !== action.payload.studentId)
                                : [...recommendedTo, action.payload.studentId],
                        };
                    }
                    return r;
                }),
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
    register: (name: string, email: string, pass: string) => Promise<User | null>;
    getAssignmentsForStudent: (studentId: string) => Assignment[];
    getMessagesWithUser: (userId: string) => Message[];
    sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => Promise<void>;
    addAssignment: (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => Promise<void>;
    updateAssignment: (updatedAssignment: Assignment) => Promise<void>;
    updateUser: (updatedUser: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addUser: (newUser: Omit<User, 'id'>) => Promise<User | null>;
    seedDatabase: (demoUserUids: Record<string, string>) => Promise<void>;
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
    uploadFile: (file: File, path: string) => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(dataReducer, getInitialState());

    const fetchAllData = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        const collections = ['users', 'assignments', 'messages', 'templates', 'resources', 'goals', 'notifications'];
        try {
            const snapshots = await Promise.all(
                collections.map(c => db.collection(c).get())
            );
            const [users, assignments, messages, templates, resources, goals, notifications] = snapshots;

            dispatch({
                type: 'SET_INITIAL_DATA',
                payload: {
                    users: users.docs.map(d => ({ ...d.data(), id: d.id })) as User[],
                    assignments: assignments.docs.map(d => ({ ...d.data(), id: d.id })) as Assignment[],
                    messages: messages.docs.map(d => ({ ...d.data(), id: d.id })) as Message[],
                    templates: templates.docs.map(d => ({ ...d.data(), id: d.id })) as AssignmentTemplate[],
                    resources: resources.docs.map(d => ({ ...d.data(), id: d.id })) as Resource[],
                    goals: goals.docs.map(d => ({ ...d.data(), id: d.id })) as Goal[],
                    notifications: notifications.docs.map(d => ({ ...d.data(), id: d.id })) as AppNotification[],
                }
            });
        } catch (error) {
            console.error("Error fetching all data:", error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user: FirebaseUser | null) => {
            if (user) {
                 // Force refresh the token to get the latest custom claims.
                const idTokenResult = await user.getIdTokenResult(true); 
                const userRoleFromToken = idTokenResult.claims.role as UserRole | undefined;

                const userDocRef = db.collection('users').doc(user.uid);
                const userDoc = await userDocRef.get();
                if (userDoc.exists) {
                    const userFromFirestore = { ...userDoc.data(), id: user.uid } as User;
                    
                    // The role from the token is the source of truth.
                    const finalUser: User = { 
                        ...userFromFirestore, 
                        // Fallback to Firestore role if claim is not set, e.g., for newly registered users.
                        role: userRoleFromToken || userFromFirestore.role 
                    };

                    // Self-correction: If Firestore is out of sync with the token, update it.
                    if (userRoleFromToken && userFromFirestore.role !== userRoleFromToken) {
                        console.warn(`Role mismatch for ${user.uid}. Updating Firestore role to '${userRoleFromToken}'.`);
                        await userDocRef.update({ role: userRoleFromToken });
                        finalUser.role = userRoleFromToken;
                    }

                    dispatch({ type: 'SET_CURRENT_USER', payload: finalUser });
                    await fetchAllData();
                } else {
                     console.log("User document doesn't exist for authenticated user, logging out.");
                    await auth.signOut();
                }
            } else {
                dispatch({ type: 'SET_CURRENT_USER', payload: null });
                dispatch({ type: 'SET_STATE', payload: getInitialState()});
            }
             dispatch({ type: 'SET_LOADING', payload: false });
        });

        return () => unsubscribe();
    }, [fetchAllData]);

    const students = useMemo(() => state.users.filter(user => user.role === UserRole.Student), [state.users]);
    const coach = useMemo(() => state.users.find(user => user.role === UserRole.Coach) || null, [state.users]);

    const login = useCallback(async (email: string, pass: string): Promise<User | null> => {
        const userCredential = await auth.signInWithEmailAndPassword(email, pass);
        // onAuthStateChanged will handle fetching data and setting the current user
        const userDoc = await db.collection("users").doc(userCredential.user!.uid).get();
        if (userDoc.exists) {
            return { ...userDoc.data(), id: userDoc.id } as User;
        }
        return null;
    }, []);

    const logout = useCallback(async () => {
        await auth.signOut();
    }, []);

    const register = useCallback(async (name: string, email: string, pass: string): Promise<User | null> => {
        // Check if any users exist to determine if this is the first registration.
        const usersCollectionRef = db.collection('users');
        const existingUsersSnapshot = await usersCollectionRef.limit(1).get();
        const isFirstUser = existingUsersSnapshot.empty;
        
        // The first user registered will be the Super Admin.
        const role = isFirstUser ? UserRole.SuperAdmin : UserRole.Student;

        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        const newUser: User = {
            id: userCredential.user!.uid,
            name,
            email,
            role,
            profilePicture: `https://i.pravatar.cc/150?u=${email}`
        };
        await db.collection("users").doc(newUser.id).set(newUser);
        
        return newUser;
    }, []);

    const addUser = useCallback(async (userData: Omit<User, 'id'>): Promise<User | null> => {
        // This function is for admin use and assumes user is created in Auth separately.
        // It's primarily used for seeding.
        const usersQuery = await db.collection('users').where('email', '==', userData.email).limit(1).get();
        if (!usersQuery.empty) {
            console.error("User with this email already exists in Firestore.");
            return null;
        }
        // This is a simplified version for the demo. A real app would require an admin SDK
        // to create a user with a specific UID.
        const userDocRef = await db.collection("users").add(userData);
        const newUser = { ...userData, id: userDocRef.id };
        dispatch({ type: 'ADD_USER', payload: newUser });
        return newUser;
    }, []);

    const updateUser = useCallback(async (updatedUser: User) => {
        const userDocRef = db.collection('users').doc(updatedUser.id);
        await userDocRef.update(updatedUser);
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    }, []);
    
    const deleteUser = useCallback(async (userId: string) => {
        // NOTE: This only deletes the Firestore record. The Auth user must be deleted separately from the Firebase console.
        await db.collection('users').doc(userId).delete();
        dispatch({ type: 'DELETE_USER', payload: userId });
    }, []);

    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        const assignmentDocRef = db.collection('assignments').doc(updatedAssignment.id);
        await assignmentDocRef.update(updatedAssignment);
        dispatch({ type: 'UPDATE_ASSIGNMENT', payload: updatedAssignment });
    }, []);
    
    const addAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        const batch = db.batch();
        const newAssignments: Assignment[] = [];
        studentIds.forEach(studentId => {
            const assignmentDocRef = db.collection('assignments').doc();
            const newAssignment: Assignment = {
                ...assignmentData,
                id: assignmentDocRef.id,
                studentId,
                 checklist: assignmentData.checklist?.map((item, index) => ({ ...item, id: `chk-${assignmentDocRef.id}-${index}`, isCompleted: false })) || [],
            };
            batch.set(assignmentDocRef, newAssignment);
            newAssignments.push(newAssignment);
        });
        await batch.commit();
        dispatch({ type: 'ADD_ASSIGNMENTS', payload: newAssignments });
    }, []);
    
    const sendMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!state.currentUser) return;
        const newMessageData = { ...message, timestamp: new Date().toISOString(), readBy: [state.currentUser.id] };
        const docRef = await db.collection('messages').add(newMessageData);
        dispatch({ type: 'ADD_MESSAGE', payload: { ...newMessageData, id: docRef.id } });
    }, [state.currentUser]);

    const uploadFile = async (file: File, path: string): Promise<string> => {
        const storageRef = storage.ref(`${path}/${Date.now()}_${file.name}`);
        await storageRef.put(file);
        const downloadURL = await storageRef.getDownloadURL();
        return downloadURL;
    };

    const seedDatabase = async (demoUserUids: Record<string, string>) => {
        console.log("Seeding database with UIDs:", demoUserUids);
        const { initialUsers, initialAssignments, initialMessages, initialTemplates, initialResources, initialGoals, tempIds } = getInitialDataForSeeding();
        const batch = db.batch();

        const tempIdToUidMap: Record<string, string> = {};
        
        const mappedUsers: User[] = [];
        for (const user of initialUsers) {
            const uid = demoUserUids[user.email];
            if (!uid) throw new Error(`UID for ${user.email} not provided! Aborting seed.`);
            
            const tempUser = Object.values(tempIds).find(id => user.profilePicture.includes(id));
            if (tempUser) {
                 tempIdToUidMap[tempUser] = uid;
            }

            const mappedUser = { ...user, id: uid };
            mappedUsers.push(mappedUser);
            const userRef = db.collection("users").doc(uid);
            batch.set(userRef, mappedUser);
        }

        const mapId = (tempId: string) => tempIdToUidMap[tempId] || tempId;

        initialAssignments.forEach((item: any) => {
            const studentUid = mapId(item.studentId);
            const coachUid = mapId(item.coachId);
            const newItem = { ...item, studentId: studentUid, coachId: coachUid };
            batch.set(db.collection("assignments").doc(item.id), newItem);
        });

        initialMessages.forEach((item: any) => {
            const senderUid = mapId(item.senderId);
            const receiverUid = item.receiverId === 'all' ? 'all' : mapId(item.receiverId);
            const readByUids = item.readBy.map(mapId);
            
            let reactionsUidMapped = {};
            if (item.reactions) {
                reactionsUidMapped = Object.fromEntries(
                    Object.entries(item.reactions).map(([emoji, userIds]: [string, any]) => [
                        emoji,
                        userIds.map(mapId)
                    ])
                );
            }
            
            const newItem = { ...item, senderId: senderUid, receiverId: receiverUid, readBy: readByUids, reactions: reactionsUidMapped };
            batch.set(db.collection("messages").doc(item.id), newItem);
        });

        initialGoals.forEach((item: any) => {
            const studentUid = mapId(item.studentId);
            const newItem = { ...item, studentId: studentUid };
            batch.set(db.collection("goals").doc(item.id), newItem);
        });

        initialResources.forEach(item => {
            const recommendedToUids = item.recommendedTo?.map(mapId).filter(Boolean) as string[] || [];
            const newItem = {...item, recommendedTo: recommendedToUids};
            batch.set(db.collection("resources").doc(item.id), newItem);
        });
        
        initialTemplates.forEach(item => batch.set(db.collection("templates").doc(item.id), item));

        await batch.commit();
        console.log("Database seeded successfully with correct UIDs!");
        await fetchAllData();
    };

    const getAssignmentsForStudent = useCallback((studentId: string) => state.assignments.filter(a => a.studentId === studentId), [state.assignments]);
    const findMessageById = useCallback((messageId: string) => state.messages.find(m => m.id === messageId), [state.messages]);
    const getMessagesWithUser = useCallback((userId: string) => {
         if (!state.currentUser) return [];
        const query = (userId === 'announcements') 
            ? state.messages.filter(m => m.type === 'announcement')
            : state.messages.filter(m => (m.senderId === state.currentUser!.id && m.receiverId === userId) || (m.senderId === userId && m.receiverId === state.currentUser!.id));
        return query.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [state.currentUser, state.messages]);
    
    const markMessagesAsRead = useCallback(async (contactId: string) => {
        if (!state.currentUser) return;
        const currentUserId = state.currentUser.id;
        const unreadMessages = state.messages.filter(m => m.senderId === contactId && m.receiverId === currentUserId && !m.readBy.includes(currentUserId));
        if (unreadMessages.length === 0) return;

        const batch = db.batch();
        unreadMessages.forEach(msg => {
            const msgRef = db.collection('messages').doc(msg.id);
            batch.update(msgRef, { readBy: firebase.firestore.FieldValue.arrayUnion(currentUserId) });
        });
        await batch.commit();
        dispatch({ type: 'MARK_MESSAGES_AS_READ', payload: { contactId, currentUserId } });
     }, [state.currentUser, state.messages]);
    
    const markNotificationsAsRead = useCallback(async () => { 
        if (!state.currentUser) return;
        const currentUserId = state.currentUser.id;
        const unreadNotifs = state.notifications.filter(n => n.userId === currentUserId && !n.isRead);
        if (unreadNotifs.length === 0) return;

        const batch = db.batch();
        unreadNotifs.forEach(notif => {
            const notifRef = db.collection('notifications').doc(notif.id);
            batch.update(notifRef, { isRead: true });
        });
        await batch.commit();
        dispatch({ type: 'MARK_NOTIFICATIONS_AS_READ', payload: { currentUserId } });
    }, [state.currentUser, state.notifications]);
    
    const updateTypingStatus = useCallback((userId: string, isTyping: boolean) => {
        // This would typically involve a real-time database like Firestore's real-time updates or Firebase RTDB
        // For this demo, we'll just update local state
        dispatch({ type: 'SET_TYPING_STATUS', payload: { userId, isTyping } });
    }, []);
    
    const getGoalsForStudent = useCallback((studentId: string) => state.goals.filter(g => g.studentId === studentId), [state.goals]);
    
    const updateGoal = useCallback(async (updatedGoal: Goal) => {
        await db.collection('goals').doc(updatedGoal.id).update(updatedGoal);
        dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    }, []);
    
    const addGoal = useCallback(async (newGoalData: Omit<Goal, 'id'>) => {
        const docRef = await db.collection('goals').add(newGoalData);
        const newGoal = { ...newGoalData, id: docRef.id };
        dispatch({ type: 'ADD_GOAL', payload: newGoal });
    }, []);

    const addReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!state.currentUser) return;
        const userId = state.currentUser.id;
        const messageRef = db.collection('messages').doc(messageId);
        // Using FieldValue to handle concurrent updates
        await messageRef.update({
            [`reactions.${emoji}`]: firebase.firestore.FieldValue.arrayUnion(userId)
        });
        dispatch({ type: 'ADD_REACTION', payload: { messageId, emoji, userId } });
    }, [state.currentUser]);

    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if (!state.currentUser) return;
        const userId = state.currentUser.id;
        const message = state.messages.find(m => m.id === messageId);
        if (!message || !message.poll) return;

        const batch = db.batch();
        const messageRef = db.collection('messages').doc(messageId);

        // Atomically remove user's vote from all options and add to the new one
        message.poll.options.forEach((opt, index) => {
            batch.update(messageRef, {
                [`poll.options.${index}.votes`]: firebase.firestore.FieldValue.arrayRemove(userId)
            });
        });
        batch.update(messageRef, {
            [`poll.options.${optionIndex}.votes`]: firebase.firestore.FieldValue.arrayUnion(userId)
        });

        await batch.commit();
        dispatch({ type: 'VOTE_ON_POLL', payload: { messageId, optionIndex, userId } });
    }, [state.currentUser, state.messages]);

    const toggleResourceRecommendation = useCallback(async (resourceId: string, studentId: string) => {
        const resourceRef = db.collection('resources').doc(resourceId);
        const resource = state.resources.find(r => r.id === resourceId);
        const isRecommended = resource?.recommendedTo?.includes(studentId);

        await resourceRef.update({
            recommendedTo: isRecommended
                ? firebase.firestore.FieldValue.arrayRemove(studentId)
                : firebase.firestore.FieldValue.arrayUnion(studentId)
        });
        dispatch({ type: 'TOGGLE_RESOURCE_RECOMMENDATION', payload: { resourceId, studentId } });
    }, [state.resources]);


    const value = useMemo(() => ({
        ...state, students, coach,
        login, logout, register, getAssignmentsForStudent, getMessagesWithUser, sendMessage, addAssignment, updateAssignment,
        updateUser, deleteUser, addUser, seedDatabase, markMessagesAsRead, markNotificationsAsRead, updateTypingStatus,
        getGoalsForStudent, updateGoal, addGoal, addReaction, voteOnPoll, findMessageById, toggleResourceRecommendation, uploadFile
    }), [
        state, students, coach, login, logout, register, getAssignmentsForStudent, getMessagesWithUser, sendMessage, addAssignment, updateAssignment,
        updateUser, deleteUser, addUser, seedDatabase, markMessagesAsRead, markNotificationsAsRead, updateTypingStatus,
        getGoalsForStudent, updateGoal, addGoal, addReaction, voteOnPoll, findMessageById, toggleResourceRecommendation, uploadFile,
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
