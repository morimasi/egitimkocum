
import { UserRole, AssignmentStatus, AcademicTrack, ResourceCategory, QuestionDifficulty } from '../types';
import { examCategories } from './examCategories.js';

const uuid = () => crypto.randomUUID();

// --- USERS ---
const superAdminId = 'super-admin-id';
const mahmutHocaId = 'mahmut-hoca-id';
const ayseHocaId = 'ayse-hoca-id';

const student1Id = 'student-ahmet-id';
const student2Id = 'student-zeynep-id';
const student3Id = 'student-can-id';
const student4Id = 'student-elif-id';
const student5Id = 'student-mert-id';
const student6Id = 'student-ipek-id';

const parent1Id = 'parent-yılmaz-id';
const parent2Id = 'parent-fatma-id';

const users = [
    // Admins & Coaches
    { id: superAdminId, name: 'Süper Admin', email: 'admin@mahmuthoca.com', password: 'password', role: UserRole.SuperAdmin, profilePicture: `https://i.pravatar.cc/150?u=admin`, childIds: [], parentIds: [], earnedBadgeIds: [] },
    { id: mahmutHocaId, name: 'Mahmut Hoca', email: 'mahmut@mahmuthoca.com', password: 'password', role: UserRole.Coach, profilePicture: `https://i.pravatar.cc/150?u=mahmut`, childIds: [], parentIds: [], earnedBadgeIds: [] },
    { id: ayseHocaId, name: 'Ayşe Yılmaz', email: 'ayse@mahmuthoca.com', password: 'password', role: UserRole.Coach, profilePicture: `https://i.pravatar.cc/150?u=ayse`, childIds: [], parentIds: [], earnedBadgeIds: [] },
    // Students
    { id: student1Id, name: 'Ahmet Yılmaz', email: 'ahmet@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=ahmet`, assignedCoachId: mahmutHocaId, gradeLevel: '12', academicTrack: AcademicTrack.Sayisal, parentIds: [parent1Id], xp: 1250, streak: 5, earnedBadgeIds: ['first-assignment', 'on-time-submissions'] },
    { id: student2Id, name: 'Zeynep Kaya', email: 'zeynep@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=zeynep`, assignedCoachId: mahmutHocaId, gradeLevel: '11', academicTrack: AcademicTrack.EsitAgirlik, parentIds: [parent2Id], xp: 850, streak: 2, earnedBadgeIds: ['first-assignment'] },
    { id: student3Id, name: 'Can Demir', email: 'can@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=can`, assignedCoachId: mahmutHocaId, gradeLevel: 'mezun', academicTrack: AcademicTrack.Sozel, parentIds: [], xp: 2300, streak: 0, earnedBadgeIds: ['first-assignment', 'streak-starter', 'perfect-score'] },
    { id: student4Id, name: 'Elif Şahin', email: 'elif@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=elif`, assignedCoachId: ayseHocaId, gradeLevel: '12', academicTrack: AcademicTrack.Sayisal, parentIds: [], xp: 1800, streak: 8, earnedBadgeIds: ['first-assignment', 'streak-master', 'high-achiever'] },
    { id: student5Id, name: 'Mert Öztürk', email: 'mert@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=mert`, assignedCoachId: ayseHocaId, gradeLevel: '10', academicTrack: AcademicTrack.Sayisal, parentIds: [], xp: 450, streak: 1, earnedBadgeIds: [] },
    { id: student6Id, name: 'İpek Aydın', email: 'ipek@mahmuthoca.com', password: 'password', role: UserRole.Student, profilePicture: `https://i.pravatar.cc/150?u=ipek`, assignedCoachId: ayseHocaId, gradeLevel: '11', academicTrack: AcademicTrack.Dil, parentIds: [], xp: 950, streak: 0, earnedBadgeIds: ['first-assignment'] },
    // Parents
    { id: parent1Id, name: 'Yılmaz Bey', email: 'yilmaz@veli.com', password: 'password', role: UserRole.Parent, profilePicture: `https://i.pravatar.cc/150?u=yilmaz`, childIds: [student1Id], parentIds: [], earnedBadgeIds: [] },
    { id: parent2Id, name: 'Fatma Hanım', email: 'fatma@veli.com', password: 'password', role: UserRole.Parent, profilePicture: `https://i.pravatar.cc/150?u=fatma`, childIds: [student2Id], parentIds: [], earnedBadgeIds: [] },
];

// --- ASSIGNMENTS ---
const assignments = [
    // Ahmet's Assignments
    { id: uuid(), studentId: student1Id, coachId: mahmutHocaId, title: 'Matematik - Türev Testi', description: 'Türev kuralları ile ilgili 20 soruluk testi çöz.', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), status: AssignmentStatus.Pending, submissionType: 'file', grade: null, feedback: '', fileUrl: null, submittedAt: null, checklist: [] },
    { id: uuid(), studentId: student1Id, coachId: mahmutHocaId, title: 'Fizik - Vektörler Özet', description: 'Vektörler konusunun özetini çıkarıp metin olarak gönder.', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: AssignmentStatus.Graded, submissionType: 'text', grade: 90, feedback: 'Harika bir özet olmuş Ahmet, başarılarının devamını dilerim.', fileUrl: null, submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), checklist: [] },
    { id: uuid(), studentId: student1Id, coachId: mahmutHocaId, title: 'Kimya - Mol Hesaplamaları', description: 'Ders kitabındaki mol hesaplamaları alıştırmalarını yap.', dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), status: AssignmentStatus.Graded, submissionType: 'completed', grade: 100, feedback: 'Mükemmel, tam puan!', fileUrl: null, submittedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), checklist: [] },
    // Zeynep's Assignments
    { id: uuid(), studentId: student2Id, coachId: mahmutHocaId, title: 'Edebiyat - Divan Şiiri Analizi', description: 'Seçtiğin bir divan şiirini analiz et.', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: AssignmentStatus.Pending, submissionType: 'text', grade: null, feedback: '', fileUrl: null, submittedAt: null, checklist: [] },
    { id: uuid(), studentId: student2Id, coachId: mahmutHocaId, title: 'Tarih - Kurtuluş Savaşı Sunumu', description: 'Kurtuluş Savaşı cepheleri hakkında bir sunum hazırla.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: AssignmentStatus.Submitted, submissionType: 'file', grade: null, feedback: '', fileUrl: '#', submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), checklist: [] },
    // Can's Assignments
    { id: uuid(), studentId: student3Id, coachId: mahmutHocaId, title: 'Coğrafya - İklim Tipleri', description: 'Dünyadaki ana iklim tiplerini araştır.', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: AssignmentStatus.Graded, submissionType: 'text', grade: 75, feedback: 'Güzel çalışma, ancak Akdeniz ikliminin özelliklerini daha detaylı inceleyebilirdin.', fileUrl: null, submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), checklist: [] },
    // Elif's Assignments
    { id: uuid(), studentId: student4Id, coachId: ayseHocaId, title: 'Biyoloji - Hücre Çizimi', description: 'Hayvan ve bitki hücresi çizerek organelleri göster.', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), status: AssignmentStatus.Pending, submissionType: 'file', grade: null, feedback: '', fileUrl: null, submittedAt: null, checklist: [] }, // Overdue
];

// --- EXAMS ---
const exams = [
    { id: uuid(), studentId: student1Id, title: 'TYT Deneme Sınavı - 1', date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), totalQuestions: 120, correct: 85, incorrect: 20, empty: 15, netScore: 80.0, subjects: [{ name: 'Matematik', correct: 25, incorrect: 5, empty: 10, netScore: 23.75 }, { name: 'Türkçe', correct: 30, incorrect: 8, empty: 2, netScore: 28.0 }], category: 'Genel Deneme Sınavları', topic: 'TYT', type: 'deneme' },
    { id: uuid(), studentId: student1Id, title: 'Türev Konu Taraması', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), totalQuestions: 20, correct: 18, incorrect: 2, empty: 0, netScore: 17.5, subjects: [], category: 'Matematik', topic: 'Türev', type: 'konu-tarama' },
    { id: uuid(), studentId: student2Id, title: 'AYT Edebiyat Taraması', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), totalQuestions: 40, correct: 32, incorrect: 8, empty: 0, netScore: 30.0, subjects: [], category: 'Edebiyat', topic: 'Divan Edebiyatı', type: 'konu-tarama' },
];

// --- GOALS ---
const goals = [
    { id: uuid(), studentId: student1Id, title: 'Haftada 3 deneme sınavı çözmek', description: '', isCompleted: false, milestones: [{id: uuid(), text: '1. Deneme', isCompleted: true}, {id: uuid(), text: '2. Deneme', isCompleted: false}] },
    { id: uuid(), studentId: student1Id, title: 'Türev konusunu bitirmek', description: '', isCompleted: true, milestones: [] },
    { id: uuid(), studentId: student2Id, title: 'Günde 50 paragraf sorusu çözmek', description: '', isCompleted: false, milestones: [] },
];

// --- RESOURCES ---
const resources = [
    { id: uuid(), name: 'Limit ve Süreklilik Video Dersi', type: 'link', url: 'https://www.youtube.com', isPublic: true, uploaderId: mahmutHocaId, assignedTo: [], category: ResourceCategory.Matematik },
    { id: uuid(), name: 'Organik Kimya Notları', type: 'pdf', url: '#', isPublic: true, uploaderId: mahmutHocaId, assignedTo: [], category: ResourceCategory.Kimya },
    { id: uuid(), name: 'Ahmet için Özel Fizik Problemleri', type: 'document', url: '#', isPublic: false, uploaderId: mahmutHocaId, assignedTo: [student1Id], category: ResourceCategory.Fizik },
];

// --- TEMPLATES ---
const templates: any[] = [];

examCategories.forEach(category => {
  if (category.name === "Genel Deneme Sınavları") {
    return;
  }

  category.topics.forEach(topic => {
    for (let i = 1; i <= 5; i++) {
      templates.push({
        id: uuid(),
        title: `${topic} - Pratik Testi ${i}`,
        description: `Bu ödev şablonu, "${topic}" konusundaki anlama ve uygulama becerilerinizi geliştirmek için tasarlanmıştır. ${i}. pratik testini içerir.`,
        checklist: [
          { text: `"${topic}" konusuyla ilgili notları gözden geçir.` },
          { text: 'En az 20 soru çöz.' },
          { text: 'Yanlış yapılan soruların çözümlerini incele.' },
          { text: 'Anlaşılmayan noktaları belirle ve not al.' }
        ]
      });
    }
  });
});


// --- QUESTIONS ---
const questions = [
    { id: uuid(), creatorId: mahmutHocaId, category: ResourceCategory.Matematik, topic: 'Türev', questionText: 'f(x) = 3x² + 2x - 1 fonksiyonunun x=1 noktasındaki türevi nedir?', options: ['4', '6', '8', '10'], correctOptionIndex: 2, difficulty: QuestionDifficulty.Easy, explanation: 'f\'(x) = 6x + 2 olduğundan, f\'(1) = 6(1) + 2 = 8 olur.' },
    { id: uuid(), creatorId: mahmutHocaId, category: ResourceCategory.Fizik, topic: 'Dinamik', questionText: 'Sürtünmesiz yatay düzlemde durmakta olan 2 kg kütleli cisme 10 N büyüklüğünde bir kuvvet uygulanırsa cismin ivmesi kaç m/s² olur?', options: ['2', '5', '10', '20'], correctOptionIndex: 1, difficulty: QuestionDifficulty.Easy, explanation: 'F=m.a formülünden 10 = 2 * a, buradan a = 5 m/s² bulunur.' },
    { id: uuid(), creatorId: ayseHocaId, category: ResourceCategory.Turkce, topic: 'Paragraf', questionText: 'Bu parçada asıl anlatılmak istenen aşağıdakilerden hangisidir?', options: ['Seçenek A', 'Seçenek B', 'Seçenek C', 'Seçenek D'], correctOptionIndex: 0, difficulty: QuestionDifficulty.Medium, explanation: 'Parçanın ana fikri giriş cümlesinde verilmiştir.' },
    { id: uuid(), creatorId: ayseHocaId, category: ResourceCategory.Biyoloji, topic: 'Hücre Bölünmeleri', questionText: 'Mitoz bölünmenin profaz evresinde aşağıdaki olaylardan hangisi gerçekleşmez?', options: ['Kromatin ipliklerin kısalıp kalınlaşması', 'Çekirdek zarının erimesi', 'İğ ipliklerinin oluşması', 'Kardeş kromatitlerin ayrılması'], correctOptionIndex: 3, difficulty: QuestionDifficulty.Medium, explanation: 'Kardeş kromatitlerin ayrılması anafaz evresinde gerçekleşir.' },
];

// --- CONVERSATIONS & MESSAGES ---
const conversations = [
    { id: 'conv-announcements', participantIds: users.map(u => u.id), isGroup: true, groupName: '📢 Duyurular', groupImage: 'https://i.pravatar.cc/150?u=announcements', adminId: superAdminId },
    { id: 'conv-mahmut-ahmet', participantIds: [mahmutHocaId, student1Id], isGroup: false },
    { id: 'conv-mahmut-zeynep', participantIds: [mahmutHocaId, student2Id], isGroup: false },
    { id: 'conv-ayse-elif', participantIds: [ayseHocaId, student4Id], isGroup: false },
    { id: 'conv-ogretmenler', participantIds: [mahmutHocaId, ayseHocaId, superAdminId], isGroup: true, groupName: 'Öğretmenler Odası', groupImage: 'https://i.pravatar.cc/150?u=teachers', adminId: superAdminId },
];

const messages = [
    { id: uuid(), conversationId: 'conv-announcements', senderId: mahmutHocaId, text: 'Merhaba arkadaşlar, haftalık deneme sınavı sonuçları sisteme yüklenmiştir. Kontrol edebilirsiniz.', type: 'announcement', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), readBy: [] },
    { id: uuid(), conversationId: 'conv-mahmut-ahmet', senderId: mahmutHocaId, text: 'Ahmet, türev ödevindeki ilerlemen nasıl gidiyor?', type: 'text', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), readBy: [mahmutHocaId] },
    { id: uuid(), conversationId: 'conv-mahmut-ahmet', senderId: student1Id, text: 'İyi gidiyor hocam, son testteyim.', type: 'text', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), readBy: [student1Id] },
    { id: uuid(), conversationId: 'conv-ogretmenler', senderId: ayseHocaId, text: '12. sınıflar için ek bir etüt planlayalım mı?', type: 'text', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), readBy: [ayseHocaId] },
];


export const seedData = {
    users,
    assignments,
    exams,
    goals,
    resources,
    templates,
    questions,
    conversations,
    messages
};
