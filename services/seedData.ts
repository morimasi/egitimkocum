import {
  UserRole, AssignmentTemplate, Resource, ResourceCategory, Conversation, AcademicTrack, BadgeID, Assignment, Message, AppNotification, Goal, Badge, CalendarEvent, Exam, Question
} from '../types';
import { examCategories } from './examCategories';

const uuid = () => crypto.randomUUID();

// Kullanıcı isteği üzerine tüm test verileri kaldırıldı.
// Uygulama artık temiz bir veritabanı ile başlayacak.
// Kayıt olan ilk kullanıcı "Süper Admin" rolünü alacaktır.
// "Veri Ekle" özelliği artık yalnızca temel rozetleri oluşturacaktır.

const users: any[] = [];
const conversations: Conversation[] = [];

export function generateDynamicSeedData() {
    const templates: AssignmentTemplate[] = [];
    const resources: Resource[] = [];
    return { templates, resources };
}


export const seedData = {
    users,
    assignments: [] as Assignment[],
    messages: [] as Message[],
    conversations,
    notifications: [] as AppNotification[],
    templates: [] as AssignmentTemplate[],
    resources: [] as Resource[],
    goals: [] as Goal[],
    badges: [] as Badge[],
    calendarEvents: [] as CalendarEvent[],
    exams: [] as Exam[],
    questions: [] as Question[],
};
