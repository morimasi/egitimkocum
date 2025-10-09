import {
  UserRole, AssignmentTemplate, Resource, ResourceCategory, Conversation, AcademicTrack, BadgeID, Assignment, Message, AppNotification, Goal, Badge, CalendarEvent, Exam, Question, User
} from '../types';
import { examCategories } from './examCategories';

const uuid = () => crypto.randomUUID();

// Kullanıcı isteği üzerine tüm test verileri kaldırıldı.
// Uygulama artık temiz bir veritabanı ile başlayacak.
// Kayıt olan ilk kullanıcı "Süper Admin" rolünü alacaktır.
// "Veri Ekle" özelliği artık yalnızca temel rozetleri oluşturacaktır.

export function generateDynamicSeedData() {
    return { templates: [] as AssignmentTemplate[], resources: [] as Resource[] };
}


export const seedData = {
    users: [] as User[],
    assignments: [] as Assignment[],
    messages: [] as Message[],
    conversations: [] as Conversation[],
    notifications: [] as AppNotification[],
    templates: [] as AssignmentTemplate[],
    resources: [] as Resource[],
    goals: [] as Goal[],
    badges: [] as Badge[],
    calendarEvents: [] as CalendarEvent[],
    exams: [] as Exam[],
    questions: [] as Question[],
};