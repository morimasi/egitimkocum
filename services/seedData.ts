import {
  UserRole, AssignmentTemplate, Resource, ResourceCategory, Conversation, AcademicTrack, BadgeID, Assignment, Message, AppNotification, Goal, Badge, CalendarEvent, Exam, Question
} from '../types';
import { examCategories } from './examCategories';

const uuid = () => crypto.randomUUID();

// Kullanıcı isteği üzerine tüm test verileri kaldırıldı.
// Uygulama artık temiz bir veritabanı ile başlayacak.
// Kayıt olan ilk kullanıcı "Süper Admin" rolünü alacaktır.
// "Veri Ekle" özelliği artık yalnızca temel rozetleri oluşturacaktır.

const users = [];
const conversations = [];

export function generateDynamicSeedData() {
    const templates = [];
    const resources = [];
    return { templates, resources };
}


export const seedData = {
    users,
    assignments: [],
    messages: [],
    conversations,
    notifications: [],
    templates: [],
    resources: [],
    goals: [],
    badges: [],
    calendarEvents: [],
    exams: [],
    questions: [],
};