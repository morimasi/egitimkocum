import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useReducer } from 'react';
import { User, Assignment, Message, UserRole, AppNotification, AssignmentTemplate, Resource, Goal, AssignmentStatus } from '../types';

// Helper to create downloadable dummy files for the demo
const createDummyBlobUrl = (filename: string, content: string, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    return URL.createObjectURL(blob);
};

// Data has been consolidated here to remove external dependencies.
const getInitialData = () => {
    const initialUsers: User[] = [
      { id: 'superadmin-1', name: 'Admin User', email: 'admin@app.com', role: UserRole.SuperAdmin, profilePicture: 'https://i.pravatar.cc/150?u=superadmin-1' },
      { id: 'coach-1', name: 'Ayşe Yılmaz', email: 'ayse.yilmaz@koc.com', role: UserRole.Coach, profilePicture: 'https://i.pravatar.cc/150?u=coach-1' },
      { id: 'student-1', name: 'Ali Veli', email: 'ali.veli@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-1' },
      { id: 'student-2', name: 'Zeynep Kaya', email: 'zeynep.kaya@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-2' },
      { id: 'student-3', name: 'Mehmet Öztürk', email: 'mehmet.ozturk@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-3' },
      { id: 'student-4', name: 'Fatma Demir', email: 'fatma.demir@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-4' },
    ];

    const initialAssignments: Assignment[] = [
      { id: 'asg-1', studentId: 'student-1', coachId: 'coach-1', title: 'Matematik Problemleri', description: 'Limit ve Türev konularında 20 problem çözülecek.', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, coachAttachments: [], feedbackReaction: null, submissionType: 'file' },
      { id: 'asg-2', studentId: 'student-1', coachId: 'coach-1', title: 'Fizik Deney Raporu', description: 'Basit sarkaç deneyi raporu hazırlanacak.', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 85, feedback: 'Raporun gayet başarılı, özellikle sonuç bölümünü çok iyi analiz etmişsin. Bir dahaki sefere hipotez kısmını daha detaylı yazabilirsin.', fileUrl: createDummyBlobUrl('report.pdf', 'Bu bir örnek fizik raporu dosyasıdır.'), fileName: 'report.pdf', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [{name: 'Fizik-Deney-Notlandirma-Anahtari.pdf', url: createDummyBlobUrl('Fizik-Deney-Notlandirma-Anahtari.pdf', 'Bu bir örnek notlandırma anahtarıdır.')}], feedbackReaction: '👍', submissionType: 'file' },
      { id: 'asg-3', studentId: 'student-2', coachId: 'coach-1', title: 'Kompozisyon Yazımı', description: 'Küresel ısınmanın etkileri üzerine bir kompozisyon yazılacak.', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Submitted, grade: null, feedback: '', fileUrl: createDummyBlobUrl('composition.docx', 'Bu bir örnek kompozisyon dosyasıdır.'), fileName: 'composition.docx', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [], audioFeedbackUrl: createDummyBlobUrl('feedback.webm', 'mock audio data', 'audio/webm'), feedbackReaction: null, submissionType: 'file' },
      { id: 'asg-4', studentId: 'student-3', coachId: 'coach-1', title: 'Tarih Araştırması', description: 'Osmanlı İmparatorluğu\'nun duraklama dönemi nedenleri araştırılacak.', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 92, feedback: 'Harika bir araştırma olmuş. Kaynakçan çok zengin ve argümanların çok tutarlı. Eline sağlık!', fileUrl: createDummyBlobUrl('tarih.pdf', 'Bu bir örnek tarih araştırmasıdır.'), fileName: 'tarih.pdf', submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [], feedbackReaction: null, submissionType: 'file' },
      { id: 'asg-5', studentId: 'student-4', coachId: 'coach-1', title: 'Biyoloji Projesi', description: 'Hücre bölünmesi modelleri hazırlanacak.', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, coachAttachments: [], checklist: [{id: 'chk-1', text: 'Araştırma yap', isCompleted: false}, {id: 'chk-2', text: 'Modeli tasarla', isCompleted: false}, {id: 'chk-3', text: 'Sunumu hazırla', isCompleted: false}], feedbackReaction: null, submissionType: 'file' },
      { id: 'asg-6', studentId: 'student-2', coachId: 'coach-1', title: 'İngilizce Sunum', description: 'İngilizce bir kitap özeti sunumu yapılacak.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 78, feedback: 'Sunumun akıcıydı, tebrikler. Gramer konusunda biraz daha pratik yapman faydalı olacaktır.', fileUrl: createDummyBlobUrl('presentation.pptx', 'Bu bir örnek sunum dosyasıdır.'), fileName: 'presentation.pptx', submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [{name: 'Sunum-Degerlendirme-Formu.pdf', url: createDummyBlobUrl('Sunum-Degerlendirme-Formu.pdf', 'Bu bir örnek değerlendirme formudur.')}], feedbackReaction: '🤔', submissionType: 'file' },
      { id: 'asg-7', studentId: 'student-1', coachId: 'coach-1', title: 'Yaklaşan Ödev', description: 'Bu ödevin teslim tarihi çok yakın.', dueDate: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, coachAttachments: [], feedbackReaction: null, submissionType: 'file' },
      { id: 'asg-8', studentId: 'student-1', coachId: 'coach-1', title: 'Metin Cevaplı Ödev', description: 'Verilen makaleyi oku ve ana fikrini 2 paragrafta özetle.', dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Submitted, grade: null, feedback: '', fileUrl: null, submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), submissionType: 'text', textSubmission: 'Makale, yapay zekanın eğitimdeki rolünün giderek arttığını ve kişiselleştirilmiş öğrenme deneyimleri sunduğunu vurguluyor. Özellikle, AI tabanlı platformların öğrencilerin zayıf yönlerini tespit ederek onlara özel materyaller sunması büyük bir avantaj olarak gösteriliyor. Bununla birlikte, teknolojinin getirdiği etik sorunlara ve öğretmen-öğrenci etkileşiminin önemine de dikkat çekiliyor.'},
      { id: 'asg-9', studentId: 'student-2', coachId: 'coach-1', title: 'Konu Tekrarı', description: 'Kimya dersindeki "Maddenin Halleri" konusunu tekrar et.', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, submissionType: 'completed' },
    ];

    const initialMessages: Message[] = [
        { id: 'msg-1', senderId: 'student-1', receiverId: 'coach-1', text: 'Hocam merhaba, matematik ödevindeki 5. soruda takıldım. Yardımcı olabilir misiniz?', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: ['coach-1', 'student-1'] },
        { id: 'msg-2', senderId: 'coach-1', receiverId: 'student-1', text: 'Merhaba Ali, tabii ki. Hangi adımı anlamadığını söylersen oradan devam edelim.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: ['student-1', 'coach-1'], reactions: {'👍': ['student-1']} },
        { id: 'msg-3', senderId: 'student-2', receiverId: 'coach-1', text: 'Kompozisyon ödevimi teslim ettim öğretmenim.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: ['coach-1', 'student-2'] },
        { id: 'msg-4', senderId: 'student-1', receiverId: 'coach-1', text: 'Bu da sesli mesaj örneği.', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), type: 'audio', audioUrl: createDummyBlobUrl('message.webm', 'mock audio data', 'audio/webm'), readBy: ['student-1'] },
        { id: 'announcement-1', senderId: 'coach-1', receiverId: 'all', text: 'Arkadaşlar merhaba, yarınki etüt saati 15:00\'e alınmıştır. Herkesin katılımını bekliyorum.', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), type: 'announcement', readBy: ['coach-1', 'student-1'] },
        { id: 'msg-5', senderId: 'coach-1', receiverId: 'student-1', text: 'Ayrıca, geçen haftaki deneme sonuçların gayet iyiydi, tebrikler!', timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(), type: 'text', readBy: ['student-1', 'coach-1'] },
        { id: 'msg-6', senderId: 'student-1', receiverId: 'coach-1', text: 'Teşekkür ederim hocam!', timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(), type: 'text', readBy: ['student-1'], replyTo: 'msg-5'},
    ];

    const initialNotifications: AppNotification[] = [
        { id: 'notif-1', userId: 'coach-1', message: "Zeynep Kaya 'Kompozisyon Yazımı' ödevini teslim etti.", timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), isRead: false, link: { page: 'assignments', filter: { studentId: 'student-2' } } },
        { id: 'notif-2', userId: 'coach-1', message: "Ali Veli'den yeni bir sesli mesajınız var.", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), isRead: false, link: { page: 'messages', filter: { contactId: 'student-1' } } },
        { id: 'notif-3', userId: 'coach-1', message: "Mehmet Öztürk'ten yeni bir mesajınız var.", timestamp: new Date().toISOString(), isRead: true, link: { page: 'messages', filter: { contactId: 'student-3' } } },
    ];

    const initialTemplates: AssignmentTemplate[] = [
      { id: 'temp-task-1', title: 'Soru Çözümü', description: 'Belirtilen konularda veya kaynaklardan belirli sayıda soru çözülecektir. Çözüm adımlarınızı göstermeniz ve anlamadığınız noktaları belirtmeniz beklenmektedir.', checklist: [{text: 'Belirtilen sayıda soruyu çöz'}, {text: 'Yanlışlarını ve boşlarını kontrol et'}, {text: 'Anlamadığın soruları not al'}] },
      { id: 'temp-task-2', title: 'Konu Tekrarı', description: 'Belirtilen dersin konusu tekrar edilecek ve konuyla ilgili özet çıkarılacaktır. Önemli gördüğünüz formül veya kavramları not alınız.', checklist: [{text: 'Konu anlatımını oku/izle'}, {text: 'Kendi cümlelerinle özet çıkar'}, {text: 'Önemli kavramları listele'}] },
      { id: 'temp-task-3', title: 'Deneme Çözümü', description: 'Belirtilen deneme sınavı, süre tutularak çözülecektir. Sınav sonrası doğru ve yanlış sayılarınızı not ediniz.', checklist: [{text: 'Süre tutarak denemeyi çöz'}, {text: 'Cevaplarını kontrol et'}, {text: 'Net sayını hesapla'}] },
      { id: 'temp-task-4', title: 'Yanlış Analizi', description: 'Çözdüğünüz deneme veya testteki yanlış ve boş bıraktığınız soruların nedenlerini analiz ediniz. Doğru çözümlerini öğrenerek not alınız.', checklist: [{text: 'Yanlış/boş soruları belirle'}, {text: 'Her bir sorunun doğru çözümünü öğren'}, {text: 'Neden yanlış yaptığını (bilgi eksiği, dikkat hatası vb.) not al'}] },
      { id: 'temp-task-5', title: 'Kitap Okuma ve Özet', description: 'Belirtilen kitabı okuyup, ana fikrini ve karakter analizlerini içeren bir özet hazırlayınız.', checklist: [{text: 'Kitabın belirtilen bölümünü oku'}, {text: 'Önemli olayları not al'}, {text: 'Ana fikri ve karakterleri analiz et'}, {text: 'Özeti yaz'}] },
      { id: 'temp-ders-1', title: 'Matematik', description: 'Matematik dersi için verilecek olan ödevin açıklaması.', checklist: [{text: 'Konuyu tekrar et'}, {text: 'Verilen alıştırmaları çöz'}, {text: 'Sonuçları kontrol et'}] },
      { id: 'temp-ders-2', title: 'Türkçe', description: 'Türkçe dersi için verilecek olan ödevin açıklaması.', checklist: [{text: 'Metni oku ve anla'}, {text: 'Soruları cevapla'}, {text: 'Yazım ve dilbilgisi kurallarına dikkat et'}] },
    ];

    const initialResources: Resource[] = [
      { id: 'res-1', name: 'Türev Konu Anlatımı.pdf', type: 'pdf', url: createDummyBlobUrl('Türev-Konu-Anlatımı.pdf', 'Bu bir örnek Türev PDF dosyasıdır.'), recommendedTo: ['student-1'] },
      { id: 'res-2', name: 'Khan Academy - İntegral Videoları', type: 'link', url: 'https://www.khanacademy.org/', recommendedTo: [] },
      { id: 'res-3', name: 'Kimyasal Tepkimeler.pdf', type: 'pdf', url: createDummyBlobUrl('Kimyasal-Tepkimeler.pdf', 'Bu bir örnek Kimya PDF dosyasıdır.'), recommendedTo: ['student-2', 'student-3'] },
    ];

    const initialGoals: Goal[] = [
        {id: 'goal-1', studentId: 'student-1', text: 'Haftada 200 paragraf sorusu çöz.', isCompleted: false},
        {id: 'goal-2', studentId: 'student-1', text: 'Matematik not ortalamasını 85\'e yükselt.', isCompleted: false},
        {id: 'goal-3', studentId: 'student-2', text: 'Her gün 30 dakika kitap oku.', isCompleted: true},
    ];

    return {
      users: initialUsers,
      assignments: initialAssignments,
      messages: initialMessages,
      notifications: initialNotifications,
      templates: initialTemplates,
      resources: initialResources,
      goals: initialGoals,
      currentUser: null,
      isLoading: true,
      typingStatus: {},
    }
};

type AppState = ReturnType<typeof getInitialData>;

type Action =
    | { type: 'SET_STATE'; payload: AppState }
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
    | { type: 'TOGGLE_RESOURCE_RECOMMENDATION'; payload: { resourceId: string; studentId: string } };


const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_STATE':
            return action.payload;
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload };
        case 'ADD_ASSIGNMENTS':
            return { ...state, assignments: [...state.assignments, ...action.payload] };
        case 'UPDATE_ASSIGNMENT':
            return { ...state, assignments: state.assignments.map(a => a.id === action.payload.id ? action.payload : a) };
        case 'ADD_MESSAGE':
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
            return { ...state, notifications: state.notifications.map(n => n.userId === action.payload.currentUserId && !n.isRead ? { ...n, isRead: true } : n)};
        case 'ADD_NOTIFICATION':
            return { ...state, notifications: [...state.notifications, action.payload] };
        case 'SET_TYPING_STATUS':
            return { ...state, typingStatus: { ...state.typingStatus, [action.payload.userId]: action.payload.isTyping } };
        case 'ADD_GOAL':
            return { ...state, goals: [...state.goals, action.payload] };
        case 'UPDATE_GOAL':
            return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g) };
        case 'ADD_REACTION': {
            return { ...state, messages: state.messages.map(msg => {
                if (msg.id === action.payload.messageId) {
                    const newReactions = { ...(msg.reactions || {}) };
                    const userHasReactedWithEmoji = newReactions[action.payload.emoji]?.includes(action.payload.userId);
                    Object.keys(newReactions).forEach(key => {
                        newReactions[key] = newReactions[key].filter(id => id !== action.payload.userId);
                        if (newReactions[key].length === 0) delete newReactions[key];
                    });
                    if (!userHasReactedWithEmoji) {
                        if (!newReactions[action.payload.emoji]) newReactions[action.payload.emoji] = [];
                        newReactions[action.payload.emoji].push(action.payload.userId);
                    }
                    return { ...msg, reactions: newReactions };
                }
                return msg;
            })};
        }
        case 'VOTE_ON_POLL': {
            return { ...state, messages: state.messages.map(msg => {
                if (msg.id === action.payload.messageId && msg.poll) {
                    let userAlreadyVotedForThisOption = false;
                    const newOptions = msg.poll.options.map((opt, index) => {
                        if (index === action.payload.optionIndex && opt.votes.includes(action.payload.userId)) userAlreadyVotedForThisOption = true;
                        return { ...opt, votes: opt.votes.filter(v => v !== action.payload.userId) };
                    });
                    if (!userAlreadyVotedForThisOption) {
                        newOptions[action.payload.optionIndex].votes.push(action.payload.userId);
                    }
                    return { ...msg, poll: { ...msg.poll, options: newOptions } };
                }
                return msg;
            })};
        }
        case 'TOGGLE_RESOURCE_RECOMMENDATION': {
            return { ...state, resources: state.resources.map(res => {
                if (res.id === action.payload.resourceId) {
                    const recommended = res.recommendedTo || [];
                    const isRecommended = recommended.includes(action.payload.studentId);
                    const newRecommended = isRecommended
                        ? recommended.filter(id => id !== action.payload.studentId)
                        : [...recommended, action.payload.studentId];
                    return { ...res, recommendedTo: newRecommended };
                }
                return res;
            })};
        }
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
    const [state, dispatch] = useReducer(dataReducer, getInitialData());
    
    useEffect(() => {
        try {
            const savedUserId = localStorage.getItem('currentUser');
            if (savedUserId) {
                const user = state.users.find(u => u.id === savedUserId);
                dispatch({ type: 'SET_CURRENT_USER', payload: user || null });
            }
        } catch (error) {
            console.error("Could not restore session:", error);
        }
        dispatch({ type: 'SET_LOADING', payload: false });
    }, []); 

    const students = useMemo(() => state.users.filter(user => user.role === UserRole.Student), [state.users]);
    const coach = useMemo(() => state.users.find(user => user.role === UserRole.Coach) || null, [state.users]);

    const login = useCallback(async (email: string): Promise<User | null> => {
        const user = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            dispatch({ type: 'SET_CURRENT_USER', payload: user });
            localStorage.setItem('currentUser', user.id);
            return user;
        }
        return null;
    }, [state.users]);

    const logout = useCallback(async () => {
        dispatch({ type: 'SET_CURRENT_USER', payload: null });
        localStorage.removeItem('currentUser');
    }, []);
    
    const register = useCallback(async (name: string, email: string): Promise<User | null> => {
        if(state.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            const user = await login(email);
            return user;
        }
        
        const newUser: User = {
            id: `user-${Date.now()}`, name, email, role: UserRole.Student,
            profilePicture: `https://i.pravatar.cc/150?u=${email}`
        };
        dispatch({ type: 'ADD_USER', payload: newUser });
        await login(email);
        return newUser;
    }, [state.users, login]);

    const getAssignmentsForStudent = useCallback((studentId: string) => state.assignments.filter(a => a.studentId === studentId), [state.assignments]);
    const findMessageById = useCallback((messageId: string) => state.messages.find(m => m.id === messageId), [state.messages]);

    const getMessagesWithUser = useCallback((userId: string) => {
        if (!state.currentUser) return [];
        const query = (userId === 'announcements') 
            ? state.messages.filter(m => m.type === 'announcement')
            : state.messages.filter(m => (m.senderId === state.currentUser!.id && m.receiverId === userId) || (m.senderId === userId && m.receiverId === state.currentUser!.id));
        return query.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [state.currentUser, state.messages]);

    const sendMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp' | 'readBy'>) => {
        if (!state.currentUser) return;
        const newMessage: Message = { id: `msg-${Date.now()}`, ...message, timestamp: new Date().toISOString(), readBy: [state.currentUser.id] };
        dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
    }, [state.currentUser]);
    
    const addAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'studentId'>, studentIds: string[]) => {
        const newAssignments = studentIds.map(studentId => {
            const id = `asg-${Date.now()}-${studentId}`;
            return { ...assignmentData, id, studentId, checklist: assignmentData.checklist?.map((item, index) => ({ ...item, id: `chk-${id}-${index}`, isCompleted: false }))};
        });
        dispatch({ type: 'ADD_ASSIGNMENTS', payload: newAssignments });
    }, []);

    const addNotification = useCallback(async (userId: string, message: string, link?: AppNotification['link']) => {
        const newNotification: AppNotification = { id: `notif-${Date.now()}`, userId, message, timestamp: new Date().toISOString(), isRead: false, link };
        dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    }, []);

    const updateAssignment = useCallback(async (updatedAssignment: Assignment) => {
        const originalAssignment = state.assignments.find(a => a.id === updatedAssignment.id);
        if (originalAssignment && originalAssignment.status !== AssignmentStatus.Graded && updatedAssignment.status === AssignmentStatus.Graded) {
            const coachName = coach?.name || 'Koçun';
            addNotification(updatedAssignment.studentId, `${coachName}, "${updatedAssignment.title}" ödevini notlandırdı.`, { page: 'assignments' });
        }
        dispatch({ type: 'UPDATE_ASSIGNMENT', payload: updatedAssignment });
    }, [state.assignments, coach, addNotification]);

    const updateUser = useCallback(async (updatedUser: User) => dispatch({ type: 'UPDATE_USER', payload: updatedUser }), []);
    const deleteUser = useCallback(async (userId: string) => dispatch({ type: 'DELETE_USER', payload: userId }), []);
    const addUser = useCallback(async (userData: Omit<User, 'id'>) => dispatch({ type: 'ADD_USER', payload: { ...userData, id: `user-${Date.now()}` } }), []);
    
    const resetData = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        await logout();
        dispatch({ type: 'SET_STATE', payload: getInitialData() });
        dispatch({ type: 'SET_LOADING', payload: false });
    }, [logout]);

    const markMessagesAsRead = useCallback(async (contactId: string) => {
        if (!state.currentUser) return;
        dispatch({ type: 'MARK_MESSAGES_AS_READ', payload: { contactId, currentUserId: state.currentUser.id } });
    }, [state.currentUser]);

    const markNotificationsAsRead = useCallback(async () => {
        if (!state.currentUser) return;
        dispatch({ type: 'MARK_NOTIFICATIONS_AS_READ', payload: { currentUserId: state.currentUser.id } });
    }, [state.currentUser]);

    const updateTypingStatus = useCallback((userId: string, isTyping: boolean) => dispatch({ type: 'SET_TYPING_STATUS', payload: { userId, isTyping } }), []);
    const getGoalsForStudent = useCallback((studentId: string) => state.goals.filter(g => g.studentId === studentId), [state.goals]);
    const updateGoal = useCallback(async (updatedGoal: Goal) => dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal }), []);
    const addGoal = useCallback(async (newGoalData: Omit<Goal, 'id'>) => dispatch({ type: 'ADD_GOAL', payload: { ...newGoalData, id: `goal-${Date.now()}` } }), []);
    
    const addReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!state.currentUser) return;
        dispatch({ type: 'ADD_REACTION', payload: { messageId, emoji, userId: state.currentUser.id } });
    }, [state.currentUser]);

    const voteOnPoll = useCallback(async (messageId: string, optionIndex: number) => {
        if (!state.currentUser) return;
        dispatch({ type: 'VOTE_ON_POLL', payload: { messageId, optionIndex, userId: state.currentUser.id } });
    }, [state.currentUser]);

    const toggleResourceRecommendation = useCallback(async (resourceId: string, studentId: string) => {
        dispatch({ type: 'TOGGLE_RESOURCE_RECOMMENDATION', payload: { resourceId, studentId } });
    }, []);

    const value = useMemo(() => ({
        ...state, students, coach,
        login, logout, register, getAssignmentsForStudent, getMessagesWithUser, sendMessage, addAssignment, updateAssignment,
        updateUser, deleteUser, addUser, resetData, markMessagesAsRead, markNotificationsAsRead, updateTypingStatus,
        getGoalsForStudent, updateGoal, addGoal, addReaction, voteOnPoll, findMessageById, toggleResourceRecommendation,
    }), [
        state, students, coach,
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