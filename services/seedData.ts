import { User, Assignment, Message, Conversation, AppNotification, AssignmentTemplate, Resource, Goal, Badge, CalendarEvent, Exam, Question, UserRole, AssignmentStatus, NotificationPriority, BadgeID, AcademicTrack, ResourceCategory, QuestionDifficulty } from '../types';

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const coachId = 'coach-1';
const studentId1 = 'student-1';
const studentId2 = 'student-2';
const parentId1 = 'parent-1';
const superAdminId = 'super-admin-1';

export const initialData = {
  users: [
    {
      id: superAdminId, name: 'Süper Admin', email: 'admin@mahmuthoca.com', role: UserRole.SuperAdmin, profilePicture: 'https://i.pravatar.cc/150?u=admin', xp: 1000,
    },
    {
      id: coachId, name: 'Ayşe Yılmaz', email: 'ayse@mahmuthoca.com', role: UserRole.Coach, profilePicture: 'https://i.pravatar.cc/150?u=ayse', xp: 500,
    },
    {
      id: studentId1, name: 'Ali Veli', email: 'ali@mahmuthoca.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=ali', assignedCoachId: coachId, gradeLevel: '12', academicTrack: AcademicTrack.Sayisal, parentIds: [parentId1], xp: 250, streak: 3, earnedBadgeIds: [BadgeID.FirstAssignment],
    },
    {
      id: studentId2, name: 'Zeynep Çelik', email: 'zeynep@mahmuthoca.com', role: UserRole.Student, profilePicture: 'https://i.pravatar.cc/150?u=zeynep', assignedCoachId: coachId, gradeLevel: '11', academicTrack: AcademicTrack.EsitAgirlik, xp: 120, streak: 0,
    },
    {
      id: parentId1, name: 'Mehmet Veli', email: 'mehmet@veli.com', role: UserRole.Parent, profilePicture: 'https://i.pravatar.cc/150?u=mehmet', childIds: [studentId1],
    },
  ] as User[],

  assignments: [
    { id: 'assign-1', title: 'Matematik - Türev Testi', description: 'Türev kuralları ile ilgili 20 soruluk testi çözün.', dueDate: daysAgo(-7).toISOString(), status: AssignmentStatus.Graded, grade: 85, feedback: 'Harika iş, Ali! Türev kurallarını iyi kavramışsın.', studentId: studentId1, coachId, submittedAt: daysAgo(1).toISOString() },
    { id: 'assign-2', title: 'Fizik - Vektörler Konu Özeti', description: 'Vektörler konusunu özetleyin ve 3 örnek problem çözün.', dueDate: daysAgo(-2).toISOString(), status: AssignmentStatus.Pending, grade: null, feedback: '', studentId: studentId1, coachId, submittedAt: null },
    { id: 'assign-3', title: 'Edebiyat - Makale Yazımı', description: 'Serbest bir konuda 500 kelimelik bir makale yazın.', dueDate: daysAgo(5).toISOString(), status: AssignmentStatus.Submitted, grade: null, feedback: '', studentId: studentId2, coachId, submittedAt: daysAgo(1).toISOString() },
  ] as Assignment[],
  
  messages: [
    { id: 'msg-1', senderId: coachId, conversationId: 'conv-1', text: 'Merhaba Ali, haftalık hedeflerin nasıl gidiyor?', timestamp: daysAgo(2).toISOString(), type: 'text', readBy: [coachId] },
    { id: 'msg-2', senderId: studentId1, conversationId: 'conv-1', text: 'İyi gidiyor hocam, türev testini bitirdim.', timestamp: daysAgo(1).toISOString(), type: 'text', readBy: [studentId1, coachId] },
    { id: 'msg-3', senderId: coachId, conversationId: 'conv-announcements', text: 'Arkadaşlar, hafta sonu deneme sınavı yapılacaktır. Katılım zorunludur.', timestamp: daysAgo(3).toISOString(), type: 'announcement', readBy: [coachId], priority: NotificationPriority.High },
  ] as Message[],
  
  conversations: [
    { id: 'conv-1', participantIds: [coachId, studentId1], isGroup: false },
    { id: 'conv-2', participantIds: [coachId, studentId2], isGroup: false },
    { id: 'conv-announcements', participantIds: [coachId, studentId1, studentId2], isGroup: true, groupName: 'Duyurular', groupImage: 'https://i.pravatar.cc/150?u=announcements', adminId: coachId },
  ] as Conversation[],
  
  notifications: [
    { id: 'notif-1', userId: studentId1, message: 'Yeni ödev: Fizik - Vektörler Konu Özeti', timestamp: daysAgo(5).toISOString(), isRead: true, priority: NotificationPriority.Medium },
  ] as AppNotification[],
  
  templates: [
    { id: 'template-1', title: 'Haftalık Paragraf Soru Çözümü', description: 'Her gün 20 paragraf sorusu çözülecek ve yanlışlar analiz edilecek.', checklist: [{ text: 'Pazartesi 20 soru' }, { text: 'Salı 20 soru' }] },
  ] as AssignmentTemplate[],
  
  resources: [
    { id: 'res-1', name: 'Logaritma Konu Anlatım PDF', type: 'pdf', url: '#', isPublic: true, uploaderId: coachId, category: ResourceCategory.Matematik },
  ] as Resource[],
  
  questions: [
    { id: 'q-1', creatorId: coachId, category: ResourceCategory.Matematik, topic: 'Türev', questionText: 'f(x) = 3x^2 + 5x - 2 fonksiyonunun x=1 noktasındaki türevi nedir?', options: ['8', '11', '10', '13'], correctOptionIndex: 1, difficulty: QuestionDifficulty.Easy, explanation: 'f\'(x) = 6x + 5. f\'(1) = 6(1) + 5 = 11.' },
  ] as Question[],
  
  goals: [
    { id: 'goal-1', studentId: studentId1, title: 'Haftada 100 türev sorusu çözmek.', description: '', isCompleted: false, milestones: [{ id: 'm1', text: '50 soru çözüldü', isCompleted: true }, { id: 'm2', text: '100 soru tamamlandı', isCompleted: false }] },
  ] as Goal[],
  
  badges: [
    { id: BadgeID.FirstAssignment, name: 'İlk Adım', description: 'İlk ödevini zamanında teslim et.' },
    { id: BadgeID.HighAchiever, name: 'Yüksek Uçan', description: 'Bir ödevden 90 üzeri not al.' },
    { id: BadgeID.PerfectScore, name: 'Mükemmeliyet', description: 'Bir ödevden 100 tam puan al.' },
    { id: BadgeID.GoalGetter, name: 'Hedef Avcısı', description: 'İlk hedefini tamamla.' },
    { id: BadgeID.StreakStarter, name: 'Seri Başlangıcı', description: '3 günlük ödev teslim serisi yakala.' },
    { id: BadgeID.StreakMaster, name: 'Seri Ustası', description: '7 günlük ödev teslim serisi yakala.' },
    { id: BadgeID.OnTimeSubmissions, name: 'Dakik', description: '5 ödevi zamanında teslim et.' },
  ] as Badge[],
  
  calendarEvents: [
    { id: 'ce-1', userId: studentId1, title: 'Matematik Özel Ders', date: daysAgo(-3).toISOString().split('T')[0], type: 'study', color: 'bg-indigo-500', startTime: '14:00', endTime: '15:00' },
  ] as CalendarEvent[],
  
  exams: [
    { id: 'exam-1', studentId: studentId1, title: 'TYT Deneme Sınavı - 1', date: daysAgo(10).toISOString().split('T')[0], totalQuestions: 120, correct: 80, incorrect: 20, empty: 20, netScore: 75, subjects: [{ name: 'Matematik', totalQuestions: 40, correct: 30, incorrect: 5, empty: 5, netScore: 28.75 }], category: 'Genel Deneme Sınavları', topic: 'TYT', type: 'deneme' },
  ] as Exam[],
};