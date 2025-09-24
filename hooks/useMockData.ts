import { useState } from 'react';
import { User, Assignment, Message, UserRole, AssignmentStatus, AppNotification, AssignmentTemplate, Resource, Goal } from '../types';

const initialUsers: User[] = [
  { id: 'superadmin-1', name: 'Admin User', email: 'admin@app.com', role: UserRole.SuperAdmin, profilePicture: 'https://i.pravatar.cc/150?u=superadmin-1' },
  { id: 'coach-1', name: 'Ayşe Yılmaz', email: 'ayse.yilmaz@koc.com', role: UserRole.Coach, profilePicture: 'https://i.pravatar.cc/150?u=coach-1' },
  { id: 'student-1', name: 'Ali Veli', email: 'ali.veli@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-1' },
  { id: 'student-2', name: 'Zeynep Kaya', email: 'zeynep.kaya@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-2' },
  { id: 'student-3', name: 'Mehmet Öztürk', email: 'mehmet.ozturk@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-3' },
  { id: 'student-4', name: 'Fatma Demir', email: 'fatma.demir@ogrenci.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=student-4' },
];

const initialAssignments: Assignment[] = [
  { id: 'asg-1', studentId: 'student-1', coachId: 'coach-1', title: 'Matematik Problemleri', description: 'Limit ve Türev konularında 20 problem çözülecek.', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, coachAttachments: [], feedbackReaction: null },
  { id: 'asg-2', studentId: 'student-1', coachId: 'coach-1', title: 'Fizik Deney Raporu', description: 'Basit sarkaç deneyi raporu hazırlanacak.', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 85, feedback: 'Raporun gayet başarılı, özellikle sonuç bölümünü çok iyi analiz etmişsin. Bir dahaki sefere hipotez kısmını daha detaylı yazabilirsin.', fileUrl: 'report.pdf', submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [{name: 'Fizik-Deney-Notlandirma-Anahtari.pdf', url: '#'}], feedbackReaction: '👍' },
  { id: 'asg-3', studentId: 'student-2', coachId: 'coach-1', title: 'Kompozisyon Yazımı', description: 'Küresel ısınmanın etkileri üzerine bir kompozisyon yazılacak.', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Submitted, grade: null, feedback: '', fileUrl: 'composition.docx', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [], audioFeedbackUrl: 'blob:https://example.com/mock-audio-123', feedbackReaction: null },
  { id: 'asg-4', studentId: 'student-3', coachId: 'coach-1', title: 'Tarih Araştırması', description: 'Osmanlı İmparatorluğu\'nun duraklama dönemi nedenleri araştırılacak.', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 92, feedback: 'Harika bir araştırma olmuş. Kaynakçan çok zengin ve argümanların çok tutarlı. Eline sağlık!', fileUrl: 'tarih.pdf', submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [], feedbackReaction: null },
  { id: 'asg-5', studentId: 'student-4', coachId: 'coach-1', title: 'Biyoloji Projesi', description: 'Hücre bölünmesi modelleri hazırlanacak.', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, coachAttachments: [], checklist: [{id: 'chk-1', text: 'Araştırma yap', isCompleted: false}, {id: 'chk-2', text: 'Modeli tasarla', isCompleted: false}, {id: 'chk-3', text: 'Sunumu hazırla', isCompleted: false}], feedbackReaction: null },
  { id: 'asg-6', studentId: 'student-2', coachId: 'coach-1', title: 'İngilizce Sunum', description: 'İngilizce bir kitap özeti sunumu yapılacak.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, grade: 78, feedback: 'Sunumun akıcıydı, tebrikler. Gramer konusunda biraz daha pratik yapman faydalı olacaktır.', fileUrl: 'presentation.pptx', submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), coachAttachments: [{name: 'Sunum-Degerlendirme-Formu.pdf', url: '#'}], feedbackReaction: '🤔' },
  { id: 'asg-7', studentId: 'student-1', coachId: 'coach-1', title: 'Yaklaşan Ödev', description: 'Bu ödevin teslim tarihi çok yakın.', dueDate: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', fileUrl: null, submittedAt: null, coachAttachments: [], feedbackReaction: null },

];

const initialMessages: Message[] = [
    { id: 'msg-1', senderId: 'student-1', receiverId: 'coach-1', text: 'Hocam merhaba, matematik ödevindeki 5. soruda takıldım. Yardımcı olabilir misiniz?', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'text', isRead: true },
    { id: 'msg-2', senderId: 'coach-1', receiverId: 'student-1', text: 'Merhaba Ali, tabii ki. Hangi adımı anlamadığını söylersen oradan devam edelim.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), type: 'text', isRead: true },
    { id: 'msg-3', senderId: 'student-2', receiverId: 'coach-1', text: 'Kompozisyon ödevimi teslim ettim öğretmenim.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), type: 'text', isRead: true },
    { id: 'msg-4', senderId: 'student-1', receiverId: 'coach-1', text: 'Bu da sesli mesaj örneği.', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), type: 'audio', audioUrl: 'blob:https://example.com/mock-audio-456', isRead: false },
    { id: 'announcement-1', senderId: 'coach-1', receiverId: 'all', text: 'Arkadaşlar merhaba, yarınki etüt saati 15:00\'e alınmıştır. Herkesin katılımını bekliyorum.', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), type: 'announcement', isRead: false },
];

const initialNotifications: AppNotification[] = [
    { id: 'notif-1', userId: 'coach-1', message: "Zeynep Kaya 'Kompozisyon Yazımı' ödevini teslim etti.", timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), isRead: false, link: { page: 'assignments', filter: { studentId: 'student-2' } } },
    { id: 'notif-2', userId: 'coach-1', message: "Ali Veli'den yeni bir sesli mesajınız var.", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), isRead: false, link: { page: 'messages', filter: { contactId: 'student-1' } } },
    { id: 'notif-3', userId: 'coach-1', message: "Mehmet Öztürk'ten yeni bir mesajınız var.", timestamp: new Date().toISOString(), isRead: true, link: { page: 'messages', filter: { contactId: 'student-3' } } },
];

const initialTemplates: AssignmentTemplate[] = [
  { id: 'temp-1', title: 'Haftalık Kitap Özeti', description: 'Bu hafta okuduğunuz kitabın özetini çıkarın. Ana karakterleri, konuyu ve kitabın ana fikrini belirtin.', checklist: [{text: 'Kitabı bitir'}, {text: 'Ana karakterleri listele'}, {text: 'Konuyu özetle'}, {text: 'Ana fikri yaz'}] },
  { id: 'temp-2', title: 'Deney Raporu', description: 'Yaptığınız deneyi bilimsel rapor formatına uygun şekilde yazın.', checklist: [{text: 'Hipotezi belirle'}, {text: 'Malzemeleri listele'}, {text: 'Deney adımlarını yaz'}, {text: 'Gözlemleri kaydet'}, {text: 'Sonucu analiz et'}] },
];

const initialResources: Resource[] = [
  { id: 'res-1', name: 'Türev Konu Anlatımı.pdf', type: 'pdf', url: '#' },
  { id: 'res-2', name: 'Khan Academy - İntegral Videoları', type: 'link', url: '#' },
];

const initialGoals: Goal[] = [
    {id: 'goal-1', studentId: 'student-1', text: 'Haftada 200 paragraf sorusu çöz.', isCompleted: false},
    {id: 'goal-2', studentId: 'student-1', text: 'Matematik not ortalamasını 85\'e yükselt.', isCompleted: false},
    {id: 'goal-3', studentId: 'student-2', text: 'Her gün 30 dakika kitap oku.', isCompleted: true},
];


export const useMockData = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [templates, setTemplates] = useState<AssignmentTemplate[]>(initialTemplates);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  const getInitialData = () => {
    return {
      users: initialUsers,
      assignments: initialAssignments,
      messages: initialMessages,
      notifications: initialNotifications,
      templates: initialTemplates,
      resources: initialResources,
      goals: initialGoals,
    }
  }

  return {
    users,
    setUsers,
    assignments,
    setAssignments,
    messages,
    setMessages,
    notifications, 
    setNotifications,
    templates,
    setTemplates,
    resources,
    setResources,
    goals,
    setGoals,
    getInitialData
  };
};