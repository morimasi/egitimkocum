import { User, Assignment, Message, Conversation, Badge, BadgeID, UserRole, AssignmentStatus, AcademicTrack } from '../types';

const users: User[] = [
    { id: 'user_admin', name: 'Mahmut Hoca', email: 'admin@egitim.com', role: UserRole.SuperAdmin, profilePicture: 'https://i.pravatar.cc/150?u=admin@egitim.com', isOnline: true, xp: 0, streak: 0 },
    { id: 'user_coach_1', name: 'Ahmet Yılmaz', email: 'ahmet.yilmaz@egitim.com', role: UserRole.Coach, profilePicture: 'https://i.pravatar.cc/150?u=ahmet.yilmaz@egitim.com', isOnline: true, xp: 0, streak: 0 },
    { id: 'user_student_1', name: 'Leyla Kaya', email: 'leyla.kaya@mail.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=leyla.kaya@mail.com', isOnline: true, assignedCoachId: 'user_coach_1', gradeLevel: '12', academicTrack: AcademicTrack.Sayisal, xp: 1250, streak: 5, parentIds: ['user_parent_1'] },
    { id: 'user_student_2', name: 'Mehmet Öztürk', email: 'mehmet.ozturk@mail.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=mehmet.ozturk@mail.com', isOnline: true, assignedCoachId: 'user_coach_1', gradeLevel: '11', academicTrack: AcademicTrack.EsitAgirlik, xp: 800, streak: 2 },
    { id: 'user_student_3', name: 'Ali Veli', email: 'ali.veli@mail.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=ali.veli@mail.com', isOnline: false, assignedCoachId: 'user_coach_1', gradeLevel: '12', academicTrack: AcademicTrack.Sayisal, xp: 1500, streak: 0 },
    { id: 'user_coach_2', name: 'Zeynep Çelik', email: 'zeynep.celik@egitim.com', role: UserRole.Coach, profilePicture: 'https://i.pravatar.cc/150?u=zeynep.celik@egitim.com', isOnline: true, xp: 0, streak: 0 },
    { id: 'user_student_4', name: 'Elif Naz', email: 'elif.naz@mail.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=elif.naz@mail.com', isOnline: true, assignedCoachId: 'user_coach_2', gradeLevel: '10', academicTrack: AcademicTrack.Dil, xp: 450, streak: 0 },
    { id: 'user_parent_1', name: 'Sema Kaya', email: 'sema.kaya@mail.com', role: UserRole.Parent, profilePicture: 'https://i.pravatar.cc/150?u=sema.kaya@mail.com', isOnline: true, childIds: ['user_student_1'], xp: 0, streak: 0 },
];

const assignments: Assignment[] = [
    { id: 'assign_1', title: 'Matematik: Türev Alma Kuralları Testi', description: 'Türev alma kurallarını içeren 20 soruluk testi çözün ve sonuçlarınızı yükleyin. Özellikle çarpım ve bölüm türevine odaklanın.', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, studentId: 'user_student_1', coachId: 'user_coach_1', submissionType: 'file', grade: null, feedback: '', submittedAt: null, checklist: [{ id: 'c1', text: "Konu tekrarı yapıldı.", isCompleted: false }, { id: 'c2', text: "20 soru çözüldü.", isCompleted: false }, { id: 'c3', text: "Yanlışlar kontrol edildi.", isCompleted: false }], fileUrl: null },
    { id: 'assign_2', title: 'Türkçe: Paragraf Soru Çözümü', description: 'Verilen kaynaktan 50 paragraf sorusu çözülecek.', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Graded, studentId: 'user_student_1', coachId: 'user_coach_1', submissionType: 'completed', grade: 95, feedback: 'Harika bir iş çıkardın Leyla! Paragraf anlama hızın ve doğruluğun gözle görülür şekilde artmış. Bu tempoyu koru!', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), checklist: [], fileUrl: null },
    { id: 'assign_3', title: 'Fizik: Vektörler Konu Özeti', description: 'Fizik dersi vektörler konusunun özetini çıkarıp metin olarak gönderin. Bileşke vektör bulma yöntemlerine özellikle değinin.', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Pending, studentId: 'user_student_2', coachId: 'user_coach_1', submissionType: 'text', grade: null, feedback: '', submittedAt: null, checklist: [], fileUrl: null },
    { id: 'assign_4', title: 'Kimya: Mol Kavramı Soru Bankası', description: 'Soru bankasındaki mol kavramı ile ilgili ilk 3 testi bitir.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Submitted, studentId: 'user_student_2', coachId: 'user_coach_1', submissionType: 'completed', grade: null, feedback: '', submittedAt: new Date().toISOString(), checklist: [], fileUrl: null },
    { id: 'assign_5', title: 'İngilizce: Kelime Çalışması', description: 'Verilen 20 kelimeyi ezberle ve her biriyle birer cümle kur.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: AssignmentStatus.Submitted, studentId: 'user_student_4', coachId: 'user_coach_2', submissionType: 'text', grade: null, feedback: '', submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), checklist: [], fileUrl: null },
];

const conversations: Conversation[] = [
    { id: 'conv-1', participantIds: ['user_coach_1', 'user_student_1'], isGroup: false },
    { id: 'conv-2', participantIds: ['user_coach_1', 'user_student_2'], isGroup: false },
    { id: 'conv-3', participantIds: ['user_coach_1', 'user_student_3'], isGroup: false },
    { id: 'conv-4', participantIds: ['user_coach_2', 'user_student_4'], isGroup: false },
    { id: 'conv-announcements', participantIds: ['user_admin', 'user_coach_1', 'user_coach_2', 'user_student_1', 'user_student_2', 'user_student_3', 'user_student_4'], isGroup: true, groupName: '📢 Duyurular', groupImage: 'https://i.pravatar.cc/150?u=announcements', adminId: 'user_admin' },
    { id: 'conv-group-1', participantIds: ['user_coach_1', 'user_student_1', 'user_student_3'], isGroup: true, groupName: 'Sayısal Çalışma Grubu', groupImage: 'https://i.pravatar.cc/150?u=sayisal', adminId: 'user_coach_1' },
    { id: 'conv-teachers-lounge', participantIds: ['user_admin', 'user_coach_1', 'user_coach_2'], isGroup: true, groupName: 'Öğretmenler Odası', groupImage: 'https://i.pravatar.cc/150?u=teachers', adminId: 'user_admin' },
];

const messages: Message[] = [
    { id: 'msg-1', senderId: 'user_coach_1', conversationId: 'conv-1', text: 'Merhaba Leyla, haftalık programını gözden geçirdim. Matematik netlerin yükselişte, tebrikler!', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: ['user_coach_1'] },
    { id: 'msg-2', senderId: 'user_student_1', conversationId: 'conv-1', text: 'Teşekkür ederim öğretmenim! Türev testinde biraz zorlandım ama halledeceğim.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), type: 'text', readBy: ['user_student_1'] },
    { id: 'msg-3', senderId: 'user_admin', conversationId: 'conv-announcements', text: 'Arkadaşlar, yarınki deneme sınavı için son tekrar yapmayı unutmayın! Başarılar dilerim.', timestamp: new Date().toISOString(), type: 'announcement', readBy: ['user_admin'] },
];

const badges: Badge[] = [
    { id: BadgeID.FirstAssignment, name: "İlk Adım", description: "İlk ödevini başarıyla tamamladın!" },
    { id: BadgeID.HighAchiever, name: "Yüksek Başarı", description: "Not ortalaman 90'ın üzerinde!" },
    { id: BadgeID.PerfectScore, name: "Mükemmel Skor", description: "Bir ödevden 100 tam puan aldın!" },
    { id: BadgeID.GoalGetter, name: "Hedef Avcısı", description: "Haftalık hedeflerinin hepsine ulaştın!" },
    { id: BadgeID.StreakStarter, name: "Seri Başladı", description: "3 gün üst üste ödev teslim ettin." },
    { id: BadgeID.StreakMaster, name: "Seri Ustası", description: "7 gün üst üste ödev teslim ettin." },
    { id: BadgeID.OnTimeSubmissions, name: "Dakik Oyuncu", description: "5 ödevi zamanında teslim ettin." },
];

export const seedData = {
    users,
    assignments,
    conversations,
    messages,
    badges,
    notifications: [],
    templates: [],
    resources: [],
    goals: [],
    calendarEvents: [],
    exams: [],
    questions: [],
};
